import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { api, downloadEvidence, uploadFile, uploadAbuserPhoto, clearTokens, getStoredUser, downloadCaseSummary } from "@/lib/api";
import { DashboardShell } from "@/components/dashboard-shell";
import { StatusTimeline } from "@/components/case/status-timeline";
import { ChatPanel } from "@/components/case/chat-panel";
import { CASE_STATUS_LABELS, type CaseStatus } from "@safeher/shared-types";

interface InfoRequest {
  id: string;
  type: string;
  message: string;
  status: string;
  createdAt: string;
}

interface CaseDetail {
  id: string;
  caseNumber: string;
  status: CaseStatus;
  report: {
    id: string;
    category: string;
    description: string;
    location: string;
    incidentDate: string;
    abuserKnown: boolean;
  };
  statusHistory: { status: CaseStatus; createdAt: string; note?: string }[];
  infoRequests: InfoRequest[];
}

export default function VictimCaseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const caseId = params.id as string;
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (!user || user.role !== "VICTIM") {
      router.push("/login");
      return;
    }
    api<CaseDetail>(`/api/cases/${caseId}`).then((r) => r.data && setCaseData(r.data));
  }, [caseId, router]);

  async function fulfillRequest(requestId: string) {
    await api(`/api/cases/${caseId}/info-requests/${requestId}/fulfill`, { method: "PATCH" });
    setCaseData((prev) =>
      prev
        ? {
            ...prev,
            infoRequests: prev.infoRequests.map((r) =>
              r.id === requestId ? { ...r, status: "FULFILLED" } : r,
            ),
          }
        : prev,
    );
  }

  if (!caseData) {
    return (
      <DashboardShell role="Victim" onLogout={() => { clearTokens(); router.push("/"); }}>
        <p className="text-[var(--muted)]">Loading case...</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      role="Victim"
      onLogout={() => { clearTokens(); router.push("/"); }}
      backHref="/victim/dashboard"
    >
      <Link href="/victim/dashboard" className="text-sm text-[var(--primary)] mb-4 inline-block hover:underline">
        ← Back to cases
      </Link>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{caseData.caseNumber}</h1>
          <p className="text-sm text-[var(--muted)]">{caseData.report.category.replace(/_/g, " ")}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-full glass text-[var(--primary)]">
            {CASE_STATUS_LABELS[caseData.status]}
          </span>
          <button onClick={() => downloadCaseSummary(caseId)} className="btn-ghost text-sm px-3 py-1.5 ml-2">
            Download Summary
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <section className="glass rounded-xl p-5">
            <h2 className="font-semibold mb-3">Report Details</h2>
            <p className="text-sm"><span className="text-[var(--muted)]">Location:</span> {caseData.report.location}</p>
            <p className="text-sm mt-1">
              <span className="text-[var(--muted)]">Date:</span>{" "}
              {new Date(caseData.report.incidentDate).toLocaleDateString()}
            </p>
            <p className="text-sm mt-3 leading-relaxed">{caseData.report.description}</p>
          </section>

          {caseData.report.abuserKnown && (
            <AbuserPhotoBlock reportId={caseData.report.id} />
          )}

          {caseData.infoRequests.length > 0 && (
            <section className="glass border border-[var(--warning)]/30 rounded-xl p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[var(--warning)]/50" />
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <span className="text-[var(--warning)]">⚠️</span> Information Requests
              </h2>
              {caseData.infoRequests.map((req) => (
                <div key={req.id} className="mb-4 last:mb-0 glass-elevated p-4 rounded-lg">
                  <p className="text-sm font-medium leading-relaxed">{req.message}</p>
                  <p className="text-xs text-[var(--muted)] mt-1">{req.type.replace(/_/g, " ")}</p>
                  {req.status === "PENDING" && (
                    <button
                      onClick={() => fulfillRequest(req.id)}
                      className="mt-3 text-sm btn-primary px-4 py-1.5"
                    >
                      Mark as provided
                    </button>
                  )}
                  {req.status === "FULFILLED" && (
                    <span className="inline-block mt-3 text-xs text-[var(--success)] px-2 py-1 glass rounded border border-[var(--success)]/20">
                      ✓ Provided
                    </span>
                  )}
                </div>
              ))}
            </section>
          )}

          <EvidenceBlock caseId={caseId} reportId={caseData.report.id} canUpload />
        </div>

        <div className="space-y-6">
          <section className="glass rounded-xl p-5">
            <h2 className="font-semibold mb-4">Case Progress</h2>
            <StatusTimeline currentStatus={caseData.status} history={caseData.statusHistory} />
          </section>
          <ChatPanel caseId={caseId} userRole="VICTIM" />
        </div>
      </div>
    </DashboardShell>
  );
}

function AbuserPhotoBlock({ reportId }: { reportId: string }) {
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const res = await uploadAbuserPhoto(reportId, file);
    setUploading(false);
    if (res.success) {
      setDone(true);
    }
    e.target.value = "";
  }

  return (
    <section className="glass rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Abuser Photo</h2>
          <p className="text-xs text-[var(--muted)] mt-1">Provide a photo to assist AI matching</p>
        </div>
        {done ? (
          <span className="text-xs text-[var(--success)] glass px-2 py-1 rounded">Uploaded</span>
        ) : (
          <label className="cursor-pointer btn-ghost text-sm px-3 py-1.5">
            {uploading ? "Uploading..." : "Upload Photo"}
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        )}
      </div>
    </section>
  );
}

function EvidenceBlock({
  caseId,
  reportId,
  canUpload,
}: {
  caseId: string;
  reportId: string;
  canUpload: boolean;
}) {
  const [items, setItems] = useState<{ id: string; fileName: string; type: string; fileSize: number }[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api<typeof items>(`/api/cases/${caseId}/evidence`).then((r) => r.data && setItems(r.data));
  }, [caseId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const res = await uploadFile(reportId, file);
    setUploading(false);
    if (res.data) {
      const ev = res.data as { id: string; fileName: string; type: string; fileSize: number };
      setItems((prev) => [...prev, ev]);
    }
    e.target.value = "";
  }

  return (
    <section className="glass rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Evidence</h2>
        {canUpload && (
          <label className="cursor-pointer btn-ghost text-sm px-3 py-1.5">
            {uploading ? "Uploading..." : "Upload File"}
            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No evidence yet</p>
      ) : (
        <ul className="space-y-2">
          {items.map((ev) => (
            <li key={ev.id} className="flex justify-between items-center text-sm glass rounded-lg px-3 py-2">
              <span className="truncate max-w-[200px]">{ev.fileName}</span>
              <button
                onClick={() => downloadEvidence(ev.id, ev.fileName)}
                className="text-[var(--primary)] hover:underline flex-shrink-0"
              >
                Download
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
