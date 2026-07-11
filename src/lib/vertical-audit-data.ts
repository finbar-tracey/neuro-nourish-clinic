/**
 * Vertical scoring for pay-per-lead / pay-per-booking productisation.
 * Run: npm run vertical:audit
 *
 * Scores are 1–10 (higher = better for BLB-style stack replication).
 * Evidence notes reference live BLB data where available (Jun 2026).
 */

export type VerticalId =
  | "property_finance"
  | "rd_tax_accountancy"
  | "commercial_conveyancing"
  | "fire_doors_passive_fire"
  | "commercial_roofing"
  | "residential_roofing"
  | "building_safety_remediation"
  | "btl_expat_mortgage"
  | "home_improvements"
  | "med_spa_cosmetic"
  | "dental_implants"
  | "ifa_wealth"
  | "pi_immigration_law"
  | "exec_recruitment"
  | "residential_mortgage"
  | "solar_heat_pump";

export type ChannelId = "meta_website_lp" | "meta_instant_form" | "google_search";

export type VerticalScores = {
  lpFunnelFit: number;
  metaEase: number;
  googleEase: number;
  complianceEase: number;
  cplPotential: number;
  revenuePerBooking: number;
  cloneSpeed: number;
  ukVolume: number;
};

export type VerticalDefinition = {
  id: VerticalId;
  name: string;
  shortPitch: string;
  scores: VerticalScores;
  /** GBP — typical charge to client per confirmed booked qualified call */
  chargePerBooking: { low: number; high: number };
  /** GBP — target qualified CPL you need to hit for ~3:1 gross margin */
  targetCpl: { low: number; high: number };
  /** GBP — typical client commission / fee per closed deal */
  clientUpside: { low: number; high: number };
  primaryChannels: ChannelId[];
  avoidChannels: ChannelId[];
  complianceOwner: string;
  cloneFromBlb: string[];
  killCriteria: string[];
  evidence: string[];
  risks: string[];
};

/** Weights — compliance and revenue weighted because they gate scale and pricing power. */
export const VERTICAL_WEIGHTS: Record<keyof VerticalScores, number> = {
  lpFunnelFit: 0.12,
  metaEase: 0.12,
  googleEase: 0.12,
  complianceEase: 0.18,
  cplPotential: 0.14,
  revenuePerBooking: 0.18,
  cloneSpeed: 0.06,
  ukVolume: 0.08,
};

export function compositeScore(scores: VerticalScores): number {
  let total = 0;
  for (const [key, weight] of Object.entries(VERTICAL_WEIGHTS) as Array<
    [keyof VerticalScores, number]
  >) {
    total += scores[key] * weight;
  }
  return Math.round(total * 10) / 10;
}

export function easeScore(scores: VerticalScores): number {
  const easeKeys: Array<keyof VerticalScores> = [
    "lpFunnelFit",
    "metaEase",
    "googleEase",
    "complianceEase",
    "cloneSpeed",
  ];
  const easeWeight = easeKeys.reduce((sum, k) => sum + VERTICAL_WEIGHTS[k], 0);
  let total = 0;
  for (const key of easeKeys) {
    total += scores[key] * (VERTICAL_WEIGHTS[key] / easeWeight);
  }
  return Math.round(total * 10) / 10;
}

export function moneyScore(scores: VerticalScores): number {
  const moneyKeys: Array<keyof VerticalScores> = [
    "revenuePerBooking",
    "cplPotential",
    "ukVolume",
  ];
  const moneyWeight = moneyKeys.reduce((sum, k) => sum + VERTICAL_WEIGHTS[k], 0);
  let total = 0;
  for (const key of moneyKeys) {
    total += scores[key] * (VERTICAL_WEIGHTS[key] / moneyWeight);
  }
  return Math.round(total * 10) / 10;
}

