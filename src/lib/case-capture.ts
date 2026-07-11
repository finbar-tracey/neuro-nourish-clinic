import type { Lead } from "@/generated/prisma/client";
import { landingPath, parseAdAngle } from "@/lib/attribution-display";
import { META_INSTANT_FORM_SOURCE } from "@/lib/meta-source";
import { CALLBACK_SLA_MINUTES } from "@/lib/operational-queue";
import { isClinicVertical, isNeuronourish } from "@/lib/vertical-config";

function defaultCaptureNextAction(): string {
  if (isNeuronourish()) return "Call client";
  if (isClinicVertical()) return "Call patient";
  return "Call borrower";
}

/** Default case fields when Step 2 contact is captured — no db dependency. */
export function captureCaseDefaults(now = new Date()) {
  const due = new Date(now.getTime() + CALLBACK_SLA_MINUTES * 60 * 1000);
  return {
    owner: "Daniel",
    caseStage: "NEW_ENQUIRY" as const,
    operationalQueue: "NEW_LEAD" as const,
    nextAction: defaultCaptureNextAction(),
    nextActionAt: due,
    callbackDueAt: due,
    riskLevel: "MEDIUM" as const,
    riskReason: "Awaiting first contact",
    probability: 10,
  };
}

/** Meta instant form partial — automation only until step 3 qualified. */
export function metaPartialCaseDefaults() {
  return {
    owner: "Daniel",
    caseStage: "NEW_ENQUIRY" as const,
    operationalQueue: "NEW_LEAD" as const,
    nextAction: "Awaiting qualification",
    nextActionAt: null,
    callbackDueAt: null,
    riskLevel: "LOW" as const,
    riskReason: "Meta instant form — completion link sent",
    probability: 5,
  };
}

export function metaPartialAdditionalInfo(metaLeadgenId?: string) {
  const tag = metaLeadgenId ? `[Meta leadgen: ${metaLeadgenId}] ` : "";
  return `${tag}[Partial] Meta instant form — step 3 pending via /lp/complete`;
}

export function humanTimelineForMetaCapture(lead: Lead) {
  const campaign = lead.utmCampaign ? `campaign ${lead.utmCampaign}` : null;
  const parts = [
    `${lead.firstName} submitted a £${lead.loanAmount.toLocaleString("en-GB")} property finance enquiry via Meta instant form`,
    campaign,
  ].filter(Boolean);
  return `${parts.join(" ")}.`;
}

export function isMetaAwaitingQualification(lead: Lead): boolean {
  return lead.source === META_INSTANT_FORM_SOURCE && lead.formCompleted === false;
}

export function humanTimelineForCapture(lead: Lead) {
  const channel = lead.attributionChannel ?? lead.utmSource ?? lead.source;
  const angle = parseAdAngle(lead.additionalInfo);
  const campaign = lead.utmCampaign ?? (angle ? angle.toUpperCase() : null);
  const path = landingPath(lead.landingPageUrl);
  const parts = [
    `${lead.firstName} submitted a £${lead.loanAmount.toLocaleString("en-GB")} bridging finance enquiry`,
    channel ? `via ${channel}` : null,
    campaign ? `campaign ${campaign}` : null,
    path ? `from ${path}` : null,
  ].filter(Boolean);
  return `${parts.join(" ")}.`;
}
