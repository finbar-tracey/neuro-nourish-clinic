import type { CaseStage } from "@/generated/prisma/client";
import type { CaseView } from "@/lib/case";
import { isHealthcareVertical } from "@/lib/vertical-config";

export type CardWorkflowKind =
  | "log-call"
  | "consultation"
  | "request-documents"
  | "chase-documents";

export const WORKFLOW_LABELS: Record<CardWorkflowKind, string> = {
  "log-call": "Log call",
  consultation: "After consultation",
  "request-documents": "Next step",
  "chase-documents": "Documents",
};

const TERMINAL: CaseStage[] = ["LOST", "DISQUALIFIED", "COMPLETED"];

/** Stage-appropriate quick actions for queue cards */
export function getCardWorkflow(c: CaseView): CardWorkflowKind | null {
  if (TERMINAL.includes(c.stage)) return null;

  switch (c.stage) {
    case "CONSULTATION_BOOKED":
      return "consultation";
    case "CONSULTATION_COMPLETED":
      return isHealthcareVertical() ? null : "request-documents";
    case "DOCUMENTS_REQUESTED":
      return isHealthcareVertical() ? null : "chase-documents";
    case "NEW_ENQUIRY":
    case "CONTACT_DUE":
    case "CONTACTED":
      return "log-call";
    default:
      if (/chase documents/i.test(c.nextAction)) return "chase-documents";
      if (/request documents/i.test(c.nextAction)) return "request-documents";
      return null;
  }
}

/** @deprecated use getCardWorkflow */
export function needsCallWorkflow(c: CaseView): boolean {
  return getCardWorkflow(c) === "log-call";
}

async function patchLead(leadId: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/leads/${leadId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Update failed");
}

export async function runCardWorkflowAction(
  leadId: string,
  kind: CardWorkflowKind,
  action: string,
): Promise<void> {
  switch (kind) {
    case "log-call": {
      const outcome =
        action === "connected"
          ? "connected"
          : action === "voicemail"
            ? "no_answer"
            : "no_answer";
      const note = action === "voicemail" ? "Voicemail left" : undefined;
      const res = await fetch(`/api/leads/${leadId}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "call", outcome, note }),
      });
      if (!res.ok) throw new Error("Contact log failed");
      break;
    }
    case "consultation":
      if (action === "completed") {
        await patchLead(leadId, { consultationCompleted: true });
      } else if (action === "no-show") {
        await patchLead(leadId, { consultationNoShow: true });
      }
      break;
    case "request-documents": {
      const res = await fetch(`/api/leads/${leadId}/request-documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Document request failed");
      break;
    }
    case "chase-documents":
      if (action === "chase") {
        const res = await fetch(`/api/leads/${leadId}/contact`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channel: "sms",
            outcome: "sent",
            note: "Document chase sent",
          }),
        });
        if (!res.ok) throw new Error("Chase log failed");
      } else if (action === "received") {
        await patchLead(leadId, { markDocumentsReceived: true });
      }
      break;
  }
}
