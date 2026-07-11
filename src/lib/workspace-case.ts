import type { CaseView } from "@/lib/case";
import type { CaseStage } from "@/generated/prisma/client";
import type { InboxQueueId } from "@/lib/operational-queue";
import { isNeuronourishVertical } from "@/lib/vertical-config";
import {
  nnIsAssessmentPaid,
  nnIsProgrammeEnrolled,
} from "@/lib/neuronourish-workspace";

export function deserializeCaseView(raw: Record<string, unknown>): CaseView {
  const leadRaw = (raw.lead ?? raw) as Record<string, unknown>;
  const parseDate = (value: unknown) => (value ? new Date(String(value)) : null);

  return {
    ...(raw as unknown as CaseView),
    createdAt: new Date(String(raw.createdAt)),
    updatedAt: new Date(String(raw.updatedAt)),
    nextActionDueAt: parseDate(raw.nextActionDueAt),
    lead: {
      ...leadRaw,
      createdAt: new Date(String(leadRaw.createdAt)),
      updatedAt: new Date(String(leadRaw.updatedAt ?? leadRaw.createdAt)),
      winbackNextAt: parseDate(leadRaw.winbackNextAt),
      nextActionAt: parseDate(leadRaw.nextActionAt),
      callbackDueAt: parseDate(leadRaw.callbackDueAt),
      discoveryBookedAt: parseDate(leadRaw.discoveryBookedAt),
      assessmentPaidAt: parseDate(leadRaw.assessmentPaidAt),
      creditExpiryDate: parseDate(leadRaw.creditExpiryDate),
      enrolledAt: parseDate(leadRaw.enrolledAt),
      firstResponseAt: parseDate(leadRaw.firstResponseAt),
      lastContactedAt: parseDate(leadRaw.lastContactedAt),
      documentsRequestedAt: parseDate(leadRaw.documentsRequestedAt),
      consultationCompletedAt: parseDate(leadRaw.consultationCompletedAt),
      priorityCallBookedAt: parseDate(leadRaw.priorityCallBookedAt),
      saleCompletedAt: parseDate(leadRaw.saleCompletedAt),
      importedAt: parseDate(leadRaw.importedAt),
      bookingChaseNextAt: parseDate(leadRaw.bookingChaseNextAt),
      uploadTokenExpiresAt: parseDate(leadRaw.uploadTokenExpiresAt),
    } as CaseView["lead"],
  };
}

export function caseInOperationalQueue(caseItem: CaseView, queue: InboxQueueId): boolean {
  if (caseItem.stage === "LOST" || caseItem.stage === "DISQUALIFIED") return false;
  if (hasInitialInvoicePaid(caseItem) && queue !== "COMPLETION") return false;

  const isNn = isNeuronourishVertical();

  if (queue === "NEW_LEAD") {
    if (isNn) {
      // Soft-capture (quiz_partial) has formCompleted=false — still a new enquiry
      return caseItem.queue === "NEW_LEAD" && !caseItem.conversationStarted;
    }
    return (
      caseItem.queue === "NEW_LEAD" &&
      caseItem.formCompleted &&
      !caseItem.conversationStarted
    );
  }
  if (queue === "AWAITING_CALLBACK") {
    return isFollowUpActive(caseItem);
  }
  if (queue === "AT_RISK") {
    if (isNn) {
      // Overlay filter — overdue / high risk stay visible in their real queue too
      return (
        caseItem.riskLevel === "HIGH" ||
        caseItem.slaStatus === "OVERDUE" ||
        caseItem.slaStatus === "AT_RISK"
      );
    }
    return (
      caseItem.queue === "AT_RISK" ||
      (caseItem.riskLevel === "HIGH" &&
        (caseItem.slaStatus === "OVERDUE" || caseItem.slaStatus === "AT_RISK"))
    );
  }
  if (!isNn && caseItem.queue === "AT_RISK") return false;
  return caseItem.queue === queue;
}

export type QueuePageId =
  | "callbacks"
  | "documents"
  | "applications"
  | "completions"
  | "closed"
  | "at-risk";

export function isClosedCase(caseItem: CaseView): boolean {
  return caseItem.stage === "LOST" || caseItem.stage === "DISQUALIFIED";
}

export function hasInitialInvoicePaid(caseItem: CaseView): boolean {
  if (isNeuronourishVertical()) {
    return nnIsProgrammeEnrolled(caseItem.lead) || caseItem.stage === "COMPLETED";
  }
  return (
    (caseItem.lead.initialInvoiceAmount ?? 0) > 0 ||
    caseItem.stage === "COMPLETED" ||
    caseItem.lead.status === "WON"
  );
}

