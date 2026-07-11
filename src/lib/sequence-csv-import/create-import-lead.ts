import type { Lead } from "@/generated/prisma/client";
import { logCaseTimeline } from "@/lib/case-engine";
import type { LawfulBasis } from "@/lib/sequence-csv-import/types";
import {
  sequenceLostReason,
  type ImportSequenceId,
  type ParsedImportRow,
} from "@/lib/sequence-csv-import/types";

function importTags(
  batchId: string,
  campaign: string,
  lawfulBasis: LawfulBasis,
  row: ParsedImportRow,
) {
  const parts = [
    `[CSV import batch:${batchId}]`,
    `[Campaign:${campaign}]`,
    `[Lawful basis:${lawfulBasis}]`,
  ];
  if (row.externalId) parts.push(`[External:${row.externalId}]`);
  if (row.notes) parts.push(row.notes);
  if (row.usedDefaultAmount) parts.push("[Import: default loan amount]");
  return parts.join(" ");
}

export function buildImportLeadData(
  row: ParsedImportRow,
  batchId: string,
  campaign: string,
  lawfulBasis: LawfulBasis,
  sequenceId: ImportSequenceId,
): Partial<Lead> &
  Pick<
    Lead,
    | "firstName"
    | "lastName"
    | "email"
    | "phone"
    | "loanPurpose"
    | "loanAmount"
    | "termMonths"
    | "propertyType"
    | "propertyValue"
    | "propertyLocation"
    | "timeframe"
  > {
  const lostReason = sequenceLostReason(sequenceId);
  const now = new Date();

  return {
    firstName: row.firstName.trim(),
    lastName: row.lastName.trim(),
    email: row.email.trim().toLowerCase(),
    phone: row.phone.trim() || "07000000000",
    loanPurpose: row.loanPurpose,
    loanAmount: row.loanAmount,
    termMonths: 12,
    propertyType: "unspecified",
    propertyValue: Math.max(row.loanAmount, 100_000),
    propertyLocation: row.propertyLocation.trim() || "Unknown",
    timeframe: "30_days",
    source: "csv_import",
    attributionChannel: "Import",
    utmCampaign: campaign,
    status: "LOST",
    caseStage: "LOST",
    lostReason,
    owner: "Daniel",
    operationalQueue: "AT_RISK",
    nextAction: null,
    nextActionAt: null,
    callbackDueAt: null,
    formCompleted: false,
    qualificationTier: "imported",
    probability: 0,
    expectedValue: 0,
    remindersPaused: true,
    nurtureEnrolled: false,
    riskLevel: "LOW",
    riskReason: "Imported cold lead",
    importBatchId: batchId,
    importCampaign: campaign,
    lawfulBasis,
    importedAt: now,
    additionalInfo: importTags(batchId, campaign, lawfulBasis, row),
  };
}

export function mergeImportLeadData(
  existing: Lead,
  row: ParsedImportRow,
  batchId: string,
  campaign: string,
  lawfulBasis: LawfulBasis,
  sequenceId: ImportSequenceId,
): Partial<Lead> {
  const base = buildImportLeadData(row, batchId, campaign, lawfulBasis, sequenceId);
  const preservedInfo = existing.additionalInfo?.trim();
  const mergedInfo = preservedInfo
    ? `${base.additionalInfo} ${preservedInfo}`
    : base.additionalInfo;

  return {
    ...base,
    firstName: row.firstName.trim() || existing.firstName,
    lastName: row.lastName.trim() || existing.lastName,
    phone: row.phone.trim() || existing.phone,
    loanAmount: row.usedDefaultAmount ? existing.loanAmount : row.loanAmount,
    loanPurpose: row.loanPurpose || existing.loanPurpose,
    propertyLocation:
      row.propertyLocation !== "Unknown" ? row.propertyLocation : existing.propertyLocation,
    additionalInfo: mergedInfo,
  };
}

export async function logImportTimeline(leadId: string, batchId: string, campaign: string) {
  await logCaseTimeline(
    leadId,
    "AUTOMATION_RUN",
    `Imported from CSV batch ${batchId} (${campaign}).`,
    "Daniel",
    { importBatchId: batchId, campaign },
  );
}
