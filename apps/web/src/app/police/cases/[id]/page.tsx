"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { api, clearTokens, getStoredUser, downloadEvidence, downloadPoliceReport, downloadWitnessAudio, fetchAuthBlob } from "@/lib/api";
import { DashboardShell } from "@/components/dashboard-shell";
import { StatusTimeline } from "@/components/case/status-timeline";
import { ChatPanel } from "@/components/case/chat-panel";
import { CASE_STATUS_LABELS, type CaseStatus } from "@safeher/shared-types";

interface CaseDetail {
  id: string;
  caseNumber: string;
  status: CaseStatus;
  isUrgent: boolean;
  investigator?: { id: string; firstName: string; lastName: string; badgeNumber: string };
  report: {
    id: string;
    category: string;
    description: string;
    location: string;
    incidentDate: string;
    abuserKnown?: boolean;
    abuserName?: string;
    victimProfile: { anonymousId: string; ageRange?: string; gender?: string; region?: { name: string } };
  };
  statusHistory: { status: CaseStatus; createdAt: string; note?: string }[];
  infoRequests: { id: string; type: string; message: string; status: string }[];
}

interface Officer {
  id: string;
  firstName: string;
  lastName: string;
  badgeNumber: string;
}

interface SuspectMatch {
  canonicalName: string;
  confidence: number;
  reportCount: number;
  locations: string[];
  reports: { name: string; reportId: string; caseNumber: string; location: string }[];
}

