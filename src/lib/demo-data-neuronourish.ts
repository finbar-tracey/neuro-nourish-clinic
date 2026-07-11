import { db } from "@/lib/db";
import { deleteLeadCase } from "@/lib/delete-lead-case";
import { NN_PRICING, type NnFunnelStage } from "@/lib/neuronourish-funnel";
import {
  nnLegacyLoanStub,
  nnOperationalPatchForStage,
  pipelineValueEurForStage,
  qualificationTierFromQuiz,
} from "@/lib/neuronourish-workspace";
import { defaultCaseOwner } from "@/lib/vertical-config";

export const NN_DEMO_EMAIL_DOMAIN = "@demo.neuronourish.local";
/** Also purge legacy BLB demo rows when Emer reloads NN demo. */
export const NN_DEMO_LEGACY_BLB_DOMAIN = "@demo.blb.local";
const DEMO_TAG = "[DEMO]";

function minutesAgo(m: number) {
  return new Date(Date.now() - m * 60 * 1000);
}

function hoursAgo(h: number) {
  return minutesAgo(h * 60);
}

function daysAgo(d: number) {
  return hoursAgo(d * 24);
}

function hoursFromNow(h: number) {
  return new Date(Date.now() + h * 60 * 60 * 1000);
}

type NnDemoCase = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  funnelStage: NnFunnelStage;
  primaryConcern: string;
  quizScore?: number;
  segment?: string;
  source: string;
  attributionChannel: string;
  utmSource?: string;
  utmCampaign?: string;
  nextAction: string;
  nextActionAt: Date;
  conversationStarted: boolean;
  firstResponseAt?: Date | null;
  responseTimeMinutes?: number | null;
  formCompleted: boolean;
  createdAt: Date;
  note: string;
  riskLevel?: "LOW" | "MEDIUM" | "HIGH";
  discoveryBookedAt?: Date | null;
  assessmentPaidAt?: Date | null;
  enrolledAt?: Date | null;
};

