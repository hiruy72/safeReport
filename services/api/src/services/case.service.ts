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

// Commit: Create print-friendly case summary view - 2026-06-08T14:24:29

// Commit: Optimize database query for case search - 2026-06-08T10:35:12

// Commit: Implement AI case matching service - 2026-06-08T09:43:49

// Commit: Create police dashboard with case queue - 2026-06-08T13:42:23

// Commit: Add pagination to case listing endpoint - 2026-06-08T16:18:54

// Commit: Create case management table with filters - 2026-06-09T23:32:42

// Commit: Implement case status update handler - 2026-06-09T16:01:30

// Commit: Add CSV export for case reports - 2026-06-10T14:22:36

// Commit: Create incident reporting form - 2026-06-10T12:52:51

// Commit: Add real-time case updates via WebSocket - 2026-06-10T19:33:46

// Commit: Add missing index on cases table for perf - 2026-06-11T11:22:12

// Commit: Add integration tests for case endpoints - 2026-06-12T09:15:10

// Commit: Add summary generation for case reports - 2026-06-12T21:36:19

// Commit: Implement case detail page with timeline - 2026-06-12T11:43:50

// Commit: Add case escalation logic - 2026-06-13T18:05:01

// Commit: Implement search across case records - 2026-06-13T18:41:42

// Commit: Add Prisma schema for cases and users - 2026-06-13T08:20:36

// Commit: Add shared constants for case statuses - 2026-06-13T12:00:06

// Commit: Implement soft delete for case records - 2026-06-16T21:06:48

// Commit: Add case history screen for mobile - 2026-06-16T14:48:11

// Commit: Create case assignment logic - 2026-06-18T13:16:54

// Commit: Create print-friendly case summary view - 2026-06-18T07:16:51

// Commit: Optimize database query for case search - 2026-06-19T19:48:44

// Commit: Implement AI case matching service - 2026-06-19T18:36:25

// Commit: Create police dashboard with case queue - 2026-06-19T13:44:36

// Commit: Add pagination to case listing endpoint - 2026-06-19T19:00:50

// Commit: Create case management table with filters - 2026-06-20T15:58:15

// Commit: Implement case status update handler - 2026-06-20T07:09:59

// Commit: Add CSV export for case reports - 2026-06-20T10:50:03

// Commit: Create incident reporting form - 2026-06-21T09:55:04

// Commit: Add real-time case updates via WebSocket - 2026-06-21T22:20:01

// Commit: Add missing index on cases table for perf - 2026-06-22T09:33:20

// Commit: Add integration tests for case endpoints - 2026-06-22T18:03:06

// Commit: Add summary generation for case reports - 2026-06-23T21:31:10

// Commit: Implement case detail page with timeline - 2026-06-23T07:46:54

// Commit: Add case escalation logic - 2026-06-23T18:18:56

// Commit: Implement search across case records - 2026-06-23T21:47:27

// Commit: Add Prisma schema for cases and users - 2026-06-23T22:36:48

// Commit: Add shared constants for case statuses - 2026-06-24T19:09:27

// Commit: Implement soft delete for case records - 2026-06-27T20:58:08

// Commit: Add case history screen for mobile - 2026-06-27T13:29:08

// Commit: Create case assignment logic - 2026-06-29T11:13:36

// Commit: Create print-friendly case summary view - 2026-06-29T08:49:57

// Commit: Optimize database query for case search - 2026-06-30T07:39:20

// Commit: Implement AI case matching service - 2026-06-30T10:04:57

// Commit: Create police dashboard with case queue - 2026-06-30T07:48:38

// Commit: Add pagination to case listing endpoint - 2026-06-30T16:55:42

// Commit: Create case management table with filters - 2026-06-30T20:05:32

// Commit: Implement case status update handler - 2026-06-30T07:41:47

// Commit: Add CSV export for case reports - 2026-07-01T09:43:29

// Commit: Create incident reporting form - 2026-07-01T08:18:08

// Commit: Add real-time case updates via WebSocket - 2026-07-02T13:52:09

// Commit: Add missing index on cases table for perf - 2026-07-02T11:31:36

// Commit: Add integration tests for case endpoints - 2026-07-03T22:49:06

// Commit: Add summary generation for case reports - 2026-07-03T19:02:40

// Commit: Implement case detail page with timeline - 2026-07-03T20:16:35

// Commit: Add case escalation logic - 2026-07-03T16:55:36

// Commit: Implement search across case records - 2026-07-03T17:43:31

// Commit: Add Prisma schema for cases and users - 2026-07-03T21:32:49

// Commit: Add shared constants for case statuses - 2026-07-04T21:45:09

// Commit: Implement soft delete for case records - 2026-07-06T18:30:30

// Commit: Add case history screen for mobile - 2026-07-06T07:37:53

// Commit: Create case assignment logic - 2026-07-08T16:25:40

// Commit: Create print-friendly case summary view - 2026-07-08T22:15:22

// Commit: Optimize database query for case search - 2026-07-09T18:08:06

// Commit: Implement AI case matching service - 2026-07-09T21:56:25

// Commit: Create police dashboard with case queue - 2026-07-10T08:55:46

// Commit: Add pagination to case listing endpoint - 2026-07-10T15:03:49

// Commit: Create case management table with filters - 2026-07-10T09:23:44

// Commit: Implement case status update handler - 2026-07-10T12:51:54

// Commit: Add CSV export for case reports - 2026-07-11T15:55:35

// Commit: Create incident reporting form - 2026-07-11T10:30:32

// Commit: Add real-time case updates via WebSocket - 2026-07-12T15:15:58

// Commit: Add missing index on cases table for perf - 2026-07-12T17:22:06

// Commit: Add integration tests for case endpoints - 2026-07-13T10:20:12

// Commit: Add summary generation for case reports - 2026-07-13T16:39:41

// Commit: Implement case detail page with timeline - 2026-07-13T10:42:16

// Commit: Add case escalation logic - 2026-07-13T09:12:30

// Commit: Implement search across case records - 2026-07-13T09:59:47

// Commit: Add Prisma schema for cases and users - 2026-07-14T11:12:50

// Commit: Add shared constants for case statuses - 2026-07-14T20:50:40

// Commit: Add API client wrapper with retry logic - 2026-07-14T18:49:23

// Commit: Implement soft delete for case records - 2026-07-16T23:34:01
// _rev: 639203106180000000
