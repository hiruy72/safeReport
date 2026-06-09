"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, uploadAbuserPhoto } from "@/lib/api";
import { DashboardShell } from "@/components/dashboard-shell";
import { REPORT_CATEGORY_LABELS, type ReportCategory } from "@safeher/shared-types";
import { clearTokens } from "@/lib/api";

const ABUSER_RELATIONS = [
  "EX_BOYFRIEND", "TEACHER", "EMPLOYER", "FAMILY_MEMBER", "STRANGER", "OTHER",
];

export default function NewReportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState<boolean | null>(null);
  const [abuserPhoto, setAbuserPhoto] = useState<File | null>(null);
  const [form, setForm] = useState({
    category: "SEXUAL_HARASSMENT" as ReportCategory,
    incidentDate: "",
    incidentTime: "",
    location: "",
    description: "",
    abuserKnown: false,
    abuserName: "",
    abuserNickname: "",
    abuserPhone: "",
    abuserSocial: "",
    abuserWorkplace: "",
    abuserSchool: "",
    abuserVehicle: "",
    abuserAddress: "",
    abuserRelation: "",
  });

  useEffect(() => {
    api<{ verificationStatus: string }>("/api/victims/profile").then((r) => {
      if (r.data) setVerified(r.data.verificationStatus === "VERIFIED");
    });
  }, []);

  function update(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!verified) {
      setError("Your identity must be verified before submitting reports.");
      return;
    }
    setLoading(true);
    const res = await api<{ id: string; case?: { id: string } }>("/api/victims/reports", {
      method: "POST",
      body: JSON.stringify(form),
    });
    if (res.success && res.data?.id && abuserPhoto) {
      await uploadAbuserPhoto(res.data.id, abuserPhoto);
    }
    setLoading(false);
    if (!res.success) {
      setError(res.error ?? "Failed to submit report");
      return;
    }
    const caseId = res.data?.case?.id;
    router.push(caseId ? `/victim/cases/${caseId}` : "/victim/dashboard");
  }

  if (verified === null) {
    return (
      <DashboardShell role="Victim" onLogout={() => { clearTokens(); router.push("/"); }}>
        <p className="text-[var(--muted)]">Loading...</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="Victim" onLogout={() => { clearTokens(); router.push("/"); }}>
      <h1 className="text-2xl font-bold mb-6">Submit a Report</h1>

      {!verified && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-sm">
          Your identity verification is pending. You cannot submit reports until an administrator verifies your account.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select value={form.category} onChange={(e) => update("category", e.target.value)}
            className="w-full border border-[var(--border)] rounded-lg px-4 py-2.5 bg-[var(--surface)]">
            {(Object.entries(REPORT_CATEGORY_LABELS) as [ReportCategory, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Incident Date</label>
            <input type="date" required value={form.incidentDate} onChange={(e) => update("incidentDate", e.target.value)}
              className="w-full border border-[var(--border)] rounded-lg px-4 py-2.5 bg-[var(--surface)]" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Time (optional)</label>
            <input type="time" value={form.incidentTime} onChange={(e) => update("incidentTime", e.target.value)}
              className="w-full border border-[var(--border)] rounded-lg px-4 py-2.5 bg-[var(--surface)]" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Location</label>
          <input required value={form.location} onChange={(e) => update("location", e.target.value)}
            className="w-full border border-[var(--border)] rounded-lg px-4 py-2.5 bg-[var(--surface)]" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Detailed Description</label>
          <textarea required rows={5} value={form.description} onChange={(e) => update("description", e.target.value)}
            className="w-full border border-[var(--border)] rounded-lg px-4 py-2.5 bg-[var(--surface)]" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.abuserKnown} onChange={(e) => update("abuserKnown", e.target.checked)} />
          The abuser is known to me
        </label>
        {form.abuserKnown && (
          <div className="space-y-3 pl-4 border-l-2 border-[var(--border)]">
            <input placeholder="Full name" value={form.abuserName} onChange={(e) => update("abuserName", e.target.value)}
              className="w-full border border-[var(--border)] rounded-lg px-4 py-2.5 bg-[var(--surface)] text-sm" />
            <input placeholder="Nickname" value={form.abuserNickname} onChange={(e) => update("abuserNickname", e.target.value)}
              className="w-full border border-[var(--border)] rounded-lg px-4 py-2.5 bg-[var(--surface)] text-sm" />
            <input placeholder="Phone number" value={form.abuserPhone} onChange={(e) => update("abuserPhone", e.target.value)}
              className="w-full border border-[var(--border)] rounded-lg px-4 py-2.5 bg-[var(--surface)] text-sm" />
            <input placeholder="Social media handles" value={form.abuserSocial} onChange={(e) => update("abuserSocial", e.target.value)}
              className="w-full border border-[var(--border)] rounded-lg px-4 py-2.5 bg-[var(--surface)] text-sm" />
            <input placeholder="Workplace" value={form.abuserWorkplace} onChange={(e) => update("abuserWorkplace", e.target.value)}
              className="w-full border border-[var(--border)] rounded-lg px-4 py-2.5 bg-[var(--surface)] text-sm" />
            <input placeholder="School" value={form.abuserSchool} onChange={(e) => update("abuserSchool", e.target.value)}
              className="w-full border border-[var(--border)] rounded-lg px-4 py-2.5 bg-[var(--surface)] text-sm" />
            <input placeholder="Vehicle plate" value={form.abuserVehicle} onChange={(e) => update("abuserVehicle", e.target.value)}
              className="w-full border border-[var(--border)] rounded-lg px-4 py-2.5 bg-[var(--surface)] text-sm" />
            <input placeholder="Address" value={form.abuserAddress} onChange={(e) => update("abuserAddress", e.target.value)}
              className="w-full border border-[var(--border)] rounded-lg px-4 py-2.5 bg-[var(--surface)] text-sm" />
            <select value={form.abuserRelation} onChange={(e) => update("abuserRelation", e.target.value)}
              className="input-field text-sm">
              <option value="">Relationship to victim</option>
              {ABUSER_RELATIONS.map((r) => (
                <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
              ))}
            </select>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--muted)]">Abuser photo (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAbuserPhoto(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-[var(--muted)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[var(--surface-elevated)] file:text-[var(--foreground)]"
              />
              <p className="text-xs text-[var(--muted)] mt-1">Stored encrypted. EXIF metadata is stripped.</p>
            </div>
          </div>
        )}
        {error && <p className="text-[var(--danger)] text-sm">{error}</p>}
        <button type="submit" disabled={loading || !verified}
          className="bg-[var(--primary)] text-white px-6 py-2.5 rounded-lg font-medium disabled:opacity-50">
          {loading ? "Submitting..." : "Submit Report"}
        </button>
      </form>
    </DashboardShell>
  );
}

