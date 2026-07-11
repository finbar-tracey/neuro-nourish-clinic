import type { CaseView } from "@/lib/case";
import { computeExpectedCommission } from "@/lib/case-stages";
import { isNeuronourish } from "@/lib/vertical-config";
import { nnExpectedValueCents, nnRevenueEur } from "@/lib/neuronourish-workspace";
import {
  buildCallNowFeed,
  buildFollowUpActiveFeed,
  buildFollowUpOverdueFeed,
  buildUncontactedNewFeed,
  hasInitialInvoicePaid,
  isFollowUpActive,
  isFollowUpOverdue,
  isUncontactedNewLead,
} from "@/lib/workspace-case";

export type OperationalPulse = {
  newEnquiriesToday: number;
  contactToday: number;
  followUpDue: number;
  followUpOverdue: number;
  overdueCases: number;
  uncontactedNew: number;
  callsDue: number;
  priorityCallsBooked: number;
  documentsOutstanding: number;
  atRiskCases: number;
  pipelineCommission: number;
  expectedRevenue: number;
  revenueThisMonth: number;
  invoiceThisMonth: number;
  commissionThisMonth: number;
  avgResponseMinutes: number | null;
};

export type OperationalPriorities = {
  contactToday: string[];
  followUpDue: string[];
  followUpOverdue: string[];
  uncontactedNew: string[];
  newEnquiries: string[];
  priorityCallsToday: string[];
  callbacksDue: string[];
  documentsOutstanding: string[];
  applications: string[];
  atRisk: string[];
  completions: string[];
};

export type OperationalApiPayload = {
  pulse: OperationalPulse;
  priorities: OperationalPriorities;
  cases: Record<string, unknown>[];
};

function ids(cases: CaseView[]): string[] {
  return cases.map((c) => c.caseId);
}

function serializeCase(c: CaseView): Record<string, unknown> {
  return {
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    nextActionDueAt: c.nextActionDueAt?.toISOString() ?? null,
    lead: {
      ...c.lead,
      createdAt: c.lead.createdAt.toISOString(),
      updatedAt: c.lead.updatedAt.toISOString(),
      nextActionAt: c.lead.nextActionAt?.toISOString() ?? null,
      callbackDueAt: c.lead.callbackDueAt?.toISOString() ?? null,
      winbackNextAt: c.lead.winbackNextAt?.toISOString() ?? null,
      discoveryBookedAt: c.lead.discoveryBookedAt?.toISOString() ?? null,
      assessmentPaidAt: c.lead.assessmentPaidAt?.toISOString() ?? null,
      creditExpiryDate: c.lead.creditExpiryDate?.toISOString() ?? null,
      enrolledAt: c.lead.enrolledAt?.toISOString() ?? null,
      firstResponseAt: c.lead.firstResponseAt?.toISOString() ?? null,
      lastContactedAt: c.lead.lastContactedAt?.toISOString() ?? null,
      documentsRequestedAt: c.lead.documentsRequestedAt?.toISOString() ?? null,
      consultationCompletedAt: c.lead.consultationCompletedAt?.toISOString() ?? null,
      priorityCallBookedAt: c.lead.priorityCallBookedAt?.toISOString() ?? null,
      saleCompletedAt: c.lead.saleCompletedAt?.toISOString() ?? null,
      importedAt: c.lead.importedAt?.toISOString() ?? null,
      bookingChaseNextAt: c.lead.bookingChaseNextAt?.toISOString() ?? null,
      uploadTokenExpiresAt: c.lead.uploadTokenExpiresAt?.toISOString() ?? null,
    },
  };
}

