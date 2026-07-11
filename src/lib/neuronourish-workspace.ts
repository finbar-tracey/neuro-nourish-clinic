import type { CaseStage, Lead, OperationalQueue } from "@/generated/prisma/client";
import { NN_CONCERN_OPTIONS } from "@/lib/neuronourish-copy";
import {
  funnelStageLabel,
  NN_FUNNEL_STAGES,
  NN_PRICING,
  type NnFunnelStage,
} from "@/lib/neuronourish-funnel";
import { defaultCaseOwner, isNeuronourishVertical } from "@/lib/vertical-config";

export const NN_CARE_JOURNEY = [
  "eoi_submitted",
  "quiz_partial",
  "quiz_completed",
  "discovery_requested",
  "assessment_purchased",
  "assessment_completed",
  "programme_enrolled",
] as const;

export const NN_QUALIFICATION_TIERS = [
  "unscreened",
  "highly_qualified",
  "nurture",
  "out_of_scope",
] as const;

export type NnQualificationTier = (typeof NN_QUALIFICATION_TIERS)[number];

export const NN_LOST_REASONS = [
  "Not ready to proceed",
  "Chose another provider",
  "Outside service area",
  "Not a clinical fit",
  "No response after follow-up",
  "Other",
] as const;

export const NN_DISQUALIFIED_REASONS = [
  "Not eligible for programme",
  "Requires specialist medical care first",
  "Under 18",
  "Other",
] as const;

const LEGACY_FUNNEL_STAGES = new Set<string>(NN_FUNNEL_STAGES);

export function workspaceClientLabel(): "Client" | "Borrower" {
  return isNeuronourishVertical() ? "Client" : "Borrower";
}

export function workspaceOwnerName(): string {
  return defaultCaseOwner();
}

/** Primary funnel stage — native field with legacy fallback for pre-migration rows. */
export function funnelStageFromLead(lead: Lead): string {
  if (lead.funnelStage && lead.funnelStage !== "quiz_partial") {
    return lead.funnelStage;
  }
  const legacy = lead.qualificationTier ?? lead.propertyType;
  if (legacy && LEGACY_FUNNEL_STAGES.has(legacy)) return legacy;
  return lead.funnelStage ?? "eoi_submitted";
}

export function quizScoreFromLead(lead: Lead): number | null {
  if (lead.quizScore != null && lead.quizScore > 0 && lead.quizScore <= 100) {
    return lead.quizScore;
  }
  const legacy = lead.loanAmount ?? lead.propertyValue ?? 0;
  if (legacy > 0 && legacy <= 100) return legacy;
  return null;
}

export function segmentFromLead(lead: Lead): string | null {
  if (lead.segment === "elevated" || lead.segment === "standard") return lead.segment;
  if (lead.propertyType === "elevated" || lead.propertyType === "standard") {
    return lead.propertyType;
  }
  return null;
}

export function primaryConcernFromLead(lead: Lead): string | null {
  const blbPurposes = new Set([
    "auction",
    "purchase",
    "refinance",
    "chain_break",
    "chain break",
    "development",
    "bridging",
  ]);
  if (lead.primaryConcern) {
    if (blbPurposes.has(lead.primaryConcern)) return null;
    const match = NN_CONCERN_OPTIONS.find((o) => o.value === lead.primaryConcern);
    return match?.label ?? lead.primaryConcern.replace(/_/g, " ");
  }
  if (blbPurposes.has(lead.loanPurpose)) return null;
  const match = NN_CONCERN_OPTIONS.find((o) => o.value === lead.loanPurpose);
  if (match) return match.label;
  if (LEGACY_FUNNEL_STAGES.has(lead.loanPurpose)) return null;
  if (!lead.loanPurpose || lead.loanPurpose === "general") return null;
  return lead.loanPurpose.replace(/_/g, " ");
}

export function qualificationTierLabel(lead: Lead): string {
  const tier = lead.qualificationTier ?? "unscreened";
  const labels: Record<string, string> = {
    unscreened: "Unscreened",
    highly_qualified: "Highly qualified",
    nurture: "Nurture",
    out_of_scope: "Out of scope",
  };
  return labels[tier] ?? tier;
}

export function qualificationTierFromQuiz(score: number, segment?: string): NnQualificationTier {
  if (score >= 75) return "highly_qualified";
  if (score < 50 || segment === "elevated") return "nurture";
  return "nurture";
}

export function nnStageLabel(lead: Lead): string {
  return funnelStageLabel(funnelStageFromLead(lead));
}

export function formatEur(cents: number): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatEurAmount(euros: number): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(euros);
}

