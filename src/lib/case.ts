import type { CaseStage, Lead, OperationalQueue, RiskLevel } from "@/generated/prisma/client";
import {
  computeExpectedCommission,
  computeExpectedValue,
  inferCaseStage,
  STAGE_PROBABILITY,
} from "@/lib/case-stages";
import { CALLBACK_SLA_MINUTES } from "@/lib/operational-queue";
import { addWorkingDays } from "@/lib/working-days";
import {
  funnelStageFromLead,
  nnExpectedValueCents,
  nnInferOperationalQueue,
  nnNextActionForStage,
  nnNormalizeLeadOperationalFields,
  nnStageLabel,
  workspaceOwnerName,
} from "@/lib/neuronourish-workspace";
import type { NnFunnelStage } from "@/lib/neuronourish-funnel";
import { isNeuronourish } from "@/lib/vertical-config";
import { coerceDateMs } from "@/lib/utils";

export type SlaStatus = "ON_TRACK" | "DUE_SOON" | "OVERDUE" | "AT_RISK";

export type CaseView = {
  caseId: string;
  borrowerFirstName: string;
  borrowerLastName: string;
  borrowerName: string;
  phone: string;
  email: string;
  loanAmount: number;
  purpose: string;
  timeline: string;
  source: string;
  attributionChannel: string | null;
  owner: string;
  stage: CaseStage;
  stageLabel: string;
  queue: OperationalQueue;
  nextAction: string;
  nextActionDueAt: Date | null;
  riskLevel: RiskLevel;
  riskReason: string | null;
  slaStatus: SlaStatus;
  expectedCommission: number;
  probability: number;
  expectedValue: number;
  formCompleted: boolean;
  qualificationTier: string | null;
  priorityCallSlot: string | null;
  teamsMeetingUrl: string | null;
  uploadToken: string | null;
  conversationStarted: boolean;
  responseTimeMinutes: number | null;
  createdAt: Date;
  updatedAt: Date;
  /** Raw lead for API patches */
  lead: Lead;
};

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function addHours(date: Date, hours: number) {
  return addMinutes(date, hours * 60);
}

function addDays(date: Date, days: number) {
  return addMinutes(date, days * 24 * 60);
}

export function computeSlaStatus(lead: Lead, now = Date.now()): SlaStatus {
  // NeuroNourish: overdue is time-based. HIGH risk is a badge, not an SLA exile.
  if (!isNeuronourish()) {
    if (lead.operationalQueue === "AT_RISK" || lead.riskLevel === "HIGH") {
      return "AT_RISK";
    }
  }
  const due = lead.nextActionAt ?? lead.callbackDueAt;
  if (!due) {
    if (isNeuronourish() && lead.riskLevel === "HIGH") return "AT_RISK";
    return "ON_TRACK";
  }
  const dueMs = new Date(due).getTime();
  const minsUntil = (dueMs - now) / (60 * 1000);
  if (minsUntil < 0) return "OVERDUE";
  if (minsUntil <= 15) return "DUE_SOON";
  return "ON_TRACK";
}

export function computeRisk(lead: Lead, now = Date.now()): { level: RiskLevel; reason: string } {
  const stage = inferCaseStage(lead);
  if (stage === "LOST" || stage === "DISQUALIFIED" || stage === "COMPLETED") {
    return { level: "LOW", reason: "Case closed" };
  }
  if (lead.remindersPaused) {
    return { level: "LOW", reason: "Reminders paused" };
  }

  const createdMins = (now - coerceDateMs(lead.createdAt)) / (60 * 1000);
  if (
    !lead.conversationStarted &&
    !lead.firstResponseAt &&
    createdMins > CALLBACK_SLA_MINUTES &&
    (stage === "NEW_ENQUIRY" || stage === "CONTACT_DUE")
  ) {
    return { level: "HIGH", reason: "First contact overdue" };
  }

  if (lead.documentsRequestedAt && stage === "DOCUMENTS_REQUESTED") {
    const docHours = (now - coerceDateMs(lead.documentsRequestedAt)) / (60 * 60 * 1000);
    if (docHours > 48) {
      return { level: "HIGH", reason: "Documents overdue" };
    }
    if (docHours > 24) {
      return { level: "MEDIUM", reason: "Documents due soon" };
    }
  }

  if (lead.priorityCallBookedAt && !lead.consultationCompletedAt) {
    const slotPassed = lead.nextActionAt && coerceDateMs(lead.nextActionAt) < now;
    if (slotPassed && stage === "CONSULTATION_BOOKED") {
      return { level: "HIGH", reason: "Consultation outcome not recorded" };
    }
  }

  const inactiveDays = (now - coerceDateMs(lead.updatedAt)) / (24 * 60 * 60 * 1000);
  if (inactiveDays >= 3 && !isTerminal(stage)) {
    return { level: "HIGH", reason: "No activity for 3+ days" };
  }

  if (lead.conversationStarted && !lead.formCompleted) {
    return { level: "MEDIUM", reason: "Qualification incomplete" };
  }

  if (stage === "CONSULTATION_BOOKED" || stage === "DOCUMENTS_RECEIVED") {
    return { level: "LOW", reason: "Progressing well" };
  }

  return { level: "MEDIUM", reason: "Awaiting first contact" };
}

