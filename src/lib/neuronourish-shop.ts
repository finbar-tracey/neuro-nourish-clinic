/**
 * NeuroNourish shop catalog — single source for /shop URLs and Stripe checkout.
 * Prices are provisional until Emer locks final SKUs; public UI can hide €.
 */

export type ShopCtaType = "buy" | "book";

export type ShopCategory = "assessment" | "consultation" | "lab" | "supplement" | "programme";

export type ShopProduct = {
  slug: string;
  /** Legacy checkout keys still accepted by /api/checkout */
  legacyKeys?: readonly string[];
  name: string;
  shortName: string;
  category: ShopCategory;
  eyebrow: string;
  headline: string;
  subtext: string;
  includes: readonly string[];
  /** Stripe unit amount in cents (EUR) */
  amountCents: number;
  currency: "eur";
  showPublicPrice: boolean;
  priceLabel?: string;
  ctaType: ShopCtaType;
  ctaLabel: string;
  ctaHint: string;
  bookHref?: string;
  crmTag: string;
  /** Funnel stage written on successful payment */
  funnelStage: "assessment_purchased" | "programme_enrolled" | "eoi_submitted";
  successHeadline: string;
  successBody: string;
  successNextSteps: readonly string[];
  placeholderNote?: string;
  featured?: boolean;
};

