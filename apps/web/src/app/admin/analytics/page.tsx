"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, clearTokens, getStoredUser } from "@/lib/api";
import { DashboardShell } from "@/components/dashboard-shell";

interface Hotspot {
  area: string;
  count: number;
  risk: string;
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<{
    hotspots: Hotspot[];
    byCategory: { category: string; _count: number }[];
    activityLast24h: number;
  } | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (!user || user.role !== "ADMIN") { router.push("/login"); return; }
    api<typeof data>("/api/admin/analytics").then((r) => r.data && setData(r.data));
  }, [router]);

  return (
    <DashboardShell role="Admin" onLogout={() => { clearTokens(); router.push("/"); }}>
      <Link href="/admin/dashboard" className="text-sm text-[var(--primary)] mb-4 inline-block">← Dashboard</Link>
      <h1 className="text-3xl font-bold mb-2">Crime Analytics</h1>
      <p className="text-[var(--muted)] mb-8">Hotspot map and reporting trends</p>

      {!data ? (
        <p className="text-[var(--muted)]">Loading analytics...</p>
      ) : (
        <div className="grid lg:grid-cols-2 gap-8">
          <section className="glass-elevated rounded-2xl p-6">
            <h2 className="font-semibold mb-4">Most Reported Areas</h2>
            {data.hotspots.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No data yet</p>
            ) : (
              <ul className="space-y-3">
                {data.hotspots.map((h) => (
                  <li key={h.area} className="flex items-center justify-between">
                    <span>{h.area}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-[var(--muted)]">{h.count} reports</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full risk-${h.risk}`}>{h.risk}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-6 flex gap-4 text-xs text-[var(--muted)]">
              <span><span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-1" />High</span>
              <span><span className="inline-block w-2 h-2 rounded-full bg-yellow-400 mr-1" />Medium</span>
              <span><span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-1" />Low</span>
            </div>
          </section>

          <section className="glass-elevated rounded-2xl p-6">
            <h2 className="font-semibold mb-4">Reports by Category</h2>
            <ul className="space-y-2">
              {data.byCategory.map((c) => (
                <li key={c.category} className="flex justify-between text-sm">
                  <span>{c.category.replace(/_/g, " ")}</span>
                  <span className="text-[var(--primary)] font-medium">{c._count}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-[var(--muted)]">
              Audit events (24h): <span className="text-[var(--foreground)]">{data.activityLast24h}</span>
            </p>
          </section>
        </div>
      )}
    </DashboardShell>
  );
}

