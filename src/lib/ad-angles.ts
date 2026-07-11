export type AdAngle = "auction" | "development" | "chain" | "refurb" | "default";

export const AD_ANGLE_VALUES: AdAngle[] = [
  "auction",
  "development",
  "chain",
  "refurb",
  "default",
];

export const AD_ANGLES: Record<
  AdAngle,
  {
    headline: string;
    highlight: string;
    bullets: string[];
    defaultLoanPurpose: string;
    defaultTimeframe: string;
    painHeadline: string;
    painIntro: string;
    painBullets: string[];
    solutionBridge: string;
    highlightUseCase: string;
    finalCtaHeadline: string;
    finalCtaSubline: string;
  }
> = {
  default: {
    headline: "Need Bridging Finance Fast?",
    highlight: "Get a Free Quote Today.",
    bullets: [
      "Auction purchases & business/investment finance",
      "Refurbishment & development finance",
      "Complex deals high-street banks reject",
      "No obligation — free specialist consultation",
    ],
    defaultLoanPurpose: "",
    defaultTimeframe: "",
    painHeadline: "Sound Familiar?",
    painIntro:
      "You need short-term property finance — but high-street banks move slowly, reject complex deals, and can't meet urgent deadlines.",
    painBullets: [
      "Your purchase deadline is days away, not weeks",
      "The property needs work before a standard mortgage is possible",
      "You've been turned down or quoted unrealistic terms elsewhere",
    ],
    solutionBridge:
      "Daniel manages and introduces your case to the right lender from 200+ lenders — independent broker, not limited to a few lenders. Terms in 2 hours. Funds in as little as 72 hours, subject to status.",
    highlightUseCase: "",
    finalCtaHeadline: "Get Your Free Bridging Quote Today",
    finalCtaSubline:
      "Daniel will review your scenario and outline your options within 2 hours — no obligation.",
  },
  auction: {
    headline: "Auction Purchase Tomorrow?",
    highlight: "Get Pre-Approved Bridging Finance Today.",
    bullets: [
      "Pre-approved funding before you bid",
      "Complete in as little as 48 hours",
      "200+ specialist auction lenders",
      "Free quote — no obligation",
    ],
    defaultLoanPurpose: "auction",
    defaultTimeframe: "urgent",
    painHeadline: "Auction Deadlines Don't Wait",
    painIntro:
      "You need a firm funding line before you bid — but most lenders can't move fast enough for a 28-day completion.",
    painBullets: [
      "Exchange is binding — you can't afford funding to fall through",
      "High-street banks need weeks of paperwork, not days",
      "Without pre-approval, you're bidding blind on your max budget",
    ],
    solutionBridge:
      "Get pre-approved auction finance in 48 hours — so you bid with confidence and complete on time.",
    highlightUseCase: "Auction Purchases",
    finalCtaHeadline: "Get Pre-Approved Before You Bid",
    finalCtaSubline:
      "Free auction finance quote within 2 hours — funding in as little as 48 hours.",
  },
  development: {
    headline: "Need Development Finance?",
    highlight: "Fund Your Project in Days, Not Weeks.",
    bullets: [
      "Staged drawdowns for refurb & new build",
      "Light & heavy works welcome",
      "Exit strategy tailored to your project",
      "Free specialist consultation",
    ],
    defaultLoanPurpose: "development",
    defaultTimeframe: "30_days",
    painHeadline: "Your Project Can't Sit Idle",
    painIntro:
      "Development and refurbishment need staged funding — but standard lenders don't understand drawdowns or un-mortgageable properties.",
    painBullets: [
      "Contractors are ready but finance isn't in place",
      "The property won't qualify for a mortgage until works are done",
      "You need flexible terms tied to your build schedule, not a bank's",
    ],
    solutionBridge:
      "Staged drawdowns matched to your build schedule — with an exit strategy structured around your project timeline.",
    highlightUseCase: "Development",
    finalCtaHeadline: "Fund Your Development Project",
    finalCtaSubline:
      "Free quote within 2 hours — staged drawdowns for light and heavy works.",
  },
  chain: {
    headline: "Business or Investment Finance?",
    highlight: "Get a Free Quote Today.",
    bullets: [
      "Buy before you sell — move fast",
      "Funding arranged in 3–10 days",
      "Clear exit when your sale completes",
      "No obligation quote in 2 hours",
    ],
    defaultLoanPurpose: "chain_break",
    defaultTimeframe: "urgent",
    painHeadline: "Complex Deals Need a Specialist Broker",
    painIntro:
      "You've found the right property — but standard lenders cannot support your timeline or deal structure.",
    painBullets: [
      "Another buyer is ready to move without waiting",
      "Your mortgage offer expires before your sale goes through",
      "You need to buy now and repay when your current property sells",
    ],
    solutionBridge:
      "Buy now, sell later — bridging finance with a clear exit when your property sale completes.",
    highlightUseCase: "Business/Investment",
    finalCtaHeadline: "Get Your Free Quote Today",
    finalCtaSubline:
      "Free quote in 2 hours — funding arranged in 3–10 days with a clear sale exit.",
  },
  refurb: {
    headline: "Property Needs Work Before a Mortgage?",
    highlight: "Bridging Finance for Refurbishment.",
    bullets: [
      "Fund properties mortgage lenders reject",
      "Light works from 0.60%/month",
      "Heavy structural with staged drawdowns",
      "Free quote within 2 hours",
    ],
    defaultLoanPurpose: "refurbishment",
    defaultTimeframe: "30_days",
    painHeadline: "Unmortgageable Doesn't Mean Unfinanceable",
    painIntro:
      "The property has potential — but lenders won't touch it until the refurbishment is complete.",
    painBullets: [
      "Kitchens, bathrooms, or structural works need funding upfront",
      "Buy-to-let lenders reject properties in poor condition",
      "You need short-term finance with a clear refinance exit",
    ],
    solutionBridge:
      "Bridge the gap, complete the works, then refinance — rates from 0.60%/month on light refurbishments.",
    highlightUseCase: "Refurbishment",
    finalCtaHeadline: "Finance Your Refurbishment",
    finalCtaSubline:
      "Free quote within 2 hours — light and heavy works with staged drawdowns.",
  },
};