export const NN_SHOP_PRODUCTS: readonly ShopProduct[] = [
  {
    slug: "cognitive-assessment",
    legacyKeys: ["assessment"],
    name: "Cognitive Health Assessment",
    shortName: "Assessment",
    category: "assessment",
    eyebrow: "Clinical baseline",
    headline: "Cognitive Health Assessment",
    subtext:
      "A clinician-reviewed cognitive baseline with a personalised summary — the clear next step after the brain health quiz.",
    includes: [
      "Validated cognitive assessment (CNS Vital Signs)",
      "Clinician-reviewed personalised summary by email",
      "Clear recommendation for your next step",
      "Fee credited toward a 12-month programme if you enrol within 30 days",
    ],
    amountCents: 9000,
    currency: "eur",
    showPublicPrice: false,
    priceLabel: "Fee confirmed at checkout",
    ctaType: "buy",
    ctaLabel: "Continue to secure checkout",
    ctaHint: "Name, email, phone & date of birth · then Stripe",
    crmTag: "shop_cognitive_assessment",
    funnelStage: "assessment_purchased",
    successHeadline: "Assessment purchase confirmed",
    successBody:
      "If your date of birth was provided at checkout, check your email for CNS testing instructions. Otherwise unlock your test from the button below.",
    successNextSteps: [
      "Check your inbox for assessment instructions (or unlock if prompted)",
      "Complete your CNS Vital Signs test within the stated window",
      "Explore programme tiers when you're ready",
    ],
    featured: true,
  },
  {
    slug: "nutrition-consultation",
    name: "Nutrition Consultation",
    shortName: "Nutrition",
    category: "consultation",
    eyebrow: "Consultation",
    headline: "Nutrition Consultation",
    subtext:
      "One-to-one nutrition guidance focused on cognitive health, energy, and sustainable habits — tailored to your lifestyle.",
    includes: [
      "Personalised nutrition review",
      "Practical food and habit recommendations",
      "Clear follow-up actions",
    ],
    amountCents: 15_000,
    currency: "eur",
    showPublicPrice: false,
    priceLabel: "Investment confirmed at checkout",
    ctaType: "buy",
    ctaLabel: "Book via checkout",
    ctaHint: "Secure Stripe checkout",
    crmTag: "shop_nutrition_consultation",
    funnelStage: "eoi_submitted",
    successHeadline: "Nutrition consultation secured",
    successBody: "Thank you. Our team will confirm your consultation details by email.",
    successNextSteps: [
      "Watch for a confirmation email",
      "Share any goals or constraints ahead of the session",
    ],
  },
  {
    slug: "dietetic-consultation",
    name: "Dietetic Consultation",
    shortName: "Dietetic",
    category: "consultation",
    eyebrow: "CORU-aligned care",
    headline: "Dietetic Consultation",
    subtext:
      "Clinical dietetic consultation with evidence-informed protocols to support brain health and metabolic foundations.",
    includes: [
      "Dietitian-led clinical review",
      "Evidence-informed nutrition protocol",
      "Coordination notes for your wider care team where appropriate",
    ],
    amountCents: 18_000,
    currency: "eur",
    showPublicPrice: false,
    priceLabel: "Investment confirmed at checkout",
    ctaType: "buy",
    ctaLabel: "Book via checkout",
    ctaHint: "Secure Stripe checkout",
    crmTag: "shop_dietetic_consultation",
    funnelStage: "eoi_submitted",
    successHeadline: "Dietetic consultation secured",
    successBody: "Thank you. Our clinical team will confirm timing and preparation steps by email.",
    successNextSteps: [
      "Watch for confirmation and prep guidance",
      "Bring recent blood work if you have it",
    ],
  },
  {
    slug: "blood-work",
    name: "Blood Work Review Package",
    shortName: "Blood work",
    category: "lab",
    eyebrow: "Clinical data",
    headline: "Blood Work Review",
    subtext:
      "Structured review of nutritional, metabolic, hormonal, and inflammatory markers that contribute to brain health.",
    includes: [
      "Guided blood panel pathway",
      "Clinical interpretation in brain-health context",
      "Recommendations informed by your results",
    ],
    amountCents: 25_000,
    currency: "eur",
    showPublicPrice: false,
    priceLabel: "Investment confirmed at checkout",
    ctaType: "buy",
    ctaLabel: "Purchase package",
    ctaHint: "Product imagery finalising · Checkout live in test",
    crmTag: "shop_blood_work",
    funnelStage: "eoi_submitted",
    successHeadline: "Blood work package confirmed",
    successBody: "We'll email instructions for labs and how results feed into your plan.",
    successNextSteps: ["Follow the lab instructions in your email", "Book discovery if you want programme context"],
    placeholderNote: "Final product imagery arriving shortly.",
  },
  {
    slug: "pt257",
    name: "PT257",
    shortName: "PT257",
    category: "supplement",
    eyebrow: "Targeted support",
    headline: "PT257",
    subtext:
      "PT257 product page — custom imagery and final clinical framing in progress. Checkout wiring is ready for launch.",
    includes: [
      "Product fulfilment details confirmed after purchase",
      "Usage guidance from the NeuroNourish care team",
    ],
    amountCents: 9900,
    currency: "eur",
    showPublicPrice: false,
    priceLabel: "Price confirmed at checkout",
    ctaType: "buy",
    ctaLabel: "Purchase PT257",
    ctaHint: "Custom image & copy landing tomorrow",
    crmTag: "shop_pt257",
    funnelStage: "eoi_submitted",
    successHeadline: "PT257 order confirmed",
    successBody: "Thank you. Fulfilment and usage guidance will follow by email.",
    successNextSteps: ["Check your inbox for fulfilment details"],
    placeholderNote: "Custom image, test framing, and final copy pending.",
  },
  {
    slug: "premium-programme",
    name: "Premium 12-Month Programme",
    shortName: "Premium",
    category: "programme",
    eyebrow: "Programme tier",
    headline: "Premium Programme",
    subtext:
      "Full personalised pathway with Emer walkthrough-level clinical attention — for clients who want the deepest level of guidance.",
    includes: [
      "Comprehensive intake, blood review, and cognitive baseline",
      "Personalised nutrition and lifestyle strategy",
      "Emer-led clinical walkthrough touchpoints",
      "Ongoing coaching and app tracking",
    ],
    amountCents: 500_000,
    currency: "eur",
    showPublicPrice: false,
    priceLabel: "Investment discussed on discovery · Checkout available",
    ctaType: "buy",
    ctaLabel: "Enrol in Premium",
    ctaHint: "Prefer to talk first? Book a discovery call",
    bookHref: "/discovery",
    crmTag: "tier_premium",
    funnelStage: "programme_enrolled",
    successHeadline: "Welcome to Premium",
    successBody: "Your Premium programme place is reserved. Our team will begin onboarding shortly.",
    successNextSteps: ["Complete onboarding when invited", "Watch for your care-team welcome email"],
    featured: true,
  },
  {
    slug: "medium-programme",
    legacyKeys: ["programme"],
    name: "Medium 12-Month Programme",
    shortName: "Medium",
    category: "programme",
    eyebrow: "Programme tier",
    headline: "Medium Programme",
    subtext:
      "Dietitian-led 12-month personalised brain health programme — nutrition, biomarkers, coaching, and app support.",
    includes: [
      "Full intake and lifestyle timeline",
      "Blood work review and cognitive assessment where appropriate",
      "CORU dietitian-supervised nutrition programme",
      "Coaching, lifestyle strategy, and app tracking",
    ],
    amountCents: 355_000,
    currency: "eur",
    showPublicPrice: false,
    priceLabel: "Investment discussed on discovery · Checkout available",
    ctaType: "buy",
    ctaLabel: "Enrol in Medium",
    ctaHint: "Prefer to talk first? Book a discovery call",
    bookHref: "/discovery",
    crmTag: "tier_medium",
    funnelStage: "programme_enrolled",
    successHeadline: "Welcome to the Medium programme",
    successBody: "Your place is reserved. Onboarding begins within one business day.",
    successNextSteps: ["Complete portal onboarding", "Prepare recent health history for intake"],
    featured: true,
  },
  {
    slug: "light-programme",
    name: "Light Programme",
    shortName: "Light",
    category: "programme",
    eyebrow: "Programme tier",
    headline: "Light Programme",
    subtext:
      "App-led monitoring and lighter structured support — for adults who want accountability without the full clinical intensity.",
    includes: [
      "Guided onboarding into the NeuroNourish app",
      "Habit tracking for meals, sleep, movement, and mood",
      "Lighter-touch check-ins and guidance",
    ],
    amountCents: 99_000,
    currency: "eur",
    showPublicPrice: false,
    priceLabel: "Investment discussed on discovery · Checkout available",
    ctaType: "buy",
    ctaLabel: "Enrol in Light",
    ctaHint: "Prefer to talk first? Book a discovery call",
    bookHref: "/discovery",
    crmTag: "tier_light",
    funnelStage: "programme_enrolled",
    successHeadline: "Welcome to Light",
    successBody: "Your Light programme is confirmed. App access details will follow by email.",
    successNextSteps: ["Activate the companion app when invited", "Set your first habit targets"],
    featured: true,
  },
] as const;

