"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, getStoredUser } from "@/lib/api";

interface Notification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  metadata?: { caseId?: string };
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const unread = items.filter((n) => !n.read).length;

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  async function load() {
    const res = await api<Notification[]>("/api/notifications");
    if (res.data) setItems(res.data);
  }

  async function markRead(id: string) {
    await api(`/api/notifications/${id}/read`, { method: "PATCH" });
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg glass hover:bg-[var(--surface-elevated)]" aria-label="Notifications">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--accent)] rounded-full" />}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 glass-elevated rounded-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)] flex justify-between items-center">
            <span className="font-medium text-sm">Notifications</span>
            {unread > 0 && (
              <button onClick={() => api("/api/notifications/read-all", { method: "PATCH" }).then(load)} className="text-xs text-[var(--primary)]">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {items.length === 0 ? (
              <p className="p-4 text-sm text-[var(--muted)]">No notifications</p>
            ) : (
              items.map((n) => {
                const user = getStoredUser();
                const href = n.metadata?.caseId
                  ? user?.role === "POLICE"
                    ? `/police/cases/${n.metadata.caseId}`
                    : `/victim/cases/${n.metadata.caseId}`
                  : "#";
                return (
                  <div key={n.id} className={`px-4 py-3 border-b border-[var(--border)] last:border-0 ${!n.read ? "bg-[var(--accent-soft)]" : ""}`}
                    onClick={() => !n.read && markRead(n.id)}>
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-[var(--muted)] mt-0.5">{n.body}</p>
                    {n.metadata?.caseId && (
                      <Link href={href} className="text-xs text-[var(--primary)] mt-1 inline-block" onClick={(e) => e.stopPropagation()}>
                        View case →
                      </Link>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
