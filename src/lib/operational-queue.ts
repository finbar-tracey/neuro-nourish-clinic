import type { Lead, OperationalQueue } from "@/generated/prisma/client";
import { PRIORITY_CALL_BOOKED_PREFIX } from "@/lib/lead-tags";
import { isMetaInstantFormSource } from "@/lib/meta-source";
import { coerceDate } from "@/lib/utils";
import { defaultCaseOwner, isClinicVertical, isNeuronourish } from "@/lib/vertical-config";
import { nnInferOperationalQueue, nnNormalizeLeadOperationalFields } from "@/lib/neuronourish-workspace";

export { PRIORITY_CALL_BOOKED_PREFIX };

export const DEFAULT_OWNER = "Daniel";
export const CALLBACK_SLA_MINUTES = 15;

export const INBOX_QUEUES = [
  {
    id: "NEW_LEAD" as const,
    label: "New Leads",
    emoji: "🔥",
    description: "Fresh enquiries needing first contact",
    color: "border-orange-200 bg-orange-50/60",
    header: "bg-orange-600",
  },
  {
    id: "AWAITING_CALLBACK" as const,
    label: "Follow-Up",
    emoji: "📞",
    description: "Contacted leads — follow-ups due today to 72 hours",
    color: "border-violet-200 bg-violet-50/60",
    header: "bg-violet-600",
  },
  {
    id: "AWAITING_DOCUMENTS" as const,
    label: "Awaiting Documents",
    emoji: "📄",
    description: "Docs requested from borrower",
    color: "border-amber-200 bg-amber-50/60",
    header: "bg-amber-600",
  },
  {
    id: "APPLICATION" as const,
    label: "Applications",
    emoji: "🏦",
    description: "DIP / lender submissions in progress",
    color: "border-blue-200 bg-blue-50/60",
    header: "bg-blue-600",
  },
  {
    id: "COMPLETION" as const,
    label: "Completed",
    emoji: "💰",
    description: "Initial invoice paid — deal closed",
    color: "border-green-200 bg-green-50/60",
    header: "bg-green-600",
  },
  {
    id: "AT_RISK" as const,
    label: "At Risk",
    emoji: "🚨",
    description: "No conversation after 24 hours",
    color: "border-red-200 bg-red-50/60",
    header: "bg-red-600",
  },
] as const;

export type InboxQueueId = (typeof INBOX_QUEUES)[number]["id"];

export function callbackDueAtFromNow(
  minutes = CALLBACK_SLA_MINUTES,
  from: Date | string = new Date(),
) {
  const base = coerceDate(from);
  return new Date(base.getTime() + minutes * 60 * 1000);
}

export function metaHotOperationalFields(now = new Date()) {
  const due = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  return {
    nextAction: "HOT — call within 2 hours",
    nextActionAt: due,
    callbackDueAt: due,
  };
}

export function metaWarmOperationalFields(now = new Date()) {
  const due = new Date(now);
  due.setHours(18, 0, 0, 0);
  if (due.getTime() <= now.getTime()) {
    due.setDate(due.getDate() + 1);
  }
  return {
    nextAction: "WARM — call same day",
    nextActionAt: due,
    callbackDueAt: due,
  };
}

export function captureOperationalFields(now = new Date()) {
  const due = callbackDueAtFromNow(CALLBACK_SLA_MINUTES, now);
  const owner = defaultCaseOwner();
  return {
    owner,
    operationalQueue: "NEW_LEAD" as OperationalQueue,
    nextAction: isNeuronourish()
      ? "Call client"
      : isClinicVertical()
        ? "Call patient"
        : "Call borrower",
    nextActionAt: due,
    callbackDueAt: due,
  };
}

export function qualifiedOperationalFields(now = new Date()) {
  const due = callbackDueAtFromNow(CALLBACK_SLA_MINUTES, now);
  return {
    operationalQueue: "NEW_LEAD" as OperationalQueue,
    caseStage: "NEW_ENQUIRY" as const,
    nextAction: isNeuronourish()
      ? "Call client"
      : isClinicVertical()
        ? "Call patient"
        : "Call borrower",
    nextActionAt: due,
    callbackDueAt: due,
  };
}

export function priorityCallOperationalFields(
  slotLabel: string,
  displayTime: string,
  slotDueAt?: Date,
  now = new Date(),
) {
  return {
    operationalQueue: "AWAITING_CALLBACK" as OperationalQueue,
    status: "BOOKED" as const,
    caseStage: "CONSULTATION_BOOKED" as const,
    nextAction: `Follow up — ${displayTime}`,
    nextActionAt: slotDueAt ?? now,
    conversationStarted: true,
    priorityCallSlot: slotLabel,
    priorityCallBookedAt: now,
    callbackDueAt: null,
    probability: 30,
  };
}