const CASES: NnDemoCase[] = [
  {
    firstName: "Aoife",
    lastName: "Byrne",
    email: `aoife.byrne${NN_DEMO_EMAIL_DOMAIN}`,
    phone: "0879001001",
    funnelStage: "quiz_partial",
    primaryConcern: "memory",
    source: "quiz",
    attributionChannel: "Meta",
    utmSource: "facebook",
    utmCampaign: "brain_quiz_ie",
    nextAction: "Follow up if quiz abandoned",
    nextActionAt: minutesAgo(-6),
    conversationStarted: false,
    formCompleted: false,
    createdAt: minutesAgo(12),
    note: "Soft capture at Q6 — name + email only. Nurture enrolled.",
    riskLevel: "MEDIUM",
  },
  {
    firstName: "Sean",
    lastName: "Murphy",
    email: `sean.murphy${NN_DEMO_EMAIL_DOMAIN}`,
    phone: "0879001002",
    funnelStage: "quiz_completed",
    primaryConcern: "focus",
    quizScore: 62,
    segment: "general",
    source: "quiz",
    attributionChannel: "Meta",
    utmSource: "facebook",
    utmCampaign: "brain_quiz_ie",
    nextAction: "Call client — quiz completed",
    nextActionAt: minutesAgo(-3),
    conversationStarted: false,
    formCompleted: true,
    createdAt: minutesAgo(25),
    note: "Quiz score 62/100 · Worth exploring. Call for discovery.",
    riskLevel: "MEDIUM",
  },
  {
    firstName: "Niamh",
    lastName: "Kelly",
    email: `niamh.kelly${NN_DEMO_EMAIL_DOMAIN}`,
    phone: "0879001003",
    funnelStage: "quiz_completed",
    primaryConcern: "family_history",
    quizScore: 48,
    segment: "elevated",
    source: "quiz",
    attributionChannel: "Organic",
    nextAction: "Call client — quiz report requested",
    nextActionAt: minutesAgo(8),
    conversationStarted: true,
    firstResponseAt: minutesAgo(20),
    responseTimeMinutes: 11,
    formCompleted: true,
    createdAt: hoursAgo(2),
    note: "Requested emailed report + mobile. Hot follow-up.",
    riskLevel: "LOW",
  },
  {
    firstName: "Conor",
    lastName: "Walsh",
    email: `conor.walsh${NN_DEMO_EMAIL_DOMAIN}`,
    phone: "0879001004",
    funnelStage: "discovery_requested",
    primaryConcern: "prevention",
    quizScore: 71,
    segment: "general",
    source: "discovery_page",
    attributionChannel: "Direct",
    nextAction: "Confirm discovery call time",
    nextActionAt: hoursFromNow(4),
    conversationStarted: true,
    firstResponseAt: hoursAgo(1),
    responseTimeMinutes: 9,
    formCompleted: true,
    createdAt: hoursAgo(5),
    note: "Requested discovery call via /discovery form.",
    riskLevel: "LOW",
  },
  {
    firstName: "Ciara",
    lastName: "O'Sullivan",
    email: `ciara.osullivan${NN_DEMO_EMAIL_DOMAIN}`,
    phone: "0879001005",
    funnelStage: "discovery_requested",
    primaryConcern: "energy",
    quizScore: 55,
    segment: "general",
    source: "quiz",
    attributionChannel: "Meta",
    utmSource: "facebook",
    nextAction: "Discovery call — Today 14:30",
    nextActionAt: hoursFromNow(4),
    conversationStarted: true,
    firstResponseAt: daysAgo(1),
    responseTimeMinutes: 14,
    formCompleted: true,
    createdAt: daysAgo(1),
    note: "Calendly booked for today 14:30.",
    discoveryBookedAt: hoursAgo(20),
    riskLevel: "LOW",
  },
  {
    firstName: "Padraig",
    lastName: "Ryan",
    email: `padraig.ryan${NN_DEMO_EMAIL_DOMAIN}`,
    phone: "0879001006",
    funnelStage: "assessment_purchased",
    primaryConcern: "memory",
    quizScore: 58,
    segment: "general",
    source: "assessment",
    attributionChannel: "Organic",
    nextAction: "Send CNS assessment link / chase completion",
    nextActionAt: hoursFromNow(24),
    conversationStarted: true,
    firstResponseAt: daysAgo(3),
    responseTimeMinutes: 8,
    formCompleted: true,
    createdAt: daysAgo(3),
    note: "€90 assessment paid. Awaiting CNS completion.",
    assessmentPaidAt: daysAgo(2),
    riskLevel: "LOW",
  },
  {
    firstName: "Maeve",
    lastName: "Doyle",
    email: `maeve.doyle${NN_DEMO_EMAIL_DOMAIN}`,
    phone: "0879001007",
    funnelStage: "programme_enrolled",
    primaryConcern: "prevention",
    quizScore: 74,
    segment: "general",
    source: "programme",
    attributionChannel: "Referral",
    nextAction: "Onboarding — confirm portal + week-1 coaching",
    nextActionAt: hoursFromNow(48),
    conversationStarted: true,
    firstResponseAt: daysAgo(10),
    responseTimeMinutes: 7,
    formCompleted: true,
    createdAt: daysAgo(12),
    note: "€3,550 programme enrolled. Portal onboarding pending.",
    assessmentPaidAt: daysAgo(14),
    enrolledAt: daysAgo(2),
    riskLevel: "LOW",
  },
  {
    firstName: "Eoin",
    lastName: "Brennan",
    email: `eoin.brennan${NN_DEMO_EMAIL_DOMAIN}`,
    phone: "0879001008",
    funnelStage: "quiz_completed",
    primaryConcern: "parent",
    quizScore: 41,
    segment: "elevated",
    source: "quiz",
    attributionChannel: "Meta",
    utmSource: "facebook",
    nextAction: "Re-engage — no reply after quiz",
    nextActionAt: hoursAgo(-26),
    conversationStarted: false,
    formCompleted: true,
    createdAt: daysAgo(4),
    note: "No contact within SLA — at risk.",
    riskLevel: "HIGH",
  },
];

