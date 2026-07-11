import type { CaseStage, Lead, RiskLevel } from "@/generated/prisma/client";

export const CASE_STAGE_LABELS: Record<CaseStage, string> = {
  NEW_ENQUIRY: "New enquiry",
  CONTACT_DUE: "Contact due",
  CONTACTED: "Contacted",
  CONSULTATION_BOOKED: "Consultation booked",
  CONSULTATION_COMPLETED: "Consultation completed",
  DOCUMENTS_REQUESTED: "Documents requested",
  DOCUMENTS_RECEIVED: "Documents received",
  APPLICATION_PREPARING: "Application preparing",
  APPLICATION_SUBMITTED: "Application submitted",
  OFFER_RECEIVED: "Offer received",
  COMPLETION_SCHEDULED: "Completion scheduled",
  COMPLETED: "Completed",
  LOST: "Lost",
  DISQUALIFIED: "Disqualified",
};

export const STAGE_PROBABILITY: Record<CaseStage, number> = {
  NEW_ENQUIRY: 10,
  CONTACT_DUE: 12,
  CONTACTED: 20,
  CONSULTATION_BOOKED: 30,
  CONSULTATION_COMPLETED: 45,
  DOCUMENTS_REQUESTED: 55,
  DOCUMENTS_RECEIVED: 70,
  APPLICATION_PREPARING: 75,
  APPLICATION_SUBMITTED: 80,
  OFFER_RECEIVED: 90,
  COMPLETION_SCHEDULED: 95,
  COMPLETED: 100,
  LOST: 0,
  DISQUALIFIED: 0,
};

export const ACTIVE_STAGES: CaseStage[] = [
  "NEW_ENQUIRY",
  "CONTACT_DUE",
  "CONTACTED",
  "CONSULTATION_BOOKED",
  "CONSULTATION_COMPLETED",
  "DOCUMENTS_REQUESTED",
  "DOCUMENTS_RECEIVED",
  "APPLICATION_PREPARING",
  "APPLICATION_SUBMITTED",
  "OFFER_RECEIVED",
  "COMPLETION_SCHEDULED",
];

export function stageLabel(stage: CaseStage | string | null | undefined): string {
  if (!stage) return "New enquiry";
  return CASE_STAGE_LABELS[stage as CaseStage] ?? String(stage).replace(/_/g, " ");
}

export function isTerminalStage(stage: CaseStage | string): boolean {
  return stage === "COMPLETED" || stage === "LOST" || stage === "DISQUALIFIED";
}

export const LOST_REASONS = [
  "No response",
  "Not eligible",
  "Went with another broker",
  "Funding no longer needed",
  "Too small",
  "Regulated/owner-occupied",
  "Bad credit/insolvency issue",
  "Other",
] as const;

export const DISQUALIFIED_REASONS = [
  "Owner-occupied",
  "Below minimum loan amount",
  "No deposit/equity",
  "Outside business/investment criteria",
  "Timeline unsuitable",
  "Other",
] as const;

export const DEFAULT_COMMISSION_RATE =
  Number(process.env.DEFAULT_COMMISSION_RATE ?? "0.015") || 0.015;

export function computeExpectedCommission(loanAmount: number): number {
  return Math.round(loanAmount * DEFAULT_COMMISSION_RATE);
}

export function computeExpectedValue(loanAmount: number, probability: number): number {
  return Math.round(computeExpectedCommission(loanAmount) * (probability / 100));
}

export function inferCaseStage(lead: Lead): CaseStage {
  if (lead.status === "DISQUALIFIED" || lead.caseStage === "DISQUALIFIED") {
    return "DISQUALIFIED";
  }
  if (lead.status === "LOST" || lead.caseStage === "LOST") return "LOST";
  if (lead.status === "WON" || lead.caseStage === "COMPLETED") return "COMPLETED";
  if (lead.caseStage) return lead.caseStage;
  if (lead.consultationCompletedAt) return "CONSULTATION_COMPLETED";
  if (lead.priorityCallBookedAt || lead.status === "BOOKED") return "CONSULTATION_BOOKED";
  if (lead.conversationStarted || lead.status === "CONTACTED") return "CONTACTED";
  if (lead.operationalQueue === "AT_RISK" || lead.caseStage === "CONTACT_DUE") {
    return "CONTACT_DUE";
  }
  return "NEW_ENQUIRY";
}

export function riskLabel(level: RiskLevel | string): string {
  switch (level) {
    case "HIGH":
      return "High risk";
    case "MEDIUM":
      return "Medium risk";
    case "LOW":
      return "Low risk";
    default:
      return "Risk";
  }
}
