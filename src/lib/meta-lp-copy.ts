import type { AdAngle } from "@/lib/ad-angles";

/** Banned on paid LP — used by meta-lp-compliance-audit.ts */
export const META_LP_BANNED_PATTERNS: { label: string; pattern: RegExp }[] = [
  { label: "bridging loan phrase", pattern: /\bbridging\s+loan\b/i },
  { label: "need bridging", pattern: /\bneed\s+bridging\b/i },
  { label: "48-hour funding", pattern: /\b48[\s-]?hr/i },
  { label: "48 hours funding", pattern: /\b48\s*hours?\b/i },
  { label: "72-hour", pattern: /\b72[\s-]?hr/i },
  { label: "public rate", pattern: /\b0\.\d+%/i },
  { label: "rates from", pattern: /\brates\s+from\b/i },
  { label: "funded in", pattern: /\bfunded\s+in\b/i },
  { label: "loans from £", pattern: /\bloans\s+from\s+£/i },
];

/** Legal/footer allowlist substrings — matches inside these are OK */
export const META_LP_BANNED_ALLOWLIST = [
  "loans secured on an individual's primary residence",
  "primary residence",
  "Bridging loans are not regulated",
];

export const META_LP_METADATA = {
  title: "Specialist Bridging Loans Broker — London | Bridging Loans Broker",
  description:
    "Free enquiry for business and investment property finance. Independent specialist broker introducing enquiries to 200+ lenders. Introducer only — not a lender. Subject to status.",
} as const;

export const META_LP_TOP_BANNER =
  "Specialist bridging loans broker — free enquiry for London investors →";

export const META_LP_FOOTER_INTRO =
  "Bridging Loans Broker is a specialist bridging loans broker and introducer, not a lender. We introduce unregulated bridging finance for business and investment purposes only. We do not offer consumer credit or finance secured on an individual's primary residence. Bridging finance for these purposes is not regulated by the FCA. Subject to status and lender criteria.";

type HeroCopy = {
  headline: string;
  highlight: string;
  bullets: string[];
  solutionBridge: string;
  responseBadge: string;
};

type AngleMarketing = HeroCopy & {
  metaTitle: string;
  metaDescription: string;
  painHeadline: string;
  painIntro: string;
  painBullets: string[];
  finalCtaHeadline: string;
  finalCtaSubline: string;
};

const DEFAULT_HERO: HeroCopy = {
  headline: "Specialist Bridging Loans Broker",
  highlight: "Free Enquiry — London Investors.",
  bullets: [
    "Auction purchases & business/investment finance",
    "Refurbishment & development finance",
    "Complex deals high-street banks decline",
    "No obligation — free specialist consultation",
  ],
  solutionBridge:
    "Daniel manages and introduces your case to the right lender from 200+ lenders — independent broker, not limited to a few lenders. Indicative terms within 2 hours. Funds in as little as 72 hours, subject to status.",
  responseBadge: "Typical response within 2 hours",
};

