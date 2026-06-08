"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function WitnessPortalPage() {
  const [caseNumber, setCaseNumber] = useState("");
  const [statement, setStatement] = useState("");
  const [audio, setAudio] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData();
    form.append("caseNumber", caseNumber);
    form.append("statement", statement);
    if (audio) form.append("audio", audio);
    const res = await api("/api/witness", { method: "POST", body: form });
    setLoading(false);
    if (!res.success) {
      setError(res.error ?? "Submission failed");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="glass-elevated rounded-2xl p-10 max-w-md text-center animate-fade-up">
          <span className="text-4xl mb-4 block">✓</span>
          <h1 className="text-2xl font-bold mb-2">Thank You</h1>
          <p className="text-[var(--muted)] mb-6">Your anonymous statement has been submitted securely.</p>
          <Link href="/" className="text-[var(--primary)] hover:underline">Return home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg glass-elevated rounded-2xl p-8 animate-fade-up">
        <Link href="/" className="text-xl font-bold gradient-text block mb-6">SafeHer</Link>
        <h1 className="text-2xl font-bold mb-2">Witness Portal</h1>
        <p className="text-sm text-[var(--muted)] mb-8">
          Support an existing case with an anonymous statement. No account required.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-[var(--muted)]">Case Number</label>
            <input
              required
              placeholder="e.g. SH-2034521"
              value={caseNumber}
              onChange={(e) => setCaseNumber(e.target.value.toUpperCase())}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-[var(--muted)]">Your Statement</label>
            <textarea
              required
              rows={5}
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              placeholder="Describe what you witnessed..."
              className="input-field resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-[var(--muted)]">Audio Testimony (optional)</label>
            <input type="file" accept="audio/*" onChange={(e) => setAudio(e.target.files?.[0] ?? null)} className="text-sm text-[var(--muted)]" />
          </div>
          {error && <p className="text-[var(--danger)] text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? "Submitting..." : "Submit Anonymously"}
          </button>
        </form>
      </div>
    </div>
  );
}
