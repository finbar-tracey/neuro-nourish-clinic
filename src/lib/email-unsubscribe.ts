import { createHmac, timingSafeEqual } from "node:crypto";

import { db } from "@/lib/db";
import { getSiteUrl } from "@/lib/site-url";
import { runtimeSecret } from "@/lib/runtime-env";
import { stopWinback } from "@/lib/winback-stop";

export const EMAIL_OPT_OUT_TAG = "[email-opt-out]";

export function isEmailOptedOut(additionalInfo: string | null | undefined): boolean {
  return additionalInfo?.includes(EMAIL_OPT_OUT_TAG) ?? false;
}

export function appendEmailOptOutTag(existing: string | null | undefined): string {
  if (existing?.includes(EMAIL_OPT_OUT_TAG)) return existing;
  return existing ? `${EMAIL_OPT_OUT_TAG} ${existing}` : EMAIL_OPT_OUT_TAG;
}

function signingSecret(): string | null {
  return runtimeSecret("WORKSPACE_SECRET") ?? runtimeSecret("CRON_SECRET") ?? null;
}

export function createUnsubscribeToken(email: string): string | null {
  const secret = signingSecret();
  if (!secret) return null;

  const normalized = email.trim().toLowerCase();
  const payload = Buffer.from(normalized, "utf8").toString("base64url");
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function emailFromUnsubscribeToken(token: string): string | null {
  const secret = signingSecret();
  if (!secret) return null;

  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;

  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    return Buffer.from(payload, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

export function unsubscribeUrl(email: string): string | null {
  const token = createUnsubscribeToken(email);
  if (!token) return null;
  return `${getSiteUrl().replace(/\/$/, "")}/api/unsubscribe/${token}`;
}

export async function optOutEmailAddress(email: string): Promise<number> {
  const normalized = email.trim().toLowerCase();
  const leads = await db.lead.findMany({
    select: {
      id: true,
      additionalInfo: true,
      email: true,
      winbackEnrolled: true,
      winbackStatus: true,
    },
  });

  let updated = 0;
  for (const lead of leads) {
    if (lead.email.trim().toLowerCase() !== normalized) continue;
    if (isEmailOptedOut(lead.additionalInfo)) continue;
    await db.lead.update({
      where: { id: lead.id },
      data: { additionalInfo: appendEmailOptOutTag(lead.additionalInfo) },
    });
    if (lead.winbackStatus === "active" || lead.winbackStatus === "paused") {
      const full = await db.lead.findUnique({ where: { id: lead.id } });
      if (full) await stopWinback(full, "opted_out");
    }
    updated++;
  }
  return updated;
}