const ANGLE_MARKETING: Record<AdAngle, AngleMarketing> = {
  default: {
    ...DEFAULT_HERO,
    metaTitle: META_LP_METADATA.title,
    metaDescription: META_LP_METADATA.description,
    painHeadline: "Property Investors Face Tight Deadlines",
    painIntro:
      "Short-term property finance often needs a specialist broker — high-street banks move slowly and decline complex investment deals.",
    painBullets: [
      "Your purchase deadline is closer than standard mortgage timelines allow",
      "The property needs work before long-term finance is realistic",
      "You need a broker with access to 200+ lenders — not one bank's product",
    ],
    finalCtaHeadline: "Start Your Free Enquiry Today",
    finalCtaSubline:
      "Daniel will review your scenario and outline indicative options within 2 hours — no obligation.",
  },
  auction: {
    headline: "Auction Purchase Coming Up?",
    highlight: "Speak to a Specialist Broker.",
    bullets: [
      "Broker-led enquiry before you bid",
      "Specialist auction lenders on our panel",
      "200+ lenders searched for your deal",
      "Free enquiry — no obligation",
    ],
    solutionBridge:
      "Get a broker-led auction finance enquiry — Daniel searches 200+ lenders so you can bid with clearer funding options, subject to status.",
    responseBadge: "Typical response within 2 hours",
    metaTitle: "Auction Finance Broker — London | Bridging Loans Broker",
    metaDescription:
      "Free auction property finance enquiry for investors. Independent broker introducing enquiries to 200+ specialist lenders. Introducer only — not a lender. Subject to status.",
    painHeadline: "Auction Deadlines Need Specialist Support",
    painIntro:
      "You need clarity on funding options before you bid — but most high-street providers cannot support urgent auction timelines.",
    painBullets: [
      "Exchange is binding — funding structure matters before you commit",
      "High-street banks need weeks of paperwork, not auction timescales",
      "A broker can search specialist lenders matched to your lot",
    ],
    finalCtaHeadline: "Free Auction Finance Enquiry",
    finalCtaSubline:
      "Daniel reviews auction scenarios within 2 hours — introducer only, subject to status.",
  },
  development: {
    headline: "Development Finance Enquiry?",
    highlight: "Broker-Led Specialist Search.",
    bullets: [
      "Staged drawdowns for refurb & new build",
      "Light & heavy works considered",
      "Exit strategy tailored to your project",
      "Free specialist consultation",
    ],
    solutionBridge:
      "Staged drawdown enquiries matched to your build schedule — Daniel introduces your project to specialist lenders, subject to status.",
    responseBadge: "Typical response within 2 hours",
    metaTitle: "Development Finance Broker — London | Bridging Loans Broker",
    metaDescription:
      "Free development finance enquiry for investors. Independent broker introducing enquiries to 200+ specialist lenders. Introducer only — not a lender. Subject to status.",
    painHeadline: "Development Projects Need Flexible Funding",
    painIntro:
      "Development and refurbishment need staged funding — standard lenders often do not support drawdowns or unmortgageable properties.",
    painBullets: [
      "Contractors are ready but funding structure is not in place",
      "The property may not qualify for long-term finance until works complete",
      "You need terms aligned to your build schedule, not a single bank product",
    ],
    finalCtaHeadline: "Enquire About Development Finance",
    finalCtaSubline:
      "Free enquiry within 2 hours — staged drawdown options via specialist lenders.",
  },
  chain: {
    headline: "Business or Investment Finance?",
    highlight: "Broker-Led Specialist Search.",
    bullets: [
      "Buy before you sell — move with a plan",
      "Specialist lenders for business/investment cases",
      "Exit strategy when your sale completes",
      "Free enquiry in 2 hours",
    ],
    solutionBridge:
      "Buy now, sell later — Daniel introduces business and investment enquiries to specialist lenders with a clear exit, subject to status.",
    responseBadge: "Typical response within 2 hours",
    metaTitle: "Business & Investment Finance Broker — London | Bridging Loans Broker",
    metaDescription:
      "Free business and investment property finance enquiry. Independent broker introducing enquiries to 200+ lenders. Introducer only — not a lender. Subject to status.",
    painHeadline: "Complex Deals Need a Specialist Broker",
    painIntro:
      "You may have found the right property — but standard lenders cannot support your timeline or deal structure.",
    painBullets: [
      "Another buyer may proceed without waiting for your sale",
      "Your mortgage offer may expire before your sale completes",
      "You need short-term finance with a clear exit strategy",
    ],
    finalCtaHeadline: "Free Business & Investment Enquiry",
    finalCtaSubline:
      "Daniel outlines indicative options within 2 hours — introducer only, subject to status.",
  },
  refurb: {
    headline: "Refurbishment Finance Enquiry?",
    highlight: "Specialist Broker Search.",
    bullets: [
      "Finance for properties long-term lenders decline",
      "Light and heavy works considered",
      "Staged drawdowns where required",
      "Free enquiry within 2 hours",
    ],
    solutionBridge:
      "Complete the works, then refinance — Daniel introduces refurbishment enquiries to specialist lenders, subject to status.",
    responseBadge: "Typical response within 2 hours",
    metaTitle: "Refurbishment Finance Broker — London | Bridging Loans Broker",
    metaDescription:
      "Free refurbishment finance enquiry for investors. Independent broker introducing enquiries to 200+ specialist lenders. Introducer only — not a lender. Subject to status.",
    painHeadline: "Unmortgageable Does Not Mean Unfinanceable",
    painIntro:
      "The property has potential — but many funders will not support it until refurbishment is complete.",
    painBullets: [
      "Works need funding before long-term finance is available",
      "Buy-to-let funders often decline properties in poor condition",
      "You need short-term finance with a clear refinance exit",
    ],
    finalCtaHeadline: "Free Refurbishment Enquiry",
    finalCtaSubline:
      "Daniel reviews refurb scenarios within 2 hours — light and heavy works, subject to status.",
  },
};

