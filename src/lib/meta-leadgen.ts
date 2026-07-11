import { createHmac, timingSafeEqual } from "node:crypto";

import { normalizeUKPhone } from "@/lib/form-validation";
import { runtimeEnv, runtimeSecret } from "@/lib/runtime-env";
import { LOAN_PURPOSES } from "@/lib/validations";
import { QUICK_TIMEFRAMES } from "@/lib/timeframes";

export type MetaLeadField = {
  name: string;
  values: string[];
};

export type MetaLeadgenPayload = {
  id: string;
  created_time?: string;
  field_data?: MetaLeadField[];
};

const AMOUNT_BANDS: { pattern: RegExp; value: number }[] = [
  { pattern: /150|100.?000|50.?000/i, value: 150_000 },
  { pattern: /250|200.?000/i, value: 250_000 },
  { pattern: /500|400.?000|350.?000/i, value: 500_000 },
  { pattern: /1.?m|million|750|800|900/i, value: 1_000_000 },
];

const PURPOSE_ALIASES: Record<string, string> = {
  auction: "auction",
  purchase: "purchase",
  "capital raise": "equity_release",
  "equity release": "equity_release",
  business: "chain_break",
  investment: "chain_break",
  refinance: "refinance",
  refurb: "refurbishment",
  refurbishment: "refurbishment",
  development: "development",
  other: "other",
};

const TIMEFRAME_ALIASES: Record<string, string> = {
  urgent: "urgent",
  "7 days": "urgent",
  "within 7": "urgent",
  "30 days": "30_days",
  "30 day": "30_days",
  "90 days": "90_days",
  "90 day": "90_days",
  researching: "researching",
  research: "researching",
};

function fieldMap(fields: MetaLeadField[] | undefined): Map<string, string> {
  const map = new Map<string, string>();
  for (const field of fields ?? []) {
    const key = field.name.toLowerCase().replace(/\s+/g, "_");
    const value = field.values?.[0]?.trim() ?? "";
    if (value) map.set(key, value);
  }
  return map;
}

function pickField(map: Map<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    const direct = map.get(key);
    if (direct) return direct;
  }
  for (const [name, value] of map.entries()) {
    if (keys.some((k) => name.includes(k))) return value;
  }
  return "";
}

function mapLoanAmount(raw: string): number {
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.length >= 5) {
    const n = Number(digits);
    if (Number.isFinite(n) && n >= 50_000) return n;
  }
  for (const band of AMOUNT_BANDS) {
    if (band.pattern.test(raw)) return band.value;
  }
  return 250_000;
}

function mapLoanPurpose(raw: string): string {
  const lower = raw.toLowerCase().trim();
  for (const [needle, value] of Object.entries(PURPOSE_ALIASES)) {
    if (lower.includes(needle)) return value;
  }
  const match = LOAN_PURPOSES.find(
    (p) => p.value === lower || p.label.toLowerCase() === lower,
  );
  return match?.value ?? "other";
}

function mapTimeframe(raw: string): string {
  const lower = raw.toLowerCase().trim();
  for (const [needle, value] of Object.entries(TIMEFRAME_ALIASES)) {
    if (lower.includes(needle)) return value;
  }
  const match = QUICK_TIMEFRAMES.find(
    (t) => t.value === lower || t.label.toLowerCase() === lower,
  );
  return match?.value ?? "30_days";
}

export function mapMetaLeadFields(fields: MetaLeadField[] | undefined) {
  const map = fieldMap(fields);

  const firstName = pickField(map, "first_name", "firstname") || "Enquiry";
  const lastName = pickField(map, "last_name", "lastname") || "Lead";
  const email = pickField(map, "email");
  const phoneRaw = pickField(map, "phone_number", "phone", "mobile");
  const phone = phoneRaw ? normalizeUKPhone(phoneRaw) : "";

  const amountRaw = pickField(
    map,
    "loan_amount",
    "amount",
    "how_much",
    "finance_amount",
    "custom_question_1",
  );
  const purposeRaw = pickField(
    map,
    "loan_purpose",
    "purpose",
    "what_do_you_need",
    "custom_question_2",
  );
  const timeframeRaw = pickField(
    map,
    "timeframe",
    "timeline",
    "when",
    "custom_question_3",
  );

  return {
    firstName,
    lastName,
    email,
    phone,
    loanAmount: mapLoanAmount(amountRaw || "250000"),
    loanPurpose: mapLoanPurpose(purposeRaw || "other"),
    timeframe: mapTimeframe(timeframeRaw || "30_days"),
  };
}

export async function fetchMetaLeadgen(leadgenId: string): Promise<MetaLeadgenPayload | null> {
  const token = runtimeSecret("META_PAGE_ACCESS_TOKEN");
  if (!token) return null;

  const version = runtimeEnv("META_GRAPH_API_VERSION") ?? "v21.0";
  const url = new URL(`https://graph.facebook.com/${version}/${leadgenId}`);
  url.searchParams.set("access_token", token);
  url.searchParams.set("fields", "id,created_time,field_data");

  const res = await fetch(url.toString(), { method: "GET" });
  if (!res.ok) {
    console.error("Meta leadgen fetch failed:", res.status, await res.text());
    return null;
  }

  return (await res.json()) as MetaLeadgenPayload;
}

export function verifyMetaWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  const secret = runtimeSecret("META_APP_SECRET");
  if (!secret || !signatureHeader?.startsWith("sha256=")) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const received = signatureHeader.slice(7);
  if (expected.length !== received.length) return false;

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
  } catch {
    return false;
  }
}

export function metaWebhookVerifyToken(): string | undefined {
  return runtimeSecret("META_LEADGEN_VERIFY_TOKEN");
}
