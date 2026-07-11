import { getKvRestConfig } from "@/lib/kv-env";

type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

function memoryRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = memoryBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { ok: true };
}

async function kvRateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const config = getKvRestConfig();
  if (!config) return memoryRateLimit(key, limit, windowMs);

  const windowSec = Math.ceil(windowMs / 1000);
  const redisKey = `ratelimit:${key}`;

  try {
    const base = config.url.replace(/\/$/, "");
    const incrRes = await fetch(`${base}/incr/${encodeURIComponent(redisKey)}`, {
      headers: { Authorization: `Bearer ${config.token}` },
    });
    const count = Number(await incrRes.text());

    if (count === 1) {
      await fetch(`${base}/expire/${encodeURIComponent(redisKey)}/${windowSec}`, {
        headers: { Authorization: `Bearer ${config.token}` },
      });
    }

    if (count > limit) {
      const ttlRes = await fetch(`${base}/ttl/${encodeURIComponent(redisKey)}`, {
        headers: { Authorization: `Bearer ${config.token}` },
      });
      const ttl = Number(await ttlRes.text());
      return { ok: false, retryAfterSeconds: ttl > 0 ? ttl : windowSec };
    }

    return { ok: true };
  } catch {
    return memoryRateLimit(key, limit, windowMs);
  }
}

export async function rateLimit(
  key: string,
  limit = 20,
  windowMs = 60_000,
): Promise<RateLimitResult> {
  if (process.env.DISABLE_RATE_LIMIT === "true") return { ok: true };
  return kvRateLimit(key, limit, windowMs);
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}
