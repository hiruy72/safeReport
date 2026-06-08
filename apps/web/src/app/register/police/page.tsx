"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, registerPolice } from "@/lib/api";

interface Region {
  id: string;
  name: string;
  policeStations: { id: string; name: string }[];
}

export default function PoliceRegisterPage() {
  const router = useRouter();
  const [regions, setRegions] = useState<Region[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [credential, setCredential] = useState<File | null>(null);
  const [form, setForm] = useState({
    email: "",
    password: "",
    badgeNumber: "",
    firstName: "",
    lastName: "",
    phone: "",
    stationId: "",
  });

  useEffect(() => {
    api<Region[]>("/api/regions").then((r) => r.data && setRegions(r.data));
  }, []);

  const stations = regions.flatMap((r) => r.policeStations);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v) data.append(k, v); });
    if (credential) data.append("credential", credential);
    const res = await registerPolice(data);
    setLoading(false);
    if (!res.success) {
      setError(res.error ?? "Registration failed");
      return;
    }
    router.push("/police/pending");
  }

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md glass-elevated rounded-2xl p-8 animate-fade-up">
        <Link href="/" className="text-xl font-bold gradient-text block mb-6">SafeHer</Link>
        <h1 className="text-2xl font-bold mb-1">Police Officer Registration</h1>
        <p className="text-sm text-[var(--muted)] mb-8">
          Upload your official credentials. An administrator will review and assign your station.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="First Name" value={form.firstName} onChange={(v) => update("firstName", v)} />
          <Field label="Last Name" value={form.lastName} onChange={(v) => update("lastName", v)} />
          <Field label="Badge Number" value={form.badgeNumber} onChange={(v) => update("badgeNumber", v)} />
          <Field label="Phone" value={form.phone} onChange={(v) => update("phone", v)} />
          <Field label="Email" type="email" value={form.email} onChange={(v) => update("email", v)} />
          <Field label="Password" type="password" value={form.password} onChange={(v) => update("password", v)} />
          <div>
            <label className="block text-sm font-medium mb-1.5 text-[var(--muted)]">Preferred Police Station</label>
            <select
              value={form.stationId}
              onChange={(e) => update("stationId", e.target.value)}
              className="input-field"
            >
              <option value="">Select station</option>
              {stations.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-[var(--muted)]">Official Credential (PDF/Image)</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setCredential(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-[var(--muted)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[var(--surface-elevated)] file:text-[var(--foreground)]"
            />
          </div>
          {error && <p className="text-[var(--danger)] text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2 disabled:opacity-50">
            {loading ? "Submitting..." : "Submit Registration"}
          </button>
        </form>

        <p className="mt-8 pt-6 border-t border-[var(--border)] text-sm text-center text-[var(--muted)]">
          Already registered? <Link href="/login" className="text-[var(--primary)] hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text",
}: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5 text-[var(--muted)]">{label}</label>
      <input type={type} required value={value} onChange={(e) => onChange(e.target.value)} className="input-field" />
    </div>
  );
}