function isTerminal(stage: CaseStage): boolean {
  return stage === "COMPLETED" || stage === "LOST" || stage === "DISQUALIFIED";
}

export type NextActionUpdate = {
  nextAction: string;
  nextActionAt: Date | null;
  caseStage?: CaseStage;
  operationalQueue?: OperationalQueue;
  riskLevel?: RiskLevel;
  riskReason?: string;
  probability?: number;
};

export function nextActionForStage(lead: Lead, stage: CaseStage, now = new Date()): NextActionUpdate {
  switch (stage) {
    case "NEW_ENQUIRY":
    case "CONTACT_DUE":
      return {
        nextAction: "Call borrower",
        nextActionAt: addMinutes(lead.createdAt, CALLBACK_SLA_MINUTES),
        caseStage: stage,
        operationalQueue: "NEW_LEAD",
        probability: STAGE_PROBABILITY[stage],
      };
    case "CONTACTED":
      return {
        nextAction: lead.formCompleted ? "Book consultation" : "Complete qualification",
        nextActionAt: addHours(now, 2),
        caseStage: "CONTACTED",
        operationalQueue: "NEW_LEAD",
        probability: 20,
      };
    case "CONSULTATION_BOOKED":
      return {
        nextAction: "Complete consultation",
        nextActionAt: lead.nextActionAt ?? addHours(now, 4),
        caseStage: "CONSULTATION_BOOKED",
        operationalQueue: "AWAITING_CALLBACK",
        probability: 30,
      };
    case "CONSULTATION_COMPLETED":
      return {
        nextAction: "Request documents",
        nextActionAt: addHours(now, 4),
        caseStage: "CONSULTATION_COMPLETED",
        operationalQueue: "AWAITING_CALLBACK",
        probability: 45,
      };
    case "DOCUMENTS_REQUESTED":
      return {
        nextAction: "Wait for borrower documents",
        nextActionAt: addDays(lead.documentsRequestedAt ?? now, 2),
        caseStage: "DOCUMENTS_REQUESTED",
        operationalQueue: "AWAITING_DOCUMENTS",
        probability: 55,
      };
    case "DOCUMENTS_RECEIVED":
      return {
        nextAction: "Review documents",
        nextActionAt: addHours(now, 4),
        caseStage: "DOCUMENTS_RECEIVED",
        operationalQueue: "APPLICATION",
        probability: 70,
        riskLevel: "LOW",
        riskReason: "Documents received",
      };
    case "APPLICATION_PREPARING":
      return {
        nextAction: "Follow up lender",
        nextActionAt: addWorkingDays(now, 2),
        caseStage: "APPLICATION_PREPARING",
        operationalQueue: "APPLICATION",
        probability: STAGE_PROBABILITY[stage],
      };
    case "APPLICATION_SUBMITTED":
      return {
        nextAction: "Follow up lender",
        nextActionAt: addWorkingDays(now, 2),
        caseStage: "APPLICATION_SUBMITTED",
        operationalQueue: "APPLICATION",
        probability: STAGE_PROBABILITY[stage],
      };
    case "OFFER_RECEIVED":
      return {
        nextAction: "Confirm completion timeline",
        nextActionAt: addHours(now, 4),
        caseStage: "OFFER_RECEIVED",
        operationalQueue: "COMPLETION",
        probability: 90,
      };
    case "COMPLETION_SCHEDULED":
      return {
        nextAction: "Monitor completion",
        nextActionAt: addDays(now, 7),
        caseStage: "COMPLETION_SCHEDULED",
        operationalQueue: "COMPLETION",
        probability: 95,
      };
    case "COMPLETED":
      return {
        nextAction: "None",
        nextActionAt: null,
        caseStage: "COMPLETED",
        operationalQueue: "COMPLETION",
        probability: 100,
        riskLevel: "LOW",
        riskReason: "Completed",
      };
    case "LOST":
    case "DISQUALIFIED":
      return {
        nextAction: "None",
        nextActionAt: null,
        caseStage: stage,
        probability: 0,
        riskLevel: "LOW",
        riskReason: "Closed",
      };
    default:
      return {
        nextAction: "Review case",
        nextActionAt: addHours(now, 2),
        probability: 10,
      };
  }
}

