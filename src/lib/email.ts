import { notificationsDryRun } from "@/lib/notifications-config";
import { enqueueNotificationRetry } from "@/lib/notification-retry";
import { resendFromAddress, resendReplyTo } from "@/lib/email-from";
import { brandedEmailHtml, type BrandedEmailOptions } from "@/lib/email-templates";
import { unsubscribeUrl } from "@/lib/email-unsubscribe";
import { runtimeSecret } from "@/lib/runtime-env";

export type EmailCategory = "transactional" | "marketing";

type SendEmailInput = {
  to: string;
  subject: string;
  body: string;
  replyTo?: string;
  htmlOptions?: BrandedEmailOptions;
  /** When set, used as the email HTML body instead of the branded template wrapper. */
  html?: string;
  /** Marketing emails get RFC 8058 List-Unsubscribe headers (Gmail / Yahoo). */
  category?: EmailCategory;
  attachments?: Array<{ filename: string; content: Buffer }>;
};

type SendEmailResult = {
  sent: boolean;
  logged: boolean;
  id?: string;
  error?: string;
  skipped?: "opted_out";
};

function listUnsubscribeHeaders(to: string): Record<string, string> | undefined {
  const url = unsubscribeUrl(to);
  if (!url) return undefined;

  return {
    "List-Unsubscribe": `<${url}>, <mailto:daniel@bridgingloansbroker.co.uk?subject=unsubscribe>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

export async function sendEmail({
  to,
  subject,
  body,
  replyTo,
  htmlOptions,
  html: htmlOverride,
  category = "transactional",
  attachments,
}: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = runtimeSecret("RESEND_API_KEY");
  const from = resendFromAddress();
  const reply = replyTo ?? resendReplyTo();

  if (!apiKey || notificationsDryRun()) {
    return { sent: false, logged: true };
  }

  const marketing = category === "marketing";
  const unsub = marketing ? unsubscribeUrl(to) : null;
  const html =
    htmlOverride ??
    brandedEmailHtml(body, subject, {
      ...htmlOptions,
      unsubscribeUrl: unsub ?? htmlOptions?.unsubscribeUrl,
    });

  const payload: Record<string, unknown> = {
    from,
    to: [to],
    subject,
    html,
    text: marketing && unsub ? `${body}\n\nUnsubscribe: ${unsub}` : body,
    reply_to: reply,
    tags: [{ name: "category", value: category }],
  };

  if (marketing) {
    const headers = listUnsubscribeHeaders(to);
    if (headers) payload.headers = headers;
  }

  if (attachments?.length) {
    payload.attachments = attachments.map((file) => ({
      filename: file.filename,
      content: file.content.toString("base64"),
    }));
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as { id?: string; message?: string };

    if (!res.ok) {
      const fail = {
        sent: false,
        logged: true,
        error: data.message ?? `Resend error ${res.status}`,
      };
      if (!notificationsDryRun()) {
        void enqueueNotificationRetry({
          channel: "email",
          to,
          subject,
          body,
          error: fail.error,
        });
      }
      return fail;
    }

    return { sent: true, logged: false, id: data.id };
  } catch (error) {
    const fail = {
      sent: false,
      logged: true,
      error: error instanceof Error ? error.message : "Send failed",
    };
    if (!notificationsDryRun()) {
      void enqueueNotificationRetry({
        channel: "email",
        to,
        subject,
        body,
        error: fail.error,
      });
    }
    return fail;
  }
}

export function emailConfigured(): boolean {
  return Boolean(runtimeSecret("RESEND_API_KEY"));
}

export function isMarketingJourneyEmail(id: string): boolean {
  return (
    id.startsWith("nurture-day-") ||
    id.startsWith("winback-lost-day-") ||
    id.startsWith("winback-long-day-")
  );
}
