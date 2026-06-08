import { prisma, UserRole } from "@safeher/db";
import { AppError } from "../middleware/errorHandler";
import { CASE_STATUS_LABELS } from "@safeher/shared-types";

export async function generateCaseSummary(caseId: string, userId: string, role: UserRole) {
  const caseRecord = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      report: {
        include: {
          victimProfile: { include: { region: true } },
          evidence: { select: { fileName: true, type: true, uploadedAt: true } },
        },
      },
      station: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
      investigator: { select: { badgeNumber: true, firstName: true, lastName: true } },
    },
  });
  if (!caseRecord) throw new AppError(404, "Case not found");

  if (role === UserRole.VICTIM && caseRecord.report.victimProfile.userId !== userId) {
    throw new AppError(403, "Access denied");
  }
  if (role === UserRole.POLICE) {
    const officer = await prisma.policeProfile.findUnique({ where: { userId } });
    if (!officer || officer.stationId !== caseRecord.stationId) {
      throw new AppError(403, "Access denied");
    }
  }

  const victim = caseRecord.report.victimProfile;
  const timeline = caseRecord.statusHistory.map((h) => ({
    status: CASE_STATUS_LABELS[h.status as keyof typeof CASE_STATUS_LABELS] ?? h.status,
    date: h.createdAt.toISOString(),
    note: h.note,
  }));

  return {
    generatedAt: new Date().toISOString(),
    caseNumber: caseRecord.caseNumber,
    status: caseRecord.status,
    station: caseRecord.station.name,
    investigator: caseRecord.investigator
      ? `Investigator #${caseRecord.investigator.badgeNumber}`
      : "Unassigned",
    victim: {
      anonymousId: victim.anonymousId,
      ageRange: victim.ageRange,
      gender: victim.gender,
      region: victim.region?.name,
    },
    incident: {
      category: caseRecord.report.category,
      date: caseRecord.report.incidentDate.toISOString(),
      location: caseRecord.report.location,
      description: caseRecord.report.description,
    },
    evidenceCount: caseRecord.report.evidence.length,
    evidence: caseRecord.report.evidence,
    timeline,
  };
}

export async function generatePoliceReport(caseId: string, policeUserId: string) {
  const summary = await generateCaseSummary(caseId, policeUserId, UserRole.POLICE);
  const text = [
    `SAFEHER INVESTIGATION REPORT`,
    `Generated: ${summary.generatedAt}`,
    ``,
    `Case: ${summary.caseNumber}`,
    `Status: ${summary.status}`,
    `Station: ${summary.station}`,
    `Investigator: ${summary.investigator}`,
    ``,
    `VICTIM (ANONYMOUS)`,
    `ID: ${summary.victim.anonymousId}`,
    `Age: ${summary.victim.ageRange}`,
    `Gender: ${summary.victim.gender}`,
    `Region: ${summary.victim.region}`,
    ``,
    `INCIDENT`,
    `Category: ${summary.incident.category}`,
    `Date: ${summary.incident.date}`,
    `Location: ${summary.incident.location}`,
    ``,
    `Description:`,
    summary.incident.description,
    ``,
    `TIMELINE`,
    ...summary.timeline.map((t) => `- ${t.date}: ${t.status}${t.note ? ` (${t.note})` : ""}`),
    ``,
    `Evidence files: ${summary.evidenceCount}`,
  ].join("\n");

  return { text, summary };
}
