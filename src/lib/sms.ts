import { notificationsDryRun } from "@/lib/notifications-config";
import { enqueueNotificationRetry } from "@/lib/notification-retry";
import { runtimeEnv, vonageApiSecret } from "@/lib/runtime-env";
import { registerSmsOutbox } from "@/lib/sms-delivery";
import { gsmSafeSms, isIrishNumber, toVonageNumber } from "@/lib/sms-encoding";
import { vonageBasicAuth, vonageMessagesAuthHeader } from "@/lib/vonage-auth";

export type { toVonageNumber, gsmSafeSms, isIrishNumber } from "@/lib/sms-encoding";

export type SendSmsOptions = {
  /** borrower = branded alpha on UK; broker = always numeric */
  audience?: "borrower" | "broker";
  leadId?: string;
  purpose?: string;
};

type SendSmsResult = {
  sent: boolean;
  logged: boolean;
  id?: string;
  error?: string;
};

function resolveFromField(to: string, audience: "borrower" | "broker"): string | null {
  const numericFrom = runtimeEnv("VONAGE_FROM_NUMBER");
  const alphaFrom = runtimeEnv("VONAGE_SENDER_ID");

  if (!numericFrom) return null;

  if (audience === "broker") {
    return toVonageNumber(numericFrom);
  }

  if (isIrishNumber(to)) {
    return toVonageNumber(numericFrom);
  }

  if (alphaFrom && /^[a-zA-Z0-9 .&_-]{1,11}$/.test(alphaFrom)) {
    return alphaFrom;
  }

  return toVonageNumber(numericFrom);
}

function authFailure(detail?: string): boolean {
  const msg = (detail ?? "").toLowerCase();
  return (
    msg.includes("invalid token") ||
    msg.includes("unauthorized") ||
    msg.includes("bad credentials") ||
    msg.includes("correct credentials")
  );
}

async function sendViaLegacySms(
  to: string,
  text: string,
  from: string,
  options: SendSmsOptions,
): Promise<SendSmsResult> {
  const apiKey = runtimeEnv("VONAGE_API_KEY");
  const apiSecret = vonageApiSecret();
  if (!apiKey || !apiSecret) {
    return { sent: false, logged: true, error: "Vonage API key/secret missing" };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const body: Record<string, string | number> = {
    api_key: apiKey,
    api_secret: apiSecret,
    to: toVonageNumber(to),
    from,
    text,
    "status-report-req": 1,
  };
  if (siteUrl) {
    body.callback = `${siteUrl}/api/vonage/status`;
  }
  if (options.leadId) {
    body["client-ref"] = options.leadId;
  }

  const res = await fetch("https://rest.nexmo.com/sms/json", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as {
    messages?: Array<{
      status?: string;
      "message-id"?: string;
      "error-text"?: string;
    }>;
  };

  const msg = data.messages?.[0];
  if (msg?.status === "0") {
    const id = msg["message-id"];
    if (id) {
      void registerSmsOutbox({
        messageUuid: id,
        leadId: options.leadId,
        to: toVonageNumber(to),
        purpose: options.purpose,
      });
    }
    return { sent: true, logged: false, id };
  }

  return {
    sent: false,
    logged: true,
    error: msg?.["error-text"] ?? "Legacy SMS API error",
  };
}

async function sendViaMessagesApi(
  to: string,
  text: string,
  from: string,
  options: SendSmsOptions,
): Promise<SendSmsResult> {
  const auth = vonageMessagesAuthHeader();
  if (!auth) {
    return { sent: false, logged: true, error: "Vonage auth not configured" };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const payload: Record<string, string> = {
    message_type: "text",
    text,
    to: toVonageNumber(to),
    from,
    channel: "sms",
  };
  if (siteUrl) {
    payload.webhook_url = `${siteUrl}/api/vonage/status`;
    payload.webhook_version = "v1";
  }

  const res = await fetch("https://api.nexmo.com/v1/messages", {
    method: "POST",
    headers: {
      Authorization: auth,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await res.json()) as {
    message_uuid?: string;
    title?: string;
    detail?: string;
  };

  if (!res.ok) {
    return {
      sent: false,
      logged: true,
      error: data.detail ?? data.title ?? `Vonage error ${res.status}`,
    };
  }

  if (data.message_uuid) {
    void registerSmsOutbox({
      messageUuid: data.message_uuid,
      leadId: options.leadId,
      to: toVonageNumber(to),
      purpose: options.purpose,
    });
  }

  return { sent: true, logged: false, id: data.message_uuid };
}

/** Sends via Vonage when configured; otherwise logs only (activity logged by caller). */
export async function sendSms(
  to: string,
  body: string,
  options: SendSmsOptions = {},
): Promise<SendSmsResult> {
  const audience = options.audience ?? "borrower";
  const from = resolveFromField(to, audience);
  const text = gsmSafeSms(body);

  if (!from || notificationsDryRun()) {
    return { sent: false, logged: true, error: from ? undefined : "VONAGE_FROM_NUMBER missing" };
  }

  if (!vonageBasicAuth() && !vonageMessagesAuthHeader()) {
    return { sent: false, logged: true, error: "Vonage not configured" };
  }

  let result = await sendViaMessagesApi(to, text, from, options);

  if (!result.sent && authFailure(result.error)) {
    result = await sendViaLegacySms(to, text, from, options);
  }

  if (!result.sent && !notificationsDryRun()) {
    void enqueueNotificationRetry({
      channel: "sms",
      to,
      body: text,
      error: result.error,
      leadId: options.leadId,
    });
  }

  return result;
}

export function smsConfigured(): boolean {
  return Boolean(
    runtimeEnv("VONAGE_API_KEY") &&
      vonageApiSecret() &&
      runtimeEnv("VONAGE_FROM_NUMBER"),
  );
}
