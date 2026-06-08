"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, clearTokens, getStoredUser } from "@/lib/api";
import { DashboardShell } from "@/components/dashboard-shell";
import { CASE_STATUS_LABELS, type CaseStatus } from "@safeher/shared-types";

interface Profile {
  anonymousId: string;
  ageRange?: string;
  gender?: string;
  region?: string;
  verificationStatus: string;
  hasIdentityDocuments?: boolean;
}

interface CaseItem {
  id: string;
  category: string;
  createdAt: string;
  case?: {
    id: string;
    caseNumber: string;
    status: CaseStatus;
    statusHistory: { status: CaseStatus; createdAt: string }[];
  };
}

const CATEGORY_ICONS: Record<string, string> = {
  SEXUAL_HARASSMENT: "⚠️",
  DOMESTIC_VIOLENCE: "🏠",
  PHYSICAL_ASSAULT: "🚨",
  STALKING: "👁️",
  ONLINE_HARASSMENT: "💻",
  WORKPLACE_HARASSMENT: "🏢",
  SCHOOL_HARASSMENT: "🎓",
  HUMAN_TRAFFICKING: "🔗",
  OTHER: "📋",
};

const STATUS_STYLES: Record<CaseStatus | string, { bg: string; text: string; dot: string }> = {
  SUBMITTED:       { bg: "bg-blue-500/10 border border-blue-500/20",   text: "text-blue-400",   dot: "bg-blue-400" },
  UNDER_REVIEW:    { bg: "bg-amber-500/10 border border-amber-500/20", text: "text-amber-400",  dot: "bg-amber-400" },
  ASSIGNED:        { bg: "bg-violet-500/10 border border-violet-500/20", text: "text-violet-400", dot: "bg-violet-400" },
  INVESTIGATING:   { bg: "bg-cyan-500/10 border border-cyan-500/20",   text: "text-cyan-400",   dot: "bg-cyan-400" },
  RESOLVED:        { bg: "bg-green-500/10 border border-green-500/20", text: "text-green-400",  dot: "bg-green-400" },
  CLOSED:          { bg: "bg-zinc-500/10 border border-zinc-500/20",   text: "text-zinc-400",   dot: "bg-zinc-400" },
  REOPENED:        { bg: "bg-orange-500/10 border border-orange-500/20", text: "text-orange-400", dot: "bg-orange-400" },
};

