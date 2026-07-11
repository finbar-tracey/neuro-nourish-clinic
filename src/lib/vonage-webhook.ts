import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import { runtimeEnv } from "@/lib/runtime-env";

function base64UrlDecode(input: string): Buffer {
  const padded = input + "=".repeat((4 - (input.length % 4)) % 4);
  return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function verifyJwtHs256(token: string, secret: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signatureB64] = parts;
  const signed = `${headerB64}.${payloadB64}`;
  const expected = createHmac("sha256", secret).update(signed).digest();
  const actual = base64UrlDecode(signatureB64);

  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }

  try {
    return JSON.parse(base64UrlDecode(payloadB64).toString("utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Verify Vonage Messages API signed webhook (JWT in Authorization header). */
export function verifyVonageWebhook(
  authorization: string | null,
  rawBody: string,
): boolean {
  const secret = runtimeEnv("VONAGE_SIGNATURE_SECRET");
  if (!secret) return true;

  if (!authorization?.startsWith("Bearer ")) return false;

  const token = authorization.slice("Bearer ".length).trim();
  const claims = verifyJwtHs256(token, secret);
  if (!claims) return false;

  const payloadHash = claims.payload_hash;
  if (typeof payloadHash === "string" && payloadHash.length > 0) {
    const hash = createHash("sha256").update(rawBody).digest("hex");
    if (hash !== payloadHash) return false;
  }

  return true;
}