export const VERTICALS: VerticalDefinition[] = [
  {
    id: "rd_tax_accountancy",
    name: "R&D tax credits & specialist accountancy",
    shortPitch: "Qualified discovery calls from Search + Meta — eligibility-first funnel",
    scores: {
      lpFunnelFit: 9,
      metaEase: 8,
      googleEase: 9,
      complianceEase: 7,
      cplPotential: 8,
      revenuePerBooking: 8,
      cloneSpeed: 8,
      ukVolume: 8,
    },
    chargePerBooking: { low: 150, high: 400 },
    targetCpl: { low: 25, high: 80 },
    clientUpside: { low: 5_000, high: 30_000 },
    primaryChannels: ["google_search", "meta_website_lp"],
    avoidChannels: [],
    complianceOwner: "HMRC / ASA — no guaranteed refund claims",
    cloneFromBlb: [
      "Form capture → qualify → thank-you booking",
      "SMS capture + no-booking follow-up",
      "Workspace queues + pay-per-booking event = priorityCallBookedAt",
    ],
    killCriteria: [
      "Qualified CPL > £100 for 14 days",
      "Booking rate < 15% of qualified completes",
      "Client close rate < 8% from booked calls",
    ],
    evidence: [
      "B2B eligibility forms map cleanly to BLB step 1–3",
      "Outside Meta UK financial special category when framed as business services",
    ],
    risks: ["Seasonal demand (Jan–Mar spike)", "Client must deliver on claim quality"],
  },
  {
    id: "property_finance",
    name: "Specialist property finance (bridging / dev / commercial)",
    shortPitch: "Same stack that produced ~£1.50–£3 website leads on LONDON_BLB",
    scores: {
      lpFunnelFit: 10,
      metaEase: 4,
      googleEase: 7,
      complianceEase: 5,
      cplPotential: 9,
      revenuePerBooking: 10,
      cloneSpeed: 10,
      ukVolume: 7,
    },
    chargePerBooking: { low: 200, high: 600 },
    targetCpl: { low: 15, high: 60 },
    clientUpside: { low: 2_000, high: 20_000 },
    primaryChannels: ["google_search", "meta_instant_form"],
    avoidChannels: ["meta_website_lp"],
    complianceOwner: "FCA-adjacent / ASA — introducer not lender; Meta financial category",
    cloneFromBlb: [
      "meta-lp-copy.ts + meta-lp:audit (when website LP allowed)",
      "Investment-only qualification flags",
      "phone:post-impl E.164 validation",
      "Win-back + broker notify pipeline",
    ],
    killCriteria: [
      "Meta website LP blocked > 30 days — stay on instant form + Google",
      "Qualified CPL > £80 sustained",
      "SMS failure rate > 5% on valid UK mobiles",
    ],
    evidence: [
      "BLB live: London - BLB - LP ~£3.03 spend, 1 Lead, 299 impressions (Jun 2026)",
      "BLB live: instant form campaigns ~£26 CPL at scale (298 leads historical)",
      "Ali Arsanjani: LONDON_BLB, SMS sent, qualified — booking intent logged",
      "Meta website LP blocked pending FCA / investment verification",
    ],
    risks: [
      "Meta ad policy is primary bottleneck",
      "Pay-per-show needs consultationCompletedAt discipline",
    ],
  },
  {
    id: "commercial_conveyancing",
    name: "Commercial / BTL conveyancing & property law",
    shortPitch: "Investor legal quotes → booked case review calls",
    scores: {
      lpFunnelFit: 8,
      metaEase: 7,
      googleEase: 8,
      complianceEase: 6,
      cplPotential: 7,
      revenuePerBooking: 9,
      cloneSpeed: 7,
      ukVolume: 7,
    },
    chargePerBooking: { low: 200, high: 500 },
    targetCpl: { low: 30, high: 100 },
    clientUpside: { low: 3_000, high: 15_000 },
    primaryChannels: ["google_search", "meta_website_lp"],
    avoidChannels: [],
    complianceOwner: "SRA — no outcome guarantees; clear fee transparency",
    cloneFromBlb: [
      "Property transaction type + timeline form fields",
      "Attribution panel (UTM / referrer)",
      "Case stages through consultation booked",
    ],
    killCriteria: [
      "Qualified CPL > £120",
      "Show rate < 50% on booked calls",
      "Duplicate / low-intent quote requests > 30%",
    ],
    evidence: [
      "Same investor audience as bridging — natural referral graph",
      "Legal services typically easier Meta path than lending",
    ],
    risks: ["Long sales cycle", "Quote shoppers — need stronger qualification"],
  },
  {
    id: "fire_doors_passive_fire",
    name: "Fire doors, passive fire & compartmentation (B2B)",
    shortPitch: "Building Safety Act demand — book compliance surveys & remedial quotes",
    scores: {
      lpFunnelFit: 8,
      metaEase: 8,
      googleEase: 9,
      complianceEase: 7,
      cplPotential: 7,
      revenuePerBooking: 9,
      cloneSpeed: 7,
      ukVolume: 8,
    },
    chargePerBooking: { low: 250, high: 700 },
    targetCpl: { low: 40, high: 120 },
    clientUpside: { low: 15_000, high: 500_000 },
    primaryChannels: ["google_search", "meta_website_lp"],
    avoidChannels: [],
    complianceOwner: "Building Safety Act / FIRAS-BM Trada — no guaranteed certification in ads",
    cloneFromBlb: [
      "Qualify: building type (block/HMO/commercial), door count, FRA deadline",
      "Book site survey call — same thank-you Reserve flow",
      "Timeline urgency field maps to BLB timeframe",
    ],
    killCriteria: [
      "Qualified CPL > £150",
      "Leads skew residential single-home (low ticket) > 40%",
      "Survey booking rate < 12%",
    ],
    evidence: [
      "Post-Grenfell UK regulatory tailwind — blocks, landlords, FM companies must act",
      "High contract values on multi-door remedial packages",
      "Outside Meta financial special category",
    ],
    risks: [
      "Need FM/contractor ICP — wrong leads are small landlords with 1 door",
      "Sales cycle includes site survey before quote",
    ],
  },
  {
    id: "commercial_roofing",
    name: "Commercial / industrial roofing & flat roof refurb",
    shortPitch: "High-ticket B2B roof surveys — leaks, refurb, warranty-led",
    scores: {
      lpFunnelFit: 7,
      metaEase: 7,
      googleEase: 8,
      complianceEase: 8,
      cplPotential: 6,
      revenuePerBooking: 9,
      cloneSpeed: 7,
      ukVolume: 7,
    },
    chargePerBooking: { low: 200, high: 600 },
    targetCpl: { low: 50, high: 150 },
    clientUpside: { low: 30_000, high: 500_000 },
    primaryChannels: ["google_search", "meta_website_lp"],
    avoidChannels: ["meta_instant_form"],
    complianceOwner: "ASA / NVQ contractor claims — no guaranteed leak-free promises",
    cloneFromBlb: [
      "Property type + roof type + urgency (active leak Y/N)",
      "Book survey call not instant quote",
    ],
    killCriteria: [
      "CPL > £180 without commercial building mix",
      "Residential re-roof leads > 50% of volume",
      "Client can't attend survey within 5 days",
    ],
    evidence: [
      "Commercial contracts dwarf residential re-roof (£30k–£500k+)",
      "Search intent: flat roof repair commercial, industrial roofing contractor",
    ],
    risks: [
      "Residential roofing PPL is commoditised — must filter to commercial",
      "Weather/seasonality",
    ],
  },
  {
    id: "residential_roofing",
    name: "Residential re-roof / storm damage",
    shortPitch: "High Meta volume — lower ticket vs commercial",
    scores: {
      lpFunnelFit: 7,
      metaEase: 8,
      googleEase: 7,
      complianceEase: 8,
      cplPotential: 6,
      revenuePerBooking: 5,
      cloneSpeed: 7,
      ukVolume: 9,
    },
    chargePerBooking: { low: 50, high: 150 },
    targetCpl: { low: 25, high: 80 },
    clientUpside: { low: 5_000, high: 18_000 },
    primaryChannels: ["meta_instant_form", "meta_website_lp", "google_search"],
    avoidChannels: [],
    complianceOwner: "ASA — before/after, deposit terms",
    cloneFromBlb: ["Basic LP + postcode — weak pay-per-booking ceiling"],
    killCriteria: ["Client fee ceiling < £80/booking", "CPL > £70 at scale"],
    evidence: ["Storm seasons spike Meta demand locally"],
    risks: [
      "Not golden gun — Compare to commercial roofing / fire compliance",
      "Race to bottom with Checkatrade / Bark competitors",
    ],
  },
  {
    id: "building_safety_remediation",
    name: "Building safety / cladding & major remedial (FM & developers)",
    shortPitch: "Ultra-high ticket — long cycle, strict qualification",
    scores: {
      lpFunnelFit: 7,
      metaEase: 6,
      googleEase: 8,
      complianceEase: 5,
      cplPotential: 5,
      revenuePerBooking: 10,
      cloneSpeed: 5,
      ukVolume: 6,
    },
    chargePerBooking: { low: 400, high: 1_500 },
    targetCpl: { low: 80, high: 250 },
    clientUpside: { low: 100_000, high: 5_000_000 },
    primaryChannels: ["google_search"],
    avoidChannels: ["meta_instant_form"],
    complianceOwner: "Building Safety Act — sensitive post-Grenfell messaging",
    cloneFromBlb: ["Heavy qualification: block height, role (RMMC/FM/developer), budget band"],
    killCriteria: [
      "Lead quality disputes",
      "Sales cycle > 12 months without pipeline",
      "Any non-compliant remediation claims in ads",
    ],
    evidence: ["Highest theoretical contract size in construction adjacency"],
    risks: [
      "Enterprise sales — LP is top of funnel only",
      "Messaging sensitivity",
      "Low lead volume",
    ],
  },
  {
    id: "btl_expat_mortgage",
    name: "Complex BTL / expat / Ltd company mortgage",
    scores: {
      lpFunnelFit: 9,
      metaEase: 5,
      googleEase: 8,
      complianceEase: 4,
      cplPotential: 7,
      revenuePerBooking: 8,
      cloneSpeed: 8,
      ukVolume: 9,
    },
    shortPitch: "Complex mortgage enquiries — Search-led, FCA-aware copy",
    chargePerBooking: { low: 100, high: 400 },
    targetCpl: { low: 40, high: 120 },
    clientUpside: { low: 1_000, high: 5_000 },
    primaryChannels: ["google_search", "meta_instant_form"],
    avoidChannels: ["meta_website_lp"],
    complianceOwner: "FCA regulated advice — stricter than bridging introducer",
    cloneFromBlb: ["Qualification tiers", "Long nurture path for researching timeframe"],
    killCriteria: ["CPL > £150", "FCA complaint or ad rejection spike"],
    evidence: ["High Search volume in UK"],
    risks: ["Regulation heavier than bridging introducer model"],
  },
  {
    id: "home_improvements",
    name: "High-ticket home improvements (extension / loft / renovation)",
    shortPitch: "Consultation-led home projects — Meta-friendly local ads",
    scores: {
      lpFunnelFit: 7,
      metaEase: 8,
      googleEase: 7,
      complianceEase: 8,
      cplPotential: 6,
      revenuePerBooking: 5,
      cloneSpeed: 7,
      ukVolume: 9,
    },
    chargePerBooking: { low: 40, high: 120 },
    targetCpl: { low: 25, high: 80 },
    clientUpside: { low: 500, high: 3_000 },
    primaryChannels: ["meta_website_lp", "meta_instant_form"],
    avoidChannels: [],
    complianceOwner: "ASA — before/after claims, deposit terms",
    cloneFromBlb: ["Geo qualification (postcode)", "Photo upload optional on step 3"],
    killCriteria: ["CPL > £60", "Client margin can't support £80+ per booking"],
    evidence: ["Large Meta local audience"],
    risks: ["Low £/booking caps your fee", "Tyre-kicker volume"],
  },
  {
    id: "med_spa_cosmetic",
    name: "Med spa / aesthetic clinics",
    shortPitch: "Consultation bookings for high-ticket treatments",
    scores: {
      lpFunnelFit: 8,
      metaEase: 7,
      googleEase: 7,
      complianceEase: 6,
      cplPotential: 6,
      revenuePerBooking: 7,
      cloneSpeed: 6,
      ukVolume: 9,
    },
    chargePerBooking: { low: 80, high: 250 },
    targetCpl: { low: 20, high: 70 },
    clientUpside: { low: 1_000, high: 8_000 },
    primaryChannels: ["meta_website_lp", "meta_instant_form"],
    avoidChannels: [],
    complianceOwner: "ASA / MHRA for claims; before-after rules",
    cloneFromBlb: ["Slot booking on thank-you", "SMS reminders"],
    killCriteria: ["Show rate < 40%", "CPL rising without booking lift"],
    evidence: ["Visual creative performs on Meta"],
    risks: ["Saturated PPL market", "Clinical claim restrictions"],
  },
  {
    id: "dental_implants",
    name: "Dental implants / cosmetic dentistry",
    shortPitch: "High-value dental consultation funnel",
    scores: {
      lpFunnelFit: 8,
      metaEase: 7,
      googleEase: 8,
      complianceEase: 6,
      cplPotential: 6,
      revenuePerBooking: 8,
      cloneSpeed: 6,
      ukVolume: 8,
    },
    chargePerBooking: { low: 100, high: 300 },
    targetCpl: { low: 30, high: 90 },
    clientUpside: { low: 2_000, high: 12_000 },
    primaryChannels: ["google_search", "meta_website_lp"],
    avoidChannels: [],
    complianceOwner: "GDC / ASA — treatment claims",
    cloneFromBlb: ["Booking + SMS confirm"],
    killCriteria: ["CPL > £100 without premium client fee"],
    evidence: ["Strong Search intent locally"],
    risks: ["Local radius targeting complexity"],
  },
  {
    id: "ifa_wealth",
    name: "IFA / wealth management (regulated)",
    shortPitch: "High upside — heavy compliance cost",
    scores: {
      lpFunnelFit: 8,
      metaEase: 3,
      googleEase: 6,
      complianceEase: 3,
      cplPotential: 5,
      revenuePerBooking: 10,
      cloneSpeed: 5,
      ukVolume: 7,
    },
    chargePerBooking: { low: 300, high: 1_000 },
    targetCpl: { low: 80, high: 200 },
    clientUpside: { low: 5_000, high: 50_000 },
    primaryChannels: ["google_search"],
    avoidChannels: ["meta_website_lp", "meta_instant_form"],
    complianceOwner: "FCA — financial promotion rules",
    cloneFromBlb: ["Qualification only — not production-ready without FCA sign-off"],
    killCriteria: ["Any non-compliant ad copy live", "CPL > £250"],
    evidence: ["Highest fee potential"],
    risks: ["Same Meta FCA wall as bridging but stricter"],
  },
  {
    id: "pi_immigration_law",
    name: "PI / immigration law (lead gen sensitive)",
    shortPitch: "High case values — reputation and regulation risk",
    scores: {
      lpFunnelFit: 7,
      metaEase: 5,
      googleEase: 7,
      complianceEase: 4,
      cplPotential: 6,
      revenuePerBooking: 9,
      cloneSpeed: 6,
      ukVolume: 8,
    },
    chargePerBooking: { low: 150, high: 600 },
    targetCpl: { low: 40, high: 120 },
    clientUpside: { low: 3_000, high: 30_000 },
    primaryChannels: ["google_search"],
    avoidChannels: ["meta_instant_form"],
    complianceOwner: "SRA / MOJ referral rules for PI",
    cloneFromBlb: ["Timeline + case type qualification"],
    killCriteria: ["Lead quality disputes > 20%", "Regulatory complaint"],
    evidence: ["Search intent strong for immigration"],
    risks: ["Lead gen stigma in legal", "Quality disputes kill margins"],
  },
  {
    id: "exec_recruitment",
    name: "Executive / niche recruitment",
    shortPitch: "High fee per placement — weak Meta LP fit",
    scores: {
      lpFunnelFit: 6,
      metaEase: 8,
      googleEase: 7,
      complianceEase: 9,
      cplPotential: 7,
      revenuePerBooking: 9,
      cloneSpeed: 5,
      ukVolume: 6,
    },
    chargePerBooking: { low: 200, high: 800 },
    targetCpl: { low: 30, high: 100 },
    clientUpside: { low: 5_000, high: 40_000 },
    primaryChannels: ["google_search", "meta_website_lp"],
    avoidChannels: [],
    complianceOwner: "Employment agency regs — light for B2B",
    cloneFromBlb: ["Partial — LinkedIn often beats LP for exec"],
    killCriteria: ["Client can't close placed candidates", "CPL ok but wrong seniority"],
    evidence: ["Easy ads"],
    risks: ["Channel mismatch — recruiters live on LinkedIn"],
  },
  {
    id: "residential_mortgage",
    name: "Mass residential mortgage",
    shortPitch: "Huge volume — FCA + low differentiation",
    scores: {
      lpFunnelFit: 7,
      metaEase: 4,
      googleEase: 8,
      complianceEase: 3,
      cplPotential: 6,
      revenuePerBooking: 6,
      cloneSpeed: 7,
      ukVolume: 10,
    },
    chargePerBooking: { low: 60, high: 200 },
    targetCpl: { low: 30, high: 100 },
    clientUpside: { low: 400, high: 2_000 },
    primaryChannels: ["google_search", "meta_instant_form"],
    avoidChannels: ["meta_website_lp"],
    complianceOwner: "FCA full regulated promotion",
    cloneFromBlb: ["Form works but economics worse than specialist finance"],
    killCriteria: ["CPL > £80 at scale", "Commodity broker clients churn"],
    evidence: ["Volume leader"],
    risks: ["Race to bottom on PPL fees"],
  },
  {
    id: "solar_heat_pump",
    name: "Solar / heat pump (home energy)",
    shortPitch: "Volume play — lower fee ceiling",
    scores: {
      lpFunnelFit: 6,
      metaEase: 7,
      googleEase: 6,
      complianceEase: 7,
      cplPotential: 5,
      revenuePerBooking: 4,
      cloneSpeed: 6,
      ukVolume: 8,
    },
    chargePerBooking: { low: 40, high: 100 },
    targetCpl: { low: 25, high: 70 },
    clientUpside: { low: 500, high: 2_500 },
    primaryChannels: ["meta_instant_form", "meta_website_lp"],
    avoidChannels: [],
    complianceOwner: "ASA — savings claims, MIS mis-selling history",
    cloneFromBlb: ["Basic LP only — weak pay-per-booking economics"],
    killCriteria: ["Client CAC > margin", "Grant/regulatory story changes"],
    evidence: ["Meta volume"],
    risks: ["Low £/booking — not golden gun material"],
  },
];

export const GOLDEN_GUN_IDS: VerticalId[] = [
  "rd_tax_accountancy",
  "fire_doors_passive_fire",
  "property_finance",
];

export const CHANNEL_LABELS: Record<ChannelId, string> = {
  meta_website_lp: "Meta → website LP (/lp)",
  meta_instant_form: "Meta instant form",
  google_search: "Google Search",
};

export function rankedVerticals(): Array<
  VerticalDefinition & { composite: number; ease: number; money: number }
> {
  return [...VERTICALS]
    .map((v) => ({
      ...v,
      composite: compositeScore(v.scores),
      ease: easeScore(v.scores),
      money: moneyScore(v.scores),
    }))
    .sort((a, b) => b.composite - a.composite);
}
