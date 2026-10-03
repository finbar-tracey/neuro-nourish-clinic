const PRODUCTION_NN = "https://neuronourish.clinic";

function normalizeSiteOrigin(raw: string): string | null {
  const cleaned = raw.trim().replace(/\/$/, "");
  if (!cleaned) return null;

  const withScheme = /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;

  try {
    const url = new URL(withScheme);
    if (!url.hostname) return null;
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

/** Public LP origin for borrower SMS/email deep links (always production). */
export function borrowerLinkOrigin(): string {
  return PRODUCTION_NN;
}

/** Canonical origin for emails, SMS links, metadata, and sitemap. */
export function getSiteUrl(): string {
  const candidates = [process.env.NEXT_PUBLIC_SITE_URL, process.env.VERCEL_URL];

  for (const raw of candidates) {
    if (!raw?.trim()) continue;
    const origin = normalizeSiteOrigin(raw);
    if (origin) return origin;
  }

  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    return PRODUCTION_NN;
  }

  return "http://localhost:3000";
}

/** Alias used by NeuroNourish nurture modules */
export function siteUrl(): string {
  return getSiteUrl();
}
