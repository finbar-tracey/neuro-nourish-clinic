import { isHealthcare } from "@/lib/vertical-config";

const PRODUCTION_NN = "https://neuronourish.clinic";
const PRODUCTION_BC = "https://bookedconsult.com";

function productionSite(): string {
  if (isHealthcare()) return PRODUCTION_BC;
  return PRODUCTION_NN;
}

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
  return productionSite();
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
    return productionSite();
  }

  return "http://localhost:3000";
}

/** Alias used by NeuroNourish nurture modules */
export function siteUrl(): string {
  return getSiteUrl();
}
