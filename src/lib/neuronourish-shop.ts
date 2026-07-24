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
    name: "Remote Cognitive Test (CNS Vital Signs)",
    shortName: "Remote Cognitive Test",
    category: "assessment",
    eyebrow: "Cognitive test",
    headline: "Remote Cognitive Test (CNS Vital Signs)",
    subtext:
      "A clinician-reviewed cognitive baseline with a personalised summary — the clear next step after the brain health quiz.",
    includes: [
      "Validated cognitive assessment (CNS Vital Signs)",
      "Clinician-reviewed personalised summary by email",
      "Clear recommendation for your next step",
      "Fee credited toward a 12-month programme if you enrol within 30 days",
    ],
    amountCents: 8999,
    currency: "eur",
    showPublicPrice: true,
    priceLabel: "€89.99",
    ctaType: "buy",
    ctaLabel: "Buy Cognitive Assessment",
    ctaHint: "Remote CNS Vital Signs · credited toward enrolment within 30 days",
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
    showPublicPrice: true,
    priceLabel: "€150",
    ctaType: "buy",
    ctaLabel: "Book nutrition consultation",
    ctaHint: "Diet + supplementation · Secure Stripe checkout",
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
    showPublicPrice: true,
    priceLabel: "€180",
    ctaType: "buy",
    ctaLabel: "Book dietetic consultation",
    ctaHint: "CORU-registered dietitian · Purely diet focus",
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
    slug: "moca-online",
    name: "MoCA Online Test",
    shortName: "MoCA Online",
    category: "assessment",
    eyebrow: "Cognitive test",
    headline: "MoCA Online Test",
    subtext:
      "Montreal Cognitive Assessment delivered online — a widely used clinical screen for cognitive change.",
    includes: [
      "Structured MoCA online administration",
      "Scored results shared with our clinical team",
      "Guidance on whether a fuller CNS assessment is appropriate",
    ],
    amountCents: 3999,
    currency: "eur",
    showPublicPrice: true,
    priceLabel: "€39.99",
    ctaType: "buy",
    ctaLabel: "Book MoCA Online",
    ctaHint: "Secure Stripe checkout",
    crmTag: "shop_moca_online",
    funnelStage: "assessment_purchased",
    successHeadline: "MoCA Online booked",
    successBody: "Thank you. Testing instructions will follow by email.",
    successNextSteps: ["Check your inbox for MoCA access details"],
  },
  {
    slug: "hdx-cognition",
    name: "HDx Cognition Test (In Person)",
    shortName: "HDx Cognition",
    category: "assessment",
    eyebrow: "Cognitive test · In person",
    headline: "HDx Cognition Test",
    subtext:
      "In-person Head Diagnostics cognition testing for a clinic-grade cognitive baseline.",
    includes: [
      "In-person HDx cognition session",
      "Clinician-reviewed summary",
      "Clear next-step recommendation",
    ],
    amountCents: 11_999,
    currency: "eur",
    showPublicPrice: true,
    priceLabel: "€119.99",
    ctaType: "buy",
    ctaLabel: "Book HDx Cognition Test",
    ctaHint: "In-person appointment · Secure Stripe checkout",
    crmTag: "shop_hdx_cognition",
    funnelStage: "assessment_purchased",
    successHeadline: "HDx Cognition Test booked",
    successBody: "Thank you. Our team will confirm your in-person appointment details.",
    successNextSteps: ["Watch for scheduling confirmation"],
  },
  {
    slug: "p-tau217",
    name: "p-Tau217 Blood Test",
    shortName: "p-Tau217",
    category: "lab",
    eyebrow: "Blood test · In person",
    headline: "p-Tau217 (In Person)",
    subtext:
      "In-person blood draw with phlebotomy included for p-Tau217 — a key Alzheimer’s-related biomarker pathway.",
    includes: [
      "Blood draw service included",
      "p-Tau217 laboratory analysis",
      "Clinical context within your brain-health plan",
    ],
    amountCents: 36_600,
    currency: "eur",
    showPublicPrice: true,
    priceLabel: "€366",
    ctaType: "buy",
    ctaLabel: "Book p-Tau217 Test",
    ctaHint: "In person · Blood draw included",
    crmTag: "shop_p_tau217",
    funnelStage: "eoi_submitted",
    successHeadline: "p-Tau217 test booked",
    successBody: "Thank you. Phlebotomy scheduling details will follow by email.",
    successNextSteps: ["Watch for draw appointment confirmation"],
  },
  {
    slug: "baseline-blood-test",
    name: "Baseline Blood Test",
    shortName: "Baseline Bloods",
    category: "lab",
    eyebrow: "Blood test · In person",
    headline: "Baseline Blood Test",
    subtext:
      "Comprehensive baseline panel with blood draw included — nutritional, metabolic, and inflammatory markers that inform your programme.",
    includes: [
      "Blood draw / phlebotomy included",
      "Baseline panel for brain-health planning",
      "Clinician interpretation in programme context",
    ],
    amountCents: 46_000,
    currency: "eur",
    showPublicPrice: true,
    priceLabel: "€460",
    ctaType: "buy",
    ctaLabel: "Book Baseline Blood Test",
    ctaHint: "In person · Blood draw included",
    crmTag: "shop_baseline_blood",
    funnelStage: "eoi_submitted",
    successHeadline: "Baseline blood test booked",
    successBody: "Thank you. Phlebotomy scheduling details will follow by email.",
    successNextSteps: ["Watch for draw appointment confirmation"],
  },
  {
    slug: "homocysteine",
    name: "Homocysteine Blood Test",
    shortName: "Homocysteine",
    category: "lab",
    eyebrow: "Blood test · In person",
    headline: "Homocysteine (In Person)",
    subtext:
      "In-person homocysteine testing with blood draw included — relevant to vascular and cognitive risk pathways.",
    includes: [
      "Blood draw service included",
      "Homocysteine laboratory analysis",
      "Results reviewed in brain-health context",
    ],
    amountCents: 7100,
    currency: "eur",
    showPublicPrice: true,
    priceLabel: "€71",
    ctaType: "buy",
    ctaLabel: "Book Homocysteine Test",
    ctaHint: "In person · Blood draw included",
    crmTag: "shop_homocysteine",
    funnelStage: "eoi_submitted",
    successHeadline: "Homocysteine test booked",
    successBody: "Thank you. Phlebotomy scheduling details will follow by email.",
    successNextSteps: ["Watch for draw appointment confirmation"],
  },
  {
    slug: "testosterone-shbg",
    name: "Testosterone & SHBG Test",
    shortName: "Testosterone & SHBG",
    category: "lab",
    eyebrow: "Blood test",
    headline: "Testosterone & SHBG Test",
    subtext:
      "Hormonal markers that can influence energy, mood, and cognitive performance — reviewed in programme context.",
    includes: [
      "Testosterone and SHBG analysis",
      "Clinical interpretation for brain health",
      "Clear follow-up recommendations",
    ],
    amountCents: 8500,
    currency: "eur",
    showPublicPrice: true,
    priceLabel: "€85",
    ctaType: "buy",
    ctaLabel: "Book Testosterone & SHBG Test",
    ctaHint: "Secure Stripe checkout",
    crmTag: "shop_testosterone_shbg",
    funnelStage: "eoi_submitted",
    successHeadline: "Hormone panel booked",
    successBody: "Thank you. Testing instructions will follow by email.",
    successNextSteps: ["Watch for scheduling or kit details"],
  },
  {
    slug: "premium-programme",
    name: "NeuroNourish High-Touch",
    shortName: "High-Touch",
    category: "programme",
    eyebrow: "12-month programme",
    headline: "NeuroNourish High-Touch",
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
    ctaLabel: "Enrol in High-Touch",
    ctaHint: "Prefer to talk first? Book a discovery call",
    bookHref: "/discovery",
    crmTag: "tier_premium",
    funnelStage: "programme_enrolled",
    successHeadline: "Welcome to High-Touch",
    successBody: "Your High-Touch programme place is reserved. Our team will begin onboarding shortly.",
    successNextSteps: ["Complete onboarding when invited", "Watch for your care-team welcome email"],
    featured: true,
  },
  {
    slug: "medium-programme",
    legacyKeys: ["programme"],
    name: "NeuroNourish Guided",
    shortName: "Guided",
    category: "programme",
    eyebrow: "12-month programme",
    headline: "NeuroNourish Guided",
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
    ctaLabel: "Enrol in Guided",
    ctaHint: "Prefer to talk first? Book a discovery call",
    bookHref: "/discovery",
    crmTag: "tier_medium",
    funnelStage: "programme_enrolled",
    successHeadline: "Welcome to NeuroNourish Guided",
    successBody: "Your place is reserved. Onboarding begins within one business day.",
    successNextSteps: ["Complete portal onboarding", "Prepare recent health history for intake"],
    featured: true,
  },
  {
    slug: "light-programme",
    name: "Self-Led",
    shortName: "Self-Led",
    category: "programme",
    eyebrow: "12-month programme",
    headline: "Self-Led",
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
    ctaLabel: "Enrol in Self-Led",
    ctaHint: "Prefer to talk first? Book a discovery call",
    bookHref: "/discovery",
    crmTag: "tier_light",
    funnelStage: "programme_enrolled",
    successHeadline: "Welcome to Self-Led",
    successBody: "Your Self-Led programme is confirmed. App access details will follow by email.",
    successNextSteps: ["Activate the companion app when invited", "Set your first habit targets"],
    featured: true,
  },
] as const;

