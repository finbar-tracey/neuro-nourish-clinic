import crypto from "crypto";

const REPLAY_WINDOW_SECONDS = 300;

function safeTimingEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

/** Validates Calendly `t=...,v1=...` webhook signatures (production format). */
export function verifyCalendlyStructuredSignature(
  rawBody: string,
  calendlyHeader: string,
  signingKey: string,
): boolean {
  const parts = calendlyHeader.split(",");
  const timestampPart = parts.find((p) => p.startsWith("t="));
  const signaturePart = parts.find((p) => p.startsWith("v1="));

  if (!timestampPart || !signaturePart) return false;

  const timestamp = timestampPart.split("=")[1];
  const passedSignature = signaturePart.split("=")[1];
  if (!timestamp || !passedSignature) return false;

  const timestampSeconds = parseInt(timestamp, 10);
  if (Number.isNaN(timestampSeconds)) return false;

  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - timestampSeconds) > REPLAY_WINDOW_SECONDS) {
    console.warn("[SECURITY] Calendly webhook timestamp outside valid window.");
    return false;
  }

  const verificationPayload = `${timestamp}.${rawBody}`;
  const computedSignature = crypto
    .createHmac("sha256", signingKey)
    .update(verificationPayload, "utf8")
    .digest("hex");

  return safeTimingEqual(computedSignature, passedSignature);
}

/** Legacy dev/staging format: raw HMAC hex over body only. */
export function verifyCalendlyLegacySignature(
  rawBody: string,
  signature: string,
  signingKey: string,
): boolean {
  const expected = crypto.createHmac("sha256", signingKey).update(rawBody).digest("hex");
  return safeTimingEqual(expected, signature);
}

/** Accepts production `t=,v1=` headers or legacy raw hex signatures. */
export function verifyCalendlyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  signingKey: string,
): boolean {
  if (!signingKey) return true;
  if (!signatureHeader) return false;

  if (signatureHeader.includes("t=") && signatureHeader.includes("v1=")) {
    return verifyCalendlyStructuredSignature(rawBody, signatureHeader, signingKey);
  }

  return verifyCalendlyLegacySignature(rawBody, signatureHeader, signingKey);
}

export function readCalendlySignatureHeader(request: Request): string | null {
  return (
    request.headers.get("calendly-webhook-signature") ??
    request.headers.get("x-calendly-signature") ??
    request.headers.get("Calendly-Webhook-Signature")
  );
}
