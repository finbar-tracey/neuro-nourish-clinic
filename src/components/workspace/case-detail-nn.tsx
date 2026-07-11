"use client";

import Link from "next/link";
import { funnelStageLabel } from "@/lib/neuronourish-funnel";
import {
  creditExpiryLabel,
  formatEurAmount,
  funnelStageFromLead,
  NN_CARE_JOURNEY,
  NN_DISQUALIFIED_REASONS,
  NN_LOST_REASONS,
  nnIsAssessmentPaid,
  nnIsProgrammeEnrolled,
  nnRevenueEur,
  nnStageLabel,
  primaryConcernFromLead,
  qualificationTierLabel,
  quizScoreFromLead,
  segmentFromLead,
  pipelineValueEurForStage,
} from "@/lib/neuronourish-workspace";
import { cn, formatDate } from "@/lib/utils";

type LeadLike = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  funnelStage?: string;
  quizScore?: number | null;
  primaryConcern?: string | null;
  segment?: string | null;
  qualificationTier?: string | null;
  revenueEur?: number;
  pipelineValueEur?: number;
  creditExpiryDate?: string | null;
  assessmentPaidAt?: string | null;
  discoveryBookedAt?: string | null;
  enrolledAt?: string | null;
  additionalInfo: string | null;
  probability: number;
  loanPurpose?: string;
  loanAmount?: number;
  propertyType?: string;
  propertyValue?: number;
  initialInvoiceAmount?: number | null;
  revenueGenerated?: number | null;
  expectedValue?: number | null;
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2 last:border-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-navy">{value}</dd>
    </div>
  );
}

export function CaseDetailNnJourney({ lead }: { lead: LeadLike }) {
  const current = funnelStageFromLead(lead as never);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 font-semibold text-navy">Care journey</h2>
      <div className="flex flex-wrap gap-1">
        {NN_CARE_JOURNEY.map((stage) => (
          <span
            key={stage}
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium",
              current === stage ? "bg-gold text-navy" : "bg-slate-100 text-slate-500",
            )}
          >
            {funnelStageLabel(stage)}
          </span>
        ))}
      </div>
    </section>
  );
}

export function CaseDetailNnSummary({ lead }: { lead: LeadLike }) {
  const score = quizScoreFromLead(lead as never);
  const concern = primaryConcernFromLead(lead as never);
  const segment = segmentFromLead(lead as never);
  const enrolled = nnIsProgrammeEnrolled(lead as never);
  const assessmentPaid = nnIsAssessmentPaid(lead as never);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 font-semibold text-navy">Client summary</h2>
      <dl className="space-y-0 text-sm">
        <Row label="Funnel stage" value={nnStageLabel(lead as never)} />
        <Row label="Qualification" value={qualificationTierLabel(lead as never)} />
        {score != null ? <Row label="Quiz score" value={`${score}/100`} /> : null}
        {segment ? (
          <Row
            label="Segment"
            value={segment === "elevated" ? "Worth exploring further" : "Standard"}
          />
        ) : null}
        {concern ? <Row label="Primary concern" value={concern} /> : null}
        <Row label="Programme" value="12-month personalised" />
        <Row label="Email" value={lead.email} />
        <Row label="Phone" value={lead.phone} />
      </dl>

      <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
        <p className="text-xs font-semibold text-slate-400">Quick links</p>
        <div className="flex flex-wrap gap-2 text-xs">
          <Link
            href={`/quiz/results?leadId=${lead.id}${score != null ? `&score=${score}` : ""}`}
            className="rounded-full border border-slate-200 px-2.5 py-1 font-medium text-navy hover:bg-slate-50"
            target="_blank"
          >
            Quiz results
          </Link>
          <Link
            href={`/assessment?leadId=${lead.id}`}
            className="rounded-full border border-slate-200 px-2.5 py-1 font-medium text-navy hover:bg-slate-50"
            target="_blank"
          >
            Assessment checkout
          </Link>
          <Link
            href="/discovery"
            className="rounded-full border border-slate-200 px-2.5 py-1 font-medium text-navy hover:bg-slate-50"
            target="_blank"
          >
            Discovery call
          </Link>
        </div>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <p className="text-xs font-semibold text-slate-400">Revenue</p>
        <p className="mt-0.5 text-[11px] text-slate-500">
          Assessment €90 · Programme €3,550 · Assessment credited within 30 days of enrolment.
        </p>
        <dl className="mt-2 space-y-0 text-sm">
          <Row
            label="Assessment paid"
            value={assessmentPaid ? "Yes" : "No"}
          />
          <Row label="Programme enrolled" value={enrolled ? "Yes" : "No"} />
          {lead.discoveryBookedAt ? (
            <Row label="Discovery booked" value={formatDate(lead.discoveryBookedAt)} />
          ) : null}
          {lead.assessmentPaidAt ? (
            <Row label="Assessment paid" value={formatDate(lead.assessmentPaidAt)} />
          ) : null}
          {lead.creditExpiryDate ? (
            <Row
              label="Assessment credit"
              value={
                <>
                  {formatDate(lead.creditExpiryDate)}
                  {creditExpiryLabel(lead as never) ? (
                    <span className="block text-xs font-normal text-slate-500">
                      {creditExpiryLabel(lead as never)}
                    </span>
                  ) : null}
                </>
              }
            />
          ) : null}
          {lead.enrolledAt ? <Row label="Enrolled" value={formatDate(lead.enrolledAt)} /> : null}
          <Row label="Recorded revenue" value={formatEurAmount(nnRevenueEur(lead as never))} />
          <Row
            label="Pipeline value"
            value={formatEurAmount(
              lead.pipelineValueEur ??
                pipelineValueEurForStage(funnelStageFromLead(lead as never) as never),
            )}
          />
          <Row label="Probability" value={`${lead.probability}%`} />
        </dl>
      </div>

      {lead.additionalInfo ? (
        <p className="mt-4 rounded-lg bg-linen/30 p-3 text-xs leading-relaxed text-slate-600">
          {lead.additionalInfo}
        </p>
      ) : null}
    </div>
  );
}

export function nnLostReasonOptions() {
  return NN_LOST_REASONS;
}

export function nnDisqualifiedReasonOptions() {
  return NN_DISQUALIFIED_REASONS;
}

export function CaseDetailNnHeaderMeta({ lead }: { lead: LeadLike }) {
  const score = quizScoreFromLead(lead as never);
  const concern = primaryConcernFromLead(lead as never);
  const parts = [
    score != null ? `Score ${score}/100` : null,
    concern,
    nnStageLabel(lead as never),
  ].filter(Boolean);

  return <p className="mt-2 text-lg text-slate-700">{parts.join(" · ")}</p>;
}