export function isFollowUpActive(caseItem: CaseView): boolean {
  if (isClosedCase(caseItem)) return false;
  if (hasInitialInvoicePaid(caseItem)) return false;
  return caseItem.queue === "AWAITING_CALLBACK";
}

export function isFollowUpOverdue(caseItem: CaseView, now = new Date()): boolean {
  if (!isFollowUpActive(caseItem)) return false;
  const due = caseItem.nextActionDueAt?.getTime();
  if (due == null) return false;
  return due < now.getTime();
}

export function isWinbackActive(caseItem: CaseView): boolean {
  return caseItem.lead.winbackStatus === "active";
}

export function isWinbackPaused(caseItem: CaseView): boolean {
  return caseItem.lead.winbackStatus === "paused";
}

export function caseInReengagementQueue(caseItem: CaseView): boolean {
  return (
    caseItem.lead.winbackStatus === "active" || caseItem.lead.winbackStatus === "paused"
  );
}

export function isWinbackDueToday(caseItem: CaseView, now = new Date()): boolean {
  if (caseItem.lead.winbackStatus !== "active" || !caseItem.lead.winbackNextAt) {
    return false;
  }
  const due = new Date(caseItem.lead.winbackNextAt);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const dueMs = due.getTime();
  return dueMs >= start.getTime() && dueMs <= end.getTime();
}

export function caseInQueuePage(caseItem: CaseView, pageId: QueuePageId): boolean {
  switch (pageId) {
    case "callbacks":
      return isFollowUpActive(caseItem);
    case "documents":
      return caseItem.queue === "AWAITING_DOCUMENTS" || caseItem.stage === "DOCUMENTS_REQUESTED";
    case "applications":
      if (isNeuronourishVertical()) {
        return (
          caseItem.queue === "APPLICATION" ||
          nnIsAssessmentPaid(caseItem.lead)
        );
      }
      return (
        caseItem.queue === "APPLICATION" ||
        caseItem.stage === "DOCUMENTS_RECEIVED" ||
        caseItem.stage === "APPLICATION_PREPARING" ||
        caseItem.stage === "APPLICATION_SUBMITTED"
      );
    case "completions":
      return hasInitialInvoicePaid(caseItem) || caseItem.queue === "COMPLETION";
    case "closed":
      return isClosedCase(caseItem);
    case "at-risk":
      return caseInOperationalQueue(caseItem, "AT_RISK");
    default:
      return false;
  }
}

export function sortCasesByUrgency(cases: CaseView[]): CaseView[] {
  const slaRank = (c: CaseView) => {
    if (c.slaStatus === "AT_RISK" || c.slaStatus === "OVERDUE") return 0;
    if (c.slaStatus === "DUE_SOON") return 1;
    return 2;
  };
  return [...cases].sort((a, b) => {
    const rank = slaRank(a) - slaRank(b);
    if (rank !== 0) return rank;
    const aDue = a.nextActionDueAt?.getTime() ?? Infinity;
    const bDue = b.nextActionDueAt?.getTime() ?? Infinity;
    return aDue - bDue;
  });
}

export function queueNavCounts(cases: CaseView[]) {
  const active = cases.filter(
    (c) => !["LOST", "DISQUALIFIED", "COMPLETED"].includes(c.stage),
  );
  return {
    newLead: active.filter((c) => caseInOperationalQueue(c, "NEW_LEAD")).length,
    callbacks: active.filter((c) => isFollowUpActive(c)).length,
    documents: active.filter((c) => caseInQueuePage(c, "documents")).length,
    applications: active.filter((c) => caseInOperationalQueue(c, "APPLICATION")).length,
    completions: cases.filter((c) => caseInQueuePage(c, "completions")).length,
    closed: cases.filter((c) => isClosedCase(c)).length,
    reengagement: cases.filter((c) => isWinbackActive(c)).length,
    atRisk: active.filter((c) => caseInOperationalQueue(c, "AT_RISK")).length,
  };
}

export function stagesInCases(cases: CaseView[]): CaseStage[] {
  const set = new Set(cases.map((c) => c.stage));
  return Array.from(set);
}

export function dedupeCasesById(cases: CaseView[]): CaseView[] {
  const seen = new Set<string>();
  return cases.filter((c) => {
    if (seen.has(c.caseId)) return false;
    seen.add(c.caseId);
    return true;
  });
}

