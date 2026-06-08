"use client";

import { useState } from "react";
import { api, uploadFile, downloadEvidence } from "@/lib/api";

interface Evidence {
  id: string;
  fileName: string;
  type: string;
  fileSize: number;
  uploadedAt: string;
}

export function EvidenceSection({
  caseId,
  reportId,
  canUpload,
}: {
  caseId: string;
  reportId: string;
  canUpload: boolean;
}) {
  const [items, setItems] = useState<Evidence[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function load() {
    const res = await api<Evidence[]>(`/api/cases/${caseId}/evidence`);
    if (res.data) {
      setItems(res.data);
      setLoaded(true);
    }
  }

  if (!loaded) {
    load();
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const res = await uploadFile(reportId, file);
    setUploading(false);
    if (res.data) {
      setItems((prev) => [...prev, res.data as Evidence]);
    }
    e.target.value = "";
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium">Evidence</h3>
        {canUpload && (
          <label className="cursor-pointer bg-[var(--primary)] text-white px-3 py-1.5 rounded-lg text-sm">
            {uploading ? "Uploading..." : "Upload File"}
            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No evidence uploaded yet</p>
      ) : (
        <ul className="space-y-2">
          {items.map((ev) => (
            <li
              key={ev.id}
              className="flex items-center justify-between bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-2"
            >
              <div>
                <p className="text-sm font-medium">{ev.fileName}</p>
                <p className="text-xs text-[var(--muted)]">
                  {ev.type} · {(ev.fileSize / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={() => downloadEvidence(ev.id, ev.fileName)}
                className="text-sm text-[var(--primary)] hover:underline"
              >
                Download
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
