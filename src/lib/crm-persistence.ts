import fs from "node:fs/promises";
import path from "node:path";

import type {
  Activity,
  AutomationRule,
  AutomationRun,
  CaseDocument,
  Lead,
  Note,
  Task,
} from "@/generated/prisma/client";
import { normalizeOperationalLead } from "@/lib/operational-queue";
import { NN_FUNNEL_STAGES } from "@/lib/neuronourish-funnel";
import {
  pipelineValueEurForStage,
  qualificationTierFromQuiz,
  quizScoreFromLead,
} from "@/lib/neuronourish-workspace";
import type { NnFunnelStage } from "@/lib/neuronourish-funnel";
import { assertKvForServerlessWrites, kvRestFetch, kvStorageMode } from "@/lib/kv-env";
import { kvSetBody, parseKvJsonResult } from "@/lib/kv-rest";
import { crmFileStoreName, crmKvKeyName } from "@/lib/vertical-config";

function fileStorePath() {
  return crmFileStoreName();
}

function kvStoreKey() {
  return crmKvKeyName();
}

export type NotificationRetryItem = {
  id: string;
  channel: "sms" | "email";
  to: string;
  subject?: string;
  body: string;
  leadId?: string;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  lastAttemptAt?: string;
  lastError?: string;
};

export type SmsOutboxItem = {
  messageUuid: string;
  leadId?: string;
  to: string;
  purpose?: string;
  sentAt: string;
};

export type CrmStorePayload = {
  leads: Lead[];
  notes: Note[];
  activities: Activity[];
  tasks: Task[];
  caseDocuments: CaseDocument[];
  automationRules: AutomationRule[];
  automationRuns: AutomationRun[];
  notificationRetries?: NotificationRetryItem[];
  smsOutbox?: SmsOutboxItem[];
  importBatches?: import("@/lib/sequence-csv-import/types").ImportBatch[];
  importPreviews?: Record<string, import("@/lib/sequence-csv-import/types").ImportPreview>;
  importLock?: { previewId: string; until: string } | null;
  crmBackupMeta?: import("@/lib/crm-backup-meta").CrmBackupMeta;
  preImportBackups?: Record<string, import("@/lib/crm-backup-meta").PreImportBackupSnapshot>;
};

function emptyStore(): CrmStorePayload {
  return {
    leads: [],
    notes: [],
    activities: [],
    tasks: [],
    caseDocuments: [],
    automationRules: [],
    automationRuns: [],
    notificationRetries: [],
    smsOutbox: [],
  };
}

function filePath() {
  return path.join(process.cwd(), fileStorePath());
}

function kvEnabled(): boolean {
  return kvStorageMode() === "kv";
}

function hydrateDate(value: unknown): Date {
  if (value instanceof Date) return value;
  return new Date(String(value));
}

function migrateClinicalFields(lead: Lead): Lead {
  const legacyFunnel = NN_FUNNEL_STAGES.includes(
    (lead.qualificationTier ?? "") as NnFunnelStage,
  )
    ? lead.qualificationTier!
    : NN_FUNNEL_STAGES.includes((lead.propertyType ?? "") as NnFunnelStage)
      ? lead.propertyType
      : null;

  const funnelStage =
    lead.funnelStage && lead.funnelStage !== "quiz_partial"
      ? lead.funnelStage
      : legacyFunnel ?? lead.funnelStage ?? "quiz_partial";

  const quizScore = quizScoreFromLead(lead);
  const segment =
    lead.segment ??
    (lead.propertyType === "elevated" || lead.propertyType === "standard"
      ? lead.propertyType
      : null);

  let qualificationTier = lead.qualificationTier ?? "unscreened";
  if (NN_FUNNEL_STAGES.includes(qualificationTier as NnFunnelStage)) {
    qualificationTier =
      quizScore != null ? qualificationTierFromQuiz(quizScore, segment ?? undefined) : "unscreened";
  }

  const revenueEur =
    lead.revenueEur > 0
      ? lead.revenueEur
      : (lead.revenueGenerated ?? lead.initialInvoiceAmount ?? 0) / 100;

  const pipelineValueEur =
    lead.pipelineValueEur > 0
      ? lead.pipelineValueEur
      : pipelineValueEurForStage(funnelStage as NnFunnelStage);

  return {
    ...lead,
    funnelStage,
    quizScore: lead.quizScore ?? quizScore,
    primaryConcern:
      lead.primaryConcern ??
      (lead.loanPurpose && !NN_FUNNEL_STAGES.includes(lead.loanPurpose as NnFunnelStage)
        ? lead.loanPurpose
        : null),
    segment,
    qualificationTier,
    revenueEur,
    pipelineValueEur,
  };
}