export type UrgentPriorities = {
  newEnquiries: CaseView[];
  priorityCallsToday: CaseView[];
  callbacksDue: CaseView[];
  documentsOutstanding: CaseView[];
  atRisk: CaseView[];
};

/** Single deduplicated urgent list for command centre — no case shown twice */
export function buildUrgentFeed(priorities: UrgentPriorities, limit = 10): CaseView[] {
  const urgentNew = priorities.newEnquiries.filter(
    (c) => c.slaStatus === "OVERDUE" || c.slaStatus === "AT_RISK" || c.slaStatus === "DUE_SOON",
  );
  const urgentDocs = priorities.documentsOutstanding.filter(
    (c) => c.riskLevel === "HIGH" || c.slaStatus === "OVERDUE" || c.slaStatus === "AT_RISK",
  );

  const merged = dedupeCasesById([
    ...priorities.atRisk,
    ...priorities.callbacksDue,
    ...urgentNew,
    ...urgentDocs,
    ...priorities.priorityCallsToday,
  ]);

  return sortCasesByUrgency(merged).slice(0, limit);
}

export type QueueFilterChip = "all" | "overdue" | "due-today";

export function filterCasesByChip(cases: CaseView[], chip: QueueFilterChip): CaseView[] {
  if (chip === "all") return cases;
  if (chip === "overdue") {
    return cases.filter((c) => c.slaStatus === "OVERDUE" || c.slaStatus === "AT_RISK");
  }
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  const endMs = endOfDay.getTime();
  return cases.filter((c) => {
    const due = c.nextActionDueAt?.getTime();
    return due != null && due <= endMs;
  });
}

export function countFilterChip(cases: CaseView[], chip: QueueFilterChip): number {
  return filterCasesByChip(cases, chip).length;
}

function endOfTodayMs(now = new Date()): number {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return end.getTime();
}

function startOfTomorrowMs(now = new Date()): number {
  const start = new Date(now);
  start.setDate(start.getDate() + 1);
  start.setHours(0, 0, 0, 0);
  return start.getTime();
}

function endOfThreeDaysMs(now = new Date()): number {
  const end = new Date(now);
  end.setDate(end.getDate() + 3);
  end.setHours(23, 59, 59, 999);
  return end.getTime();
}

export function isContactDueToday(caseItem: CaseView, now = new Date()): boolean {
  if (isClosedCase(caseItem)) return false;
  const due = caseItem.nextActionDueAt?.getTime();
  if (due == null) return false;
  return due <= endOfTodayMs(now);
}

export function isFollowUpDueThisWeek(caseItem: CaseView, now = new Date()): boolean {
  if (isClosedCase(caseItem)) return false;
  const due = caseItem.nextActionDueAt?.getTime();
  if (due == null) return false;
  return due > endOfTodayMs(now) && due <= endOfThreeDaysMs(now);
}

export function isUncontactedNewLead(caseItem: CaseView): boolean {
  if (isClosedCase(caseItem)) return false;
  if (caseItem.conversationStarted) return false;
  if (isNeuronourishVertical()) {
    return caseItem.queue === "NEW_LEAD";
  }
  return caseItem.queue === "NEW_LEAD" && caseItem.formCompleted;
}

/** All active follow-ups — stay until initial invoice paid */
export function buildFollowUpActiveFeed(cases: CaseView[], limit = 50): CaseView[] {
  const active = cases.filter((c) => isFollowUpActive(c));
  return sortCasesByUrgency(dedupeCasesById(active)).slice(0, limit);
}

/** Follow-ups with a due date in the past */
export function buildFollowUpOverdueFeed(cases: CaseView[], limit = 50): CaseView[] {
  const overdue = cases.filter((c) => isFollowUpOverdue(c));
  return sortCasesByUrgency(dedupeCasesById(overdue)).slice(0, limit);
}

/** Leads Daniel should call now — qualified, never contacted */
export function buildCallNowFeed(cases: CaseView[], limit = 20): CaseView[] {
  return buildUncontactedNewFeed(cases, limit);
}

/** Follow-ups due in next 24–72 hours */
export function buildFollowUpWeekFeed(cases: CaseView[], limit = 20): CaseView[] {
  const due = cases.filter((c) => isFollowUpDueThisWeek(c));
  return sortCasesByUrgency(dedupeCasesById(due)).slice(0, limit);
}

/** Qualified new leads never contacted */
export function buildUncontactedNewFeed(cases: CaseView[], limit = 20): CaseView[] {
  const fresh = cases.filter(isUncontactedNewLead);
  return sortCasesByUrgency(dedupeCasesById(fresh)).slice(0, limit);
}
