import { prisma } from "@safeher/db";
import { env } from "../config/env";
import { AppError } from "../middleware/errorHandler";

export interface SuspectMatch {
  canonicalName: string;
  confidence: number;
  reportCount: number;
  locations: string[];
  reports: { name: string; reportId: string; caseNumber: string; location: string }[];
}

export async function getSuspectMatchesForStation(stationId: string): Promise<SuspectMatch[]> {
  const cases = await prisma.case.findMany({
    where: { stationId },
    include: {
      report: {
        select: {
          id: true,
          abuserName: true,
          abuserKnown: true,
          location: true,
        },
      },
    },
  });

  const suspects = cases
    .filter((c) => c.report.abuserKnown && c.report.abuserName)
    .map((c) => ({
      name: c.report.abuserName!,
      report_id: c.report.id,
      case_number: c.caseNumber,
      location: c.report.location,
    }));

  return callAiMatchService(suspects);
}

export async function getGlobalSuspectMatches(): Promise<SuspectMatch[]> {
  const reports = await prisma.report.findMany({
    where: { abuserKnown: true, abuserName: { not: null } },
    include: { case: { select: { caseNumber: true } } },
  });

  const suspects = reports
    .filter((r) => r.abuserName)
    .map((r) => ({
      name: r.abuserName!,
      report_id: r.id,
      case_number: r.case?.caseNumber ?? "",
      location: r.location,
    }));

  return callAiMatchService(suspects);
}

async function callAiMatchService(
  suspects: { name: string; report_id: string; case_number: string; location: string }[],
): Promise<SuspectMatch[]> {
  if (suspects.length < 2) return [];

  try {
    const res = await fetch(`${env.aiServiceUrl}/match-suspects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suspects, threshold: 0.72 }),
    });
    if (!res.ok) throw new Error(`AI service returned ${res.status}`);
    const json = (await res.json()) as { matches: SuspectMatch[] };
    return json.matches ?? [];
  } catch (err) {
    console.error("[AI Service]", err);
    return fallbackLocalMatch(suspects);
  }
}

/** Offline fallback when Python service is unavailable */
function fallbackLocalMatch(
  suspects: { name: string; report_id: string; case_number: string; location: string }[],
): SuspectMatch[] {
  const norm = (s: string) => s.toLowerCase().trim();
  const clusters: typeof suspects[] = [];

  for (const s of suspects) {
    let placed = false;
    for (const cluster of clusters) {
      const a = norm(s.name);
      const b = norm(cluster[0].name);
      if (a === b || a.includes(b) || b.includes(a)) {
        cluster.push(s);
        placed = true;
        break;
      }
    }
    if (!placed) clusters.push([s]);
  }

  return clusters
    .filter((c) => c.length >= 2)
    .map((c) => ({
      canonicalName: c.reduce((a, b) => (a.name.length >= b.name.length ? a : b)).name,
      confidence: 80,
      reportCount: c.length,
      locations: [...new Set(c.map((x) => x.location))],
      reports: c.map((x) => ({
        name: x.name,
        reportId: x.report_id,
        caseNumber: x.case_number,
        location: x.location,
      })),
    }));
}
