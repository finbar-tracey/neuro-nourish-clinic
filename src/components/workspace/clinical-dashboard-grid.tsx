"use client";

import { format } from "date-fns";
import { AlertTriangle, CheckCircle, CreditCard, ShieldCheck } from "lucide-react";
import { funnelStageLabel } from "@/lib/neuronourish-funnel";
import { primaryConcernFromLead } from "@/lib/neuronourish-workspace";
import type { Lead } from "@/generated/prisma/client";

type ClinicalLead = Pick<
  Lead,
  | "funnelStage"
  | "quizScore"
  | "primaryConcern"
  | "loanPurpose"
  | "revenueEur"
  | "pipelineValueEur"
> & {
  creditExpiryDate?: Date | string | null;
  assessmentPaidAt?: Date | string | null;
  discoveryBookedAt?: Date | string | null;
  enrolledAt?: Date | string | null;
};

export function ClinicalDashboardGrid({ lead }: { lead: ClinicalLead }) {
  const isCreditExpired = lead.creditExpiryDate
    ? new Date(lead.creditExpiryDate) < new Date()
    : false;

  const concern =
    primaryConcernFromLead(lead as Lead) ??
    lead.primaryConcern?.replace(/_/g, " ") ??
    "General prevention";

  const revenueTier =
    lead.revenueEur >= 3550
      ? "Programme enrolled"
      : lead.revenueEur >= 90
        ? "Assessment tier"
        : "Lead phase";

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-linen/30 p-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-sm">
        <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Initial quiz metric
        </span>
        <p className="mt-1 font-display text-3xl font-bold text-navy">
          {lead.quizScore != null ? `${lead.quizScore}/100` : "Pending"}
        </p>
        <p className="mt-2 text-xs font-medium capitalize text-gold">Focus: {concern}</p>
      </div>

      <div className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-sm">
        <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Care stage
        </span>
        <div className="mt-1 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 shrink-0 text-gold" aria-hidden />
          <span className="text-base font-semibold capitalize text-navy">
            {funnelStageLabel(lead.funnelStage)}
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Pipeline value: €{lead.pipelineValueEur.toLocaleString("en-IE")}
        </p>
      </div>

      <div className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-sm">
        <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          CNS testing window
        </span>
        {lead.creditExpiryDate ? (
          <>
            <div className="mt-1 flex items-center gap-2">
              {isCreditExpired ? (
                <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" aria-hidden />
              ) : (
                <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
              )}
              <span
                className={`text-base font-semibold ${isCreditExpired ? "text-red-600" : "text-navy"}`}
              >
                {format(new Date(lead.creditExpiryDate), "dd MMM yyyy")}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {isCreditExpired ? "Testing credit expired" : "Active 30-day window"}
            </p>
          </>
        ) : (
          <>
            <p className="mt-1 text-base font-semibold text-slate-400">Not purchased</p>
            <p className="mt-2 text-xs text-slate-500">No active testing profile</p>
          </>
        )}
      </div>

      <div className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-sm">
        <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Collected revenue
        </span>
        <div className="mt-1 flex items-center gap-2">
          <CreditCard className="h-5 w-5 shrink-0 text-gold" aria-hidden />
          <span className="text-3xl font-bold text-navy">
            €{lead.revenueEur.toLocaleString("en-IE")}
          </span>
        </div>
        <p className="mt-2 text-xs font-medium text-gold">{revenueTier}</p>
      </div>
    </div>
  );
}
