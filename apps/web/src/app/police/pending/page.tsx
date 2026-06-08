"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearTokens } from "@/lib/api";

export default function PolicePendingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 bg-[rgba(251,191,36,0.2)] text-[var(--warning)] rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-3">Awaiting Approval</h1>
        <p className="text-[var(--muted)] mb-8">
          Your police officer account has been submitted. An administrator will review your
          credentials and approve your access. You will receive a notification when approved.
        </p>
        <Link href="/login" className="text-[var(--primary)] hover:underline">Return to sign in</Link>
        <button
          onClick={() => { clearTokens(); router.push("/"); }}
          className="block mx-auto mt-4 text-sm text-[var(--muted)]"
        >
          Back to home
        </button>
      </div>
    </div>
  );
}
