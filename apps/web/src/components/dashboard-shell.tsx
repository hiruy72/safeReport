"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotificationsBell } from "@/components/notifications-bell";

const NAV: Record<string, { href: string; label: string; icon: React.ReactNode }[]> = {
  Victim: [
    {
      href: "/victim/dashboard",
      label: "Dashboard",
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
      ),
    },
    {
      href: "/victim/report",
      label: "New Report",
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      href: "/victim/contacts",
      label: "Contacts",
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
        </svg>
      ),
    },
    {
      href: "/victim/upload-documents",
      label: "Identity",
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      ),
    },
  ],
  Police: [
    {
      href: "/police/dashboard",
      label: "Cases",
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
        </svg>
      ),
    },
  ],
  Admin: [
    {
      href: "/admin/dashboard",
      label: "Overview",
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
      ),
    },
    {
      href: "/admin/analytics",
      label: "Analytics",
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
        </svg>
      ),
    },
    {
      href: "/admin/regions",
      label: "Regions",
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      href: "/admin/audit",
      label: "Audit",
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
      ),
    },
  ],
};

const ROLE_COLORS: Record<string, string> = {
  Victim: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  Police: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  Admin: "text-amber-400 bg-amber-400/10 border-amber-400/20",
};

export function DashboardShell({
  role,
  children,
  onLogout,
  backHref,
}: {
  role: string;
  children: React.ReactNode;
  onLogout: () => void;
  backHref?: string;
}) {
  const links = NAV[role] ?? [];
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b" style={{ background: "rgba(255,255,255,0.96)", borderColor: "#e5e7eb", backdropFilter: "blur(12px)", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
        <div className="max-w-7xl mx-auto px-6 py-0 flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center shadow-md shadow-violet-500/25">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="white" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "#0d1117" }}>SafeHer</span>
            </Link>

            <span className={`text-[0.68rem] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full border hidden sm:inline ${ROLE_COLORS[role] ?? "text-[var(--muted)] bg-[var(--surface)] border-[var(--border)]"}`}>
              {role}
            </span>

            <nav className="hidden md:flex items-center gap-1">
              {links.map((l) => {
                const active = pathname === l.href || pathname?.startsWith(l.href + "/");
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg transition-all duration-200 ${
                      active
                        ? "font-semibold"
                        : "hover:bg-[#f3f4f6]"
                    }`}
                    style={{ color: active ? "var(--blue)" : "#6b7280", background: active ? "rgba(37,99,235,0.08)" : undefined }}
                  >
                    {l.icon}
                    {l.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {backHref && (
              <Link
                href={backHref}
                className="hidden sm:flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--primary)] transition-colors px-2 py-1"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back
              </Link>
            )}
            <NotificationsBell />
            <button
              onClick={onLogout}
              className="btn-ghost text-sm px-3.5 py-2 flex items-center gap-1.5"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 animate-fade-up">
        {children}
      </main>

      <footer style={{ borderTop: "1px solid #e5e7eb", paddingTop: "1.25rem", paddingBottom: "1.25rem" }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--muted)]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
              All systems operational
            </span>
            <span>·</span>
            <span>End-to-end encrypted</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/witness" className="hover:text-[var(--primary)] transition-colors">Witness Portal</Link>
            <span>·</span>
            <span>© 2025 SafeHer</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

