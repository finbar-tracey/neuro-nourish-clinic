import { createHash } from "node:crypto";

import { sanitizeMetaEventUrl } from "@/lib/meta-tracking";
import { runtimeEnv, runtimeSecret } from "@/lib/runtime-env";

export type MetaCapiEvent =
  | "Lead"
  | "InitiateCheckout"
  | "CompleteRegistration"
  | "Schedule"
  | "ViewContent"
  | "Purchase";

export type MetaCapiInput = {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  leadId?: string;
  eventId?: string;
  loanAmount?: number;
  currency?: string;
  contentName?: string;
  contentType?: string;
  sourceUrl?: string;
  fbclid?: string;
  fbp?: string;
  fbc?: string;
  clientIp?: string;
  userAgent?: string;
};

export type MetaCapiResult = {
  sent: boolean;
  skipped?: string;
  eventsReceived?: number;
  fbtraceId?: string;
  error?: string;
};

function metaConfigured(): boolean {
  return Boolean(runtimeSecret("META_CAPI_ACCESS_TOKEN") && runtimeEnv("NEXT_PUBLIC_META_PIXEL_ID"));
}

/** CAPI is independent of SMS/email dry-run — use META_CAPI_DRY_RUN for audits. */
export function metaCapiDryRun(): boolean {
  return runtimeEnv("META_CAPI_DRY_RUN") === "true";
}

function hashSha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("44")) return digits;
  if (digits.startsWith("0")) return `44${digits.slice(1)}`;
  return digits;
}

/** Server-side Meta Conversions API — no-op when not configured or META_CAPI_DRY_RUN=true. */
export async function sendMetaCapiEvent(
  event: MetaCapiEvent,
  input: MetaCapiInput,
): Promise<MetaCapiResult> {
  if (metaCapiDryRun()) return { sent: false, skipped: "dry_run" };
  if (!metaConfigured()) return { sent: false, skipped: "not_configured" };

  const pixelId = runtimeEnv("NEXT_PUBLIC_META_PIXEL_ID")!;
  const token = runtimeSecret("META_CAPI_ACCESS_TOKEN")!;
  const eventTime = Math.floor(Date.now() / 1000);

  const userData: Record<string, string> = {};
  if (input.email) userData.em = hashSha256(input.email);
  if (input.phone) userData.ph = hashSha256(normalizePhone(input.phone));
  if (input.firstName) userData.fn = hashSha256(input.firstName);
  if (input.lastName) userData.ln = hashSha256(input.lastName);
  if (input.leadId) userData.external_id = hashSha256(input.leadId);
  if (input.fbp) userData.fbp = input.fbp;
  if (input.fbc) {
    userData.fbc = input.fbc;
  } else if (input.fbclid) {
    userData.fbc = `fb.1.${eventTime}.${input.fbclid}`;
  }
  if (input.clientIp) userData.client_ip_address = input.clientIp;
  if (input.userAgent) userData.client_user_agent = input.userAgent;

  const customData: Record<string, unknown> = {};
  if (input.loanAmount != null) customData.value = input.loanAmount;
  if (input.currency) customData.currency = input.currency;
  if (input.contentName) customData.content_name = input.contentName;
  if (input.contentType) customData.content_type = input.contentType;

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: event,
        event_time: eventTime,
        event_id: input.eventId ?? input.leadId ?? `nn-${event}-${eventTime}`,
        action_source: "website",
        event_source_url: sanitizeMetaEventUrl(input.sourceUrl),
        user_data: userData,
        custom_data: Object.keys(customData).length > 0 ? customData : undefined,
      },
    ],
  };

  const testCode = runtimeEnv("META_CAPI_TEST_EVENT_CODE");
  if (testCode) payload.test_event_code = testCode;

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    const data = (await res.json().catch(() => ({}))) as {
      events_received?: number;
      fbtrace_id?: string;
      error?: { message?: string };
    };

    if (!res.ok) {
      const message = data.error?.message ?? `HTTP ${res.status}`;
      console.warn("[Meta CAPI]", message);
      return { sent: false, skipped: "api_error", error: message, fbtraceId: data.fbtrace_id };
    }

    return {
      sent: true,
      eventsReceived: data.events_received,
      fbtraceId: data.fbtrace_id,
    };
  } catch (error) {
    return {
      sent: false,
      skipped: "network_error",
      error: error instanceof Error ? error.message : "network_error",
    };
  }
}

export function metaCapiConfigured(): boolean {
  return metaConfigured();
}
