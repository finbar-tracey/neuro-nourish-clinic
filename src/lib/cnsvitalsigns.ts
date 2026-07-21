import { runtimeEnv, runtimeSecret } from "@/lib/runtime-env";

export type CnsRequestType = "rtl" | "email_rtl" | "list_reports" | "get_report";

export type CnsStatus =
  | "none"
  | "pending_dob"
  | "test_sent"
  | "awaiting_report"
  | "report_ready"
  | "summary_draft"
  | "summary_approved"
  | "summary_sent"
  | "failed";

export type CnsSummaryStatus = "none" | "draft" | "approved" | "sent";

export interface CNSAssessmentResponse {
  success: boolean;
  testUrl?: string;
  patientId: string;
  remoteId?: string;
  error?: string;
}

const MONTH_ABBR = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** Feature flag — when false/unset with missing creds, payment still works; no fake live URL. */
export function isCnsVsLive(): boolean {
  return runtimeEnv("CNSVS_LIVE") === "true" || runtimeEnv("CNS_VITAL_SIGNS_LIVE") === "true";
}

export function cnsVsConfigured(): boolean {
  return Boolean(
    runtimeEnv("CNSVS_API_URL") &&
      runtimeEnv("CNSVS_ACCOUNT_NUMBER") &&
      runtimeSecret("CNSVS_USERNAME") &&
      runtimeSecret("CNSVS_PASSWORD"),
  );
}

/** Optional: also send CNS's native email_rtl reminders. Default Resend-only. */
export function cnsVsUseEmailRtl(): boolean {
  return runtimeEnv("CNSVS_EMAIL_RTL") === "true";
}

export function cnsSubjectIdForLead(leadId: string): string {
  return `NN-${leadId}`;
}

export function formatDobForCns(dob: Date): {
  dob_year: number;
  dob_month: (typeof MONTH_ABBR)[number];
  dob_day: string;
} {
  const year = dob.getUTCFullYear();
  const month = MONTH_ABBR[dob.getUTCMonth()]!;
  const day = String(dob.getUTCDate()).padStart(2, "0");
  return { dob_year: year, dob_month: month, dob_day: day };
}

/** Age 18–100 (UTC calendar years). */
export function validateDobForCns(dob: Date, now = new Date()): string | null {
  if (Number.isNaN(dob.getTime())) return "Invalid date of birth";
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const m = now.getUTCMonth() - dob.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < dob.getUTCDate())) age -= 1;
  if (age < 18) return "You must be at least 18 to take this assessment";
  if (age > 100) return "Please check the date of birth";
  return null;
}

function cnsApiUrl(): string {
  return runtimeEnv("CNSVS_API_URL") ?? runtimeEnv("CNS_VITAL_SIGNS_API_URL") ?? "";
}

function cnsAuthPayload(): {
  account: number;
  username: string;
  password: string;
} {
  const account = Number(runtimeEnv("CNSVS_ACCOUNT_NUMBER"));
  const username = runtimeSecret("CNSVS_USERNAME") ?? "";
  const password = runtimeSecret("CNSVS_PASSWORD") ?? "";
  if (!Number.isFinite(account) || !username || !password) {
    throw new Error("CNSVS credentials are not fully configured");
  }
  return { account, username, password };
}

export async function cnsRequest(
  requestType: CnsRequestType,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const apiUrl = cnsApiUrl();
  if (!apiUrl) throw new Error("CNSVS_API_URL is not configured");

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "cnsvs-api-request": requestType,
    },
    body: JSON.stringify({ ...cnsAuthPayload(), ...payload }),
  });

  const text = await response.text();
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(`CNSVS ${requestType} returned non-JSON (HTTP ${response.status})`);
  }

  if (!response.ok) {
    throw new Error(
      `CNSVS ${requestType} HTTP ${response.status}: ${String(data.MESSAGE ?? text.slice(0, 200))}`,
    );
  }

  return data;
}

function statusOk(data: Record<string, unknown>): boolean {
  return String(data.STATUS_CODE ?? "") === "0";
}

