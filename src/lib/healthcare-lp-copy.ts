/** Booked Consult — B2B + patient LP copy (healthcare vertical only). */

export const HEALTHCARE_B2B_METADATA = {
  title: "Booked Consult | Booked implant consultations for clinics",
  description:
    "£2,500 pilot — 10 booked implant consults in 45 days. Pay per confirmed consultation, not leads. Live ops dashboard.",
  ogImage: "/og/for-clinics.png",
} as const;

export const HEALTHCARE_IMPLANTS_METADATA = {
  title: "Free dental implant consultation | Booked Consult",
  description:
    "Book a free implant consultation. Answer a few quick questions and choose a time that suits you — confirmation by SMS.",
  ogImage: "/og/implants.png",
} as const;

export const HEALTHCARE_FOR_CLINICS_FOOTER_NAV = {
  product: [
    { label: "Pilot offer", href: "#pilot-offer" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Live dashboard", href: "#dashboard" },
    { label: "Why us", href: "#comparison" },
  ],
  support: [
    { label: "FAQ", href: "#faq" },
    { label: "Guarantee", href: "#guarantee" },
    { label: "Patient demo", href: "/lp/implants" },
  ],
} as const;

export const HEALTHCARE_FOOTER =
  "Booked Consult arranges consultation bookings on behalf of participating dental clinics. We do not provide clinical advice. Treatment is delivered by the clinic's registered dental professionals. Advertising is approved by the practice. Subject to clinic availability.";

export const HEALTHCARE_IMPLANTS_HERO = {
  headline: "Book your free",
  highlight: "implant consultation",
  bullets: [
    "Single, multiple or full-arch implants",
    "Free consultation — no obligation",
    "Choose a time online in under 2 minutes",
  ],
  responseBadge: "Confirmation by SMS",
} as const;

export const HEALTHCARE_IMPLANTS_FAQ = [
  {
    q: "Who is this for?",
    a: "Adults interested in dental implants who want to speak to a specialist about options, suitability and next steps.",
  },
  {
    q: "Is the consultation free?",
    a: "Yes — the initial implant consultation is free. Any treatment costs are explained by the clinic at your appointment.",
  },
  {
    q: "How long is the consultation?",
    a: "Around 30 minutes. The implant team will discuss your options, suitability, and typical next steps — with no obligation to proceed.",
  },
  {
    q: "What happens after I book?",
    a: "You'll receive SMS and email confirmation. The clinic may call to confirm details before your appointment.",
  },
  {
    q: "Who provides treatment?",
    a: "Your consultation and any treatment are provided by the participating dental clinic — not Booked Consult.",
  },
  {
    q: "How do I find the clinic?",
    a: "Address and directions are included in your SMS and email confirmation once your appointment is booked.",
  },
] as const;

export const HEALTHCARE_PATIENT_COMPLIANCE_STRIP =
  "Free initial consultation · No obligation · Treatment by GDC-registered clinicians at your chosen clinic";

export const HEALTHCARE_IMPLANTS_MID_CTA = {
  headline: "Check availability for your free consultation",
  subline: "Answer a few quick questions — then choose a time online.",
  button: "Book free consultation",
} as const;

export const HEALTHCARE_IMPLANTS_STEPS = {
  title: "What happens at your consult",
  description: "From enquiry to appointment — usually under 2 minutes online.",
} as const;

export const HEALTHCARE_FOR_CLINICS = {
  headline: "10 booked implant consults",
  headlineHighlight: "in 45 days",
  headlinePrice: "£2,500 pilot",
  subline: "Pay for confirmed consultations in your diary — not leads, clicks, or retainers.",
  proofLine: "£250 per booked consult vs £80–150 per unqualified lead from typical agencies.",
  bullets: [
    "We run ads, qualify patients, and book confirmed consults",
    "10-consult pilot with delivery guarantee",
    "Live ops dashboard — see every enquiry in real time",
  ],
  pilotPrice: "£2,500",
  pilotDetail: "10 booked implant consultations in 45 days",
  pilotPerConsult: "£250",
  pilotPerConsultLabel: "per booked consult",
  pilotRoi:
    "One full-arch case (£15k+) covers the pilot many times over — before counting multiple implants.",
  pilotScarcity: "Limited to 2 new pilot practices per month",
  guarantee: "If we don't deliver 10 booked consults, we keep working at no extra cost until we do.",
  cta: "Book a 10-minute call",
  ctaShort: "Book pilot call",
  ctaNote: "10 min · No retainer · Delivery guarantee",
  patientDemoLabel: "See patient booking flow",
  pilotPricingLabel: "Pilot pricing",
  bookingFallbackBullets: [
    "Review consult availability and catchment area",
    "Walk through the patient LP and live ops dashboard",
    "Agree qualification rules before any ad spend goes live",
  ],
  bookingFallbackNote: "We reply within one business day",
} as const;

export const HEALTHCARE_FOR_CLINICS_HERO = {
  eyebrow: "For implant clinics",
  ...HEALTHCARE_FOR_CLINICS,
} as const;

export const HEALTHCARE_B2B_COMPLIANCE_STRIP =
  "Creative approved by your practice before any ad spend · GDC/ASA safe · We arrange bookings only — treatment by your registered team";

export const HEALTHCARE_B2B_COMPLIANCE_SECTION = {
  title: "Clinic-safe patient acquisition",
} as const;

export const HEALTHCARE_B2B_COMPLIANCE_ITEMS = [
  {
    id: "approval",
    label: "Your approval before ad spend",
    detail: "Nothing goes live without sign-off from your practice",
  },
  {
    id: "gdc",
    label: "GDC / ASA safe",
    detail: "Compliant patient acquisition copy and creative",
  },
  {
    id: "clinical",
    label: "Bookings only — not clinical care",
    detail: "Treatment delivered by your registered dental team",
  },
] as const;

export const HEALTHCARE_B2B_TRUST_STRIP = [
  "£250 per booked consult",
  "Live ops dashboard",
  "10-consult guarantee",
] as const;

export const HEALTHCARE_FOR_CLINICS_COMPARISON = {
  eyebrow: "Why Booked Consult",
  title: "Lead agency vs Booked Consult",
  description:
    "Most marketing agencies sell activity. We sell confirmed implant consultations sitting in your diary.",
  pilotLink: "See pilot offer",
  pilotHref: "#pilot-offer",
  featureColumnLabel: "Compare",
  agencyLabel: "Lead agency / retainer",
  bookedConsultLabel: "Booked Consult",
  recommendedBadge: "Recommended",
  summaryLine: "Bottom line: £250 per booked consult — not £80–150+ per unqualified lead.",
  rows: [
    {
      label: "What you pay for",
      agency: "Leads, clicks, impressions",
      bookedConsult: "Confirmed consults on your diary",
      highlight: false,
    },
    {
      label: "Cost per outcome",
      agency: "£80–150+ per lead (often unqualified)",
      bookedConsult: "£250 per booked consult (pilot)",
      highlight: true,
    },
    {
      label: "Booking",
      agency: "Form fill or callback",
      bookedConsult: "Qualified + slot booked + SMS confirm",
      highlight: false,
    },
    {
      label: "Transparency",
      agency: "Monthly PDF report",
      bookedConsult: "Live ops dashboard, real time",
      highlight: false,
    },
    {
      label: "Contract",
      agency: "6–12 month retainer",
      bookedConsult: "45-day pilot, performance-based",
      highlight: false,
    },
    {
      label: "Risk",
      agency: "Pay regardless of chairs filled",
      bookedConsult: "10-consult delivery guarantee",
      highlight: false,
    },
    {
      label: "Ad compliance",
      agency: "Variable",
      bookedConsult: "Creative approved by your practice (GDC/ASA)",
      highlight: false,
    },
  ],
} as const;

export const HEALTHCARE_FOR_CLINICS_HOW_IT_WORKS = {
  title: "How it works",
  description:
    "From pilot call to first booked consult in your diary — typically within 7–14 days of kick-off.",
  steps: [
    {
      step: "1",
      title: "Pilot call",
      desc: "Agree qualification rules, consult availability, catchment, and ad approval contact.",
      badge: "30 min",
      highlights: ["Qualification rules", "Consult availability", "Ad approver named"],
    },
    {
      step: "2",
      title: "Go live",
      desc: "Your patient landing page, Meta ads, qualify, book, SMS confirm — clinic notified within 5 minutes.",
      badge: "Week 1–2",
      highlights: ["LP + Meta ads live", "Qualify & book flow", "Clinic alert in 5 min"],
    },
    {
      step: "3",
      title: "Deliver",
      desc: "Weekly report on leads, qualified, booked, and show rate — live in your ops dashboard.",
      badge: "45 days",
      highlights: ["Weekly performance", "Show-rate tracking", "Live ops dashboard"],
    },
  ],
} as const;

export const HEALTHCARE_FOR_CLINICS_GUARANTEE = {
  title: "Pilot with confidence",
  description:
    "We remove the usual agency risk — so the only decision is whether implant consults are worth filling.",
  featuredBadge: "Core guarantee",
  faqLink: "Learn more in FAQ →",
} as const;

export const HEALTHCARE_FOR_CLINICS_GUARANTEES = [
  {
    title: "10-consult guarantee",
    desc: "If we don't deliver 10 booked consults, we keep working at no extra cost until we do.",
    badge: "Outcome-based",
    faqId: "faq-booked-consult",
    featured: true,
  },
  {
    title: "No retainer",
    desc: "Pilot fee only — you pay for a defined outcome, not monthly activity.",
    badge: "Fixed fee",
    faqId: undefined,
    featured: false,
  },
  {
    title: "Your ad approval",
    desc: "Nothing goes live without sign-off from your practice.",
    badge: "GDC / ASA",
    faqId: undefined,
    featured: false,
  },
  {
    title: "Full visibility",
    desc: "Every enquiry, qualification, and booking in the live ops dashboard.",
    badge: "Live dashboard",
    faqId: undefined,
    featured: false,
  },
] as const;

export const HEALTHCARE_FOR_CLINICS_PILOT_INCLUDED = [
  "Meta ads & optimisation",
  "Patient landing page",
  "Patient qualification",
  "Online booking flow",
  "SMS confirmation",
  "Clinic notified within 5 minutes",
  "Weekly performance report",
  "Live ops dashboard access",
] as const;

export const HEALTHCARE_FOR_CLINICS_PILOT_YOU_PROVIDE = [
  "Implant consult availability",
  "Ad creative approver",
  "Calendar slots (Calendly or clinic process)",
] as const;

export const HEALTHCARE_FOR_CLINICS_OPERATOR_SECTION = {
  eyebrow: "Who we are",
  title: "Built for implant practices, not generic lead gen",
  description:
    "Same ops system you see in the dashboard — applied to patient acquisition for private clinics.",
  testimonialEyebrow: "Clinic partner",
  testimonialTitle: "What implant practices say",
  testimonialDescription: "Feedback from a participating implant practice.",
  patientJourneyCta: "See the patient journey",
  dashboardCta: "See the live dashboard",
} as const;

export const HEALTHCARE_FOR_CLINICS_OPERATOR = {
  name: "Booked Consult",
  role: "Implant patient acquisition",
  bio: "We run patient acquisition for implant practices — ads, qualification, and confirmed diary bookings. You see everything in real time.",
  bullets: [
    "Performance-based pilots — not 12-month retainers",
    "GDC/ASA-safe ad approval before any spend goes live",
    "Same live ops system shown in the dashboard preview",
  ],
  credentials: [
    "Qualify → book → SMS confirm before the clinic inbox",
    "Kick-off to first booked consult: typically 7–14 days",
  ],
  stats: [
    { value: "£2,500", label: "Fixed pilot fee" },
    { value: "10", label: "Booked consults" },
    { value: "7–14 days", label: "Typical kick-off" },
  ],
} as const;

export const HEALTHCARE_FOR_CLINICS_LOOM = {
  eyebrow: "Product preview",
  title: "See how consult capture works",
  description:
    "From Meta ad click to confirmed consult in your diary — with qualification, booking, and SMS confirmation built in.",
  patientPreviewTitle: "What your patients see",
  patientPreviewDescription:
    "Live Meta ads destination — qualify, pick a slot, and get SMS confirmation in under 2 minutes.",
  patientPreviewCta: "Open patient demo",
  patientPreviewUrl: "bookedconsult.com/lp/implants",
  fallbackTitle: "90-second walkthrough on your pilot call",
  fallbackDescription:
    "We'll screen-share the full flow: ad → patient LP → qualification → Calendly booking → your live ops dashboard.",
  fallbackCta: "Book call — see the full flow",
  captureFlowSteps: [
    { label: "Meta ad", detail: "Patient clicks" },
    { label: "Qualify", detail: "Budget & timeline" },
    { label: "Book", detail: "Calendly slot" },
    { label: "Confirm", detail: "SMS + clinic alert" },
  ],
} as const;

export const HEALTHCARE_FOR_CLINICS_CRM = {
  title: "Live ops dashboard",
  description:
    "Qualified → booked → showed — every step visible in real time. No monthly PDF mystery reports.",
  caption: "See enquiry, qualification, and booking status the moment it happens",
  bookCallCta: "Book call — see the dashboard",
  demoNote: "Full dashboard walkthrough on your 10-minute pilot call",
  features: [
    {
      title: "Real-time pipeline",
      detail: "New leads, booked consults, and show rate — updated live.",
    },
    {
      title: "Full patient journey",
      detail: "Meta ad source, qualification answers, and Calendly booking in one view.",
    },
    {
      title: "Clinic alerts in 5 minutes",
      detail: "SMS and email when a consult is booked — no manual inbox checking.",
    },
  ],
  mockKpis: [
    { label: "New today", value: "4", tone: "default" as const },
    { label: "Booked", value: "2", tone: "gold" as const },
    { label: "Show rate", value: "67%", tone: "default" as const },
  ],
} as const;

export const HEALTHCARE_FOR_CLINICS_MID_CTA = {
  headline: "Ready to fill implant consult slots — not your inbox?",
  subline: "Book a 10-minute call — we'll show you the patient LP, live ops dashboard, and pilot terms.",
  pills: ["£2,500 pilot", "10 booked consults", "45-day delivery", "No retainer"],
  secondaryCta: "See pilot offer",
  secondaryHref: "#pilot-offer",
} as const;

export const HEALTHCARE_FOR_CLINICS_PROBLEM = {
  id: "problem",
  headline: "You're paying for leads. You need booked consults.",
  description:
    "Most implant practices lose patients between the form fill and the diary. We close that gap.",
  items: [
    {
      id: "booking",
      stat: "~60% never book",
      title: "Lead forms ≠ diary bookings",
      problem: "Form fills and click-to-call land in your inbox — no confirmed slot.",
      solution: "We qualify, book, and SMS-confirm before the patient reaches your team.",
    },
    {
      id: "qualify",
      stat: "Hours wasted",
      title: "Unqualified leads burn chair time",
      problem: "Tyre-kickers and wrong-fit enquiries eat front-desk follow-up.",
      solution: "Budget, timeline, and catchment filters before anything hits your calendar.",
    },
    {
      id: "retainer",
      stat: "£2k–5k/mo retainers",
      title: "Agencies sell activity, not outcomes",
      problem: "You pay for clicks and impressions whether chairs get filled or not.",
      solution: "£250 per booked consult on the pilot — pay for diary outcomes.",
    },
  ],
  cta: "See how we're different",
  ctaHref: "#pilot-offer",
} as const;

export const HEALTHCARE_FOR_CLINICS_FAQ_SECTION = {
  title: "Frequently asked questions",
  description: "Objections answered upfront — so you can book a pilot call with confidence.",
  ctaTitle: "Still have a question?",
  ctaDescription: "Book a 10-minute call — we'll walk through pilot terms, ad approval, and your catchment.",
  emailLabel: "Or email us directly",
} as const;

export const HEALTHCARE_FOR_CLINICS_FAQ_CATEGORIES = {
  pilot: "Pilot & pricing",
  delivery: "Delivery & ops",
  after: "After the pilot",
} as const;

export type HealthcareForClinicsFaqCategory = keyof typeof HEALTHCARE_FOR_CLINICS_FAQ_CATEGORIES;

export const HEALTHCARE_FOR_CLINICS_FAQ = [
  {
    id: "faq-pricing",
    category: "pilot" as const,
    q: "What do I pay for?",
    a: "The pilot is £2,500 for 10 booked implant consultations in 45 days. You pay for confirmed consultations on your diary — not leads or clicks.",
    highlight: true,
  },
  {
    id: "faq-booked-consult",
    category: "pilot" as const,
    q: "What counts as a booked consult?",
    a: "A qualified patient with a confirmed appointment slot in your calendar, who meets the qualification rules we agree at kick-off.",
    highlight: true,
  },
  {
    id: "faq-ad-spend",
    category: "pilot" as const,
    q: "What Meta ad spend should we budget?",
    a: "We recommend £20–50/day for the test phase (~£350 max in week 1). We pause or fix if spend isn't converting to form starts and booked consults — agreed rules at kick-off.",
    highlight: false,
  },
  {
    id: "faq-ads",
    category: "delivery" as const,
    q: "Who runs the ads?",
    a: "Booked Consult runs and optimises patient acquisition. Ad creative is approved by your practice before go-live (GDC/ASA safe).",
    highlight: false,
  },
  {
    id: "faq-dashboard",
    category: "delivery" as const,
    q: "Can I see what's happening?",
    a: "Yes — you get access to a live ops dashboard showing every enquiry, qualification outcome, and booking status in real time.",
    highlight: false,
  },
  {
    id: "faq-no-show",
    category: "delivery" as const,
    q: "What if patients no-show?",
    a: "We qualify and confirm before booking; show rate is tracked weekly. Qualification rules and follow-up are agreed at kick-off so chair time isn't wasted on tyre-kickers.",
    highlight: false,
  },
  {
    id: "faq-pms",
    category: "delivery" as const,
    q: "Do you need access to our PMS?",
    a: "No — we book via an agreed calendar workflow (Calendly or your clinic process). You keep clinical systems separate.",
    highlight: false,
  },
  {
    id: "faq-ad-account",
    category: "delivery" as const,
    q: "Who owns the ad account?",
    a: "Booked Consult runs and optimises ads. Creative is approved by your practice; spend and performance are transparent in your weekly report and live dashboard.",
    highlight: false,
  },
  {
    id: "faq-catchment",
    category: "delivery" as const,
    q: "Which areas do you cover?",
    a: "Catchment is agreed at kick-off — typically your clinic postcode radius or named boroughs. Patients outside catchment are nurtured, not booked, so you don't waste chair time.",
    highlight: false,
  },
  {
    id: "faq-after-pilot",
    category: "after" as const,
    q: "What happens after the 10-consult pilot?",
    a: "If the pilot works, we agree ongoing terms — typically pay-per-booked-consult or a defined monthly package. No auto-renewal; you choose after seeing show rate and case conversion.",
    highlight: true,
  },
] as const;

export const HEALTHCARE_CONSULT_STEPS = [
  { title: "Book online", desc: "Choose a consultation time that suits you" },
  { title: "Get confirmed", desc: "SMS and email confirmation from the clinic" },
  { title: "Attend your consult", desc: "Free appointment with the implant team" },
] as const;

export const HEALTHCARE_TRUST_STRIP = [
  "Free consultation",
  "GDC-registered clinic",
  "No obligation",
  "Book online in 2 minutes",
] as const;

export const TREATMENT_OPTIONS = [
  { value: "single_implant", label: "Single implant" },
  { value: "multiple_implants", label: "Multiple implants" },
  { value: "full_arch", label: "Full arch / All-on-4" },
  { value: "unsure", label: "Not sure yet — want advice" },
] as const;

export const TIMELINE_OPTIONS = [
  { value: "within_3_months", label: "Within 3 months" },
  { value: "3_to_6_months", label: "3–6 months" },
  { value: "researching", label: "Just researching" },
] as const;

export const BUDGET_BAND_VALUES: Record<string, number> = {
  under_5k: 4_000,
  "5k_10k": 7_500,
  "10k_20k": 15_000,
  over_20k: 25_000,
  unsure: 10_000,
};

export const BUDGET_OPTIONS = [
  { value: "under_5k", label: "Under £5,000" },
  { value: "5k_10k", label: "£5,000 – £10,000" },
  { value: "10k_20k", label: "£10,000 – £20,000" },
  { value: "over_20k", label: "Over £20,000" },
  { value: "unsure", label: "Not sure yet" },
] as const;
