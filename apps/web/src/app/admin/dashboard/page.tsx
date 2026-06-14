"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, clearTokens, getStoredUser } from "@/lib/api";
import { DashboardShell } from "@/components/dashboard-shell";

interface Region {
  id: string;
  name: string;
  policeStations: { id: string; name: string }[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<{
    pendingPolice: number;
    pendingVictims: number;
    users?: { role: string; _count: number }[];
    cases?: { status: string; _count: number }[];
  } | null>(null);
  const [pendingPolice, setPendingPolice] = useState<unknown[]>([]);
  const [pendingVictims, setPendingVictims] = useState<unknown[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [approveStations, setApproveStations] = useState<Record<string, string>>({});

  useEffect(() => {
    const user = getStoredUser();
    if (!user || user.role !== "ADMIN") {
      router.push("/login");
      return;
    }
    api("/api/admin/stats").then((r) => r.data && setStats(r.data as typeof stats));
    api("/api/admin/police/pending").then((r) => r.data && setPendingPolice(r.data as unknown[]));
    api("/api/admin/victims/pending").then((r) => r.data && setPendingVictims(r.data as unknown[]));
    api<Region[]>("/api/admin/regions").then((r) => r.data && setRegions(r.data));
  }, [router]);

  const allStations = regions.flatMap((r) => r.policeStations);

  async function approvePolice(userId: string) {
    const stationId = approveStations[userId];
    await api(`/api/admin/police/${userId}/approve`, {
      method: "POST",
      body: JSON.stringify({ stationId: stationId || undefined }),
    });
    setPendingPolice((p) => p.filter((x) => (x as { id: string }).id !== userId));
  }

  async function rejectPolice(userId: string) {
    await api(`/api/admin/police/${userId}/reject`, { method: "POST" });
    setPendingPolice((p) => p.filter((x) => (x as { id: string }).id !== userId));
  }

  return (
    <DashboardShell role="Admin" onLogout={() => { clearTokens(); router.push("/"); }}>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-3 text-sm">
          <Link href="/admin/regions" className="text-[var(--primary)] hover:underline">Regions & Stations</Link>
          <Link href="/admin/audit" className="text-[var(--primary)] hover:underline">Audit Logs</Link>
        </div>
      </div>

      {stats && (
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <StatCard title="Pending Police" value={stats.pendingPolice} />
          <StatCard title="Pending Victims" value={stats.pendingVictims} />
          <StatCard title="Total Users" value={stats.users?.reduce((s, u) => s + u._count, 0) ?? 0} />
          <StatCard title="Total Cases" value={stats.cases?.reduce((s, c) => s + c._count, 0) ?? 0} />
        </div>
      )}

      <section className="mb-10">
        <h2 className="font-semibold mb-4">Pending Police Officers</h2>
        {pendingPolice.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No pending approvals</p>
        ) : (
          <div className="space-y-3">
            {pendingPolice.map((p) => {
              const officer = p as {
                id: string;
                email: string;
                policeProfile?: { firstName: string; lastName: string; badgeNumber: string; stationId?: string; credentialKey?: string };
              };
              return (
                <div key={officer.id} className="glass-elevated rounded-xl p-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{officer.policeProfile?.firstName} {officer.policeProfile?.lastName}</p>
                      <p className="text-sm text-[var(--muted)]">{officer.email} · Badge #{officer.policeProfile?.badgeNumber}</p>
                      {officer.policeProfile?.credentialKey && (
                        <a
                          href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/admin/police/${officer.id}/credential`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-[var(--primary)] hover:underline"
                        >
                          View credential (requires auth)
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={approveStations[officer.id] ?? officer.policeProfile?.stationId ?? ""}
                        onChange={(e) => setApproveStations({ ...approveStations, [officer.id]: e.target.value })}
                        className="input-field py-2 text-sm"
                      >
                        <option value="">Assign station *</option>
                        {allStations.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <button onClick={() => approvePolice(officer.id)}
                        className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[var(--success)] hover:bg-[var(--success)]/80 transition-colors">Approve</button>
                      <button onClick={() => rejectPolice(officer.id)}
                        className="btn-ghost px-4 py-2 text-[var(--danger)] hover:bg-[var(--danger)]/10 text-sm">Reject</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-semibold mb-4">Pending Victim Verifications</h2>
        {pendingVictims.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No pending verifications</p>
        ) : (
          <div className="space-y-3">
            {pendingVictims.map((v) => {
              const victim = v as {
                id: string;
                anonymousId: string;
                region?: { name: string };
                identityVault?: { idImageKey?: string; selfieImageKey?: string };
              };
              const docsReady = victim.identityVault?.idImageKey && victim.identityVault?.selfieImageKey;
              return (
                <div key={victim.id} className="flex items-center justify-between glass-elevated rounded-xl p-4">
                  <div>
                    <p className="font-medium">{victim.anonymousId}</p>
                    <p className="text-sm text-[var(--muted)]">
                      {victim.region?.name} · {docsReady ? "Documents uploaded" : "Missing ID/selfie"}
                    </p>
                  </div>
                  <Link
                    href={`/admin/victims/${victim.id}`}
                    className="btn-primary text-sm px-4 py-2"
                  >
                    Review
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </DashboardShell>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm text-[var(--muted)]">{title}</p>
    </div>
  );
}