export async function cnsGenerateRemoteTest(input: {
  subjectId: string;
  dateOfBirth: Date;
  testConfig?: string;
  testLang?: string;
}): Promise<{ testUrl: string; remoteId: string }> {
  const dob = formatDobForCns(input.dateOfBirth);
  const data = await cnsRequest("rtl", {
    subject_id: input.subjectId,
    ...dob,
    test_config: input.testConfig ?? "0",
    test_lang: input.testLang ?? "english_us",
  });

  if (!statusOk(data)) {
    throw new Error(String(data.MESSAGE ?? "CNSVS rtl failed"));
  }

  const testUrl = String(data.URL ?? "");
  if (!testUrl) throw new Error("CNSVS rtl response missing URL");

  const remoteId =
    testUrl.includes("rtl=")
      ? testUrl.split("rtl=").pop()?.split("&")[0] ?? ""
      : String(data.REMOTE_ID ?? data.remote_id ?? "");

  if (!remoteId) throw new Error("CNSVS rtl response missing remote id");

  return { testUrl, remoteId };
}

export async function cnsEmailRemoteTest(remoteId: string, emailTo: string): Promise<void> {
  const data = await cnsRequest("email_rtl", {
    remote_id: remoteId,
    email_to: emailTo,
  });
  if (!statusOk(data)) {
    throw new Error(String(data.MESSAGE ?? "CNSVS email_rtl failed"));
  }
}

export type CnsReportListItem = { syncId: string; reference: string };

export async function cnsListReports(input: {
  subjectFilter: string;
  beginDate: string;
  endDate: string;
}): Promise<CnsReportListItem[]> {
  const data = await cnsRequest("list_reports", {
    subjectfilter: input.subjectFilter,
    begin_date: input.beginDate,
    end_date: input.endDate,
  });

  if (!statusOk(data)) {
    throw new Error(String(data.MESSAGE ?? "CNSVS list_reports failed"));
  }

  const list = data.LIST as
    | { RESULT?: Array<Record<string, unknown>> | Record<string, unknown> }
    | undefined;
  const raw = list?.RESULT;
  const results = Array.isArray(raw) ? raw : raw && typeof raw === "object" ? [raw] : [];
  return results
    .map((row) => ({
      syncId: String(row.SYNC_ID ?? ""),
      reference: String(row.REFERENCE ?? ""),
    }))
    .filter((row) => row.syncId);
}

export async function cnsDownloadReportPdf(syncId: string): Promise<Buffer> {
  const data = await cnsRequest("get_report", {
    sync_id: syncId,
    report_type: "Clinical",
    report_language: "English",
    paper_size: "Letter",
  });

  if (data.PDF && typeof data.PDF === "string") {
    return Buffer.from(data.PDF, "base64");
  }

  if (!statusOk(data)) {
    throw new Error(String(data.MESSAGE ?? "CNSVS get_report failed"));
  }

  throw new Error("CNSVS get_report response missing PDF");
}

/**
 * @deprecated Prefer issueCnsRemoteTest in cns-pipeline. Kept for smoke tests /
 * fallback when CNSVS_LIVE is off — returns a non-launcher placeholder only when not live.
 */
export async function generateClinicalAssessmentToken(
  patientId: string,
  _patientEmail: string,
): Promise<CNSAssessmentResponse> {
  const subjectId = cnsSubjectIdForLead(patientId);

  if (!isCnsVsLive() || !cnsVsConfigured()) {
    return {
      success: true,
      patientId: subjectId,
      testUrl: undefined,
      error: isCnsVsLive()
        ? "CNSVS credentials missing"
        : "CNSVS_LIVE is not enabled — manual issue required",
    };
  }

  return {
    success: false,
    patientId: subjectId,
    error: "Use issueCnsRemoteTest with date of birth",
  };
}

/** @deprecated Prefer issueCnsRemoteTest / ensureCnsSubjectId */
export async function resolveCnsAssessmentTestUrl(
  patientId: string,
  patientEmail: string,
): Promise<{ testUrl: string; registration: CNSAssessmentResponse }> {
  const registration = await generateClinicalAssessmentToken(patientId, patientEmail);
  return {
    testUrl: registration.testUrl ?? "",
    registration,
  };
}