function hydrateLead(lead: Lead): Lead {
  return normalizeOperationalLead({
    ...migrateClinicalFields(lead),
    createdAt: hydrateDate(lead.createdAt),
    updatedAt: hydrateDate(lead.updatedAt),
    lastContactedAt: lead.lastContactedAt ? hydrateDate(lead.lastContactedAt) : null,
    nextActionAt: lead.nextActionAt ? hydrateDate(lead.nextActionAt) : null,
    callbackDueAt: lead.callbackDueAt ? hydrateDate(lead.callbackDueAt) : null,
    priorityCallBookedAt: lead.priorityCallBookedAt
      ? hydrateDate(lead.priorityCallBookedAt)
      : null,
    firstResponseAt: lead.firstResponseAt ? hydrateDate(lead.firstResponseAt) : null,
    documentsRequestedAt: lead.documentsRequestedAt
      ? hydrateDate(lead.documentsRequestedAt)
      : null,
    consultationCompletedAt: lead.consultationCompletedAt
      ? hydrateDate(lead.consultationCompletedAt)
      : null,
    uploadTokenExpiresAt: lead.uploadTokenExpiresAt
      ? hydrateDate(lead.uploadTokenExpiresAt)
      : null,
    discoveryBookedAt: lead.discoveryBookedAt ? hydrateDate(lead.discoveryBookedAt) : null,
    assessmentPaidAt: lead.assessmentPaidAt ? hydrateDate(lead.assessmentPaidAt) : null,
    creditExpiryDate: lead.creditExpiryDate ? hydrateDate(lead.creditExpiryDate) : null,
    enrolledAt: lead.enrolledAt ? hydrateDate(lead.enrolledAt) : null,
    caseStage: lead.caseStage ?? "NEW_ENQUIRY",
    riskLevel: lead.riskLevel ?? "MEDIUM",
    probability: lead.probability ?? 10,
    remindersPaused: lead.remindersPaused ?? false,
    winbackEnrolled: lead.winbackEnrolled ?? false,
    winbackStatus: lead.winbackStatus ?? null,
    winbackSequenceId: lead.winbackSequenceId ?? null,
    winbackStep: lead.winbackStep ?? 0,
    winbackNextAt: lead.winbackNextAt ? hydrateDate(lead.winbackNextAt) : null,
    winbackStoppedReason: lead.winbackStoppedReason ?? null,
    importBatchId: lead.importBatchId ?? null,
    importCampaign: lead.importCampaign ?? null,
    lawfulBasis: lead.lawfulBasis ?? null,
    importedAt: lead.importedAt ? hydrateDate(lead.importedAt) : null,
  });
}

function hydrateStore(data: CrmStorePayload): CrmStorePayload {
  return {
    leads: (data.leads ?? []).map(hydrateLead),
    notes: (data.notes ?? []).map((note) => ({
      ...note,
      createdAt: hydrateDate(note.createdAt),
    })),
    activities: (data.activities ?? []).map((activity) => ({
      ...activity,
      createdAt: hydrateDate(activity.createdAt),
    })),
    tasks: (data.tasks ?? []).map((task) => ({
      ...task,
      createdAt: hydrateDate(task.createdAt),
      dueDate: task.dueDate ? hydrateDate(task.dueDate) : null,
    })),
    caseDocuments: (data.caseDocuments ?? []).map((doc) => ({
      ...doc,
      createdAt: hydrateDate(doc.createdAt),
      uploadedAt: doc.uploadedAt ? hydrateDate(doc.uploadedAt) : null,
    })),
    automationRules: (data.automationRules ?? []).map((rule) => ({
      ...rule,
      createdAt: hydrateDate(rule.createdAt),
      updatedAt: hydrateDate(rule.updatedAt),
    })),
    automationRuns: (data.automationRuns ?? []).map((run) => ({
      ...run,
      createdAt: hydrateDate(run.createdAt),
    })),
    importBatches: data.importBatches ?? [],
    importPreviews: data.importPreviews ?? {},
    importLock: data.importLock ?? null,
    crmBackupMeta: data.crmBackupMeta ?? {
      lastCrmBackupAt: null,
      lastCrmBackupWeekKey: null,
      lastCrmBackupChecksum: null,
      lastCrmBackupFailureAt: null,
      lastCrmBackupFailureWeekKey: null,
      lastManualBackupAt: null,
    },
    preImportBackups: data.preImportBackups ?? {},
  };
}

async function readFileStore(): Promise<CrmStorePayload> {
  try {
    const raw = await fs.readFile(filePath(), "utf8");
    return hydrateStore(JSON.parse(raw) as CrmStorePayload);
  } catch {
    return emptyStore();
  }
}

async function writeFileStore(data: CrmStorePayload) {
  await fs.writeFile(filePath(), JSON.stringify(data, null, 2), "utf8");
}

async function readKvStore(): Promise<CrmStorePayload> {
  const res = await kvRestFetch(`/get/${encodeURIComponent(kvStoreKey())}`);
  if (!res.ok) return emptyStore();
  const json = (await res.json()) as { result?: string | null };
  if (!json.result) return emptyStore();
  try {
    return hydrateStore(parseKvJsonResult<CrmStorePayload>(json.result));
  } catch {
    return emptyStore();
  }
}

async function writeKvStore(data: CrmStorePayload) {
  const body = JSON.stringify(data);
  const res = await kvRestFetch(`/set/${encodeURIComponent(kvStoreKey())}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: kvSetBody(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`KV write failed: ${res.status} ${text}`);
  }
}

export async function readCrmStore(): Promise<CrmStorePayload> {
  if (kvEnabled()) return readKvStore();
  return readFileStore();
}

export async function writeCrmStore(data: CrmStorePayload) {
  if (kvEnabled()) return writeKvStore(data);
  assertKvForServerlessWrites("writeCrmStore");
  return writeFileStore(data);
}

export function crmStorageMode(): "kv" | "file" {
  return kvEnabled() ? "kv" : "file";
}

/** Remove all leads and related CRM data; keeps automation rule definitions. */
export async function clearWorkspaceData() {
  const store = await readCrmStore();
  const summary = {
    removedLeads: store.leads.length,
    removedNotes: store.notes.length,
    removedActivities: store.activities.length,
    removedTasks: store.tasks.length,
    removedDocuments: (store.caseDocuments ?? []).length,
    removedAutomationRuns: store.automationRuns.length,
    removedNotificationRetries: (store.notificationRetries ?? []).length,
    removedSmsOutbox: (store.smsOutbox ?? []).length,
  };

  await writeCrmStore({
    leads: [],
    notes: [],
    activities: [],
    tasks: [],
    caseDocuments: [],
    automationRules: store.automationRules,
    automationRuns: [],
    notificationRetries: [],
    smsOutbox: [],
  });

  return summary;
}