export function leadToCase(lead: Lead): CaseView {
  const stage = inferCaseStage(lead);
  const risk = computeRisk(lead);
  const probability = lead.probability ?? STAGE_PROBABILITY[stage] ?? 10;

  if (isNeuronourish()) {
    const normalized = nnNormalizeLeadOperationalFields(lead);
    const funnelStage = funnelStageFromLead(lead) as NnFunnelStage;
    const expectedCents =
      Math.round((lead.pipelineValueEur || 0) * 100) || nnExpectedValueCents(lead);

    return {
      caseId: lead.id,
      borrowerFirstName: lead.firstName,
      borrowerLastName: lead.lastName,
      borrowerName: `${lead.firstName} ${lead.lastName}`,
      phone: lead.phone,
      email: lead.email,
      loanAmount: lead.loanAmount,
      purpose: lead.loanPurpose,
      timeline: lead.timeframe,
      source: lead.source,
      attributionChannel: lead.attributionChannel,
      owner: normalized.owner ?? workspaceOwnerName(),
      stage: normalized.caseStage,
      stageLabel: nnStageLabel(lead),
      queue: normalized.operationalQueue ?? nnInferOperationalQueue(normalized),
      nextAction: normalized.nextAction ?? nnNextActionForStage(funnelStage),
      nextActionDueAt: normalized.nextActionAt ?? normalized.callbackDueAt,
      riskLevel: lead.riskLevel ?? risk.level,
      riskReason: lead.riskReason ?? risk.reason,
      slaStatus: computeSlaStatus(normalized),
      expectedCommission: 0,
      probability,
      expectedValue: expectedCents,
      formCompleted: lead.formCompleted,
      qualificationTier: lead.qualificationTier,
      priorityCallSlot: lead.priorityCallSlot,
      teamsMeetingUrl: lead.teamsMeetingUrl,
      uploadToken: lead.uploadToken,
      conversationStarted: lead.conversationStarted,
      responseTimeMinutes: lead.responseTimeMinutes,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      lead,
    };
  }

  const commission = lead.estimatedCommission ?? computeExpectedCommission(lead.loanAmount);
  const expectedValue = lead.expectedValue ?? computeExpectedValue(lead.loanAmount, probability);
  const nextAction =
    lead.nextAction ??
    nextActionForStage(lead, stage).nextAction;

  return {
    caseId: lead.id,
    borrowerFirstName: lead.firstName,
    borrowerLastName: lead.lastName,
    borrowerName: `${lead.firstName} ${lead.lastName}`,
    phone: lead.phone,
    email: lead.email,
    loanAmount: lead.loanAmount,
    purpose: lead.loanPurpose,
    timeline: lead.timeframe,
    source: lead.source,
    attributionChannel: lead.attributionChannel,
    owner: lead.owner ?? "Daniel",
    stage,
    stageLabel: stage.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
    queue: lead.operationalQueue,
    nextAction,
    nextActionDueAt: lead.nextActionAt ?? lead.callbackDueAt,
    riskLevel: lead.riskLevel ?? risk.level,
    riskReason: lead.riskReason ?? risk.reason,
    slaStatus: computeSlaStatus(lead),
    expectedCommission: commission,
    probability,
    expectedValue,
    formCompleted: lead.formCompleted,
    qualificationTier: lead.qualificationTier,
    priorityCallSlot: lead.priorityCallSlot,
    teamsMeetingUrl: lead.teamsMeetingUrl,
    uploadToken: lead.uploadToken,
    conversationStarted: lead.conversationStarted,
    responseTimeMinutes: lead.responseTimeMinutes,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
    lead,
  };
}

export function slaStatusClasses(status: SlaStatus): string {
  switch (status) {
    case "ON_TRACK":
      return "border-emerald-200 bg-emerald-50/80 ring-emerald-100";
    case "DUE_SOON":
      return "border-amber-200 bg-amber-50/80 ring-amber-100";
    case "OVERDUE":
      return "border-red-200 bg-red-50/80 ring-red-100";
    case "AT_RISK":
      return "border-red-300 bg-red-100/80 ring-red-200";
    default:
      return "border-slate-200 bg-white";
  }
}

export function slaBadgeClasses(status: SlaStatus): string {
  switch (status) {
    case "ON_TRACK":
      return "bg-emerald-100 text-emerald-800";
    case "DUE_SOON":
      return "bg-amber-100 text-amber-900";
    case "OVERDUE":
    case "AT_RISK":
      return "bg-red-100 text-red-800";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export function slaStatusLabel(status: SlaStatus): string {
  switch (status) {
    case "ON_TRACK":
      return "On track";
    case "DUE_SOON":
      return "Due soon";
    case "OVERDUE":
      return "Overdue";
    case "AT_RISK":
      return "At risk";
    default:
      return status;
  }
}