export default function PoliceCaseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const caseId = params.id as string;
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [newStatus, setNewStatus] = useState<CaseStatus>("UNDER_REVIEW");
  const [statusNote, setStatusNote] = useState("");
  const [infoType, setInfoType] = useState("MORE_SCREENSHOTS");
  const [infoMessage, setInfoMessage] = useState("");
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [investigatorId, setInvestigatorId] = useState("");
  const [matches, setMatches] = useState<SuspectMatch[]>([]);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  async function loadCase() {
    const r = await api<CaseDetail>(`/api/police/cases/${caseId}`);
    if (r.data) {
      setCaseData(r.data);
      setNewStatus(r.data.status);
      if (r.data.investigator) setInvestigatorId(r.data.investigator.id);
      
      if (r.data.report.abuserKnown) {
        const url = await fetchAuthBlob(`/api/cases/${caseId}/abuser-photo`);
        if (url) setPhotoUrl(url);
      }
    }
  }

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
    loadCase();
    api<Officer[]>("/api/police/officers").then((r) => r.data && setOfficers(r.data));
    api<SuspectMatch[]>("/api/police/suspect-matches").then((r) => r.data && setMatches(r.data));
  }, [caseId, router]);

  async function updateStatus() {
    const res = await api(`/api/police/cases/${caseId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: newStatus, note: statusNote || undefined }),
    });
    if (res.success) {
      setStatusNote("");
      await loadCase();
    }
  }

  async function sendInfoRequest() {
    if (!infoMessage.trim()) return;
    await api(`/api/police/cases/${caseId}/info-request`, {
      method: "POST",
      body: JSON.stringify({ type: infoType, message: infoMessage }),
    });
    setInfoMessage("");
    await loadCase();
  }

  async function assignInvestigator() {
    if (!investigatorId) return;
    await api(`/api/police/cases/${caseId}/assign`, {
      method: "POST",
      body: JSON.stringify({ investigatorId }),
    });
    await loadCase();
  }

  async function generateReport() {
    setGeneratingReport(true);
    const res = await api<string>(`/api/police/cases/${caseId}/report`);
    setGeneratingReport(false);
    if (res.data && caseData) {
      const text = typeof res.data === "string" ? res.data : (res.data as { text: string }).text;
      downloadPoliceReport(text, caseData.caseNumber);
    }
  }

  if (!caseData) {
    return (
      <DashboardShell role="Police" onLogout={() => { clearTokens(); router.push("/"); }}>
        <p className="text-[var(--muted)]">Loading case...</p>
      </DashboardShell>
    );
  }

  const victim = caseData.report.victimProfile;
  const relevantMatches = matches.filter((m) =>
    m.reports.some((r) => r.caseNumber === caseData.caseNumber),
  );

  return (
    <DashboardShell
      role="Police"
      onLogout={() => { clearTokens(); router.push("/"); }}
      backHref="/police/dashboard"
    >
      <Link href="/police/dashboard" className="text-sm text-[var(--primary)] mb-4 inline-block hover:underline">
        ← Back to cases
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {caseData.caseNumber}
            {caseData.isUrgent && (
              <span className="ml-2 text-xs font-semibold text-[var(--danger)] glass px-2 py-1 rounded-full border border-[var(--danger)]/30">
                URGENT
              </span>
            )}
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">{caseData.report.category.replace(/_/g, " ")}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs glass px-3 py-1.5 rounded-full text-[var(--primary)]">
            {CASE_STATUS_LABELS[caseData.status]}
          </span>
          <button
            onClick={generateReport}
            disabled={generatingReport}
            className="btn-ghost text-sm py-2 px-4 disabled:opacity-50"
          >
            {generatingReport ? "Generating..." : "Generate Report"}
          </button>
        </div>
      </div>

      <div className="glass rounded-xl p-5 mb-6">
        <h2 className="font-semibold mb-2 text-sm text-[var(--muted)]">Anonymous Victim</h2>
        <p className="text-xl font-bold gradient-text">{victim.anonymousId}</p>
        <p className="text-sm text-[var(--muted)] mt-1">
          {victim.region?.name} · {victim.gender} · Age {victim.ageRange}
        </p>
        {caseData.investigator && (
          <p className="text-sm mt-3 text-[var(--muted)]">
            Investigator: {caseData.investigator.firstName} {caseData.investigator.lastName} (#{caseData.investigator.badgeNumber})
          </p>
        )}
      </div>

      {relevantMatches.length > 0 && (
        <section className="glass rounded-xl p-5 mb-6 border border-[var(--warning)]/20">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <span className="text-[var(--warning)]">⚡</span> AI Suspect Matches
          </h2>
          {relevantMatches.map((m) => (
            <div key={m.canonicalName} className="glass-elevated rounded-lg p-4 mb-3 last:mb-0">
              <div className="flex justify-between items-start">
                <p className="font-medium">{m.canonicalName}</p>
                <span className="text-xs text-[var(--success)]">{m.confidence}% match</span>
              </div>
              <p className="text-sm text-[var(--muted)] mt-1">
                Linked to {m.reportCount} reports · {m.locations.join(", ")}
              </p>
              <ul className="mt-2 text-xs text-[var(--muted)] space-y-1">
                {m.reports.map((r) => (
                  <li key={r.reportId}>Case {r.caseNumber} — {r.location}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <section className="glass rounded-xl p-5">
            <h2 className="font-semibold mb-3">Report</h2>
            <p className="text-sm text-[var(--muted)]">{caseData.report.location}</p>
            <p className="text-sm mt-3 leading-relaxed">{caseData.report.description}</p>
            {caseData.report.abuserKnown && caseData.report.abuserName && (
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <p className="text-sm text-[var(--warning)] font-medium mb-2">
                  Known abuser: {caseData.report.abuserName}
                </p>
                {photoUrl && (
                  <img src={photoUrl} alt="Abuser" className="w-32 h-32 object-cover rounded-lg border border-[var(--border)]" />
                )}
              </div>
            )}
          </section>

          <section className="glass rounded-xl p-5">
            <h2 className="font-semibold mb-3">Assign Investigator</h2>
            <select
              value={investigatorId}
              onChange={(e) => setInvestigatorId(e.target.value)}
              className="input-field mb-3 text-sm"
            >
              <option value="">Select officer</option>
              {officers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.firstName} {o.lastName} (#{o.badgeNumber})
                </option>
              ))}
            </select>
            <button onClick={assignInvestigator} className="btn-primary text-sm py-2 px-4">
              Assign
            </button>
          </section>

          <section className="glass rounded-xl p-5">
            <h2 className="font-semibold mb-3">Update Status</h2>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as CaseStatus)}
              className="input-field mb-3 text-sm"
            >
              {(Object.entries(CASE_STATUS_LABELS) as [CaseStatus, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <input
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="Note (optional)"
              className="input-field mb-3 text-sm"
            />
            <button onClick={updateStatus} className="btn-primary text-sm py-2 px-4">
              Update Status
            </button>
          </section>

          <section className="glass rounded-xl p-5">
            <h2 className="font-semibold mb-3">Request Information</h2>
            <select
              value={infoType}
              onChange={(e) => setInfoType(e.target.value)}
              className="input-field mb-3 text-sm"
            >
              <option value="MORE_SCREENSHOTS">Need more screenshots</option>
              <option value="WITNESS_INFO">Need witness information</option>
              <option value="EXACT_LOCATION">Need exact location</option>
              <option value="ANOTHER_DOCUMENT">Need another document</option>
              <option value="OTHER">Other</option>
            </select>
            <textarea
              value={infoMessage}
              onChange={(e) => setInfoMessage(e.target.value)}
              placeholder="Message to victim..."
              rows={3}
              className="input-field mb-3 text-sm resize-none"
            />
            <button onClick={sendInfoRequest} className="btn-primary text-sm py-2 px-4">
              Send Request
            </button>
          </section>

          <PoliceEvidence caseId={caseId} />
          <PoliceWitness caseId={caseId} />
        </div>

        <div className="space-y-6">
          <section className="glass rounded-xl p-5">
            <h2 className="font-semibold mb-4">Timeline</h2>
            <StatusTimeline currentStatus={caseData.status} history={caseData.statusHistory} />
          </section>
          <ChatPanel caseId={caseId} userRole="POLICE" />
        </div>
      </div>
    </DashboardShell>
  );
}

function PoliceEvidence({ caseId }: { caseId: string }) {
  const [items, setItems] = useState<{ id: string; fileName: string }[]>([]);

  useEffect(() => {
    api<typeof items>(`/api/police/cases/${caseId}/evidence`).then((r) => r.data && setItems(r.data));
  }, [caseId]);

  return (
    <section className="glass rounded-xl p-5">
      <h2 className="font-semibold mb-3">Evidence</h2>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No evidence uploaded</p>
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

function PoliceWitness({ caseId }: { caseId: string }) {
  const [items, setItems] = useState<{ id: string; statement: string; hasAudio: boolean; createdAt: string }[]>([]);

  useEffect(() => {
    api<typeof items>(`/api/cases/${caseId}/witness`).then((r) => r.data && setItems(r.data));
  }, [caseId]);

  if (items.length === 0) return null;

  return (
    <section className="glass rounded-xl p-5 border border-[var(--primary)]/20">
      <h2 className="font-semibold mb-3">Witness Testimonies</h2>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="glass-elevated rounded-lg px-4 py-3">
            <p className="text-sm leading-relaxed text-[var(--text)]">"{item.statement}"</p>
            <div className="flex items-center justify-between mt-3 text-xs">
              <span className="text-[var(--muted)]">{new Date(item.createdAt).toLocaleString()}</span>
              {item.hasAudio && (
                <button
                  onClick={() => downloadWitnessAudio(caseId, item.id)}
                  className="text-[var(--primary)] hover:underline"
                >
                  Download Audio
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
