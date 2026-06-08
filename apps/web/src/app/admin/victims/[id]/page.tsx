"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { api, clearTokens, getStoredUser, fetchAuthBlob } from "@/lib/api";
import { DashboardShell } from "@/components/dashboard-shell";

interface VerificationDetails {
  profileId: string;
  anonymousId: string;
  ageRange?: string;
  gender?: string;
  region?: string;
  hasIdImage: boolean;
  hasSelfie: boolean;
  identity: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    phone: string;
    nationalIdNumber: string;
    address: string;
  };
}

export default function AdminVictimReviewPage() {
  const router = useRouter();
  const params = useParams();
  const profileId = params.id as string;
  const [details, setDetails] = useState<VerificationDetails | null>(null);
  const [idUrl, setIdUrl] = useState<string | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (!user || user.role !== "ADMIN") {
      router.push("/login");
      return;
    }
    load();
  }, [profileId, router]);

  async function load() {
    const res = await api<VerificationDetails>(`/api/admin/victims/${profileId}/verification`);
    if (res.data) {
      setDetails(res.data);
      if (res.data.hasIdImage) {
        const url = await fetchAuthBlob(`/api/admin/victims/${profileId}/documents/id`);
        if (url) setIdUrl(url);
      }
      if (res.data.hasSelfie) {
        const url = await fetchAuthBlob(`/api/admin/victims/${profileId}/documents/selfie`);
        if (url) setSelfieUrl(url);
      }
    }
  }

  async function verify(approved: boolean) {
    await api(`/api/admin/victims/${profileId}/verify`, {
      method: "POST",
      body: JSON.stringify({ approved }),
    });
    router.push("/admin/dashboard");
  }

  if (!details) {
    return (
      <DashboardShell role="Admin" onLogout={() => { clearTokens(); router.push("/"); }}>
        <p className="text-[var(--muted)]">Loading...</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="Admin" onLogout={() => { clearTokens(); router.push("/"); }}>
      <Link href="/admin/dashboard" className="text-sm text-[var(--primary)] mb-4 inline-block">
        ← Back to dashboard
      </Link>
      <h1 className="text-2xl font-bold mb-2">Review Identity — {details.anonymousId}</h1>
      <p className="text-sm text-[var(--muted)] mb-8">
        {details.region} · {details.gender} · Age {details.ageRange}
      </p>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <section className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
          <h2 className="font-semibold mb-4">Decrypted Identity (Admin Only)</h2>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-[var(--muted)]">Name</dt><dd>{details.identity.firstName} {details.identity.lastName}</dd></div>
            <div><dt className="text-[var(--muted)]">Date of Birth</dt><dd>{details.identity.dateOfBirth}</dd></div>
            <div><dt className="text-[var(--muted)]">National ID</dt><dd>{details.identity.nationalIdNumber}</dd></div>
            <div><dt className="text-[var(--muted)]">Phone</dt><dd>{details.identity.phone}</dd></div>
            <div><dt className="text-[var(--muted)]">Address</dt><dd>{details.identity.address}</dd></div>
          </dl>
        </section>

        <section className="space-y-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
            <h3 className="font-medium text-sm mb-2">National ID Image</h3>
            {idUrl ? (
              <img src={idUrl} alt="National ID" className="rounded-lg max-h-48 object-contain" />
            ) : (
              <p className="text-sm text-[var(--muted)]">Not uploaded</p>
            )}
          </div>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
            <h3 className="font-medium text-sm mb-2">Selfie Verification</h3>
            {selfieUrl ? (
              <img src={selfieUrl} alt="Selfie" className="rounded-lg max-h-48 object-contain" />
            ) : (
              <p className="text-sm text-[var(--muted)]">Not uploaded</p>
            )}
          </div>
        </section>
      </div>

      <div className="flex gap-3">
        <button onClick={() => verify(true)} className="bg-[var(--success)] text-white px-6 py-2.5 rounded-lg">
          Verify Identity
        </button>
        <button onClick={() => verify(false)} className="border border-[var(--border)] px-6 py-2.5 rounded-lg">
          Reject
        </button>
      </div>
    </DashboardShell>
  );
}
