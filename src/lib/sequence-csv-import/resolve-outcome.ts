import type { Lead } from "@/generated/prisma/client";
import { isEmailOptedOut } from "@/lib/email-unsubscribe";
import { isValidImportEmail } from "@/lib/sequence-csv-import/parse-csv";
import {
  ENROLL_OUTCOMES,
  emptyOutcomeSummary,
  type ImportOutcomeCode,
  type ImportPreviewSummary,
  type ParsedImportRow,
  type ResolvedImportRow,
} from "@/lib/sequence-csv-import/types";
import { WINBACK_LONG_SCHEDULE, WINBACK_STANDARD_SCHEDULE } from "@/lib/winback-schedule";
import { WINBACK_LONG_SEQUENCE_ID } from "@/lib/winback-schedule";

const ACTIVE_STATUSES = new Set(["NEW", "CONTACTED", "BOOKED", "FOLLOW_UP"]);

function findLeadByEmail(leads: Lead[], email: string): Lead | undefined {
  const normalized = email.trim().toLowerCase();
  return leads.find((lead) => lead.email.trim().toLowerCase() === normalized);
}

function resolveRowOutcome(row: ParsedImportRow, leads: Lead[]): ResolvedImportRow {
  if (!isValidImportEmail(row.email)) {
    return {
      row,
      outcome: "SKIP_INVALID_EMAIL",
      detail: "Invalid email address",
      existingLeadId: null,
    };
  }

  if (!row.firstName.trim() || !row.lastName.trim()) {
    return {
      row,
      outcome: "SKIP_INVALID_EMAIL",
      detail: "First and last name are required",
      existingLeadId: null,
    };
  }

  const existing = findLeadByEmail(leads, row.email);
  if (!existing) {
    return {
      row,
      outcome: "CREATE_ENROLL",
      detail: null,
      existingLeadId: null,
    };
  }

  if (isEmailOptedOut(existing.additionalInfo)) {
    return {
      row,
      outcome: "SKIP_OPTED_OUT",
      detail: "Email opted out",
      existingLeadId: existing.id,
    };
  }

  if (existing.status === "WON" || existing.caseStage === "COMPLETED") {
    return {
      row,
      outcome: "SKIP_WON",
      detail: "Completed deal",
      existingLeadId: existing.id,
    };
  }

  if (existing.status === "DISQUALIFIED" || existing.caseStage === "DISQUALIFIED") {
    return {
      row,
      outcome: "SKIP_DISQUALIFIED",
      detail: "Disqualified case",
      existingLeadId: existing.id,
    };
  }

  if (
    existing.winbackStatus === "active" ||
    existing.winbackStatus === "paused" ||
    existing.winbackEnrolled
  ) {
    return {
      row,
      outcome: "SKIP_ENROLLED",
      detail: "Already in win-back sequence",
      existingLeadId: existing.id,
    };
  }

  if (existing.nurtureEnrolled || existing.status === "FOLLOW_UP") {
    return {
      row,
      outcome: "SKIP_ENROLLED",
      detail: "In nurture sequence",
      existingLeadId: existing.id,
    };
  }

  if (ACTIVE_STATUSES.has(existing.status) && existing.formCompleted !== false) {
    return {
      row,
      outcome: "SKIP_ACTIVE",
      detail: `Active case (${existing.status})`,
      existingLeadId: existing.id,
    };
  }

  if (existing.formCompleted === false) {
    return {
      row,
      outcome: "MERGE_ENROLL",
      detail: "Merge partial capture",
      existingLeadId: existing.id,
    };
  }

  if (existing.status === "LOST" || existing.caseStage === "LOST") {
    return {
      row,
      outcome: "REENROLL",
      detail: "Re-enroll lost case",
      existingLeadId: existing.id,
    };
  }

  if (ACTIVE_STATUSES.has(existing.status)) {
    return {
      row,
      outcome: "MERGE_ENROLL",
      detail: "Upgrade incomplete lead",
      existingLeadId: existing.id,
    };
  }

  return {
    row,
    outcome: "REENROLL",
    detail: "Enroll existing case",
    existingLeadId: existing.id,
  };
}

export function resolveImportRows(
  rows: ParsedImportRow[],
  leads: Lead[],
  sequenceId: string,
): { resolved: ResolvedImportRow[]; summary: ImportPreviewSummary } {
  const summary = emptyOutcomeSummary();
  const seenEmails = new Set<string>();
  const resolved: ResolvedImportRow[] = [];
  const schedule =
    sequenceId === WINBACK_LONG_SEQUENCE_ID ? WINBACK_LONG_SCHEDULE : WINBACK_STANDARD_SCHEDULE;
  const emailSteps = schedule.filter((s) => s.channel === "email").length;
  const smsSteps = schedule.filter((s) => s.channel === "sms").length;

  for (const row of rows) {
    if (seenEmails.has(row.email)) {
      const dup: ResolvedImportRow = {
        row,
        outcome: "SKIP_INVALID_FILE_DUP",
        detail: "Duplicate email in file",
        existingLeadId: null,
      };
      resolved.push(dup);
      summary.SKIP_INVALID_FILE_DUP++;
      summary.skipped++;
      continue;
    }
    seenEmails.add(row.email);

    const result = resolveRowOutcome(row, leads);
    resolved.push(result);
    summary[result.outcome]++;
    if (ENROLL_OUTCOMES.includes(result.outcome)) {
      summary.enrollable++;
      summary.estimatedEmails += emailSteps;
      summary.estimatedSms += smsSteps;
    } else {
      summary.skipped++;
    }
  }

  return { resolved, summary };
}

export function isEnrollOutcome(outcome: ImportOutcomeCode): boolean {
  return ENROLL_OUTCOMES.includes(outcome);
}