export type ShopSlug = (typeof NN_SHOP_PRODUCTS)[number]["slug"];

export const NN_SHOP = {
  eyebrow: "Shop",
  headline: "Programmes, assessments, and consultations",
  subtext:
    "Choose a clear next step — from a cognitive baseline to consultations, lab review, or a 12-month tier. Unsure? Start with a discovery call.",
  tiersTitle: "12-month programme tiers",
  productsTitle: "Assessments & services",
  discoveryCta: "Book a discovery call",
  discoveryHint: "15 minutes · No obligation",
  placeholderBadge: "Imagery soon",
} as const;

export function getShopProduct(slugOrLegacy: string): ShopProduct | undefined {
  const key = slugOrLegacy.trim().toLowerCase();
  return NN_SHOP_PRODUCTS.find(
    (p) => p.slug === key || p.legacyKeys?.some((k) => k === key),
  );
}

export function shopProductsByCategory(category: ShopCategory): ShopProduct[] {
  return NN_SHOP_PRODUCTS.filter((p) => p.category === category);
}

export function shopTierProducts(): ShopProduct[] {
  return NN_SHOP_PRODUCTS.filter((p) => p.category === "programme");
}

export function shopServiceProducts(): ShopProduct[] {
  return NN_SHOP_PRODUCTS.filter((p) => p.category !== "programme");
}

export function formatShopPrice(product: ShopProduct): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: product.currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(product.amountCents / 100);
}
