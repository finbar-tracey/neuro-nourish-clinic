import type { ActivityType, CaseStage, Lead } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { nextActionForStage, computeRisk } from "@/lib/case";
import { maybeSendStageEmail } from "@/lib/journey-email-send";
import {
  computeExpectedCommission,
  computeExpectedValue,
  stageLabel,
  STAGE_PROBABILITY,
} from "@/lib/case-stages";

export async function logCaseTimeline(
  leadId: string,
  type: ActivityType,
  description: string,
  actor: "System" | "Daniel" | "Borrower" | "Client" | "Patient" = "System",
  metadata?: Record<string, unknown>,
) {
  await db.activity.create({
    data: {
      leadId,
      type,
      description,
      metadata: JSON.stringify({ actor, ...metadata }),
    },
  });
}

export async function transitionCaseStage(
  lead: Lead,
  stage: CaseStage,
  timelineMessage: string,
  extra?: Partial<Lead>,
) {
  const previousStage = lead.caseStage;
  const patch = nextActionForStage(lead, stage);
  const risk = computeRisk({ ...lead, caseStage: stage, ...extra });

  const updated = await db.lead.update({
    where: { id: lead.id },
    data: {
      caseStage: stage,
      nextAction: patch.nextAction,
      nextActionAt: patch.nextActionAt,
      operationalQueue: patch.operationalQueue ?? extra?.operationalQueue ?? lead.operationalQueue,
      probability: patch.probability ?? STAGE_PROBABILITY[stage],
      riskLevel: patch.riskLevel ?? risk.level,
      riskReason: patch.riskReason ?? risk.reason,
      estimatedCommission:
        lead.estimatedCommission ?? computeExpectedCommission(lead.loanAmount),
      expectedValue: computeExpectedValue(
        lead.loanAmount,
        patch.probability ?? STAGE_PROBABILITY[stage],
      ),
      ...extra,
    },
  });

  await logCaseTimeline(lead.id, "STAGE_CHANGED", timelineMessage, "Daniel", {
    stage,
    label: stageLabel(stage),
  });

  void maybeSendStageEmail(updated, stage, previousStage);

  return updated;
}

export async function syncCaseState(lead: Lead) {
  const risk = computeRisk(lead);
  const stage = lead.caseStage ?? "NEW_ENQUIRY";
  const patch = nextActionForStage(lead, stage);
  const probability = lead.probability ?? STAGE_PROBABILITY[stage];

  return db.lead.update({
    where: { id: lead.id },
    data: {
      riskLevel: risk.level,
      riskReason: risk.reason,
      nextAction: lead.nextAction ?? patch.nextAction,
      nextActionAt: lead.nextActionAt ?? patch.nextActionAt,
      expectedValue: computeExpectedValue(lead.loanAmount, probability),
      estimatedCommission:
        lead.estimatedCommission ?? computeExpectedCommission(lead.loanAmount),
    },
  });
}

export { captureCaseDefaults, humanTimelineForCapture } from "@/lib/case-capture";
