import { CASE_STATUS_LABELS, type CaseStatus } from "@safeher/shared-types";

const STATUS_ORDER: CaseStatus[] = [
  "SUBMITTED",
  "IDENTITY_VERIFIED",
  "SENT_TO_POLICE",
  "UNDER_REVIEW",
  "INVESTIGATION_STARTED",
  "EVIDENCE_COLLECTION",
  "SUSPECT_IDENTIFIED",
  "COURT_PROCESS",
  "RESOLVED",
  "CLOSED",
];

export function StatusTimeline({
  currentStatus,
  history,
}: {
  currentStatus: CaseStatus;
  history?: { status: CaseStatus; createdAt: string; note?: string }[];
}) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);

  return (
    <div className="space-y-0">
      {STATUS_ORDER.map((status, i) => {
        const done = i <= currentIndex;
        const entry = history?.find((h) => h.status === status);
        return (
          <div key={status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`w-3 h-3 rounded-full ${done ? "bg-[var(--primary)]" : "bg-[var(--border)]"}`}
              />
              {i < STATUS_ORDER.length - 1 && (
                <div className={`w-0.5 h-8 ${done ? "bg-[var(--primary)]" : "bg-[var(--border)]"}`} />
              )}
            </div>
            <div className="pb-6">
              <p className={`text-sm font-medium ${done ? "text-[var(--foreground)]" : "text-[var(--muted)]"}`}>
                {done ? "✓ " : ""}{CASE_STATUS_LABELS[status]}
              </p>
              {entry && (
                <p className="text-xs text-[var(--muted)]">
                  {new Date(entry.createdAt).toLocaleDateString()}
                  {entry.note && ` · ${entry.note}`}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
