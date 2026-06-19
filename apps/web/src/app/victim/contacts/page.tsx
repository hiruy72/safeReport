"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, clearTokens, getStoredUser } from "@/lib/api";
import { DashboardShell } from "@/components/dashboard-shell";

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship?: string;
  email?: string;
  notifyOnSos: boolean;
}

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    relationship: "",
    email: "",
    notifyOnSos: false,
  });
  
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (!user || user.role !== "VICTIM") {
      router.push("/login");
      return;
    }
    fetchContacts();
  }, [router]);

  async function fetchContacts() {
    setLoading(true);
    const res = await api<EmergencyContact[]>("/api/victims/emergency-contacts");
    if (res.data) setContacts(res.data);
    setLoading(false);
  }

  function logout() {
    clearTokens();
    router.push("/");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isEditing) {
      await api(`/api/victims/emergency-contacts/${isEditing}`, {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      setIsEditing(null);
    } else {
      await api("/api/victims/emergency-contacts", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setIsAdding(false);
    }
    setForm({ name: "", phone: "", relationship: "", email: "", notifyOnSos: false });
    fetchContacts();
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this contact?")) return;
    await api(`/api/victims/emergency-contacts/${id}`, { method: "DELETE" });
    fetchContacts();
  }

  function handleEdit(contact: EmergencyContact) {
    setIsEditing(contact.id);
    setForm({
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship || "",
      email: contact.email || "",
      notifyOnSos: contact.notifyOnSos,
    });
    setIsAdding(true);
  }

  function handleCancel() {
    setIsAdding(false);
    setIsEditing(null);
    setForm({ name: "", phone: "", relationship: "", email: "", notifyOnSos: false });
  }

  return (
    <DashboardShell role="Victim" onLogout={logout}>
      <div className="flex items-center justify-between mb-8 animate-fade-up" style={{ animationDelay: "0ms" }}>
        <div>
          <h2 className="text-2xl font-bold gradient-text">Emergency Contacts</h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            Manage the people who will be notified in case of an emergency.
          </p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="btn-primary px-4 py-2 text-sm"
          >
            Add Contact
          </button>
        )}
      </div>

      {isAdding && (
        <div className="glass-elevated rounded-xl p-6 mb-8 animate-fade-up">
          <h3 className="text-lg font-semibold mb-6">
            {isEditing ? "Edit Emergency Contact" : "Add Emergency Contact"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[var(--muted)]">Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-field"
                  placeholder="e.g. Jane Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[var(--muted)]">Phone *</label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="input-field"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[var(--muted)]">Relationship</label>
                <input
                  type="text"
                  value={form.relationship}
                  onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                  className="input-field"
                  placeholder="e.g. Sister, Friend"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[var(--muted)]">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field"
                  placeholder="jane.doe@example.com"
                />
              </div>
            </div>
            
            <div className="flex items-center mt-6 pt-4 border-t border-[var(--border)]">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.notifyOnSos}
                  onChange={(e) => setForm({ ...form, notifyOnSos: e.target.checked })}
                  className="w-5 h-5 rounded border-[var(--border)] bg-[rgba(0,0,0,0.25)] text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                />
                <span className="text-sm">
                  Notify this contact automatically when I use the SOS button
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button type="button" onClick={handleCancel} className="btn-ghost px-5 py-2 text-sm">
                Cancel
              </button>
              <button type="submit" className="btn-primary px-5 py-2 text-sm">
                {isEditing ? "Save Changes" : "Add Contact"}
              </button>
            </div>
          </form>
        </div>
      )}

      {!loading && contacts.length === 0 && !isAdding && (
        <div className="text-center py-16 glass rounded-xl animate-fade-up" style={{ animationDelay: "100ms" }}>
          <div className="text-4xl mb-4">📇</div>
          <p className="text-[var(--muted)] mb-6 text-lg">No emergency contacts added yet.</p>
          <button
            onClick={() => setIsAdding(true)}
            className="btn-primary px-6 py-3"
          >
            Add Your First Contact
          </button>
        </div>
      )}

      {contacts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {contacts.map((contact, i) => (
            <div 
              key={contact.id} 
              className="glass card-hover rounded-xl p-6 relative group animate-fade-up"
              style={{ animationDelay: `${(i % 5) * 100}ms` }}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">{contact.name}</h3>
                  {contact.relationship && (
                    <span className="text-xs px-2 py-1 rounded bg-[var(--surface-elevated)] text-[var(--primary)] font-medium mt-1 inline-block">
                      {contact.relationship}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(contact)} className="text-xs px-2 py-1 btn-ghost">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(contact.id)} className="text-xs px-2 py-1 bg-[rgba(248,113,113,0.1)] text-[var(--danger)] rounded hover:bg-[rgba(248,113,113,0.2)] transition">
                    Delete
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 mt-4 text-sm text-[var(--muted)]">
                <p className="flex items-center gap-2">
                  <span className="text-base">📞</span> {contact.phone}
                </p>
                {contact.email && (
                  <p className="flex items-center gap-2">
                    <span className="text-base">✉️</span> {contact.email}
                  </p>
                )}
              </div>

              {contact.notifyOnSos && (
                <div className="mt-5 inline-block w-full text-center risk-high text-xs px-3 py-1.5 rounded-lg font-medium border border-[var(--danger)]">
                  🚨 SOS Alert Enabled
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

