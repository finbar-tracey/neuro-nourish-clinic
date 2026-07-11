/** Shared KV / Upstash REST credentials — supports legacy Vercel KV names and Upstash marketplace vars. */
import { runtimeEnv, runtimeSecret } from "@/lib/runtime-env";

export function getKvRestConfig(): { url: string; token: string } | null {
  const url =
    runtimeEnv("KV_REST_API_URL") || runtimeEnv("UPSTASH_REDIS_REST_URL") || "";
  const token =
    runtimeSecret("KV_REST_API_TOKEN") || runtimeSecret("UPSTASH_REDIS_REST_TOKEN") || "";

  if (!url || !token) return null;
  return { url, token };
}

export function isKvConfigured(): boolean {
  return getKvRestConfig() != null;
}

export function kvStorageMode(): "kv" | "file" {
  return isKvConfigured() ? "kv" : "file";
}

/** Vercel serverless has a read-only filesystem — file fallback cannot persist leads. */
export function assertKvForServerlessWrites(context: string): void {
  if (isKvConfigured()) return;
  if (!process.env.VERCEL) return;
  throw new Error(
    `${context}: KV is not configured on Vercel (set KV_REST_API_URL + KV_REST_API_TOKEN, then redeploy)`,
  );
}

export async function kvRestFetch(pathSuffix: string, init?: RequestInit): Promise<Response> {
  const config = getKvRestConfig();
  if (!config) {
    throw new Error("KV REST credentials are not configured");
  }

  const base = config.url.replace(/\/$/, "");
  return fetch(`${base}${pathSuffix}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.token}`,
      ...(init?.headers ?? {}),
    },
  });
}
