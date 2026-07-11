import { createSign, randomUUID } from "node:crypto";

import { runtimeEnv, vonageApiSecret } from "@/lib/runtime-env";

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

/** RS256 JWT for Vonage Messages API when the sender number is linked to an application. */
export function vonageMessagesJwt(): string | null {
  const appId = runtimeEnv("VONAGE_APPLICATION_ID");
  let privateKey = runtimeEnv("VONAGE_PRIVATE_KEY");
  if (!appId || !privateKey) return null;

  privateKey = privateKey.replace(/\\n/g, "\n");

  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      application_id: appId,
      iat: now,
      jti: randomUUID(),
    }),
  );
  const signed = `${header}.${payload}`;
  const signature = createSign("RSA-SHA256").update(signed).sign(privateKey, "base64url");
  return `${signed}.${signature}`;
}

export function vonageBasicAuth(): string | null {
  const apiKey = runtimeEnv("VONAGE_API_KEY");
  const apiSecret = vonageApiSecret();
  if (!apiKey || !apiSecret) return null;
  return `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`;
}

export function vonageMessagesAuthHeader(): string | null {
  const jwt = vonageMessagesJwt();
  if (jwt) return `Bearer ${jwt}`;
  return vonageBasicAuth();
}

/** Quick credential check — does not send SMS. */
export async function verifyVonageCredentials(): Promise<{
  ok: boolean;
  error?: string;
  balance?: string;
}> {
  const apiKey = runtimeEnv("VONAGE_API_KEY");
  const apiSecret = vonageApiSecret();
  if (!apiKey || !apiSecret) {
    return { ok: false, error: "VONAGE_API_KEY or VONAGE_API_SECRET missing" };
  }

  try {
    const url = new URL("https://rest.nexmo.com/account/get-balance");
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("api_secret", apiSecret);
    const res = await fetch(url);
    const data = (await res.json()) as {
      value?: string;
      "error-code"?: string;
      "error-code-label"?: string;
      detail?: string;
      title?: string;
    };

    if (data.value != null) {
      return { ok: true, balance: data.value };
    }

    return {
      ok: false,
      error: data["error-code-label"] ?? data.detail ?? data.title ?? "Invalid Vonage credentials",
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Vonage credential check failed",
    };
  }
}
