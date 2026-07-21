import { neuronourishPublicPaths } from "@/lib/neuronourish-seo";

/** Core Web Vitals thresholds (PageSpeed Insights / Google Search). */
export const NN_CWV_THRESHOLDS = {
  lcpMs: 2500,
  inpMs: 200,
  cls: 0.1,
  fcpMs: 1800,
  tbtMs: 200,
  /** Lighthouse performance score (0–100). */
  performanceScore: 90,
} as const;

/** Primary URLs to test in PageSpeed Insights after deploy. */
export const NN_PAGESPEED_URLS = [
  "/",
  "/quiz",
  "/shop",
  "/shop/cognitive-assessment",
  "/discovery",
  "/programme",
  "/team",
] as const;

export function neuronourishPagespeedPaths(): string[] {
  return [...NN_PAGESPEED_URLS, ...neuronourishPublicPaths().filter((p) => !NN_PAGESPEED_URLS.includes(p as (typeof NN_PAGESPEED_URLS)[number]))];
}

/** Third-party origins loaded only on specific routes (not globally). */
export const NN_THIRD_PARTY = {
  metaPixel: "https://connect.facebook.net",
  calendlyScript: "https://assets.calendly.com",
  calendlyWidget: "https://calendly.com",
  stripe: "https://js.stripe.com",
} as const;
