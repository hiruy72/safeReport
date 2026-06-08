"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";

interface Message {
  id: string;
  content: string;
  senderRole: string;
  senderLabel: string;
  createdAt: string;
}

export function ChatPanel({ caseId, userRole }: { caseId: string; userRole: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [caseId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadMessages() {
    const res = await api<Message[]>(`/api/cases/${caseId}/chat`);
    if (res.data) setMessages(res.data);
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    const res = await api<Message>(`/api/cases/${caseId}/chat`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
    setSending(false);
    if (res.data) {
      setMessages((prev) => [...prev, res.data!]);
      setContent("");
    }
  }

  return (
    <div className="glass-elevated rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <h3 className="font-medium text-sm">Anonymous Chat</h3>
        <p className="text-xs text-[var(--muted)]">Your identity remains hidden</p>
      </div>
      <div className="h-64 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-[var(--muted)] text-center py-8">No messages yet</p>
        )}
        {messages.map((m) => {
          const isMine = m.senderRole === userRole;
          return (
            <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-xl px-3 py-2 ${isMine ? "btn-primary text-sm !shadow-none" : "glass text-sm"}`}>
                <p className="text-xs opacity-70 mb-0.5">{m.senderLabel}</p>
                <p>{m.content}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="flex gap-2 p-3 border-t border-[var(--border)]">
        <input value={content} onChange={(e) => setContent(e.target.value)} placeholder="Type a message..."
          className="input-field flex-1 text-sm py-2" />
        <button type="submit" disabled={sending} className="btn-primary px-4 py-2 text-sm !shadow-none">
          Send
        </button>
      </form>
    </div>
  );
}
