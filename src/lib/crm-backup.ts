import crypto from "node:crypto";
import { gzipSync } from "node:zlib";

import type { Lead } from "@/generated/prisma/client";
import {
  crmStorageMode,
  readCrmStore,
  type CrmStorePayload,
} from "@/lib/crm-persistence";
import { formatCurrency } from "@/lib/utils";

export const CRM_BACKUP_VERSION = "2026-06";
export const CRM_BACKUP_GZIP_THRESHOLD_BYTES = 500 * 1024;

export type CrmDocumentManifestEntry = {
  leadId: string;
  docKey: string;
  label: string;
  fileName: string | null;
  fileUrl: string | null;
  uploadedAt: string | null;
};

export type CrmBackupSummary = {
  leadCount: number;
  noteCount: number;
  activityCount: number;
  taskCount: number;
  documentCount: number;
  importBatchCount: number;
  activeWinback: number;
  pausedWinback: number;
  lastImportAt: string | null;
};

export type CrmBackupFile = {
  backupVersion: string;
  createdAt: string;
  environment: string;
  storageMode: "kv" | "file";
  checksumSha256: string;
  summary: CrmBackupSummary;
  documentManifest: CrmDocumentManifestEntry[];
  store: CrmStorePayload;
};

export type CrmBackupAttachment = {
  filename: string;
  content: Buffer;
  contentType: string;
};

function escapeCsv(value: string | number | null | undefined): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function iso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : String(value);
}

export function buildDocumentManifest(store: CrmStorePayload): CrmDocumentManifestEntry[] {
  return (store.caseDocuments ?? []).map((doc) => ({
    leadId: doc.leadId,
    docKey: doc.docKey,
    label: doc.label,
    fileName: doc.fileName,
    fileUrl: doc.fileUrl,
    uploadedAt: iso(doc.uploadedAt),
  }));
}

export function buildCrmBackupSummary(store: CrmStorePayload): CrmBackupSummary {
  const batches = store.importBatches ?? [];
  const lastImport = batches
    .map((b) => b.createdAt)
    .sort()
    .at(-1) ?? null;

  return {
    leadCount: store.leads.length,
    noteCount: store.notes.length,
    activityCount: store.activities.length,
    taskCount: store.tasks.length,
    documentCount: (store.caseDocuments ?? []).length,
    importBatchCount: batches.length,
    activeWinback: store.leads.filter((l) => l.winbackStatus === "active").length,
    pausedWinback: store.leads.filter((l) => l.winbackStatus === "paused").length,
    lastImportAt: lastImport,
  };
}

export function hashStorePayload(store: CrmStorePayload): string {
  const canonical = JSON.stringify(store);
  return crypto.createHash("sha256").update(canonical).digest("hex");
}

export function buildCrmBackupFile(store: CrmStorePayload): CrmBackupFile {
  const checksumSha256 = hashStorePayload(store);
  return {
    backupVersion: CRM_BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    storageMode: crmStorageMode(),
    checksumSha256,
    summary: buildCrmBackupSummary(store),
    documentManifest: buildDocumentManifest(store),
    store,
  };
}

export async function buildCrmBackupFileFromStore(): Promise<CrmBackupFile> {
  const store = await readCrmStore();
  return buildCrmBackupFile(store);
}

export function verifyCrmBackupFile(file: CrmBackupFile): { ok: boolean; error?: string } {
  if (file.backupVersion !== CRM_BACKUP_VERSION) {
    return { ok: false, error: `Unsupported backup version: ${file.backupVersion}` };
  }
  const actual = hashStorePayload(file.store);
  if (actual !== file.checksumSha256) {
    return { ok: false, error: "Checksum mismatch — backup file may be corrupt" };
  }
  return { ok: true };
}

export const CRM_LEADS_CSV_HEADERS = [
  "First Name",
  "Last Name",
  "Email",
  "Phone",
  "Status",
  "Case Stage",
  "Loan Amount",
  "Loan Purpose",
  "Qualification",
  "Form Completed",
  "Source",
  "UTM Campaign",
  "Nurture",
  "Lost Reason",
  "Win-back Status",
  "Win-back Sequence",
  "Win-back Step",
  "Import Batch",
  "Import Campaign",
  "Lawful Basis",
  "Imported At",
  "Created",
  "Last Contacted",
] as const;

export function leadToCsvRow(lead: Lead): string {
  return [
    lead.firstName,
    lead.lastName,
    lead.email,
    lead.phone,
    lead.status,
    lead.caseStage,
    formatCurrency(lead.loanAmount),
    lead.loanPurpose,
    lead.qualificationTier ?? "",
    lead.formCompleted ? "Yes" : "No",
    lead.source,
    lead.utmCampaign ?? "",
    lead.nurtureEnrolled ? "Yes" : "No",
    lead.lostReason ?? "",
    lead.winbackStatus ?? "",
    lead.winbackSequenceId ?? "",
    lead.winbackStep,
    lead.importBatchId ?? "",
    lead.importCampaign ?? "",
    lead.lawfulBasis ?? "",
    iso(lead.importedAt) ?? "",
    lead.createdAt.toISOString(),
    lead.lastContactedAt?.toISOString() ?? "",
  ]
    .map(escapeCsv)
    .join(",");
}

export function buildLeadsCsv(leads: Lead[]): string {
  const sorted = [...leads].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
  return [CRM_LEADS_CSV_HEADERS.join(","), ...sorted.map(leadToCsvRow)].join("\n");
}

export function buildCrmBackupAttachments(
  file: CrmBackupFile,
  dateLabel = new Date().toISOString().slice(0, 10),
): CrmBackupAttachment[] {
  const json = JSON.stringify(file, null, 2);
  const jsonBuffer = Buffer.from(json, "utf8");
  const useGzip = jsonBuffer.byteLength > CRM_BACKUP_GZIP_THRESHOLD_BYTES;
  const jsonAttachment: CrmBackupAttachment = useGzip
    ? {
        filename: `crm-backup-${dateLabel}.json.gz`,
        content: gzipSync(jsonBuffer),
        contentType: "application/gzip",
      }
    : {
        filename: `crm-backup-${dateLabel}.json`,
        content: jsonBuffer,
        contentType: "application/json",
      };

  const csvAttachment: CrmBackupAttachment = {
    filename: `crm-leads-${dateLabel}.csv`,
    content: Buffer.from(buildLeadsCsv(file.store.leads), "utf8"),
    contentType: "text/csv; charset=utf-8",
  };

  return [jsonAttachment, csvAttachment];
}

export function buildCrmBackupEmailBody(file: CrmBackupFile): string {
  const s = file.summary;
  return `Weekly CRM disaster-recovery backup

Leads: ${s.leadCount}
Notes: ${s.noteCount}
Activities: ${s.activityCount}
Tasks: ${s.taskCount}
Documents (metadata): ${s.documentCount}
Import batches: ${s.importBatchCount}
Active win-back: ${s.activeWinback}
Paused win-back: ${s.pausedWinback}
Last import: ${s.lastImportAt ?? "none"}

Storage: ${file.storageMode}
Checksum (SHA-256): ${file.checksumSha256}

Save attachments to your CRM Backups folder (retain 4–8 weeks).

Emergency restore (dev/local):
npx tsx scripts/restore-crm-backup.ts --file ./crm-backup-YYYY-MM-DD.json.gz --confirm

Internal ops email — contains borrower PII.`;
}
