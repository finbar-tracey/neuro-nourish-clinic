/** Dynamic lookup — Next.js must not inline these at prebuilt deploy time. */
export function runtimeEnv(name: string): string | undefined {
  const value = process.env[name];
  if (value == null || value === "") return undefined;
  return value.trim();
}

/** Prefer `NAME_B64` on Vercel when raw secrets contain `$` (CLI/shell truncation). */
export function runtimeSecret(name: string): string | undefined {
  const encoded = runtimeEnv(`${name}_B64`);
  if (encoded) {
    try {
      const decoded = Buffer.from(encoded, "base64").toString("utf8");
      if (decoded) return decoded;
    } catch {
      /* fall through */
    }
  }
  return runtimeEnv(name);
}

/** Vonage API secret — prefer base64 on Vercel (CLI truncates `$` in raw secrets). */
export function vonageApiSecret(): string | undefined {
  return runtimeSecret("VONAGE_API_SECRET");
}
