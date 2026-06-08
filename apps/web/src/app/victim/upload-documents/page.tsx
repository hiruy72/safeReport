"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { uploadIdentityDocuments, clearTokens, getStoredUser } from "@/lib/api";
import { DashboardShell } from "@/components/dashboard-shell";

export default function UploadDocumentsPage() {
  const router = useRouter();
  const [idImage, setIdImage] = useState<File | null>(null);
  const [selfieImage, setSelfieImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (!user || user.role !== "VICTIM") {
      router.push("/login");
      return;
    }
    setAuthorized(true);
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!idImage || !selfieImage) {
      setError("Both National ID photo and selfie are required");
      return;
    }
    setLoading(true);
    setError("");
    const res = await uploadIdentityDocuments(idImage, selfieImage);
    setLoading(false);
    if (!res.success) {
      setError(res.error ?? "Upload failed");
      return;
    }
    router.push("/victim/dashboard");
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[var(--muted)]">
        Loading...
      </div>
    );
  }

  return (
    <DashboardShell role="Victim" onLogout={() => { clearTokens(); router.push("/"); }}>
      <h1 className="text-2xl font-bold mb-2">Upload Identity Documents</h1>
      <p className="text-sm text-[var(--muted)] mb-8">
        Upload your National ID and a selfie for verification. These are encrypted and only visible to administrators.
      </p>

      <form onSubmit={handleSubmit} className="max-w-md space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">National ID Photo</label>
          <input type="file" accept="image/*" required
            onChange={(e) => setIdImage(e.target.files?.[0] ?? null)} className="w-full text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Selfie Verification Photo</label>
          <input type="file" accept="image/*" capture="user" required
            onChange={(e) => setSelfieImage(e.target.files?.[0] ?? null)} className="w-full text-sm" />
        </div>
        {error && <p className="text-[var(--danger)] text-sm">{error}</p>}
        <button type="submit" disabled={loading}
          className="bg-[var(--primary)] text-white px-6 py-2.5 rounded-lg font-medium disabled:opacity-50">
          {loading ? "Uploading..." : "Submit for Verification"}
        </button>
      </form>

      <Link href="/victim/dashboard" className="text-sm text-[var(--muted)] mt-6 inline-block">
        Skip for now
      </Link>
    </DashboardShell>
  );
}
