import { neuronourishPublicPaths } from "@/lib/neuronourish-seo";

/** Tailwind-aligned breakpoints used in audits and manual device testing. */
export const NN_MOBILE_BREAKPOINTS = {
  xs: 375,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

/** WCAG 2.5.5 / Apple HIG — minimum comfortable tap target. */
export const NN_TOUCH_TARGET_PX = 48;

/** Primary routes for manual mobile QA (Chrome DevTools + real devices). */
export const NN_MOBILE_URLS = [
  "/",
  "/quiz",
  "/discovery",
  "/assessment",
  "/programme",
  "/contact",
] as const;

export function neuronourishMobilePaths(): string[] {
  return [
    ...NN_MOBILE_URLS,
    ...neuronourishPublicPaths().filter(
      (p) => !NN_MOBILE_URLS.includes(p as (typeof NN_MOBILE_URLS)[number]),
    ),
  ];
}

/** DevTools device presets to spot-check before go-live. */
export const NN_MOBILE_DEVICES = [
  "iPhone SE (375×667)",
  "iPhone 14 Pro (393×852)",
  "Pixel 7 (412×915)",
  "iPad Mini (768×1024)",
] as const;