export function metaLpAngleMarketing(angle: AdAngle = "default"): AngleMarketing {
  return ANGLE_MARKETING[angle];
}

export function metaLpHero(angle: AdAngle = "default"): HeroCopy {
  const { headline, highlight, bullets, solutionBridge, responseBadge } =
    ANGLE_MARKETING[angle];
  return { headline, highlight, bullets, solutionBridge, responseBadge };
}

export function metaLpAngleMetadata(angle: AdAngle = "default") {
  const { metaTitle, metaDescription } = ANGLE_MARKETING[angle];
  return { title: metaTitle, description: metaDescription };
}

export const META_LP_STATS = [
  { label: "Years' experience", value: "15+" },
  { label: "Finance arranged", value: "£500M+" },
  { label: "Lenders", value: "200+" },
  { label: "Countries served", value: "10+" },
] as const;

export const META_LP_KEY_FACTS = [
  { label: "Role", value: "Independent broker", note: "Introducer only" },
  { label: "Panel", value: "200+ lenders", note: "Access to the best rates/deals" },
  { label: "Clients", value: "Investors & developers", note: "Business purposes only" },
  { label: "Enquiry", value: "Free, no obligation", note: "No hard credit check" },
  { label: "Response", value: "Within 2 hours", note: "Mon–Sat, typical" },
  { label: "Terms", value: "Indicative only", note: "Subject to status" },
] as const;

export const META_LP_OFFER_ITEMS = [
  {
    title: "Free specialist consultation",
    desc: "Daniel reviews your scenario personally — no call centre.",
  },
  {
    title: "200+ lender search",
    desc: "We compare lenders across our panel to find the best available terms for your deal.",
  },
  {
    title: "Indicative outline within 2 hours",
    desc: "Options explained clearly — no jargon, no surprises. Subject to status.",
  },
  {
    title: "Broker-led process",
    desc: "Daniel manages your enquiry through to funder introduction — not a lender.",
  },
  {
    title: "No obligation, no hard credit check",
    desc: "Requesting an enquiry won't affect your credit score or commit you.",
  },
  {
    title: "Direct line to your broker",
    desc: "Call Daniel on 020 7177 4141 — speak to the person handling your enquiry.",
  },
] as const;

export const META_LP_FAQ = [
  {
    q: "What does Bridging Loans Broker do?",
    a: "We are a specialist bridging loans broker and introducer. We introduce business and investment bridging enquiries to third-party lenders — we are not a lender. Subject to status and lender criteria.",
    category: "basics" as const,
  },
  {
    q: "Who is this service for?",
    a: "Business and investment property only. We do not arrange finance where you intend to live in the property, or where you or a family member has previously lived in it.",
    category: "basics" as const,
  },
  {
    q: "Will this enquiry affect my credit score?",
    a: "No. This initial enquiry is a soft consultation — there is no hard credit check at this stage. We only proceed with formal applications when you are ready.",
    category: "objection" as const,
  },
  {
    q: "How quickly will you respond?",
    a: "Daniel typically reviews enquiries within 2 hours on business days. Funding timelines depend on your documentation, the funder, and the deal — subject to status.",
    category: "speed" as const,
  },
  {
    q: "Are you regulated by the FCA?",
    a: "Bridging finance for investment or business purposes is unregulated. We do not offer consumer credit or finance secured on an individual's primary residence.",
    category: "basics" as const,
  },
  {
    q: "What happens after I enquire?",
    a: "Daniel reviews your scenario, checks eligibility for business and investment purposes, and outlines indicative options from our funder panel. There is no obligation to proceed.",
    category: "basics" as const,
  },
] as const;

