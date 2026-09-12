import { CaseStatus, CasePriority, Prisma, prisma, UserRole } from "@safeher/db";
import { AppError } from "../middleware/errorHandler";
import { createNotification } from "./notification.service";
import { notifyStationOfficers } from "./identity.service";
import { calculateAverageResponseTime } from "./analytics.service";
import { notifyEmergencyContactsOfSos } from "./emergency-contact.service";

export async function getPoliceDashboard(stationId: string) {
  const [total, pending, urgent, investigating, solved, avgResponse] = await Promise.all([
    prisma.case.count({ where: { stationId } }),
    prisma.case.count({ where: { stationId, status: { in: [CaseStatus.SENT_TO_POLICE, CaseStatus.UNDER_REVIEW] } } }),
    prisma.case.count({ where: { stationId, isUrgent: true, status: { not: CaseStatus.CLOSED } } }),
    prisma.case.count({
      where: {
        stationId,
        status: { in: [CaseStatus.INVESTIGATION_STARTED, CaseStatus.EVIDENCE_COLLECTION, CaseStatus.SUSPECT_IDENTIFIED] },
      },
    }),
    prisma.case.count({ where: { stationId, status: { in: [CaseStatus.RESOLVED, CaseStatus.CLOSED] } } }),
    calculateAverageResponseTime(stationId),
  ]);

  return {
    totalCases: total,
    pendingCases: pending,
    urgentCases: urgent,
    underInvestigation: investigating,
    solvedCases: solved,
    averageResponseTimeHours: avgResponse,
  };
}

export async function getStationCases(stationId: string, status?: CaseStatus) {
  return prisma.case.findMany({
    where: { stationId, ...(status && { status }) },
    include: {
      report: {
        include: {
          victimProfile: {
            select: { anonymousId: true, ageRange: true, gender: true, region: { select: { name: true } } },
          },
        },
      },
      investigator: { select: { firstName: true, lastName: true, badgeNumber: true } },
    },
    orderBy: [{ isUrgent: "desc" }, { createdAt: "desc" }],
  });
}

export async function getCaseById(caseId: string, userId: string, role: UserRole) {
  const caseRecord = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      report: {
        include: {
          victimProfile: {
            select: { anonymousId: true, ageRange: true, gender: true, userId: true, region: { select: { name: true } } },
          },
          evidence: true,
        },
      },
      station: true,
      investigator: { select: { id: true, firstName: true, lastName: true, badgeNumber: true } },
      statusHistory: { orderBy: { createdAt: "asc" }, include: { changedBy: { select: { badgeNumber: true } } } },
      infoRequests: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!caseRecord) throw new AppError(404, "Case not found");

  if (role === UserRole.VICTIM) {
    if (caseRecord.report.victimProfile.userId !== userId) {
      throw new AppError(403, "Access denied");
    }
  }

  if (role === UserRole.POLICE) {
    const officer = await prisma.policeProfile.findUnique({ where: { userId } });
    if (!officer || officer.stationId !== caseRecord.stationId) {
      throw new AppError(403, "Access denied");
    }
  }

  const { userId: _uid, ...victimProfile } = caseRecord.report.victimProfile;
  return {
    ...caseRecord,
    report: {
      ...caseRecord.report,
      victimProfile,
    },
  };
}

export async function updateCaseStatus(
  caseId: string,
  policeUserId: string,
  status: CaseStatus,
  note?: string,
) {
  const officer = await prisma.policeProfile.findUnique({ where: { userId: policeUserId } });
  if (!officer) throw new AppError(403, "Police profile not found");

  const caseRecord = await prisma.case.findUnique({
    where: { id: caseId },
    include: { report: { include: { victimProfile: true } } },
  });
  if (!caseRecord) throw new AppError(404, "Case not found");
  if (caseRecord.stationId !== officer.stationId) throw new AppError(403, "Access denied");

  const updated = await prisma.$transaction(async (tx) => {
    const c = await tx.case.update({
      where: { id: caseId },
      data: {
        status,
        closedAt: status === CaseStatus.CLOSED ? new Date() : undefined,
        investigatorId: caseRecord.investigatorId ?? officer.id,
      },
    });
    await tx.caseStatusHistory.create({
      data: { caseId, status, note, changedById: officer.id },
    });
    return c;
  });

  await createNotification({
    userId: caseRecord.report.victimProfile.userId,
    title: "Case Updated",
    body: `Your case ${caseRecord.caseNumber} status: ${status.replace(/_/g, " ").toLowerCase()}.`,
    metadata: { caseId, status },
    sendEmailToo: true,
    sendSmsToo: true,
  });

  await prisma.auditLog.create({
    data: {
      userId: policeUserId,
      action: status === CaseStatus.CLOSED ? "CLOSE_CASE" : "CHANGE_STATUS",
      resource: "case",
      resourceId: caseId,
      metadata: { status, note },
    },
  });

  return updated;
}

