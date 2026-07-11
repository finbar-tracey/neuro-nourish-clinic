import { logCaseTimeline } from "@/lib/case-engine";
import type { SmsOutboxItem } from "@/lib/crm-persistence";
import { readCrmStore } from "@/lib/crm-persistence";
import { runCrmMutation } from "@/lib/db";

const MAX_OUTBOX = 500;

export async function registerSmsOutbox(item: Omit<SmsOutboxItem, "sentAt">) {
  const entry: SmsOutboxItem = { ...item, sentAt: new Date().toISOString() };
  await runCrmMutation((store) => {
    const outbox = store.smsOutbox ?? [];
    outbox.push(entry);
    store.smsOutbox = outbox.slice(-MAX_OUTBOX);
  });
}

export async function findSmsOutbox(messageUuid: string): Promise<SmsOutboxItem | null> {
  const store = await readCrmStore();
  return (store.smsOutbox ?? []).find((i) => i.messageUuid === messageUuid) ?? null;
}

type VonageStatusPayload = {
  message_uuid?: string;
  status?: string;
  to?: string;
  from?: string;
  error?: { title?: string; detail?: string };
};

export async function handleVonageDeliveryStatus(payload: VonageStatusPayload) {
  const messageUuid = payload.message_uuid;
  const status = payload.status?.toLowerCase();
  if (!messageUuid || !status) return;

  const outbox = await findSmsOutbox(messageUuid);
  if (!outbox?.leadId) return;

  const purpose = outbox.purpose ?? "notification";

  if (status === "delivered" || status === "submitted") {
    if (status === "delivered") {
      await logCaseTimeline(
        outbox.leadId,
        "SMS_SENT",
        `SMS delivered (${purpose}).`,
        "System",
        { messageUuid, to: payload.to, status },
      );
    }
    return;
  }

  if (status === "rejected" || status === "undeliverable" || status === "failed") {
    const detail = payload.error?.detail ?? payload.error?.title ?? status;
    await logCaseTimeline(
      outbox.leadId,
      "AUTOMATION_RUN",
      `SMS failed (${purpose}) - call borrower instead: ${detail}`,
      "System",
      { messageUuid, to: payload.to, status, error: detail },
    );

    await runCrmMutation((store) => {
      const lead = store.leads.find((l) => l.id === outbox.leadId);
      if (lead && !lead.nextAction?.toLowerCase().includes("sms failed")) {
        lead.nextAction = `SMS failed - call ${lead.firstName}`;
        lead.nextActionAt = new Date();
      }
    });
  }
}