export const META_LP_COMPARISON_LENDER_TYPES = [
  "Specialist bridging lenders",
  "Private & family office finance",
  "Commercial property lenders",
  "Auction finance providers",
  "Development & refurb lenders",
  "International investor finance",
] as const;

export const META_LP_COMPARISON_ROWS = [
  {
    label: "Enquiry response",
    blb: "Typically within 2 hours",
    bank: "2–6 weeks typical",
  },
  {
    label: "Complex deals",
    blb: "Auction, refurb, HMO, business/investment",
    bank: "Often declined outright",
  },
  {
    label: "Market access",
    blb: "200+ lenders — best rates/deals",
    bank: "Single in-house product",
  },
  {
    label: "Broker role",
    blb: "Introducer only — not a lender",
    bank: "Direct lender product",
  },
  {
    label: "Broker fee",
    blb: "Free consultation & enquiry",
    bank: "Arrangement fees apply",
  },
  {
    label: "Personal broker",
    blb: "Dedicated specialist (Daniel)",
    bank: "Call centre or branch queue",
  },
] as const;

export const META_LP_HOW_IT_WORKS_STEPS = [
  {
    step: "1",
    title: "Your needs",
    desc: "Finance amount, purpose & timeline — easy questions, no personal details yet.",
    time: "~30 sec",
  },
  {
    step: "2",
    title: "Your details",
    desc: "Name, phone & email — Daniel prepares your options and calls within 2 hours.",
    time: "Saved securely",
  },
  {
    step: "3",
    title: "Almost done",
    desc: "Property & eligibility check — then receive indicative terms from 200+ lenders.",
    time: "Subject to status",
  },
] as const;

export const BLB_DANIEL_SECTION = {
  eyebrow: "Expert Bridging Brokers You Can Trust",
  title: "Meet Daniel Mehrnia",
  role: "Partner · Specialist Bridging Loans Broker",
  intro: [
    "Bridging loans done properly — by people who actually care about your case.",
    "Daniel and his team take the time to understand your situation, match you with the right lender, and manage everything from first call to funds in your account.",
    "No call centres. No box-ticking. Just straight answers and fast results.",
    "Terms in 2 hours. Funds in as little as 72 hours. Subject to status.",
  ],
  bullets: [
    "200+ lenders — access to the best rates and deals",
    "Property developer experience — understands how the wrong finance eats into your profits",
    "Property tax accounting experience — plan ahead once your deal completes",
    "Independent broker — not limited to a few lenders",
  ],
  heroRole: "Partner · Your specialist Bridging Loans Broker",
  heroTagline: "15+ years · £500M+ arranged · 200+ lenders",
} as const;

export const BLB_DIRECT_LENDER_SECTION = {
  title: "Why not go direct to a lender?",
  paragraphs: [
    "Going direct to a lender might seem like it saves money — it rarely does.",
    "Wrong product, misrepresented case, last minute rejection — on an auction purchase that's your deposit gone too.",
    "Every client who came to us after trying it alone said the same thing. Cheaper, faster, far less stressful.",
    "We don't just arrange your loan — we protect your position from day one.",
    "And behind us sits a team of Chartered Property Tax Accountants. Once your deal completes, we plan ahead — cutting your tax bill, structuring your finances correctly and making sure more of your money stays yours.",
  ],
} as const;
