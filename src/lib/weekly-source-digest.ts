import { leadToCase } from "@/lib/case";
import { brokerNotifyEmail } from "@/lib/broker-notify";
import { inferCaseStage } from "@/lib/case-stages";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { notificationsDryRun } from "@/lib/notifications-config";

const DIGEST_TAG = "[Weekly source digest";

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
  return `${y}-W${m}-${week}`;
}

async function buildSourceRows() {
  const leads = await db.lead.findMany();
  const bySource = new Map<
    string,
    { leads: number; consultations: number; completed: number; expectedRevenue: number }
  >();

  for (const lead of leads) {
    const source = lead.attributionChannel ?? lead.utmSource ?? lead.source ?? "Direct";
    const bucket = bySource.get(source) ?? {
      leads: 0,
      consultations: 0,
      completed: 0,
      expectedRevenue: 0,
    };
    bucket.leads++;
    const stage = inferCaseStage(lead);
    if (stage === "CONSULTATION_BOOKED" || stage === "CONSULTATION_COMPLETED" || lead.priorityCallBookedAt) {
      bucket.consultations++;
    }
    if (stage === "COMPLETED") bucket.completed++;
    bucket.expectedRevenue += leadToCase(lead).expectedValue;
    bySource.set(source, bucket);
  }

  return [...bySource.entries()]
    .map(([source, stats]) => ({ source, ...stats }))
    .sort((a, b) => b.leads - a.leads);
}

/** Monday 08:00 London — weekly pipeline digest to Daniel (no-op if dry-run or already sent). */
export async function processWeeklySourceDigest() {
  const { weekday, hour } = londonParts();
  if (weekday !== "Mon" || hour !== 8) {
    return { sent: false, skipped: "not_scheduled_window" };
  }

  if (notificationsDryRun()) {
    return { sent: false, skipped: "dry_run" };
  }

  const key = weekKey();
  const rules = await db.automationRule.findMany();
  const marker = rules.find((r) => r.name === "__weekly_digest_marker__");
  const lastSent = marker?.description ?? "";
  if (lastSent.includes(key)) {
    return { sent: false, skipped: "already_sent" };
  }

  const rows = await buildSourceRows();
  if (rows.length === 0) {
    return { sent: false, skipped: "no_data" };
  }

  const lines = rows.map(
    (r) =>
      `• ${r.source}: ${r.leads} enquiries, ${r.consultations} consultations, ${r.completed} completed, £${r.expectedRevenue.toLocaleString("en-GB")} expected value`,
  );

  const body = `Weekly source attribution digest (${key})

${lines.join("\n")}

Open full report: ${process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://loans.bridgingloansbroker.co.uk"}/workspace/sources

Daniel Mehrnia
Bridging Loans Broker`;

  const result = await sendEmail({
    to: brokerNotifyEmail(),
    subject: `Weekly pipeline digest — ${key}`,
    body,
  });

  if (result.sent || result.logged) {
    if (marker) {
      await db.automationRule.update({
        where: { id: marker.id },
        data: { description: `${DIGEST_TAG} ${key}]` },
      });
    } else {
      await db.automationRule.create({
        data: {
          name: "__weekly_digest_marker__",
          description: `${DIGEST_TAG} ${key}]`,
          trigger: "LEAD_IDLE",
          action: "ADD_NOTE",
          config: "{}",
          enabled: false,
        },
      });
    }
  }

  return { sent: result.sent, logged: result.logged };
}
