import { WINBACK_SEQUENCE_ID } from "@/lib/winback-eligibility";
import { WINBACK_LONG_SEQUENCE_ID } from "@/lib/winback-schedule";

export const MAX_IMPORT_ROWS = 500;
export const MAX_IMPORT_BYTES = 1024 * 1024;
export const PREVIEW_TTL_MS = 30 * 60 * 1000;
export const IMPORT_LOCK_MS = 5 * 60 * 1000;
export const ATTESTATION_VERSION = "2026-06";

export const LAWFUL_BASES = [
  "consent",
  "legitimate_interest",
  "existing_customer",
] as const;

export type LawfulBasis = (typeof LAWFUL_BASES)[number];

export const IMPORT_SEQUENCE_IDS = [WINBACK_SEQUENCE_ID, WINBACK_LONG_SEQUENCE_ID] as const;

export type ImportSequenceId = (typeof IMPORT_SEQUENCE_IDS)[number];

export type ImportOutcomeCode =
  | "CREATE_ENROLL"
  | "MERGE_ENROLL"
  | "REENROLL"
  | "SKIP_ENROLLED"
  | "SKIP_ACTIVE"
  | "SKIP_WON"
  | "SKIP_DISQUALIFIED"
  | "SKIP_OPTED_OUT"
  | "SKIP_INVALID_EMAIL"
  | "SKIP_INVALID_FILE_DUP";

export type ParsedImportRow = {
  line: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  loanAmount: number;
  loanPurpose: string;
  propertyLocation: string;
  externalId: string | null;
  notes: string | null;
  usedDefaultAmount: boolean;
};

export type ResolvedImportRow = {
  row: ParsedImportRow;
  outcome: ImportOutcomeCode;
  detail: string | null;
  existingLeadId: string | null;
};

export type ImportPreviewSummary = Record<ImportOutcomeCode, number> & {
  enrollable: number;
  skipped: number;
  estimatedEmails: number;
  estimatedSms: number;
};

export type ImportPreview = {
  id: string;
  sequenceId: ImportSequenceId;
  campaign: string;
  fileName: string | null;
  createdAt: string;
  expiresAt: string;
  consumed: boolean;
  rows: ResolvedImportRow[];
  summary: ImportPreviewSummary;
};

export type ImportBatchStatus = "enrolling" | "completed" | "failed" | "rolled_back";

export type ImportBatch = {
  id: string;
  previewId: string;
  sequenceId: ImportSequenceId;
  campaign: string;
  lawfulBasis: LawfulBasis;
  fileName: string | null;
  rowCount: number;
  enrolled: number;
  skipped: number;
  failed: number;
  outcomes: Partial<Record<ImportOutcomeCode, number>>;
  leadIds: string[];
  createdLeadIds: string[];
  status: ImportBatchStatus;
  error: string | null;
  attestationVersion: string;
  attestationAt: string;
  createdAt: string;
  createdBy: string;
  preBackupChecksum?: string | null;
  preBackupAt?: string | null;
};

export function sequenceLostReason(sequenceId: ImportSequenceId): string {
  return sequenceId === WINBACK_LONG_SEQUENCE_ID
    ? "Funding no longer needed"
    : "No response";
}

export function emptyOutcomeSummary(): ImportPreviewSummary {
  return {
    CREATE_ENROLL: 0,
    MERGE_ENROLL: 0,
    REENROLL: 0,
    SKIP_ENROLLED: 0,
    SKIP_ACTIVE: 0,
    SKIP_WON: 0,
    SKIP_DISQUALIFIED: 0,
    SKIP_OPTED_OUT: 0,
    SKIP_INVALID_EMAIL: 0,
    SKIP_INVALID_FILE_DUP: 0,
    enrollable: 0,
    skipped: 0,
    estimatedEmails: 0,
    estimatedSms: 0,
  };
}

export const ENROLL_OUTCOMES: ImportOutcomeCode[] = [
  "CREATE_ENROLL",
  "MERGE_ENROLL",
  "REENROLL",
];
