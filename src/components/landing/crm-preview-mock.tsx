import { CalendarCheck, Inbox, TrendingUp } from "lucide-react";
import { HEALTHCARE_FOR_CLINICS_CRM } from "@/lib/healthcare-lp-copy";
import { cn } from "@/lib/utils";

const ROWS = [
  {
    name: "Sarah M.",
    treatment: "Full arch",
    stage: "Booked",
    queue: "Callbacks",
    time: "2m ago",
    tone: "green" as const,
  },
  {
    name: "James T.",
    treatment: "Single implant",
    stage: "New",
    queue: "New lead",
    time: "8m ago",
    tone: "orange" as const,
  },
  {
    name: "Priya K.",
    treatment: "Multiple implants",
    stage: "Qualified",
    queue: "Inbox",
    time: "22m ago",
    tone: "blue" as const,
  },
] as const;

const TONE_STYLES = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  orange: "bg-orange-50 text-orange-700 ring-orange-200",
  blue: "bg-sky-50 text-sky-700 ring-sky-200",
} as const;

/** Static CRM preview for B2B page — no screenshot asset required */
export function CrmPreviewMock() {
  const copy = HEALTHCARE_FOR_CLINICS_CRM;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ring-1 ring-slate-100">
      <div className="flex items-center justify-between border-b border-slate-800 bg-navy px-4 py-3 text-white sm:px-5">
        <div className="flex items-center gap-2">
          <div className="flex gap-1" aria-hidden>
            <span className="h-2 w-2 rounded-full bg-red-400/90" />
            <span className="h-2 w-2 rounded-full bg-amber-400/90" />
            <span className="h-2 w-2 rounded-full bg-emerald-400/90" />
          </div>
          <span className="text-sm font-semibold">Booked Consult — Ops workspace</span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" aria-hidden />
          Live
        </span>
      </div>

      <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/80">
        {copy.mockKpis.map((kpi) => (
          <div key={kpi.label} className="px-3 py-4 text-center sm:px-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{kpi.label}</p>
            <p
              className={cn(
                "mt-1 font-display text-2xl font-semibold sm:text-3xl",
                kpi.tone === "gold" ? "text-gold-ink" : "text-navy",
              )}
            >
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 border-b border-slate-100 bg-white px-4 py-2.5 text-[11px] text-slate-500">
        <span className="rounded-md bg-navy px-2 py-0.5 font-semibold text-white">All queues</span>
        <span className="rounded-md px-2 py-0.5">Inbox · 1</span>
        <span className="rounded-md px-2 py-0.5">Callbacks · 1</span>
      </div>

      <ul className="divide-y divide-slate-100">
        {ROWS.map((row) => (
          <li
            key={row.name}
            className="flex items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-slate-50/80 sm:px-5"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-navy">{row.name}</p>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1",
                    TONE_STYLES[row.tone],
                  )}
                >
                  {row.stage}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {row.treatment} · {row.queue}
              </p>
            </div>
            <span className="shrink-0 text-xs font-medium text-slate-400">{row.time}</span>
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-3 gap-px border-t border-slate-100 bg-slate-100 text-center text-[10px] font-semibold uppercase tracking-wide">
        <div className="flex items-center justify-center gap-1 bg-white py-2.5 text-slate-500">
          <Inbox className="h-3.5 w-3.5" aria-hidden />
          Enquiry
        </div>
        <div className="flex items-center justify-center gap-1 bg-white py-2.5 text-gold-ink">
          <CalendarCheck className="h-3.5 w-3.5" aria-hidden />
          Booked
        </div>
        <div className="flex items-center justify-center gap-1 bg-white py-2.5 text-slate-500">
          <TrendingUp className="h-3.5 w-3.5" aria-hidden />
          Showed
        </div>
      </div>
    </div>
  );
}
