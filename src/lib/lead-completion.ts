import type { Lead } from "@/generated/prisma/client";
import { transitionCaseStage } from "@/lib/case-engine";
import { cancelQualifiedBookingChase } from "@/lib/qualified-booking-chase";

export function isLeadCompleted(lead: Lead): boolean {
  return (
    (lead.initialInvoiceAmount ?? 0) > 0 ||
    lead.caseStage === "COMPLETED" ||
    lead.status === "WON"
  );
}

export function hasInitialInvoiceRecorded(lead: Lead): boolean {
  return (lead.initialInvoiceAmount ?? 0) > 0;
}

export async function completeLeadFromInitialInvoice(
  previous: Lead,
  initialInvoiceAmount: number,
  revenueGenerated?: number | null,
) {
  const now = new Date();
  const updated = await transitionCaseStage(
    previous,
    "COMPLETED",
    `Initial invoice received — £${initialInvoiceAmount.toLocaleString("en-GB")} from ${previous.firstName}.`,
    {
      operationalQueue: "COMPLETION",
      status: "WON",
      probability: 100,
      expectedValue: previous.estimatedCommission ?? 0,
      remindersPaused: true,
      saleCompletedAt: previous.saleCompletedAt ?? now,
      initialInvoiceAmount,
      revenueGenerated:
        revenueGenerated !== undefined ? revenueGenerated : previous.revenueGenerated,
    },
  );
  await cancelQualifiedBookingChase(previous.id);
  return updated;
}

export async function reopenLeadToFollowUp(
  previous: Lead,
  followUpAt: Date,
  label: string,
) {
  return transitionCaseStage(
    previous,
    "CONTACTED",
    `Reopened to follow-up — ${label}.`,
    {
      status: "CONTACTED",
      operationalQueue: "AWAITING_CALLBACK",
      nextAction: `Follow up — ${label}`,
      nextActionAt: followUpAt,
      callbackDueAt: null,
      remindersPaused: false,
      saleCompletedAt: null,
      initialInvoiceAmount: null,
    },
  );
}