export type ShopSlug = (typeof NN_SHOP_PRODUCTS)[number]["slug"];

export const NN_SHOP = {
  eyebrow: "Tests",
  headline: "Cognitive tests, blood panels, and consultations",
  subtext:
    "One-off clinical tests and consultations with prices listed clearly. Unsure where to start? Take the brain health quiz or book a discovery call.",
  tiersTitle: "12-month programme options",
  productsTitle: "Tests & services",
  discoveryCta: "Book a discovery call",
  discoveryHint: "15 minutes · No obligation",
  quizCta: "Not sure where to start? Take the free quiz",
  quizHint: "3 minutes · Habit baseline for your next conversation",
  placeholderBadge: "Details soon",
  priceHiddenLabel: "Investment discussed on discovery",
  relatedTitle: "Often booked with",
  faqTitle: "Tests FAQ",
  faq: [
    {
      q: "How do tests relate to the 12-month programme?",
      a: "Tests give you a clinical baseline. Programme options (High-Touch, Guided, and Self-Led) are compared on the Programme page — purchasing still happens here.",
    },
    {
      q: "Should I book a discovery call first?",
      a: "If you're unsure which test or programme fits, book a discovery call. Many people start with the remote cognitive test, then decide on a programme.",
    },
    {
      q: "Why don't I see prices on every product?",
      a: "Programme investments and a few specialised items are confirmed on a discovery call or at checkout so we can confirm clinical fit. Most one-off tests show public prices.",
    },
  ],
  programmeCompareCta: "Compare programme options",
  filterAll: "All",
  filterLabels: {
    assessment: "Cognitive tests",
    consultation: "Consultations",
    lab: "Blood tests",
    supplement: "Supplements",
    programme: "Programmes",
  },
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

/** Related products for cross-sell on detail pages (excludes self). */
export function shopRelatedProducts(slug: string, limit = 3): ShopProduct[] {
  const related: Record<string, readonly string[]> = {
    "cognitive-assessment": ["premium-programme", "medium-programme", "blood-work"],
    "nutrition-consultation": ["dietetic-consultation", "blood-work", "cognitive-assessment"],
    "dietetic-consultation": ["medium-programme", "blood-work", "nutrition-consultation"],
    "blood-work": ["cognitive-assessment", "dietetic-consultation", "medium-programme"],
    pt257: ["cognitive-assessment", "medium-programme", "nutrition-consultation"],
    "premium-programme": ["cognitive-assessment", "blood-work", "medium-programme"],
    "medium-programme": ["cognitive-assessment", "blood-work", "dietetic-consultation"],
    "light-programme": ["cognitive-assessment", "how-the-app"],
  };
  const slugs = (related[slug] ?? []).filter((s) => s !== "how-the-app");
  return slugs
    .map((s) => getShopProduct(s))
    .filter((p): p is ShopProduct => Boolean(p))
    .slice(0, limit);
}

export function formatShopPrice(product: ShopProduct): string {
  const hasCents = product.amountCents % 100 !== 0;
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: product.currency.toUpperCase(),
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(product.amountCents / 100);
}

export function shopPublicPriceLabel(product: ShopProduct): string {
  if (product.showPublicPrice) return formatShopPrice(product);
  return product.priceLabel ?? NN_SHOP.priceHiddenLabel;
}