export function buildOperationalPayload(allCases: CaseView[]): OperationalApiPayload {
  const isArchiveStage = (stage: string) =>
    stage === "COMPLETED" || stage === "LOST" || stage === "DISQUALIFIED";

  const active = allCases.filter((c) => !isArchiveStage(c.stage));

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const contactToday = buildCallNowFeed(active, 50);
  const followUpActive = buildFollowUpActiveFeed(active, 100);
  const followUpOverdue = buildFollowUpOverdueFeed(active, 50);
  const uncontactedNew = buildUncontactedNewFeed(active, 50);

  const newEnquiries = active.filter(
    (c) => c.stage === "NEW_ENQUIRY" || c.stage === "CONTACT_DUE",
  );
  const priorityCallsToday = active.filter((c) => c.stage === "CONSULTATION_BOOKED");
  const callbacksDue = active.filter(
    (c) =>
      c.slaStatus === "OVERDUE" ||
      c.slaStatus === "AT_RISK" ||
      c.stage === "CONTACT_DUE" ||
      c.queue === "AWAITING_CALLBACK",
  );
  const documentsOutstanding = active.filter((c) => c.stage === "DOCUMENTS_REQUESTED");
  const applications = active.filter(
    (c) =>
      c.stage === "DOCUMENTS_RECEIVED" ||
      c.stage === "APPLICATION_PREPARING" ||
      c.stage === "APPLICATION_SUBMITTED",
  );
  const atRisk = active.filter((c) => c.riskLevel === "HIGH" || c.slaStatus === "AT_RISK");
  const completions = allCases.filter(
    (c) => c.stage === "COMPLETION_SCHEDULED" || c.stage === "COMPLETED",
  );

  const pipelineCommission = active.reduce(
    (sum, c) =>
      sum +
      (isNeuronourish()
        ? nnExpectedValueCents(c.lead)
        : c.expectedCommission || computeExpectedCommission(c.loanAmount)),
    0,
  );
  const expectedRevenue = active.reduce(
    (sum, c) =>
      sum +
      (isNeuronourish()
        ? (c.lead.pipelineValueEur > 0
            ? c.lead.pipelineValueEur * 100
            : nnExpectedValueCents(c.lead))
        : c.expectedValue),
    0,
  );

  const invoiceThisMonth = allCases
    .filter((c) => c.lead.saleCompletedAt && new Date(c.lead.saleCompletedAt) >= monthStart)
    .reduce((sum, c) => sum + (c.lead.initialInvoiceAmount ?? 0), 0);

  const commissionThisMonth = allCases
    .filter(
      (c) =>
        hasInitialInvoicePaid(c) &&
        (c.lead.revenueGenerated ?? 0) > 0 &&
        c.updatedAt >= monthStart,
    )
    .reduce((sum, c) => sum + (c.lead.revenueGenerated ?? 0), 0);

  const nnRevenueThisMonth = isNeuronourish()
    ? allCases
        .filter((c) => c.updatedAt >= monthStart && nnRevenueEur(c.lead) > 0)
        .reduce((sum, c) => sum + nnRevenueEur(c.lead), 0)
    : 0;

  const revenueThisMonth = isNeuronourish()
    ? nnRevenueThisMonth
    : invoiceThisMonth + commissionThisMonth;

  const responded = allCases.filter(
    (c) => c.createdAt >= todayStart && c.responseTimeMinutes != null,
  );
  const avgResponse =
    responded.length > 0
      ? Math.round(
          responded.reduce((s, c) => s + (c.responseTimeMinutes ?? 0), 0) / responded.length,
        )
      : null;

  return {
    pulse: {
      newEnquiriesToday: allCases.filter((c) => c.createdAt >= todayStart && c.formCompleted)
        .length,
      contactToday: active.filter((c) => isUncontactedNewLead(c)).length,
      followUpDue: active.filter((c) => isFollowUpActive(c)).length,
      followUpOverdue: active.filter((c) => isFollowUpOverdue(c)).length,
      overdueCases: active.filter((c) => c.slaStatus === "OVERDUE" || c.slaStatus === "AT_RISK")
        .length,
      uncontactedNew: active.filter((c) => isUncontactedNewLead(c)).length,
      invoiceThisMonth,
      commissionThisMonth,
      callsDue: callbacksDue.length,
      priorityCallsBooked: priorityCallsToday.length,
      documentsOutstanding: documentsOutstanding.length,
      atRiskCases: atRisk.length,
      pipelineCommission,
      expectedRevenue,
      revenueThisMonth,
      avgResponseMinutes: avgResponse,
    },
    priorities: {
      contactToday: ids(contactToday),
      followUpDue: ids(followUpActive),
      followUpOverdue: ids(followUpOverdue),
      uncontactedNew: ids(uncontactedNew),
      newEnquiries: ids(newEnquiries),
      priorityCallsToday: ids(priorityCallsToday),
      callbacksDue: ids(callbacksDue),
      documentsOutstanding: ids(documentsOutstanding),
      applications: ids(applications),
      atRisk: ids(atRisk),
      completions: ids(completions),
    },
    cases: allCases.map(serializeCase),
  };
}
