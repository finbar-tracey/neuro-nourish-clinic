import {
  CheckCircle2,
  FileText,
  Mail,
  MessageCircle,
  Phone,
  StickyNote,
  Zap,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Activity = {
  id: string;
  type: string;
  description: string;
  createdAt: string;
};

const ICONS: Record<string, typeof Phone> = {
  FORM_SUBMITTED: Zap,
  CALL_ATTEMPTED: Phone,
  CALL_CONNECTED: Phone,
  SMS_SENT: MessageCircle,
  EMAIL_SENT: Mail,
  DOCUMENT_REQUESTED: FileText,
  NOTE_ADDED: StickyNote,
  STATUS_CHANGED: CheckCircle2,
  AUTOMATION_RUN: Zap,
  LEAD_CREATED: Zap,
};

const COLORS: Record<string, string> = {
  CALL_CONNECTED: "bg-emerald-100 text-emerald-700",
  CALL_ATTEMPTED: "bg-violet-100 text-violet-700",
  SMS_SENT: "bg-sky-100 text-sky-700",
  EMAIL_SENT: "bg-blue-100 text-blue-700",
  DOCUMENT_REQUESTED: "bg-amber-100 text-amber-800",
  FORM_SUBMITTED: "bg-orange-100 text-orange-700",
};

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

export function LeadActivityTimeline({ activities }: { activities: Activity[] }) {
  const sorted = [...activities].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  if (sorted.length === 0) {
    return <p className="text-sm text-slate-500">No activity yet.</p>;
  }

  return (
    <ol className="space-y-0">
      {sorted.map((activity, i) => {
        const Icon = ICONS[activity.type] ?? Zap;
        const color = COLORS[activity.type] ?? "bg-slate-100 text-slate-600";
        return (
          <li key={activity.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  color,
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              {i < sorted.length - 1 && (
                <span className="my-1 min-h-[1rem] w-px flex-1 bg-slate-200" aria-hidden />
              )}
            </div>
            <div className={cn("min-w-0 flex-1 pb-4")}>
              <p className="text-xs font-medium text-slate-500">{formatTime(activity.createdAt)}</p>
              <p className="mt-0.5 text-sm leading-snug text-navy">{activity.description}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
