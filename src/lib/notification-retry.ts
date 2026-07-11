import crypto from "node:crypto";

import { readCrmStore, type NotificationRetryItem } from "@/lib/crm-persistence";
import { runCrmMutation } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { sendSms } from "@/lib/sms";

export type { NotificationRetryItem };

export async function enqueueNotificationRetry(input: {
  channel: "sms" | "email";
  to: string;
  body: string;
  subject?: string;
  leadId?: string;
  error?: string;
}) {
  const item: NotificationRetryItem = {
    id: crypto.randomBytes(8).toString("hex"),
    channel: input.channel,
    to: input.to,
    body: input.body,
    subject: input.subject,
    leadId: input.leadId,
    attempts: 1,
    maxAttempts: 3,
    createdAt: new Date().toISOString(),
    lastError: input.error,
  };

  await runCrmMutation((store) => {
    store.notificationRetries = store.notificationRetries ?? [];
    store.notificationRetries.push(item);
  });

  return item.id;
}

export async function processNotificationRetries() {
  const store = await readCrmStore();
  const pending = store.notificationRetries ?? [];
  let retried = 0;
  let succeeded = 0;
  let dropped = 0;

  for (const item of [...pending]) {
    if (item.attempts >= item.maxAttempts) {
      dropped++;
      await runCrmMutation((s) => {
        s.notificationRetries = (s.notificationRetries ?? []).filter((r) => r.id !== item.id);
      });
      continue;
    }

    const result =
      item.channel === "sms"
        ? await sendSms(item.to, item.body)
        : await sendEmail({
            to: item.to,
            subject: item.subject ?? "Bridging Loans Broker",
            body: item.body,
          });

    retried++;

    if (result.sent) {
      succeeded++;
      await runCrmMutation((s) => {
        s.notificationRetries = (s.notificationRetries ?? []).filter((r) => r.id !== item.id);
      });
    } else {
      const nextAttempts = item.attempts + 1;
      if (nextAttempts >= item.maxAttempts) {
        dropped++;
        await runCrmMutation((s) => {
          s.notificationRetries = (s.notificationRetries ?? []).filter((r) => r.id !== item.id);
        });
      } else {
        await runCrmMutation((s) => {
          const list = s.notificationRetries ?? [];
          const idx = list.findIndex((r) => r.id === item.id);
          if (idx >= 0) {
            list[idx] = {
              ...list[idx]!,
              attempts: nextAttempts,
              lastAttemptAt: new Date().toISOString(),
              lastError: result.error ?? "send_failed",
            };
          }
          s.notificationRetries = list;
        });
      }
    }
  }

  return { pending: pending.length, retried, succeeded, dropped };
}