export function inferOperationalQueue(lead: Lead): OperationalQueue {
  if (isNeuronourish()) return nnInferOperationalQueue(lead);
  if (lead.caseStage === "COMPLETED" || lead.status === "WON") return "COMPLETION";
  if (lead.status === "LOST" || lead.status === "DISQUALIFIED") return "NEW_LEAD";
  if (lead.caseStage === "LOST" || lead.caseStage === "DISQUALIFIED") return "NEW_LEAD";
  if (lead.operationalQueue === "AT_RISK") return "AT_RISK";
  if (lead.operationalQueue) return lead.operationalQueue;
  if (
    lead.priorityCallSlot ||
    lead.priorityCallBookedAt ||
    lead.additionalInfo?.includes(PRIORITY_CALL_BOOKED_PREFIX) ||
    lead.status === "BOOKED"
  ) {
    return "AWAITING_CALLBACK";
  }
  return "NEW_LEAD";
}

export function normalizeOperationalLead(lead: Lead): Lead {
  if (isNeuronourish()) {
    return nnNormalizeLeadOperationalFields(lead);
  }

  const owner = lead.owner ?? defaultCaseOwner();

  if (lead.caseStage === "COMPLETED" || lead.status === "WON") {
    return {
      ...lead,
      owner,
      operationalQueue: "COMPLETION",
      nextAction: "None",
      nextActionAt: null,
      callbackDueAt: null,
      probability: lead.probability ?? 100,
      riskLevel: lead.riskLevel ?? "LOW",
    };
  }

  if (
    lead.caseStage === "LOST" ||
    lead.caseStage === "DISQUALIFIED" ||
    lead.status === "LOST" ||
    lead.status === "DISQUALIFIED"
  ) {
    return {
      ...lead,
      owner,
      nextAction: "None",
      nextActionAt: null,
      callbackDueAt: null,
      probability: 0,
      expectedValue: 0,
    };
  }

  const operationalQueue = inferOperationalQueue(lead);
  const metaAwaitingQualification =
    lead.nextAction === "Awaiting qualification" ||
    (isMetaInstantFormSource(lead.source) && !lead.formCompleted);

  const callbackDueAt = metaAwaitingQualification
    ? null
    : lead.callbackDueAt ??
      (operationalQueue === "NEW_LEAD" && lead.status === "NEW"
        ? callbackDueAtFromNow(CALLBACK_SLA_MINUTES, lead.createdAt)
        : null);

  let nextAction = lead.nextAction;
    if (!nextAction) {
    if (operationalQueue === "AWAITING_CALLBACK" && lead.priorityCallSlot) {
      nextAction = `Priority call — ${lead.priorityCallSlot}`;
    } else if (lead.nextAction === "Awaiting qualification") {
      nextAction = "Awaiting qualification";
    } else if (metaAwaitingQualification) {
      nextAction = "Awaiting qualification";
    } else if (lead.formCompleted) {
      nextAction = lead.priorityCallBookedAt ? "Conduct priority call" : "Book priority call";
    } else {
      nextAction = "Contact within 15 mins";
    }
  }

  return {
    ...lead,
    owner,
    operationalQueue,
    nextAction,
    nextActionAt: lead.nextActionAt ?? callbackDueAt,
    callbackDueAt,
  };
}

export function leadInInboxQueue(lead: Lead, queue: InboxQueueId): boolean {
  const normalized = normalizeOperationalLead(lead);
  if (normalized.status === "LOST" || normalized.status === "DISQUALIFIED") {
    return false;
  }
  if (isNeuronourish()) {
    if (queue === "AT_RISK") {
      return (
        normalized.riskLevel === "HIGH" ||
        normalized.operationalQueue === "AT_RISK"
      );
    }
    return normalized.operationalQueue === queue;
  }
  if (queue === "AT_RISK") {
    return normalized.operationalQueue === "AT_RISK";
  }
  if (normalized.operationalQueue === "AT_RISK") {
    return false;
  }
  return normalized.operationalQueue === queue;
}

export function isCallbackOverdue(lead: Lead, now = Date.now()): boolean {
  const normalized = normalizeOperationalLead(lead);
  if (normalized.operationalQueue !== "NEW_LEAD") return false;
  if (normalized.status !== "NEW" && normalized.status !== "CONTACTED") return false;
  const due = normalized.callbackDueAt ?? normalized.nextActionAt;
  if (!due) return false;
  return new Date(due).getTime() <= now;
}

export function callbackDueLabel(lead: Lead): string | null {
  const due = lead.callbackDueAt ?? lead.nextActionAt;
  if (!due) return null;
  const diffMs = new Date(due).getTime() - Date.now();
  if (diffMs >= 0) {
    const mins = Math.ceil(diffMs / (60 * 1000));
    return mins <= 60 ? `Due in ${mins}m` : `Due in ${Math.ceil(mins / 60)}h`;
  }
  const overdueMins = Math.floor(Math.abs(diffMs) / (60 * 1000));
  if (overdueMins < 60) return `${overdueMins}m overdue`;
  return `${Math.floor(overdueMins / 60)}h overdue`;
}

export function purposeLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
