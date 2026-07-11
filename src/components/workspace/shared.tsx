export const LEAD_STATUSES = [
  { value: "NEW", label: "New Leads", color: "bg-blue-100 text-blue-800" },
  { value: "CONTACTED", label: "Contacted", color: "bg-amber-100 text-amber-800" },
  { value: "BOOKED", label: "Booked", color: "bg-violet-100 text-violet-800" },
  { value: "WON", label: "Won", color: "bg-green-100 text-green-800" },
  { value: "LOST", label: "Lost", color: "bg-slate-100 text-slate-700" },
  { value: "DISQUALIFIED", label: "Disqualified", color: "bg-red-100 text-red-800" },
  { value: "FOLLOW_UP", label: "Follow Up", color: "bg-orange-100 text-orange-800" },
] as const;

export function StatusBadge({ status }: { status: string }) {
  const config = LEAD_STATUSES.find((s) => s.value === status) ?? LEAD_STATUSES[0];
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}
    >
      {config.label}
    </span>
  );
}

export const TRIGGER_LABELS: Record<string, string> = {
  LEAD_CREATED: "New lead submitted",
  LEAD_CAPTURED: "Step 2 contact captured",
  STATUS_CHANGED: "Lead status changed",
  LEAD_IDLE: "Lead inactive",
};

export const ACTION_LABELS: Record<string, string> = {
  SEND_EMAIL: "Send email",
  ADD_NOTE: "Add note",
  UPDATE_STATUS: "Update status",
  WEBHOOK: "Call webhook",
  CREATE_TASK: "Create task",
};