export function parseAdAngle(value: string | null | undefined): AdAngle {
  if (value && value in AD_ANGLES) return value as AdAngle;
  return "default";
}

export const QUICK_LOAN_AMOUNTS = [
  { label: "£150k", value: 150000 },
  { label: "£250k", value: 250000 },
  { label: "£500k", value: 500000 },
  { label: "£1M+", value: 1000000 },
] as const;

/** Quick-select purpose pills — client order */
export const QUICK_LOAN_PURPOSES = [
  { value: "auction", label: "Auction", emoji: "🏠" },
  { value: "purchase", label: "Purchase", emoji: "🏡" },
  { value: "equity_release", label: "Capital Raise", emoji: "💷" },
  { value: "chain_break", label: "Business/Inv.", emoji: "📈" },
  { value: "refinance", label: "Refinance", emoji: "🔄" },
  { value: "refurbishment", label: "Refurb", emoji: "🔨" },
  { value: "development", label: "Development", emoji: "🏗" },
  { value: "other", label: "Other", emoji: "⋯" },
] as const;

export const QUICK_PROPERTY_VALUES = [
  { label: "£250k", value: 250000 },
  { label: "£350k", value: 350000 },
  { label: "£500k", value: 500000 },
  { label: "£750k+", value: 750000 },
] as const;

/** Short labels for property type pills — full names in title tooltips */
export const QUICK_PROPERTY_TYPES = [
  { value: "residential", label: "Residential", title: "Residential" },
  { value: "commercial", label: "Commercial", title: "Commercial" },
  { value: "mixed_use", label: "Mixed use", title: "Mixed Use" },
  { value: "hmo", label: "HMO", title: "HMO" },
  { value: "land", label: "Land", title: "Land" },
  { value: "development", label: "Development", title: "Development Site" },
] as const;