export function pipelineValueEurForStage(stage: NnFunnelStage): number {
  switch (stage) {
    case "programme_enrolled":
      return NN_PRICING.programmeCents / 100;
    case "assessment_purchased":
    case "onboarding_started":
    case "onboarding_completed":
    case "assessment_completed":
    case "discovery_requested":
      return NN_PRICING.programmeCents / 100;
    case "quiz_completed":
      return NN_PRICING.assessmentCents / 100;
    default:
      return Math.round((NN_PRICING.programmeCents / 100) * 0.25);
  }
}

export function nnExpectedValueCents(lead: Lead): number {
  if (lead.pipelineValueEur > 0) return Math.round(lead.pipelineValueEur * 100);
  const tier = funnelStageFromLead(lead);
  if (tier === "programme_enrolled" || lead.status === "WON") {
    return NN_PRICING.programmeCents;
  }
  if (tier === "assessment_purchased" || tier === "assessment_completed") {
    return NN_PRICING.assessmentCents;
  }
  if (tier === "quiz_completed") return NN_PRICING.assessmentCents;
  return Math.round(NN_PRICING.programmeCents * 0.25);
}

export function nnRevenueEur(lead: Lead): number {
  if (lead.revenueEur > 0) return lead.revenueEur;
  const legacy = lead.revenueGenerated ?? lead.initialInvoiceAmount ?? 0;
  if (legacy > 0) return legacy / 100;
  return 0;
}

export function nnIsProgrammeEnrolled(lead: Lead): boolean {
  return funnelStageFromLead(lead) === "programme_enrolled" || lead.status === "WON";
}

export function nnIsAssessmentPaid(lead: Lead): boolean {
  const tier = funnelStageFromLead(lead);
  return (
    tier === "assessment_purchased" ||
    tier === "assessment_completed" ||
    lead.assessmentPaidAt != null ||
    lead.revenueEur >= NN_PRICING.assessmentCents / 100
  );
}

export function nnInferOperationalQueue(lead: Lead): OperationalQueue {
  // Never exile to AT_RISK based on riskLevel — overdue is a badge, not a queue.
  if (nnIsProgrammeEnrolled(lead) || lead.caseStage === "COMPLETED" || lead.status === "WON") {
    return "COMPLETION";
  }

  const tier = funnelStageFromLead(lead);
  if (tier === "assessment_purchased" || tier === "assessment_completed" || tier === "onboarding_started") {
    return "APPLICATION";
  }

  // Follow-up only after real human contact or a booked discovery slot
  const inActiveFollowUp =
    Boolean(lead.conversationStarted) ||
    Boolean(lead.firstResponseAt) ||
    Boolean(lead.discoveryBookedAt) ||
    Boolean(lead.priorityCallBookedAt) ||
    tier === "b2b_briefing_booked" ||
    tier === "b2b_briefing_no_show" ||
    tier === "discovery_no_show" ||
    tier === "clinician_briefing_downloaded";

  if (inActiveFollowUp) {
    return "AWAITING_CALLBACK";
  }

  // quiz_partial, quiz_completed, discovery_requested (unbooked), eoi → New enquiries
  return "NEW_LEAD";
}

const NN_CALLBACK_SLA_MINUTES = 15;

const LEGACY_LOAN_NEXT_ACTION =
  /^(call borrower|wait for borrower|follow up lender|chase documents|request documents|review documents|confirm completion|monitor completion)/i;

export function isLegacyLoanNextAction(nextAction: string | null | undefined): boolean {
  if (!nextAction?.trim()) return true;
  return LEGACY_LOAN_NEXT_ACTION.test(nextAction.trim());
}

export function nnCallbackDueAt(now = new Date()): Date {
  return new Date(now.getTime() + NN_CALLBACK_SLA_MINUTES * 60 * 1000);
}

export function nnResolveNextAction(lead: Lead, stage: NnFunnelStage): string {
  if (isLegacyLoanNextAction(lead.nextAction)) {
    return nnNextActionForStage(stage);
  }
  return lead.nextAction!;
}

export function nnResolveCaseStage(lead: Lead, stage: NnFunnelStage): CaseStage {
  const expected = nnCaseStageForFunnel(stage);
  // quiz_completed used to map to CONTACTED even before any call — remap uncontacted leads
  if (
    !lead.conversationStarted &&
    !lead.firstResponseAt &&
    (stage === "quiz_completed" || stage === "quiz_partial" || stage === "eoi_submitted") &&
    (lead.caseStage === "CONTACTED" || lead.caseStage === "NEW_ENQUIRY" || !lead.caseStage)
  ) {
    return expected;
  }
  if (expected !== "NEW_ENQUIRY" && lead.caseStage === "NEW_ENQUIRY") {
    return expected;
  }
  return lead.caseStage;
}

