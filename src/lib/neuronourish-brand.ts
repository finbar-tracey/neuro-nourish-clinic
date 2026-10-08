/**
 * NeuroNourish Clinic brand system — docs/NeuroNourish_Brand_Guidelines.pdf
 * Colour · Typography · Logo · Tone of Voice
 */

export const NN_BRAND = {
  /** Full-opacity navy for primary headlines — Website Visual Review. */
  deepSlate: "#1B3A5C",
  slateBlue: "#3D6480",
  skyBlue: "#6B98B2",
  mist: "#B8D4E2",
  deepViolet: "#2C1F4A",
  plum: "#5C4A8A",
  lavender: "#A896CC",
  gold: "#C9A84C",
  ivory: "#F5F0E6",
  linen: "#D4C8B8",
  ink: "#2A2830",
} as const;

export const NN_FONTS = {
  display: "var(--font-playfair)",
  sans: "var(--font-inter)",
} as const;

/** Type scale from brand guidelines (page 04). */
export const NN_TYPE = {
  hero: { font: "display", size: "52px+", weight: 400, lineHeight: 1.2 },
  section: { font: "display", size: "32px", weight: 400, lineHeight: 1.2 },
  card: { font: "display", size: "20px", weight: 500, lineHeight: 1.3 },
  pullQuote: { font: "display", size: "24px", weight: 400, lineHeight: 1.4 },
  body: { font: "sans", size: "16px", weight: 400, lineHeight: 1.75 },
  eyebrow: { font: "sans", size: "11px", weight: 500, lineHeight: 1.4 },
  button: { font: "sans", size: "13px", weight: 500 },
  nav: { font: "sans", size: "13px", weight: 400 },
  footer: { font: "sans", size: "12px", weight: 300, lineHeight: 1.6 },
} as const;

/** Colour roles from brand guidelines (page 03). */
export const NN_COLOR_ROLES = {
  navHeroFooter: "deepSlate",
  headingsLight: "slateBlue",
  bodyLight: "ink",
  bodyDark: "skyBlue",
  cta: "gold",
  pageBackground: "ivory",
  cardsDividers: "linen",
  lightBorders: "mist",
  secondaryDarkSection: "deepViolet",
  secondaryUi: "plum",
  badges: "lavender",
} as const;

export const NN_VOICE = {
  traits: ["sophisticated", "authentic", "modern", "calm"] as const,
  never: [
    "fearmongering or scare tactics",
    "aggressive biohacker branding",
    "hospital-style clinical language",
    "overpromising outcomes or implying dementia can be cured",
    "overly alternative or spiritual wellness aesthetics",
    "overly sales-focused language",
    "exclamation marks in headlines",
    "italics anywhere",
  ] as const,
  northStar: "Your brain's future isn't written yet: take control of it now.",
} as const;

export const NN_LOGO = {
  minIconHeightPx: 24,
  minLockupWidthPx: 120,
  clearSpaceRatio: 0.25,
} as const;
