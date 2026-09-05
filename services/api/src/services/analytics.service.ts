import { prisma } from "@safeher/db";

export async function getCrimeHotspots() {
  const reports = await prisma.report.findMany({
    select: { location: true, category: true },
  });

  const locationCounts: Record<string, number> = {};
  for (const r of reports) {
    const key = r.location.trim().split(",")[0] || r.location;
    locationCounts[key] = (locationCounts[key] ?? 0) + 1;
  }

  const hotspots = Object.entries(locationCounts)
    .map(([area, count]) => ({ area, count, risk: count >= 5 ? "high" : count >= 2 ? "medium" : "low" }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const byCategory = await prisma.report.groupBy({
    by: ["category"],
    _count: true,
  });

  return { hotspots, byCategory };
}

export async function calculateAverageResponseTime(stationId: string): Promise<number> {
  const cases = await prisma.case.findMany({
    where: { stationId, statusHistory: { some: { status: "INVESTIGATION_STARTED" } } },
    include: {
      statusHistory: { where: { status: "INVESTIGATION_STARTED" }, take: 1, orderBy: { createdAt: "asc" } },
    },
  });

  if (cases.length === 0) return 0;

  let totalHours = 0;
  let counted = 0;
  for (const c of cases) {
    const started = c.statusHistory[0];
    if (started) {
      totalHours += (started.createdAt.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60);
      counted++;
    }
  }
  return counted > 0 ? Math.round((totalHours / counted) * 10) / 10 : 0;
}

export async function getAdminAnalytics() {
  const [hotspots, users, cases, recentAudit] = await Promise.all([
    getCrimeHotspots(),
    prisma.user.groupBy({ by: ["role"], _count: true }),
    prisma.case.groupBy({ by: ["status"], _count: true }),
    prisma.auditLog.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
  ]);

  return { ...hotspots, users, cases, activityLast24h: recentAudit };
}











// _rev: 639203350810000000

// Commit: Patch XSS vulnerability in report renderer - 2026-08-04T14:30:27

// Commit: Create analytics dashboard with charts - 2026-08-11T08:44:15

// Commit: Add validation middleware using Zod - 2026-08-15T09:50:13

// Commit: Patch XSS vulnerability in report renderer - 2026-08-15T17:42:34

// Commit: Create analytics dashboard with charts - 2026-08-21T17:17:07

// Commit: Add audit logging for sensitive actions - 2026-08-25T21:18:11

// Commit: Patch XSS vulnerability in report renderer - 2026-08-25T12:56:10

// Commit: Create analytics dashboard with charts - 2026-09-01T20:41:10

// Commit: Patch XSS vulnerability in report renderer - 2026-09-05T16:12:37