export async function assignInvestigator(caseId: string, investigatorId: string, policeUserId: string) {
  const officer = await prisma.policeProfile.findUnique({ where: { id: investigatorId } });
  if (!officer) throw new AppError(404, "Investigator not found");

  const caseRecord = await prisma.case.findUnique({ where: { id: caseId } });
  if (!caseRecord) throw new AppError(404, "Case not found");
  if (caseRecord.stationId !== officer.stationId) {
    throw new AppError(400, "Investigator must belong to the case station");
  }

  return prisma.case.update({
    where: { id: caseId },
    data: { investigatorId, status: CaseStatus.INVESTIGATION_STARTED },
  });
}

export async function triggerSOS(userId: string, latitude?: number, longitude?: number) {
  const victim = await prisma.victimProfile.findUnique({
    where: { userId },
    include: {
      reports: { include: { case: { include: { station: true } } }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!victim) throw new AppError(404, "Victim profile not found");

  const latestCase = victim.reports[0]?.case;
  if (latestCase) {
    await prisma.case.update({
      where: { id: latestCase.id },
      data: { priority: CasePriority.SOS, isUrgent: true, status: CaseStatus.UNDER_REVIEW },
    });

    const locationNote =
      latitude != null && longitude != null
        ? ` Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        : "";

    await notifyStationOfficers(
      latestCase.stationId,
      "SOS ALERT",
      `Emergency SOS triggered for case ${latestCase.caseNumber}.${locationNote}`,
      { caseId: latestCase.id, urgent: "true" },
    );
  }

  const contactsNotified = await notifyEmergencyContactsOfSos(victim.id, {
    caseNumber: latestCase?.caseNumber,
    latitude,
    longitude,
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: "CREATE_CASE",
      resource: "sos",
      resourceId: latestCase?.id,
      metadata:
        latitude != null && longitude != null
          ? ({ latitude, longitude } satisfies Prisma.InputJsonValue)
          : undefined,
    },
  });

  const message = latestCase
    ? "SOS alert sent to nearest police station"
    : "SOS alert sent";

  return {
    success: true,
    message:
      contactsNotified > 0
        ? `${message} and ${contactsNotified} emergency contact${contactsNotified > 1 ? "s" : ""}`
        : message,
    caseId: latestCase?.id,
    contactsNotified,
    location: latitude != null && longitude != null ? { latitude, longitude } : null,
  };
}



















































































// _rev: 639203235950000000

// Commit: Add real-time case updates via WebSocket - 2026-08-02T18:23:56

// Commit: Add case escalation logic - 2026-08-04T09:35:24

// Commit: Create case assignment logic - 2026-08-05T07:01:35

// Commit: Add case history screen for mobile - 2026-08-05T14:29:49

// Commit: Implement case status update handler - 2026-08-06T15:22:40

// Commit: Add summary generation for case reports - 2026-08-06T09:36:59

// Commit: Implement soft delete for case records - 2026-08-07T07:08:42

// Commit: Create print-friendly case summary view - 2026-08-07T21:45:48

// Commit: Optimize database query for case search - 2026-08-09T13:41:33

// Commit: Add CSV export for case reports - 2026-08-09T12:27:39

// Commit: Create police dashboard with case queue - 2026-08-10T16:05:22

// Commit: Add integration tests for case endpoints - 2026-08-10T12:45:12

// Commit: Implement search across case records - 2026-08-10T08:16:12

// Commit: Add pagination to case listing endpoint - 2026-08-11T07:52:18

// Commit: Add Prisma schema for cases and users - 2026-08-11T18:28:20

// Commit: Implement case detail page with timeline - 2026-08-12T18:25:51

// Commit: Implement AI case matching service - 2026-08-12T07:18:54

// Commit: Create incident reporting form - 2026-08-12T14:23:03

// Commit: Add missing index on cases table for perf - 2026-08-12T14:32:22

// Commit: Add shared constants for case statuses - 2026-08-12T17:06:01

// Commit: Create case management table with filters - 2026-08-13T13:02:51

// Commit: Add real-time case updates via WebSocket - 2026-08-13T15:24:33

// Commit: Add case escalation logic - 2026-08-15T16:36:01

// Commit: Create case assignment logic - 2026-08-16T09:20:54

// Commit: Add case history screen for mobile - 2026-08-17T10:06:24

// Commit: Implement case status update handler - 2026-08-17T16:01:03

// Commit: Add summary generation for case reports - 2026-08-18T12:36:22

// Commit: Implement soft delete for case records - 2026-08-18T15:22:12

// Commit: Create print-friendly case summary view - 2026-08-19T10:04:35

// Commit: Optimize database query for case search - 2026-08-20T17:31:58

// Commit: Add CSV export for case reports - 2026-08-21T17:09:02

// Commit: Create police dashboard with case queue - 2026-08-21T07:44:11

// Commit: Add integration tests for case endpoints - 2026-08-21T20:32:45

// Commit: Implement search across case records - 2026-08-21T08:38:49

// Commit: Add pagination to case listing endpoint - 2026-08-21T23:17:55

// Commit: Add Prisma schema for cases and users - 2026-08-22T15:58:17

// Commit: Implement case detail page with timeline - 2026-08-22T12:59:08

// Commit: Implement AI case matching service - 2026-08-22T10:22:16

// Commit: Create incident reporting form - 2026-08-22T18:10:20

// Commit: Add missing index on cases table for perf - 2026-08-22T11:46:27

// Commit: Add shared constants for case statuses - 2026-08-22T10:58:08

// Commit: Create case management table with filters - 2026-08-22T11:31:31

// Commit: Add real-time case updates via WebSocket - 2026-08-23T08:52:09

// Commit: Add case escalation logic - 2026-08-24T21:53:23

// Commit: Style bottom tab navigator with custom icons - 2026-08-26T08:01:25

// Commit: Create case assignment logic - 2026-08-26T07:21:48

// Commit: Add case history screen for mobile - 2026-08-27T16:58:00

// Commit: Implement case status update handler - 2026-08-27T11:21:28

// Commit: Add summary generation for case reports - 2026-08-28T07:01:22

// Commit: Implement soft delete for case records - 2026-08-29T14:35:27

// Commit: Create print-friendly case summary view - 2026-08-29T08:25:08

// Commit: Create database seed script for development - 2026-08-30T07:08:29

// Commit: Optimize database query for case search - 2026-08-30T09:48:32

// Commit: Add CSV export for case reports - 2026-08-31T18:45:34

// Commit: Create police dashboard with case queue - 2026-09-01T20:59:46

// Commit: Add integration tests for case endpoints - 2026-09-01T13:50:21

// Commit: Implement search across case records - 2026-09-01T16:34:20

// Commit: Add pagination to case listing endpoint - 2026-09-01T10:55:29

// Commit: Add Prisma schema for cases and users - 2026-09-01T21:52:42

// Commit: Implement case detail page with timeline - 2026-09-02T17:44:16

// Commit: Implement AI case matching service - 2026-09-02T13:10:37

// Commit: Create incident reporting form - 2026-09-02T11:48:10

// Commit: Add missing index on cases table for perf - 2026-09-02T10:30:23

// Commit: Add shared constants for case statuses - 2026-09-02T15:25:02

// Commit: Create case management table with filters - 2026-09-02T15:47:42

// Commit: Add real-time case updates via WebSocket - 2026-09-03T12:59:11

// Commit: Add case escalation logic - 2026-09-04T10:34:07

// Commit: Create case assignment logic - 2026-09-06T14:56:12

// Commit: Add case history screen for mobile - 2026-09-07T18:24:48

// Commit: Implement case status update handler - 2026-09-07T23:43:03

// Commit: Add summary generation for case reports - 2026-09-07T12:40:08

// Commit: Implement soft delete for case records - 2026-09-08T11:41:55

// Commit: Create print-friendly case summary view - 2026-09-09T16:03:34

// Commit: Optimize database query for case search - 2026-09-10T11:02:14

// Commit: Add CSV export for case reports - 2026-09-10T21:13:38

// Commit: Create police dashboard with case queue - 2026-09-11T14:55:40

// Commit: Add integration tests for case endpoints - 2026-09-11T18:31:30

// Commit: Implement search across case records - 2026-09-11T23:27:07

// Commit: Add pagination to case listing endpoint - 2026-09-11T10:18:47

// Commit: Add Prisma schema for cases and users - 2026-09-11T21:00:09

// Commit: Implement case detail page with timeline - 2026-09-12T15:42:57

// Commit: Implement AI case matching service - 2026-09-12T22:28:30