export default function VictimDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [sosLoading, setSosLoading] = useState(false);
  const [sosSent, setSosSent] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (!user || user.role !== "VICTIM") {
      router.push("/login");
      return;
    }
    api<Profile>("/api/victims/profile").then((r) => {
      if (r.data) {
        setProfile(r.data);
        if (!r.data.hasIdentityDocuments) {
          router.push("/victim/upload-documents");
        }
      }
    });
    api<CaseItem[]>("/api/victims/cases").then((r) => r.data && setCases(r.data));
  }, [router]);

  async function triggerSOS() {
    setSosLoading(true);
    let body: Record<string, number> = {};
    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 }),
        );
        body = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      } catch {
        /* location unavailable */
      }
    }
    await api("/api/victims/sos", { method: "POST", body: JSON.stringify(body) });
    setSosLoading(false);
    setSosSent(true);
    setTimeout(() => setSosSent(false), 5000);
  }

  const openCases = cases.filter((c) => c.case && !["RESOLVED", "CLOSED"].includes(c.case.status));
  const resolvedCases = cases.filter((c) => c.case && ["RESOLVED", "CLOSED"].includes(c.case.status));

  return (
    <DashboardShell role="Victim" onLogout={() => { clearTokens(); router.push("/"); }}>
      {/* Profile banner */}
      {profile && (
        <div className="glass-card" style={{ borderRadius: 16, padding: "1.5rem", marginBottom: "2rem", position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #eff6ff 0%, #fff 100%)", border: "1px solid #bfdbfe" }}>
          <div style={{ position: "absolute", top: 0, right: 0, width: 180, height: "100%", background: "linear-gradient(to left, rgba(37,99,235,0.04), transparent)" }} />
          <div style={{ position: "relative", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
            <div>
              <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--blue)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.25rem" }}>Your Anonymous ID</p>
              <p style={{ fontSize: "2rem", fontWeight: 900, color: "var(--blue)", letterSpacing: "-0.02em", lineHeight: 1 }}>{profile.anonymousId}</p>
              <p style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "0.5rem" }}>
                {[profile.region, profile.gender, profile.ageRange ? `Age ${profile.ageRange}` : null].filter(Boolean).join(" · ")}
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
              <VerificationBadge status={profile.verificationStatus} />
              {profile.verificationStatus !== "VERIFIED" && (
                <Link href="/victim/upload-documents" style={{ fontSize: "0.75rem", color: "var(--blue)", textDecoration: "none", fontWeight: 600 }}>
                  Complete verification →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Total Reports", value: cases.length, color: "#0d1117" },
          { label: "Active Cases", value: openCases.length, color: "var(--blue)" },
          { label: "Resolved", value: resolvedCases.length, color: "var(--success)" },
          { label: "Under Review", value: cases.filter(c => c.case?.status === "UNDER_REVIEW").length, color: "#d97706" },
        ].map((s) => (
          <div key={s.label} className="glass-card" style={{ borderRadius: 14, padding: "1.25rem", textAlign: "center" }}>
            <p style={{ fontSize: "2rem", fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.35rem", fontWeight: 500 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Cases header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold">Your Cases</h1>
          <p className="text-sm text-[var(--muted)]">All reports you've submitted</p>
        </div>
        <Link href="/victim/report" className="btn-primary px-5 py-2.5 text-sm flex items-center gap-1.5">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          New Report
        </Link>
      </div>

      {cases.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <div className="w-16 h-16 rounded-full glass flex items-center justify-center mx-auto mb-5">
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-[var(--muted)]" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          </div>
          <h3 className="font-semibold text-lg mb-2">No reports yet</h3>
          <p className="text-sm text-[var(--muted)] mb-6 max-w-sm mx-auto">
            Submit a report when you're ready. Everything is anonymous and encrypted.
          </p>
          <Link href="/victim/report" className="btn-primary px-8 py-3 rounded-xl">
            Submit First Report
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map((c) => {
            const statusStyle = c.case ? STATUS_STYLES[c.case.status] ?? STATUS_STYLES.SUBMITTED : null;
            return (
              <Link
                key={c.id}
                href={c.case ? `/victim/cases/${c.case.id}` : "#"}
                className="block glass-card rounded-xl p-5 hover:border-[var(--primary)]/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-xl flex-shrink-0">
                      {CATEGORY_ICONS[c.category] ?? "📋"}
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--foreground)]">
                        {c.case?.caseNumber ?? "Processing..."}
                      </p>
                      <p className="text-sm text-[var(--muted)] mt-0.5">
                        {c.category.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-[var(--muted)] mt-1">
                        Filed {new Date(c.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                  {c.case && statusStyle && (
                    <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0 ${statusStyle.bg} ${statusStyle.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                      {CASE_STATUS_LABELS[c.case.status]}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* SOS Button */}
      <button
        onClick={triggerSOS}
        disabled={sosLoading}
        className={`fixed bottom-7 right-7 w-16 h-16 rounded-full font-black text-sm text-white shadow-2xl transition-all duration-200 z-50 ${
          sosSent
            ? "bg-[var(--success)] shadow-green-500/30 scale-105"
            : "bg-[var(--danger)] shadow-red-500/40 hover:scale-110 hover:shadow-red-500/50"
        }`}
        style={{ boxShadow: sosSent ? "0 0 30px rgba(52,211,153,0.5)" : "0 0 30px rgba(248,113,113,0.4)" }}
      >
        {sosLoading ? "..." : sosSent ? "✓" : "SOS"}
      </button>
    </DashboardShell>
  );
}

function VerificationBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string; icon: string }> = {
    VERIFIED:  { cls: "risk-low",    label: "Verified",       icon: "✓" },
    PENDING:   { cls: "risk-medium", label: "Pending Review", icon: "⏳" },
    REJECTED:  { cls: "risk-high",   label: "Rejected",       icon: "✗" },
  };
  const style = map[status] ?? { cls: "bg-[var(--surface)] text-[var(--muted)]", label: status, icon: "•" };
  return (
    <span className={`badge ${style.cls}`}>
      {style.icon} {style.label}
    </span>
  );
}
