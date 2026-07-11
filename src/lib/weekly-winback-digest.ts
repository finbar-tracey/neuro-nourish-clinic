import { brokerNotifyEmail } from "@/lib/broker-notify";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { notificationsDryRun } from "@/lib/notifications-config";
import { computeWinbackMetrics } from "@/lib/winback-metrics";

const DIGEST_TAG = "[Weekly win-back digest";

function londonParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "short",
    hour: "numeric",
    hour12: false,
  }).formatToParts(now);

  return {
    weekday: parts.find((p) => p.type === "weekday")?.value ?? "",
    hour: Number(parts.find((p) => p.type === "hour")?.value ?? 0),
  };
}

function weekKey(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = Number(parts.find((p) => p.type === "day")?.value ?? 1);
  const week = Math.ceil(d / 7);
  return `winback-${y}-W${m}-${week}`;
}

/** Monday 08:00 London — win-back program summary for Daniel. */
export async function processWeeklyWinbackDigest() {
  const { weekday, hour } = londonParts();
  if (weekday !== "Mon" || hour !== 8) {
    return { sent: false, skipped: "not_scheduled_window" };
  }

  if (notificationsDryRun()) {
    return { sent: false, skipped: "dry_run" };
  }

  const key = weekKey();
  const rules = await db.automationRule.findMany();
  const alreadySent = rules.some((r) => r.name.includes(DIGEST_TAG) && r.name.includes(key));
  if (alreadySent) {
    return { sent: false, skipped: "already_sent" };
  }

  const leads = await db.lead.findMany();
  const m = computeWinbackMetrics(leads);

  if (m.enrolled === 0 && m.active === 0) {
    return { sent: false, skipped: "no_winback_leads" };
  }

  const body = `Win-back summary

Active: ${m.active}
Due today: ${m.dueToday}
Paused (re-engaged): ${m.reEngaged}
Completed (all time): ${m.completed}
Stopped: ${m.stopped}

Open Re-engagement in the workspace to review sequences.`;

  await sendEmail({
    to: brokerNotifyEmail(),
    subject: `Win-back weekly — ${m.active} active, ${m.dueToday} due today`,
    body,
    category: "transactional",
  });

  await db.automationRule.create({
    data: {
      name: `${DIGEST_TAG} ${key}]`,
      description: "Weekly win-back digest sent marker",
      trigger: "LEAD_IDLE",
      action: "ADD_NOTE",
      config: JSON.stringify({ key }),
      enabled: false,
    },
  });

  return { sent: true, metrics: m };
}
