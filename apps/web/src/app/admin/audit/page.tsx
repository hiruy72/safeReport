"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, clearTokens, getStoredUser } from "@/lib/api";
import { DashboardShell } from "@/components/dashboard-shell";

interface AuditLog {
  id: string;
  action: string;
  resource?: string;
  resourceId?: string;
  ipAddress?: string;
  createdAt: string;
  user?: { email: string; role: string };
}

export default function AdminAuditPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const user = getStoredUser();
    if (!user || user.role !== "ADMIN") { router.push("/login"); return; }
    load(page);
  }, [page, router]);

  async function load(p: number) {
    const res = await api<{ items: AuditLog[]; totalPages: number }>(`/api/admin/audit-logs?page=${p}`);
    if (res.data) {
      setLogs(res.data.items);
      setTotalPages(res.data.totalPages);
    }
  }

  return (
    <DashboardShell role="Admin" onLogout={() => { clearTokens(); router.push("/"); }} backHref="/admin/dashboard">
      <Link href="/admin/dashboard" className="text-sm text-[var(--primary)] mb-4 inline-block">← Dashboard</Link>
      <h1 className="text-2xl font-bold mb-6">Audit Logs</h1>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left">
              <th className="py-2 pr-4">Time</th>
              <th className="py-2 pr-4">User</th>
              <th className="py-2 pr-4">Action</th>
              <th className="py-2 pr-4">Resource</th>
              <th className="py-2">IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-[var(--border)]">
                <td className="py-2 pr-4 text-[var(--muted)]">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="py-2 pr-4">{log.user?.email ?? "—"}</td>
                <td className="py-2 pr-4">{log.action.replace(/_/g, " ")}</td>
                <td className="py-2 pr-4">{log.resource ?? "—"} {log.resourceId && `#${log.resourceId.slice(0, 8)}`}</td>
                <td className="py-2">{log.ipAddress ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2 mt-6">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}
          className="px-3 py-1 border border-[var(--border)] rounded text-sm disabled:opacity-40">Prev</button>
        <span className="text-sm text-[var(--muted)] self-center">Page {page} of {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
          className="px-3 py-1 border border-[var(--border)] rounded text-sm disabled:opacity-40">Next</button>
      </div>
    </DashboardShell>
  );
}
