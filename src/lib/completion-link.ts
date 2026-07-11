import { createHmac, timingSafeEqual } from "node:crypto";

import { runtimeSecret } from "@/lib/runtime-env";

const EXPIRY_DAYS = 7;

function completionSecret(): string | undefined {
  return runtimeSecret("COMPLETION_LINK_SECRET");
}

function signPayload(leadId: string, exp: number, secret: string): string {
  const payload = `${leadId}.${exp}`;
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** HMAC-signed token for /lp/complete deep links (7-day expiry). */
export function signCompletionToken(leadId: string, now = Date.now()): string | null {
  const secret = completionSecret();
  if (!secret) return null;
  const exp = Math.floor(now / 1000) + EXPIRY_DAYS * 86_400;
  const sig = signPayload(leadId, exp, secret);
  return `${exp}.${sig}`;
}

export function verifyCompletionToken(leadId: string, token: string | null | undefined): boolean {
  const secret = completionSecret();
  if (!secret || !token) return false;

  const dot = token.indexOf(".");
  if (dot <= 0) return false;

  const expStr = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp <= 0) return false;
  if (Math.floor(Date.now() / 1000) > exp) return false;

  const expected = signPayload(leadId, exp, secret);
  if (expected.length !== sig.length) return false;

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  } catch {
    return false;
  }
}
