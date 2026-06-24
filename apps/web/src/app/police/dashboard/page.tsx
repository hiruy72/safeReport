"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, clearTokens, getStoredUser } from "@/lib/api";
import { DashboardShell } from "@/components/dashboard-shell";
import { CASE_STATUS_LABELS, type CaseStatus } from "@safeher/shared-types";

interface PoliceStats {
  totalCases: number;
  pendingCases: number;
  urgentCases: number;
  underInvestigation: number;
  solvedCases: number;
}

interface CaseRow {
  id: string;
  caseNumber: string;
  status: CaseStatus;
  isUrgent: boolean;
  report: {
    category: string;
    victimProfile: { anonymousId: string; ageRange?: string; region?: { name: string } };
  };
}

export default function PoliceDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<PoliceStats | null>(null);
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    const user = getStoredUser();
    if (!user || user.role !== "POLICE") {
      router.push("/login");
      return;
    }
    if (user.status === "PENDING") {
      router.push("/police/pending");
      return;
    }
    api<PoliceStats>("/api/police/dashboard").then((r) => r.data && setStats(r.data));
  }, [router]);

  useEffect(() => {
    const path = statusFilter ? `/api/police/cases?status=${statusFilter}` : "/api/police/cases";
    api<CaseRow[]>(path).then((r) => r.data && setCases(r.data));
  }, [statusFilter]);

  return (
    <DashboardShell role="Police" onLogout={() => { clearTokens(); router.push("/"); }}>
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Total", value: stats.totalCases },
            { label: "Pending", value: stats.pendingCases },
            { label: "Urgent", value: stats.urgentCases },
            { label: "Investigating", value: stats.underInvestigation },
            { label: "Solved", value: stats.solvedCases },
          ].map((s) => (
            <div key={s.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-[var(--muted)]">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Station Cases</h2>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">All statuses</option>
          {(Object.entries(CASE_STATUS_LABELS) as [CaseStatus, string][]).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {cases.length === 0 && (
          <p className="text-sm text-[var(--muted)]">No cases found</p>
        )}
        {cases.map((c) => (
          <Link
            key={c.id}
            href={`/police/cases/${c.id}`}
            className="block bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--primary)]"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">
                  {c.caseNumber}
                  {c.isUrgent && <span className="ml-2 text-[var(--danger)] text-xs">URGENT</span>}
                </p>
                <p className="text-sm text-[var(--muted)]">
                  {c.report.victimProfile.anonymousId} · {c.report.category.replace(/_/g, " ")}
                </p>
              </div>
              <span className="text-xs bg-[var(--surface-elevated)] text-[var(--primary)] px-2 py-1 rounded border border-[var(--primary)]/20">
                {CASE_STATUS_LABELS[c.status]}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </DashboardShell>
  );
}