export function nnNormalizeLeadOperationalFields(lead: Lead, now = new Date()): Lead {
  const stage = funnelStageFromLead(lead) as NnFunnelStage;
  const caseStage = nnResolveCaseStage(lead, stage);
  const operationalQueue = nnInferOperationalQueue({
    ...lead,
    funnelStage: stage,
    caseStage,
  });
  const callbackDueAt = lead.nextActionAt ?? lead.callbackDueAt ?? nnCallbackDueAt(now);
  return {
    ...lead,
    owner: lead.owner ?? workspaceOwnerName(),
    nextAction: nnResolveNextAction(lead, stage),
    caseStage,
    // Always recompute — clears sticky AT_RISK exile from SLA cron / legacy logic
    operationalQueue,
    nextActionAt: callbackDueAt,
    callbackDueAt,
  };
}

export function nnNextActionForStage(stage: NnFunnelStage): string {
  const actions: Record<NnFunnelStage, string> = {
    eoi_submitted: "Call client — discuss goals",
    quiz_started: "Await quiz completion",
    quiz_partial: "Follow up if quiz abandoned",
    quiz_completed: "Offer assessment or discovery call",
    assessment_offered: "Follow up on assessment offer",
    assessment_purchased: "Send CNS assessment link",
    onboarding_started: "Complete onboarding wizard",
    onboarding_completed: "Monitor programme upgrade nurture",
    assessment_completed: "Review summary — offer programme",
    programme_offered: "Follow up on programme enrolment",
    programme_enrolled: "Schedule dietitian onboarding",
    discovery_requested: "Confirm discovery call time",
    clinician_briefing_downloaded: "Follow up — briefing pack downloaded",
    b2b_briefing_booked: "Prepare for clinical briefing call",
    b2b_briefing_no_show: "Reschedule practice briefing call — missed slot",
    discovery_no_show: "Reschedule discovery call — missed slot",
  };
  return actions[stage] ?? "Call client";
}

export function nnCaseStageForFunnel(stage: NnFunnelStage): CaseStage {
  switch (stage) {
    case "programme_enrolled":
      return "COMPLETED";
    case "assessment_purchased":
    case "onboarding_started":
    case "assessment_completed":
      return "APPLICATION_PREPARING";
    case "discovery_requested":
      return "CONTACT_DUE";
    case "clinician_briefing_downloaded":
    case "b2b_briefing_booked":
    case "b2b_briefing_no_show":
    case "discovery_no_show":
      return "CONTACTED";
    case "quiz_completed":
      return "CONTACT_DUE";
    case "quiz_partial":
    case "eoi_submitted":
      return "NEW_ENQUIRY";
    default:
      return "NEW_ENQUIRY";
  }
}

/** Legacy loan columns — minimal stubs so bridging schema constraints stay satisfied. */
export function nnLegacyLoanStub(concern?: string | null) {
  return {
    loanPurpose: concern ?? "general",
    loanAmount: 0,
    termMonths: 0,
    propertyType: "client",
    propertyValue: 0,
    propertyLocation: "Ireland",
    timeframe: "12_month_programme",
  };
}

export type NnClinicalPatch = {
  funnelStage: string;
  quizScore?: number | null;
  primaryConcern?: string | null;
  segment?: string | null;
  qualificationTier?: string;
  revenueEur?: number;
  pipelineValueEur?: number;
  discoveryBookedAt?: Date | null;
  assessmentPaidAt?: Date | null;
  creditExpiryDate?: Date | null;
  enrolledAt?: Date | null;
  operationalQueue?: OperationalQueue;
  caseStage?: CaseStage;
  nextAction?: string;
  nextActionAt?: Date | null;
  callbackDueAt?: Date | null;
  status?: Lead["status"];
  formCompleted?: boolean;
  probability?: number;
  initialInvoiceAmount?: number;
  revenueGenerated?: number;
  expectedValue?: number;
};