function isNnDemoEmail(email: string) {
  return (
    email.endsWith(NN_DEMO_EMAIL_DOMAIN) || email.endsWith(NN_DEMO_LEGACY_BLB_DOMAIN)
  );
}

export async function clearNeuronourishDemoData() {
  const leads = await db.lead.findMany({});
  let removed = 0;
  for (const lead of leads) {
    const tagged = (lead.additionalInfo ?? "").includes(DEMO_TAG);
    if (!isNnDemoEmail(lead.email) && !tagged) continue;
    await deleteLeadCase(lead.id).catch(() => null);
    removed++;
  }
  return removed;
}

export async function seedNeuronourishDemoData(options?: { force?: boolean }) {
  // Always purge demo rows before seed so Reload never doubles cases
  await clearNeuronourishDemoData();
  if (!options?.force) {
    // no-op flag kept for API compatibility; clear already ran
  }

  const owner = defaultCaseOwner();
  let seeded = 0;

  for (const spec of CASES) {
    const tier = qualificationTierFromQuiz(spec.quizScore ?? 50, spec.segment);
    const patch = nnOperationalPatchForStage(spec.funnelStage, {
      quizScore: spec.quizScore ?? null,
      segment: spec.segment ?? null,
      primaryConcern: spec.primaryConcern,
      qualificationTier: tier,
      discoveryBookedAt: spec.discoveryBookedAt ?? null,
      assessmentPaidAt: spec.assessmentPaidAt ?? null,
      enrolledAt: spec.enrolledAt ?? null,
      nextAction: spec.nextAction,
      nextActionAt: spec.nextActionAt,
      callbackDueAt: spec.nextActionAt,
      formCompleted: spec.formCompleted,
      pipelineValueEur: pipelineValueEurForStage(spec.funnelStage),
      revenueEur:
        spec.funnelStage === "programme_enrolled"
          ? NN_PRICING.programmeCents / 100
          : spec.funnelStage === "assessment_purchased" || spec.assessmentPaidAt
            ? NN_PRICING.assessmentCents / 100
            : 0,
    });

    const stub = nnLegacyLoanStub(spec.primaryConcern);
    const lead = await db.lead.create({
      data: {
        ...stub,
        firstName: spec.firstName,
        lastName: spec.lastName,
        email: spec.email,
        phone: spec.phone,
        source: spec.source,
        attributionChannel: spec.attributionChannel,
        utmSource: spec.utmSource ?? null,
        utmCampaign: spec.utmCampaign ?? null,
        conversationStarted: spec.conversationStarted,
        firstResponseAt: spec.firstResponseAt ?? null,
        responseTimeMinutes: spec.responseTimeMinutes ?? null,
        owner,
        riskLevel: spec.riskLevel ?? "MEDIUM",
        riskReason: spec.riskLevel === "HIGH" ? "No contact within SLA" : "Demo case",
        additionalInfo: `${DEMO_TAG} ${spec.note}`,
        ...patch,
        loanPurpose: spec.primaryConcern,
      },
    });

    await db.lead.update({
      where: { id: lead.id },
      data: { createdAt: spec.createdAt, updatedAt: spec.createdAt },
    });

    await db.activity.create({
      data: {
        leadId: lead.id,
        type: "LEAD_CREATED",
        description: `${spec.firstName} ${spec.lastName} — demo (${spec.funnelStage.replace(/_/g, " ")}).`,
      },
    });

    await db.note.create({
      data: {
        leadId: lead.id,
        content: `${DEMO_TAG} ${spec.note}`,
        author: owner,
      },
    });

    seeded++;
  }

  return { seeded, skipped: false, message: `Loaded ${seeded} NeuroNourish demo cases` };
}