export function nnOperationalPatchForStage(
  stage: NnFunnelStage,
  extras?: Partial<NnClinicalPatch>,
): NnClinicalPatch {
  const stubLead = { funnelStage: stage, qualificationTier: "unscreened" } as Lead;
  const base: NnClinicalPatch = {
    funnelStage: stage,
    nextAction: nnNextActionForStage(stage),
    operationalQueue: nnInferOperationalQueue(stubLead),
    caseStage: nnCaseStageForFunnel(stage),
    pipelineValueEur: pipelineValueEurForStage(stage),
    ...nnLegacyLoanStub(),
    ...extras,
  };

  switch (stage) {
    case "quiz_completed": {
      const due = nnCallbackDueAt();
      return {
        ...base,
        formCompleted: true,
        probability: 25,
        nextActionAt: due,
        callbackDueAt: due,
      };
    }
    case "discovery_requested":
      return { ...base, status: "BOOKED", probability: 30 };
    case "assessment_purchased": {
      const creditExpiry = new Date();
      creditExpiry.setDate(creditExpiry.getDate() + NN_PRICING.assessmentCreditDays);
      return {
        ...base,
        status: "BOOKED",
        assessmentPaidAt: new Date(),
        creditExpiryDate: creditExpiry,
        revenueEur: NN_PRICING.assessmentCents / 100,
        pipelineValueEur: NN_PRICING.programmeCents / 100,
        initialInvoiceAmount: NN_PRICING.assessmentCents,
        expectedValue: NN_PRICING.programmeCents,
        probability: 45,
      };
    }
    case "assessment_completed":
      return {
        ...base,
        pipelineValueEur: NN_PRICING.programmeCents / 100,
        expectedValue: NN_PRICING.programmeCents,
        probability: 60,
      };
    case "onboarding_completed":
      return {
        ...base,
        pipelineValueEur: NN_PRICING.programmeCents / 100,
        expectedValue: NN_PRICING.programmeCents,
        probability: 55,
      };
    case "programme_enrolled":
      return {
        ...base,
        status: "WON",
        operationalQueue: "COMPLETION",
        caseStage: "COMPLETED",
        enrolledAt: new Date(),
        revenueEur: NN_PRICING.programmeCents / 100,
        pipelineValueEur: NN_PRICING.programmeCents / 100,
        initialInvoiceAmount: NN_PRICING.programmeCents,
        revenueGenerated: NN_PRICING.programmeCents,
        expectedValue: NN_PRICING.programmeCents,
        probability: 100,
        nextAction: "Schedule dietitian onboarding",
      };
    default:
      return base;
  }
}

export function nnCaseCardMeta(lead: Lead): {
  headline: string;
  subline: string;
  showRevenue: boolean;
  revenueLabel: string | null;
} {
  const score = quizScoreFromLead(lead);
  const concern = primaryConcernFromLead(lead);
  const stage = nnStageLabel(lead);
  const parts: string[] = [];
  if (score != null) parts.push(`Score ${score}/100`);
  if (concern) parts.push(concern);
  parts.push(stage);

  const enrolled = nnIsProgrammeEnrolled(lead);
  const assessmentPaid = nnIsAssessmentPaid(lead);
  const revenue = nnRevenueEur(lead);

  return {
    headline: parts.join(" · "),
    subline: segmentFromLead(lead)
      ? `Segment: ${segmentFromLead(lead) === "elevated" ? "Worth exploring" : "Standard"}`
      : "",
    showRevenue: enrolled || assessmentPaid || revenue > 0,
    revenueLabel:
      revenue > 0
        ? formatEurAmount(revenue)
        : enrolled
          ? formatEurAmount(NN_PRICING.programmeCents / 100)
          : assessmentPaid
            ? formatEurAmount(NN_PRICING.assessmentCents / 100)
            : null,
  };
}

export function creditExpiryLabel(lead: Lead): string | null {
  if (!lead.creditExpiryDate) return null;
  const diff = new Date(lead.creditExpiryDate).getTime() - Date.now();
  const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
  if (days < 0) return `Credit expired ${Math.abs(days)}d ago`;
  if (days === 0) return "Credit expires today";
  return `${days}d credit remaining`;
}

export function nnQueueOverrides(): Record<
  string,
  { label: string; emoji: string; description: string }
> {
  return {
    NEW_LEAD: {
      label: "New enquiries",
      emoji: "🧠",
      description: "Quiz, EOI, or discovery requests needing first contact",
    },
    AWAITING_CALLBACK: {
      label: "Follow-up",
      emoji: "📞",
      description: "Discovery calls and assessment conversations in progress",
    },
    APPLICATION: {
      label: "Assessment",
      emoji: "📋",
      description: "CNS assessment purchased — clinician summary pending",
    },
    COMPLETION: {
      label: "Enrolled",
      emoji: "✓",
      description: "12-month programme clients",
    },
    AT_RISK: {
      label: "At risk",
      emoji: "🚨",
      description: "Overdue / high-risk filter — not a separate exile queue",
    },
  };
}

export function nnHomeCopy() {
  return {
    greeting: workspaceOwnerName(),
    description:
      "Call new enquiries first — then follow up through discovery, assessment, and programme enrolment.",
    quickLinks: [
      { href: "/workspace/inbox", label: "New enquiries" },
      { href: "/workspace/callbacks", label: "Follow-up" },
      { href: "/workspace/completions", label: "Enrolled" },
    ],
    kpiLabels: {
      newLeads: "New enquiries",
      followUp: "Follow-up",
      overdue: "Overdue",
      revenue: "Revenue this month",
      pipeline: "Pipeline value",
    },
  };
}

export function nnInboxDescription(): string {
  return `New quiz, EOI, and discovery requests — ${workspaceOwnerName()} is notified when they arrive.`;
}

export function useNnWorkspace(): boolean {
  return isNeuronourishVertical();
}
