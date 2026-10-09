/** NeuroNourish — single source of truth for all marketing copy (10/10 scannable edition) */

export interface ScannableSection {
  eyebrow: string;
  headline: string;
  subtext?: string;
  highlights?: readonly string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  imageTheme: "sleep" | "movement" | "nutrition" | "energy" | "habits" | "metabolic";
  readTime: string;
}

export const NN_NAV = {
  links: [
    { href: "/shop/cognitive-assessment", label: "Cognitive Assessment" },
    { href: "/programme", label: "Programme" },
    { href: "/masterclasses", label: "Masterclasses" },
    { href: "/employers", label: "For Employers" },
    { href: "/healthcare", label: "For Healthcare Professionals" },
    { href: "/about", label: "About" },
  ],
  ctaQuiz: "Take the Free Brain Health Quiz",
  ctaQuizShort: "Free Quiz",
  /** Soft secondary only — must not compete with quiz in the header. */
  ctaDiscovery: "Book a consultation",
} as const;

export const NN_FOOTER = {
  tagline: "Evidence-based brain health programmes for Ireland & the UK.",
  consumers: [
    { href: "/quiz", label: "Brain health quiz" },
    { href: "/shop/cognitive-assessment", label: "Cognitive assessment" },
    { href: "/programme", label: "12-month programme" },
    { href: "/masterclasses", label: "Masterclasses" },
    { href: "/about", label: "About us" },
    { href: "/contact", label: "Contact" },
  ],
  clinics: [
    { href: "/employers", label: "For employers" },
    { href: "/healthcare", label: "For healthcare professionals" },
    { href: "/privacy", label: "Privacy" },
    { href: "/workspace/login", label: "Team login" },
  ],
  email: "hello@neuronourish.clinic",
  location: "NovaUCD, Dublin · Cavan Digital Hub · Ireland & UK (online)",
  copyright: "© 2026 NeuroNourish Clinic. All rights reserved.",
} as const;

export const NN_METADATA = {
  title: "Protect Memory & Optimise Brain Performance | NeuroNourish",
  description:
    "Personalised lifestyle medicine, biomarker analysis and targeted nutrition for adults who want to protect memory and boost mental performance. Take our free brain health quiz.",
  ogImage: "/opengraph-image",
} as const;

export const NN_HERO = {
  brand: "NeuroNourish",
  /** Kept empty: location chips removed per website review (nobody buys on geography). */
  eyebrow: "",
  headline: "Protect Your Memory.\nOptimise Brain Performance.\nStrengthen Your Future.",
  lead: "Understand the health and lifestyle factors shaping your brain today — and discover what you can do to support it for the future.",
  subtext:
    "Personalised cognitive assessment, nutrition, biomarkers and lifestyle support for adults who want to stay sharper for longer.",
  /** Trust logos live in the partners / founder strips — not the hero. */
  trustBar: [] as readonly string[],
  ctaQuiz: "Discover My Brain Health Score",
  ctaQuizHint: "Free • Takes approximately 3 minutes • Personalised results",
  /** Secondary only — not a competing gold CTA above the fold. */
  ctaAssessment: "Explore Cognitive Assessment",
  ctaAssessmentHref: "/shop/cognitive-assessment",
} as const;

/** Homepage §4 — modifiable factors education (Lancet Commission citation required). */
export const NN_WHY_BRAIN_HEALTH = {
  eyebrow: "Why brain health matters",
  headline: "Your brain health is not fixed.",
  body: "Research suggests that a substantial proportion of dementia risk at population level is associated with potentially modifiable factors.",
  factors: [
    "Physical activity",
    "Blood pressure",
    "Cholesterol",
    "Diabetes / metabolic health",
    "Nutrition",
    "Hearing",
    "Social connection",
    "Smoking",
    "Alcohol",
    "Cognitive stimulation",
    "Depression",
    "Vision",
    "Air pollution",
    "Traumatic brain injury",
  ] as const,
  close:
    "The earlier we understand your individual picture, the more opportunity we have to support the factors we can influence.",
  citation:
    "Livingston et al., The Lancet Commission on dementia prevention, intervention, and care (2020 & 2024).",
  cta: "Discover My Brain Health Profile",
  ctaHref: "/quiz",
} as const;

/** Homepage §5 — today vs future motivations. */
export const NN_TODAY_FUTURE = {
  eyebrow: "Today and tomorrow",
  headline: "Speak to both how you feel now — and what you want to protect.",
  subtext:
    "NeuroNourish helps you understand both: how your brain is performing now and the modifiable factors that may influence its future health.",
  today: {
    title: "How is your brain serving you today?",
    items: [
      {
        title: "Memory",
        body: "Forgetting names, words, appointments or information.",
      },
      {
        title: "Focus",
        body: "Difficulty concentrating or sustaining attention.",
      },
      {
        title: "Mental energy",
        body: "Brain fog, cognitive fatigue or reduced sharpness.",
      },
      {
        title: "Sleep & stress",
        body: "Feeling that poor sleep or chronic stress is affecting how you think.",
      },
    ] as const,
  },
  future: {
    title: "How are you protecting your brain for tomorrow?",
    items: [
      { title: "Family history", body: "Family history of dementia or cognitive decline." },
      { title: "Cardiovascular risk", body: "Blood pressure, cholesterol and heart health." },
      { title: "Metabolic health", body: "Diabetes risk, weight and metabolic markers." },
      { title: "Healthy ageing", body: "Staying sharper as the years go on." },
      { title: "Nutrition", body: "Eating patterns that support long-term brain health." },
      { title: "Cognitive reserve", body: "Learning, stimulation and long-term memory protection." },
    ] as const,
  },
} as const;

/** Homepage §6 — commercial funnel stages. */
export const NN_FUNNEL_STAGES = {
  eyebrow: "Your journey",
  headline: "Know → Measure → Understand → Change → Track",
  subtext: "A clear path from curiosity to lasting brain-health change.",
  stages: [
    {
      id: "01",
      label: "Know",
      title: "Take your Brain Health Quiz",
      body: "Understand the lifestyle and health factors that may be influencing your brain.",
      cta: "Take the Free Quiz",
      href: "/quiz",
    },
    {
      id: "02",
      label: "Measure",
      title: "Establish your cognitive baseline",
      body: "Measure areas such as memory, attention, processing speed and executive function.",
      cta: "Cognitive Assessment — €89.99",
      href: "/shop/cognitive-assessment",
    },
    {
      id: "03",
      label: "Understand",
      title: "Make sense of your results",
      body: "Combine your assessment with your personal health and lifestyle context.",
      cta: "Book Consultation",
      href: "/discovery",
    },
    {
      id: "04",
      label: "Change",
      title: "Build your personalised brain-health strategy",
      body: "Work systematically on the areas that matter most to you.",
      cta: "Explore the 12-Month Programme",
      href: "/programme",
    },
    {
      id: "05",
      label: "Track",
      title: "See what changes",
      body: "Use the NeuroNourish app, ongoing coaching and reassessment to monitor progress over time.",
      cta: "How the app works",
      href: "/how-the-app-works",
    },
  ] as const,
} as const;

export const NN_ASSESSMENT_FOLD = {
  eyebrow: "Measure",
  headline: "Establish your cognitive baseline",
  subtext:
    "An online cognitive assessment that moves you from self-reported lifestyle information to objective measurement across memory, attention, processing speed and executive function.",
  price: "€89.99",
  cta: "Measure My Cognition",
  ctaHref: "/shop/cognitive-assessment",
  ctaHint: "Online · Clinician-reviewed summary",
} as const;

export const NN_PROGRAMME_FOLD = {
  eyebrow: "Change",
  headline: "The 12-month High-Touch Programme",
  subtext:
    "A personalised brain-health programme designed to help you understand, improve and track the modifiable factors influencing your cognitive health.",
  price: "€3,500",
  priceHint: "for 12 months · Payment options available",
  cta: "Apply for the Programme",
  ctaHref: "/discovery",
  secondaryCta: "See what’s included",
  secondaryHref: "/programme",
} as const;

export const NN_QUIZ_FOLD = {
  eyebrow: "Your Brain Health Profile",
  headline: "Discover Your Brain Health Score",
  subtext:
    "18 questions to help you understand the lifestyle and health behaviours supporting your brain today.",
  benefits: [
    "Understand the lifestyle factors that may be influencing your brain",
    "Build your personal Brain Health Profile",
    "Get clear, practical next steps — not a medical diagnosis",
  ],
  disclaimer: "This is not a medical diagnosis and not a dementia-risk score.",
  cta: "Discover My Score",
  ctaHint: "Free · About 3 minutes · Personalised results",
  badge: "Brain Health Profile",
  previewLabel: "Sample questions",
  previewStatMinutes: "3 min",
  previewStatMinutesLabel: "Average completion",
  previewStatQuestionsLabel: "Evidence-led questions",
  /** Keep preview short so the full 18-question quiz stays intriguing. */
  previewQuestionCount: 2,
} as const;

export interface JourneyStep {
  id: number;
  benefitFocus: string;
  title: string;
  highlights: string[];
}

export const NN_JOURNEY_STEPS: JourneyStep[] = [
  {
    id: 1,
    benefitFocus: "Establish your baseline first.",
    title: "Full Intake & Lifestyle Timeline",
    highlights: [
      "Medical history, lifestyle, nutrition, symptoms, and goals",
      "Patterns that establish your baseline",
      "A clear starting point before any recommendations",
    ],
  },
  {
    id: 2,
    benefitFocus: "Recommendations informed by your clinical data.",
    title: "Comprehensive Blood Work Review",
    highlights: [
      "Nutritional, metabolic, hormonal, and inflammatory factors",
      "Brain-health context for every finding",
      "Evidence over assumptions",
    ],
  },
  {
    id: 3,
    benefitFocus: "Know your starting point with confidence.",
    title: "Clinically Validated Cognitive Assessment",
    highlights: [
      "Montreal Cognitive Assessment (MoCA) where appropriate",
      "A meaningful baseline for your journey",
      "Track change over the full programme",
    ],
  },
  {
    id: 4,
    benefitFocus: "Eating habits that support lifelong brain health.",
    title: "Personalised Nutrition Programme",
    highlights: [
      "Meal planning and macro adjustments",
      "Food compliance coaching",
      "Practical guidance for your lifestyle",
    ],
  },
  {
    id: 5,
    benefitFocus: "Habits that support long-term cognitive health.",
    title: "Brain Health Lifestyle Strategy",
    highlights: [
      "Sleep, movement, stress, and light exposure",
      "Daily routines designed around your life",
      "Support for mental wellbeing",
    ],
  },
  {
    id: 6,
    benefitFocus: "Only what is appropriate and purposeful.",
    title: "Supplementation Guidance",
    highlights: [
      "Personalised from your health history",
      "Informed by clinical findings",
      "No generic vitamin regimes",
    ],
  },
  {
    id: 7,
    benefitFocus: "Progress does not happen in sessions alone.",
    title: "Ongoing Monitoring & App Tracking",
    highlights: [
      "Regular check-ins and personalised guidance",
      "Daily tracking in the NeuroNourish App",
      "Accountability between appointments",
    ],
  },
];

export interface JourneyTimelineStep {
  id: number;
  title: string;
  summary: string;
  phase: string;
  timing: string;
}

export const NN_JOURNEY_TIMELINE: JourneyTimelineStep[] = [
  {
    id: 1,
    phase: "Understand",
    timing: "Start",
    title: "Full Intake & Lifestyle Timeline",
    summary:
      "Every programme begins with a comprehensive review of your medical history, lifestyle, nutrition, symptoms, and health goals to help us identify patterns and establish your baseline.",
  },
  {
    id: 2,
    phase: "Understand",
    timing: "Clinical",
    title: "Comprehensive Blood Work Review",
    summary:
      "We analyse your blood work to understand the nutritional, metabolic, hormonal, and inflammatory factors that contribute to brain health, ensuring every recommendation is informed by your clinical data.",
  },
  {
    id: 3,
    phase: "Understand",
    timing: "Baseline",
    title: "Clinically Validated Cognitive Assessment",
    summary:
      "Your programme includes evidence-based cognitive assessments using the Montreal Cognitive Assessment (MoCA), where appropriate, to establish a baseline and track meaningful changes throughout your journey.",
  },
  {
    id: 4,
    phase: "Personalise",
    timing: "Nutrition",
    title: "Personalised Nutrition Programme",
    summary:
      "Receive an individual nutrition strategy, including meal planning, macro adjustments, food compliance coaching, and practical guidance designed around your needs and lifestyle.",
  },
  {
    id: 5,
    phase: "Personalise",
    timing: "Lifestyle",
    title: "Brain Health Lifestyle Strategy",
    summary:
      "We create personalised strategies for sleep, movement, stress, light exposure, and daily routines that support brain health, improve mental wellbeing, and help you build habits for long-term cognitive health.",
  },
  {
    id: 6,
    phase: "Personalise",
    timing: "Support",
    title: "Supplementation Guidance",
    summary:
      "Recommendations are personalised using your health history and clinical findings to ensure supplementation is appropriate and purposeful.",
  },
  {
    id: 7,
    phase: "Optimise",
    timing: "Ongoing",
    title: "Ongoing Monitoring & App Tracking",
    summary:
      "Through regular check-ins, personalised guidance, and daily tracking inside the NeuroNourish App, you receive ongoing support, accountability, and real-time insight into your cognitive, nutritional, and lifestyle progress.",
  },
];

export const NN_JOURNEY_METHOD = [
  {
    step: 1,
    title: "Understand",
    body: "We begin by building a complete picture of your brain health. Through your motivations, medical history, blood results, cognitive assessment results and lifestyle analysis, we identify the factors that matter most to you.",
  },
  {
    step: 2,
    title: "Personalise",
    body: "Using your results, we create a personalised programme combining nutrition, lifestyle medicine, targeted supplementation and behaviour change coaching to support your brain health.",
  },
  {
    step: 3,
    title: "Optimise",
    body: "Your programme evolves as you do. Through ongoing coaching, app tracking and regular reviews, we monitor your progress, refine your plan and help you build habits that support lifelong cognitive health.",
  },
] as const;

export const NN_JOURNEY = {
  eyebrow: "The NeuroNourish Method",
  headline: "A personalised programme built around you.",
  subtext:
    "No two brains are the same, which is why no two NeuroNourish programmes are either. We shape every recommendation by your health history, blood biomarkers, cognitive assessment, lifestyle and personal goals.",
  method: NN_JOURNEY_METHOD,
  timeline: NN_JOURNEY_TIMELINE,
  steps: NN_JOURNEY_STEPS,
  cta: "Find Your Programme",
  ctaHint: "Compare High-Touch, Guided, and Self-Led",
  shopSoft: "",
  shopCta: "",
} as const;

export interface WhyBenefit {
  icon: "science" | "programme" | "clinical" | "progress" | "support" | "flexible";
  title: string;
  description: string;
  learnMoreHref?: string;
}

export const NN_WHY_BENEFITS: WhyBenefit[] = [
  {
    icon: "science",
    title: "Evidence-based root cause approach",
    description:
      "We do not focus on symptoms alone. We explore the nutritional, metabolic, inflammatory, and lifestyle factors too.",
  },
  {
    icon: "programme",
    title: "A complete 360° brain health programme",
    description:
      "Nutrition, biomarkers, cognitive assessments, supplementation, lifestyle medicine, and coaching work together to create a personalised programme for you.",
  },
  {
    icon: "clinical",
    title: "Clinical expertise you can trust",
    description:
      "Every programme is developed with clinical oversight, functional nutrition expertise, and collaboration with CORU-registered dietitians to ensure recommendations are evidence-informed.",
  },
  {
    icon: "progress",
    title: "Built in phases for lasting change",
    description:
      "Your programme begins with intensive coaching and regular check-ins before transitioning into structured long-term support. Every stage is designed to help you build lasting habits and measurable progress.",
  },
  {
    icon: "flexible",
    title: "Choose how you meet with us",
    description:
      "Access expert support in person or online through secure consultations that fit around your lifestyle.",
  },
  {
    icon: "support",
    title: "Dedicated coaching and accountability",
    description:
      "Regular one-to-one coaching, personalised guidance, and expert accountability help you stay consistent and make meaningful progress throughout your programme.",
  },
];

export const NN_WHY = {
  headline: "Why NeuroNourish?",
  subtext:
    "Six reasons adults choose a structured, evidence-led approach to brain health.",
  benefits: NN_WHY_BENEFITS,
  cta: "Find Your Programme",
  ctaHint: "Compare tiers and what is included",
} as const;

export const NN_OUTCOMES = {
  eyebrow: "Client stories",
  headline: "What people notice when they have a plan",
  subtext:
    "NeuroNourish combines measurement, personalised support and ongoing tracking — without promising to diagnose or prevent dementia.",
  /** Pending source audit — do not present as validated NeuroNourish outcome claims until verified. */
  statsPendingAudit: true,
  stats: [
    { value: "4.4", label: "Average-point improvement in cognitive scores over 12 months" },
    { value: "73%", label: "Improved on family-reported symptom assessments" },
    { value: "63%", label: "Improved on comprehensive cognitive testing" },
    { value: "72%", label: "Stability or improvement in executive functioning" },
  ],
  outcomes: [
    "Better concentration",
    "Less brain fog",
    "More confidence",
    "Better sleep",
    "Improved energy",
    "Clearer memory",
    "Healthier biomarkers",
  ],
  clinicalPartners: [
    {
      name: "Head Diagnostics",
      logo: "/brand/logos/clinical/head-diagnostics.png",
      width: 180,
      height: 45,
    },
    {
      name: "Apollo Health",
      logo: "/brand/logos/clinical/apollo-health.png",
      width: 140,
      height: 48,
    },
    {
      name: "Genova Diagnostics",
      logo: "/brand/logos/clinical/genova.png",
      width: 150,
      height: 48,
    },
    {
      name: "BrainHQ",
      logo: "/brand/logos/clinical/brainhq.png",
      width: 120,
      height: 48,
    },
    {
      name: "Kenko Health",
      logo: "/brand/logos/clinical/kenko-health.png",
      width: 120,
      height: 48,
    },
    {
      name: "CNS Vital Signs",
      logo: "/brand/logos/clinical/cns-vital-signs.png",
      width: 150,
      height: 48,
    },
    {
      name: "MoCA",
      logo: "/brand/logos/clinical/moca.png",
      width: 130,
      height: 48,
    },
  ],
  clinicalPartnersEyebrow: "Our clinical delivery partners",
  testimonial: {
    quote:
      "I finally understand what's actually happening with my brain — and I have a plan that fits my life.",
    attribution: "Programme client, Dublin",
  },
  disclaimer:
    "Not a guarantee of outcomes. Clinical results depend on individual health, adherence, and medical context. Biomarker impact figures will be published as quarterly review data accumulates.",
  cta: "Buy Cognitive Assessment",
  ctaHint: "€89.99 · Remote CNS Vital Signs baseline",
  ctaHref: "/shop/cognitive-assessment",
} as const;

export const NN_FOUNDER_TRUST = {
  /** Logos only — Emer Version 2 Vision fold. */
  items: [
    {
      label: "Sunday Times",
      detail: "",
      logo: "/brand/logos/trust/sunday-times.png",
      width: 96,
      height: 48,
    },
    {
      label: "Irish Independent",
      detail: "30 Under 30",
      logo: "/brand/logos/trust/irish-independent.png",
      width: 140,
      height: 40,
    },
    {
      label: "The Anglo-Celt",
      detail: "",
      logo: "/brand/logos/trust/anglo-celt.png",
      width: 130,
      height: 40,
    },
    {
      label: "NovaUCD",
      detail: "",
      logo: "/brand/logos/trust/novaucd.png",
      width: 140,
      height: 40,
    },
    {
      label: "Enterprise Ireland",
      detail: "",
      logo: "/brand/logos/trust/enterprise-ireland.png",
      width: 140,
      height: 48,
    },
    {
      label: "InterTradeIreland",
      detail: "",
      logo: "/brand/logos/trust/intertradeireland.png",
      width: 150,
      height: 40,
    },
    {
      label: "Local Enterprise Office",
      detail: "",
      logo: "/brand/logos/trust/local-enterprise-office.png",
      width: 150,
      height: 40,
    },
    {
      label: "DkIT",
      detail: "",
      logo: "/brand/logos/trust/dkit.png",
      width: 120,
      height: 48,
    },
    {
      label: "TU Dublin",
      detail: "",
      logo: "/brand/logos/trust/tu-dublin.png",
      width: 140,
      height: 48,
    },
    {
      label: "IINH",
      detail: "Nutrition & Health",
      logo: "/brand/logos/trust/iinh.png",
      width: 96,
      height: 48,
    },
  ],
} as const;

export const NN_CREDENTIAL_LOGOS = {
  eyebrow: "Credentials & training",
  strip: {
    label: "Professional accreditations",
    logo: "/brand/logos/credentials/accreditations.png",
    width: 720,
    height: 180,
  },
  items: [
    {
      label: "IINH",
      detail: "Health Coach",
      logo: "/brand/logos/trust/iinh.png",
      width: 96,
      height: 48,
    },
    {
      label: "TU Dublin",
      detail: "BSc Nutraceuticals",
      logo: "/brand/logos/trust/tu-dublin.png",
      width: 140,
      height: 48,
    },
    {
      label: "Apollo Health",
      detail: "ReCODE practitioner",
      logo: "/brand/logos/clinical/apollo-health.png",
      width: 140,
      height: 48,
    },
    {
      label: "Irish Independent",
      detail: "30 Under 30",
      logo: "/brand/logos/trust/irish-independent.png",
      width: 140,
      height: 40,
    },
  ],
} as const;

export const NN_APP = {
  eyebrow: "NeuroNourish app",
  headline: "Small Daily Habits. Meaningful Long-Term Progress.",
  subtext:
    "Your health does not stand still between appointments, and neither should your support. The companion app is included for programme clients. It is not available for public download.",
  benefits: [
    "Track meals, sleep, movement and mood daily",
    "Real-time habit compliance scoring",
    "Practitioner insights between sessions",
    "Personalised programme adjustments over time",
  ],
  previewMetrics: [
    { label: "Sleep", value: "7h 20m", pct: 85 },
    { label: "Meals", value: "On plan", pct: 92 },
    { label: "Movement", value: "6,400 steps", pct: 78 },
    { label: "Mood", value: "Calm & focused", pct: 88 },
  ],
  habitStreakDays: 12,
  weeklyScore: 87,
  previewStats: [
    { value: "12", label: "Habit streak", suffix: "days" },
    { value: "87", label: "Weekly score", suffix: "%" },
  ],
  cta: "Find Your Programme",
  ctaHint: "App access is included for programme clients",
  badge: "Companion app",
  caption: "Meals · sleep · movement · mood",
  previewImage: "/brand/app-dashboard-preview.png",
  previewImageAlt: "NeuroNourish companion app habit tracking preview",
} as const;

export const NN_PARTNERS = {
  eyebrow: "Partners",
  headline: "Research and innovation partners",
  subtext: "",
  footnote:
    "Programmes developed with leading Irish research, clinical, and innovation partners.",
  groups: [
    {
      label: "Research partners",
      partners: [
        {
          name: "NovaUCD",
          logo: "/brand/logos/trust/novaucd.png",
          href: "https://novaucd.ie",
          width: 160,
          height: 48,
        },
        {
          name: "Dundalk Institute of Technology",
          logo: "/brand/logos/trust/dkit.png",
          href: "https://www.dkit.ie",
          width: 120,
          height: 48,
        },
        {
          name: "TU Dublin",
          logo: "/brand/logos/trust/tu-dublin.png",
          href: "https://www.tudublin.ie",
          width: 140,
          height: 48,
        },
      ],
    },
    {
      label: "Supported by",
      partners: [
        {
          name: "Enterprise Ireland",
          logo: "/brand/logos/trust/enterprise-ireland.png",
          width: 150,
          height: 48,
        },
        {
          name: "InterTradeIreland",
          logo: "/brand/logos/trust/intertradeireland.png",
          href: "https://intertradeireland.com",
          width: 160,
          height: 48,
        },
        {
          name: "Local Enterprise Office",
          logo: "/brand/logos/trust/local-enterprise-office.png",
          width: 160,
          height: 48,
        },
      ],
    },
  ],
} as const;

export const NN_B2B = {
  eyebrow: "Healthcare partnerships",
  headline: "Helping Healthcare Organisations Deliver Preventive Brain Health",
  subtext:
    "We partner with healthcare providers, private clinics, employers, and integrated care organisations to deliver scalable, evidence-based cognitive health programmes.",
  audiences: [
    "Private clinics",
    "GP & neurology practices",
    "Employers & OH teams",
    "Integrated care orgs",
  ],
  pillars: [
    {
      icon: "report" as const,
      title: "Structured clinical reporting",
      description:
        "GP-ready summaries, biomarker interpretation, and 12-month longitudinal tracking with consent.",
    },
    {
      icon: "integration" as const,
      title: "Seamless care integration",
      description:
        "CORU-supervised nutrition protocols that complement existing neurology and primary care workflows.",
    },
    {
      icon: "outcomes" as const,
      title: "Adherence & measurable outcomes",
      description:
        "App-based habit tracking and objective cognitive monitoring between clinical touchpoints.",
    },
  ],
  highlights: [
    "White-label and employer programme options",
    "Secure virtual delivery across Ireland & UK",
    "Research collaboration via NovaUCD & DkIT",
  ],
  stats: [
    { value: "12 mo", label: "Structured programme" },
    { value: "IE & UK", label: "Virtual delivery" },
    { value: "4", label: "Partnership models" },
  ],
  cta: "Contact Partnership Team",
  ctaHint: "Clinic, employer, and integrated care pilots available",
  ctaSecondary: "Contact Partnership Team",
} as const;

export const NN_CLINICS = {
  eyebrow: "For clinicians & organisations",
  headline: NN_B2B.headline,
  subtext: NN_B2B.subtext,
  heroCtaHint: "10-minute clinical briefing · No obligation",
  partnersEyebrow: "Clinical & research partners",
  partnersHeadline: "Built with recognised clinical and innovation partners",
  referral: {
    eyebrow: "How referral works",
    headline: "Zero operational burden on your team",
    subtext:
      "You identify the patient. We run the programme. You receive structured progress reports.",
    steps: [
      {
        title: "Identify",
        body: "Flag patients with early memory concerns, cognitive fatigue, or strong family history of neurodegenerative conditions.",
      },
      {
        title: "Refer",
        body: "Share our referral card or intake link — about 60 seconds. We handle biomarkers, cognitive mapping, and coaching.",
      },
      {
        title: "We report back",
        body: "GP-ready longitudinal summaries return to your practice at key milestones, with patient consent.",
      },
    ],
  },
  pillars: [
    {
      title: "Structured Clinical Reporting",
      highlights: [
        "Cognitive assessment summaries for your patients",
        "Biomarker interpretation with lifestyle context",
        "GP-ready progress reports with consent",
        "Longitudinal tracking over 12 months",
      ],
    },
    {
      title: "Seamless Care Integration",
      highlights: [
        "Complements existing neurology & primary care",
        "CORU dietitian-supervised nutrition protocols",
        "Secure virtual delivery across Ireland & UK",
        "Workflow-aligned referral pathways",
      ],
    },
    {
      title: "Patient Adherence & Outcomes",
      highlights: [
        "App-based daily habit tracking",
        "Coaching accountability between visits",
        "Objective cognitive & biomarker monitoring",
        "Prevention-focused — not crisis intervention",
      ],
    },
    {
      title: "Partnership Models",
      highlights: [
        "Private clinic white-label options",
        "Employer & occupational health programmes",
        "Integrated care organisation pilots",
        "Research collaboration via NovaUCD & DkIT",
      ],
    },
  ],
  cta: "Contact Partnership Team",
  referralCardLink: "Download printable referral card",
} as const;

export const NN_CLINICAL_REFERRAL_CARD = {
  spec: {
    dimensions: "99mm × 210mm (DL), double-sided",
    stock: "350gsm matte premium cardstock",
    finish: "Clean tactile matte — no high-gloss laminate (allows handwritten notes)",
    palette: "Ivory background, dark slate typography, gold accent borders",
  },
  front: {
    kicker: "A structured lifestyle referral pathway for cognitive wellness",
    audience:
      "For patients presenting with early memory concerns, cognitive fatigue, or a strong family history of neurodegenerative conditions.",
    referTitle: "How to refer a patient in 60 seconds",
    steps: [
      {
        title: "Direct access",
        body: "Provide the patient with this card or direct them to our secure intake portal.",
      },
      {
        title: "Secure clinical intake",
        body: "Email basic demographic details or your standard referral letter directly to our secure clinical tracking inbound link:",
      },
    ],
    referralEmail: "referrals@neuronourish.clinic",
    manageTitle: "What we manage",
    manageItems: [
      "Deep metabolic, hormonal, and systemic inflammatory biomarker panels",
      "Standardized, objective cognitive baseline mapping (MoCA framework)",
      "Intensive 12-month lifestyle architecture and behavioral accountability",
      "Comprehensive, continuous nutritional design under CORU dietetic review",
    ],
  },
  back: {
    headline: "Closing the pathway loop with your practice",
    intro:
      "We function as a collaborative extension of your primary care model. Our programmes focus entirely on optimizing modifiable lifestyle risks, placing zero administrative or clinical time burdens on your staff.",
    guaranteeTitle: "Our clinical outcome oversight guarantee",
    guarantees: [
      {
        title: "Primary care autonomy",
        body: "NeuroNourish does not manage acute pathology or alter any of your primary pharmaceutical treatments.",
      },
      {
        title: "Structured longitudinal reports",
        body: "A detailed copy of your patient's biomarker shifts and cognitive progress is automatically delivered back to your practice at Months 3, 6, and 12.",
      },
      {
        title: "Direct case escalation",
        body: "If red-flag neurological indicators emerge during our continuous monitoring, the patient is instantly routed back to your clinic with data tracking attached.",
      },
    ],
    contactTitle: "Contact the medical liaison team",
    phone: "+353 (01) XXX XXXX",
    location: "Secure clinic base: NovaUCD, Dublin 4",
    portalLabel: "Web portal for partner practices",
  },
} as const;

export const NN_CLINICIAN_PARTNERSHIP = {
  formEyebrow: "Partner with NeuroNourish",
  formHeadline: "Request a Clinical Briefing",
  formSubtext:
    "Share your practice details and our medical liaison team will send a clinical overview and schedule a 10-minute briefing call.",
  roleLabel: "Your practice type",
  clinicNameLabel: "Business / clinic name",
  clinicNamePlaceholder: "e.g. Riverside Medical Centre",
  emailLabel: "Business email",
  roleOptions: [
    { value: "gp_practice", label: "GP / primary care practice" },
    { value: "neurology_clinic", label: "Neurology or memory clinic" },
    { value: "dietitian_clinic", label: "Independent dietitian / allied health" },
    { value: "employer_oh", label: "Employer / occupational health" },
    { value: "other_clinic", label: "Other healthcare organisation" },
  ],
  consent:
    "I agree to be contacted about NeuroNourish healthcare partnership pathways and clinical briefing materials.",
  submitLabel: "Contact Partnership Team",
  successMessage:
    "Thank you. Our clinical liaison team will send partnership materials and briefing options within one business day.",
} as const;

export const NN_CLINICIAN_FAQ = {
  headline: "Your Questions, Answered.",
  items: [
    {
      q: "How does the NeuroNourish programme integrate into my existing clinic workflow?",
      a: "Our referral pathway is engineered to place zero operational burden on your administrative or clinical staff. When you identify an eligible patient concerned about cognitive longevity or metabolic risk factors, you simply provide them with our structured referral link or complete a 60-second intake note on our platform. From that point, our team handles all baseline biomarker coordination, digital cognitive mapping, and continuous 12-month lifestyle coaching. We close the communication loop by delivering structured, longitudinal progress reports directly back to your primary care practice at key baseline milestones.",
    },
    {
      q: "Where does the clinical line of responsibility sit regarding patient outcomes?",
      a: "NeuroNourish functions strictly as a collaborative lifestyle medicine and functional nutrition provider; we do not alter primary medical prescriptions or manage acute pathology. All of our personalized nutritional protocols are directly supervised by qualified, CORU-registered dietitians and nutrition scientists who act as an extension of your care network. Your medical practice retains complete sovereign clinical oversight over the patient's primary medical treatments, while our software and coaching ecosystem focus entirely on optimizing the modifiable, everyday lifestyle variables that support long-term neuroprotection.",
    },
    {
      q: "What specific scientific validation underlies your 12-month protocol?",
      a: "Our interventions are rooted in robust, peer-reviewed clinical frameworks for dementia prevention—specifically aligning with multi-modal lifestyle modification strategies like the FINGER study and precision biomarker models. Rather than relying on static or generalized wellness metrics, we utilize clinically validated tools like the Montreal Cognitive Assessment (MoCA) to establish clear functional baselines. By continually analyzing objective biomarker panels tracking systemic metabolic, inflammatory, and endocrine terrain over a full annual cycle, we ensure every lifestyle optimization is driven by measurable data rather than clinical assumptions.",
    },
  ],
} as const;

export const NN_B2B_LINKEDIN_OUTREACH = {
  gp: {
    subject: "Supporting cognitive health referrals at scale / NeuroNourish Clinic",
    body: `Hi [Dr. Last Name],

I know how demanding managing short consultation windows can be, especially with a rising numbers of patients presenting with early memory anxiety and concerns regarding long-term dementia risk.

While primary care schedules rarely allow for the intensive, continuous lifestyle management these patients need, our team at NeuroNourish has built a structured solution to bridge that specific care gap.

Operating from NovaUCD, we provide an evidence-led, 12-month Personalised Brain Health Programme that acts as a direct extension of your practice. We coordinate advanced biomarker reviews, map digital cognitive baselines, and deliver intensive lifestyle coaching under CORU dietetic supervision.

We ensure your network remains aligned by sending clear, longitudinal data reports back to your practice, giving you complete visibility over patient outcomes without drawing on your clinic's valuable time.

I would love to send a brief 2-page clinical overview to your practice manager this week. Would you be open to a quick look?

Kind regards,

Emer Sexton
Founder & CEO, NeuroNourish`,
  },
  dietitian: {
    subject: "Clinical decision-support for neuroprotection pathways",
    body: `Hi [First Name],

I came across your practice profile and wanted to connect regarding a structural challenge many functional nutrition professionals face: the lack of an integrated system to track metabolic data alongside cognitive health baselines.

At NeuroNourish, we have developed an AI-powered clinical decision-support platform designed to synthesize complex biomarker panels with objective cognitive monitoring tools.

We partner with independent specialist clinics and dietitians across Ireland, providing automated clinical reporting frameworks and longitudinal tracking metrics that prove the real-world efficacy of your nutritional interventions over 12 months.

We are currently establishing delivery partnerships ahead of our upcoming August cohort launch. I would value the opportunity to show you a brief 5-minute video walkthrough of our platform workflow.

Are you open to exploring a collaborative partnership?

Best regards,

Emer Sexton
Founder & CEO, NeuroNourish`,
  },
} as const;

export const NN_B2B_LINKEDIN_HR_FOLLOWUP = {
  meta: {
    channel: "LinkedIn organic direct message",
    audience: [
      "Human Resource Directors",
      "Chief People Officers",
      "Corporate Wellness Directors",
    ],
    positioning:
      "High-value performance strategy for executive burnout, focus loss, and brain fog — not generic wellness sales language.",
    cohortWindow: "August clinical intake cohort",
  },
  cold: {
    executiveBurnout: {
      id: "executive-burnout-focus",
      label: "The Executive Burnout & Focus Solution (Cold Connections)",
      subject: "Managing executive brain fog and performance loss / NeuroNourish",
      body: `Hi [First Name],

I know that your team is constantly looking for ways to protect workforce productivity, but there is one critical factor that standard corporate wellness programs consistently overlook: the measurable cost of executive brain fog and chronic cognitive fatigue.

When senior leaders and key professionals experience persistent drops in mental stamina, it directly impacts your organization's decision-making speed and overall operational efficiency.

At NeuroNourish, we have built a technology-enabled platform that turns cognitive wellness into a trackable company asset. Operating from NovaUCD, we deliver precise lifestyle medicine architecture, sleep optimization protocols, and personal health coaching designed seamlessly around the demanding schedules of busy executives.

We are currently structuring custom population wellness pathways for our upcoming August clinical intake cohort. I would love to share our brief, 2-page Enterprise Outcome Briefing outlining how we track and improve workforce focus metrics over 12 months.

Are you open to a brief 10-minute introductory call next Tuesday to see if this is a fit for your team?

Best regards,

Emer Sexton
Founder & CEO, NeuroNourish`,
    },
    longevityAsset: {
      id: "longevity-asset-alignment",
      label: "The Longevity Asset Alignment (For Forward-Thinking Cultures)",
      subject: "Cognitive longevity as an enterprise asset",
      body: `Hi [First Name],

I came across your profile and noticed your proactive focus on building high-performance workspace cultures.

We spend decades of our professional careers meticulously planning and investing financially for retirement. Yet, very few organizations provide senior executives with a clear, evidence-based strategy to protect the actual health of the brain they rely on to make daily decisions.

NeuroNourish bridges this care gap by translating complex clinical neuroscience into practical, daily actions. Our 12-month programme combines advanced biomarker reviews with personalised nutrition frameworks and daily habit tracking to protect mental clarity and long-term independence.

We are currently establishing corporate partner integrations for our upcoming August intake window. I would value the opportunity to share a short 5-minute video walkthrough detailing how our software tracks and improves cognitive stamina metrics at scale.

Are you open to a brief introductory conversation this week?

Kind regards,

Emer Sexton
Founder & CEO, NeuroNourish`,
    },
  },
  followUp: {
    subject: "Workplace Cognitive Performance Overview / NeuroNourish",
    body: `Hi [First Name],

Following up on our recent communication regarding workforce well-being, I wanted to share a specific angle that traditional employee wellness benefits frequently miss: the measurable cost of executive brain fog and chronic cognitive fatigue.

When senior leaders and key professionals experience persistent drops in mental stamina or focus, it directly impacts organizational decision-making speed and overall operational efficiency.

At NeuroNourish, we partner with corporate organizations to turn cognitive wellness into a trackable asset. Our technology-enabled platform delivers precise lifestyle medicine architecture, sleep optimization protocols, and personal health coaching designed seamlessly around the schedules of busy executives.

We are currently structuring custom population wellness paths for our upcoming August intake cohort. I would love to share our brief, 2-page Enterprise Outcome Briefing outlining how we track and improve workforce focus metrics over 12 months.

Are you open to a brief 10-minute introductory call next Tuesday to explore an integration for your team?

Best regards,

Emer Sexton
Founder & CEO, NeuroNourish`,
  },
} as const;

/** LinkedIn organic outreach — corporate wellness directors (Sage tone, outcome metrics). */
export const NN_CORPORATE_WELLNESS_LINKEDIN_ORGANIC = {
  channel: "LinkedIn organic direct message",
  audience: [
    "Corporate Wellness Directors",
    "Human Resource Directors",
    "Chief People Officers",
  ],
  tone: "Sage — objective performance metrics; no low-value commercial pitches",
  cohortWindow: "August clinical intake cohort",
  angles: [
    {
      id: "executive-burnout-stamina",
      name: "The Executive Burnout & Stamina Angle",
      format: "Direct inbound message",
      subject: "Addressing executive brain fog and performance loss / NeuroNourish",
      body: `Hi [First Name],

I know that your team is constantly looking for ways to protect workforce productivity, but there is one critical factor that standard corporate wellness benefits consistently overlook: the measurable operational cost of executive brain fog and chronic cognitive fatigue.

When senior leaders and key professionals experience persistent drops in mental stamina, it directly impacts your organization's decision-making speed, strategic execution, and overall efficiency.

At NeuroNourish, we have built a technology-enabled platform that turns cognitive wellness into a trackable company asset. Operating from NovaUCD, we combine advanced biomarker reviews with precise lifestyle medicine and personal health coaching designed seamlessly around the demanding schedules of busy executives.

We are currently structuring custom population wellness pathways for our upcoming August clinical intake cohort. I would love to share our brief, 2-page Enterprise Outcome Briefing outlining how we track and improve workforce focus metrics over 12 months.

Are you open to a brief, 10-minute introductory call next Tuesday to see if this is a strategic fit for your team?

Best regards,

Emer Sexton
Founder & CEO, NeuroNourish`,
    },
    {
      id: "talent-longevity-asset",
      name: "The Modern Talent Longevity Pivot",
      format: "The asset framing",
      subject: "Managing cognitive longevity as an enterprise asset",
      body: `Hi [First Name],

I came across your profile and noticed your proactive focus on building high-performance workspace cultures.

We spend decades of our professional careers meticulously planning, investing, and calculating financially for retirement. Yet, very few organizations provide senior executives with a clear, evidence-based strategy to protect the actual health of the brain they rely on to make daily high-stakes decisions.

NeuroNourish bridges this care gap by translating complex clinical neuroscience into practical, daily actions. Our 12-month program combines advanced biomarker reviews with personalized nutrition frameworks and daily habit tracking to protect mental clarity and long-term independence.

We are currently establishing corporate partner integrations for our upcoming August intake window. I would value the opportunity to share a short 5-minute video walkthrough detailing how our software tracks and improves cognitive stamina metrics at scale.

Are you open to a brief introductory conversation this week?

Kind regards,

Emer Sexton
Founder & CEO, NeuroNourish`,
    },
  ],
} as const;

/** Alias for organic outreach matrix — cold angles + HR follow-up. */
export const NN_CORPORATE_WELLNESS_LINKEDIN_MATRIX = {
  ...NN_CORPORATE_WELLNESS_LINKEDIN_ORGANIC,
  cold: NN_B2B_LINKEDIN_HR_FOLLOWUP.cold,
  followUp: NN_B2B_LINKEDIN_HR_FOLLOWUP.followUp,
  meta: NN_B2B_LINKEDIN_HR_FOLLOWUP.meta,
} as const;

export const NN_ORGANIC_SOCIAL_VIDEOS = {
  platforms: ["LinkedIn", "Instagram", "TikTok"] as const,
  tone: "Compassionate Caregiver + Authoritative Sage — authentic, grounded, jargon-free, human-first",
  visualGoal:
    "Warm, conversational, cinematic, and professional. Bright modern clinic or home office setting.",
  videos: [
    {
      id: "pension-analogy",
      title: "The Pension Analogy (The Pattern Interrupter)",
      targetLength: "60 seconds",
      visualDirection:
        "Emer sitting casually at a clean wooden desk, looking directly at the camera. Minimalist editing, natural lighting, warm clinical background.",
      beats: [
        {
          timing: "00–15s",
          visual:
            "Close-up shot. Emer holds up a phone displaying a standard financial investment chart, then sets it down.",
          script:
            "We spend decades of our lives meticulously planning, saving, and investing financially for our retirement. We look at savings portfolios, pensions, and property. But very few of us are ever handed a clear, evidence-based plan to protect the actual health of the brain we will completely rely on to enjoy that future.",
        },
        {
          timing: "15–35s",
          visual:
            "Camera angle shifts slightly to a medium profile shot. Emer leans in forward slightly, speaking with warm empathy.",
          script:
            "If you're in your 40s or 50s and you've noticed subtle changes—like persistent afternoon brain fog, slower mental processing speed, or moments of forgotten words—those aren't things you simply have to accept as an inevitable part of growing older. They are your biological signals to take proactive control.",
        },
        {
          timing: "35–60s",
          visual:
            "Return to the primary close-up shot. A clean, subtle text graphic appears on screen showing the site link.",
          script:
            "True cognitive protection happens when we replace worry with objective data. That's why we built NeuroNourish. We combine deep biomarker mapping with structured 12-month lifestyle programmes designed entirely around your unique biology. If you're ready to stop guessing about your cognitive future, click the link below, take our free 5-minute Brain Health Quiz, and let's discover your baseline today.",
        },
      ],
      onScreenCta: "Free 5-minute Brain Health Quiz",
    },
    {
      id: "core-root-cause",
      title: "The Core Root Cause (Educational Authority)",
      targetLength: "60 seconds",
      visualDirection:
        "Emer standing next to a minimalist tracking layout whiteboard displaying icon vectors for nutrition, sleep, and biomarkers. Clear delivery without complex academic jargon.",
      beats: [
        {
          timing: "00–20s",
          visual: "Medium shot. Emer gestures casually toward the lifestyle tracking icons.",
          script:
            "When people start noticing early memory changes or brain fog, the standard approach is to react by looking for a quick fix. We search for off-the-shelf supplements, unvalidated vitamin regimes, or a brief 30-day detox. But from a scientific standpoint, I need to be direct with you: your nervous system doesn't function that way.",
        },
        {
          timing: "20–40s",
          visual:
            "Close-up tracking shot. Emer's expression is calm, realistic, and deeply encouraging.",
          script:
            "Shifting complex metabolic baselines and building lasting neuroplasticity requires an extended, structured period of deliberate care. Your brain is fully capable of growing, adapting, and building resilient cognitive reserve at any stage of life—provided it has the right multi-pillar strategy tracking nutrition, biomarkers, and lifestyle architecture together.",
        },
        {
          timing: "40–60s",
          visual:
            "Medium shot. Emer places her hand over a smartphone displaying the NeuroNourish app UI dashboard.",
          script:
            "At NeuroNourish, we guide adults through a comprehensive 12-month Personalised Brain Health Programme backed by clinical data, not clinical assumptions. True cognitive resilience is built through small, guided daily habits over time. Head over to our profile, assess your lifestyle baseline with our 5-minute quiz, and secure an onboarding conversation with our care team.",
        },
      ],
      onScreenCta: "5-minute lifestyle baseline quiz",
    },
    {
      id: "personal-truth",
      title: "The Personal Truth (The Human Foundation)",
      targetLength: "75 seconds",
      visualDirection:
        "Deeply authentic, personal presentation. Emer in a natural setting, speaking with direct transparency about lived experience.",
      beats: [
        {
          timing: "00–25s",
          visual:
            "Tight close-up shot. Emer speaks with total transparency and vulnerability, maintaining strong eye contact.",
          script:
            "I came to brain health the hard way. In 2020, a severe cycling accident left me spending three years trying to rebuild a brain that simply wouldn't cooperate. My processing speed slowed dramatically, my working memory collapsed, and a university degree that should have taken four years took me seven. I understood what it feels like when your mind no longer works the way it should.",
        },
        {
          timing: "25–50s",
          visual: "Medium shot. Emer shifts to an optimistic, authoritative stance.",
          script:
            "While my journey began with an injury, I kept meeting people decades older describing the exact same gradual dimming—the persistent brain fog, the forgotten words, and the uncertainty those changes brought. I realized that the same evidence-based strategies that help a brain recover are the exact lifestyle changes that protect it early enough to make a meaningful difference.",
        },
        {
          timing: "50–75s",
          visual: 'Close-up shot. Text graphic callout: "Your Brain Is With You For Life."',
          script:
            "That insight became the structural foundation of NeuroNourish. Science alone doesn't change lives—personalized support does. Your brain is with you for your entire life; it deserves an individualized plan to thrive. If you carry a family history or have quiet concerns that something is shifting, don't wait for a crisis. Click the link in our bio, discover your baseline score, and let's protect your future independence together.",
        },
      ],
      onScreenCta: "Discover your baseline score",
    },
  ],
} as const;

export const NN_B2B_EMPLOYER_AUTO_RESPONSE = {
  subject: "Workplace Population Brain Wellness & Performance / NeuroNourish Clinic",
  ctaLabel: "Schedule a Corporate Wellness Briefing Call",
  body: `Dear [Contact Name],

Thank you for reaching out to the institutional partnership team at NeuroNourish.

In modern high-performance work environments, chronic cognitive fatigue, executive brain fog, and decision-making loss directly impact organizational productivity, retention, and workforce well-being. Despite this, standard corporate wellness frameworks rarely provide objective, data-driven strategies to actively support employee brain health.

NeuroNourish bridges this gap by translating complex clinical neuroscience into scalable, practical corporate wellness protocols.

We deliver evidence-based cognitive health mapping, advanced biomarker screening analytics, and structured lifestyle coaching programs designed to fit seamlessly into the lives of busy executives and professionals. Our custom technology platform helps employees track focus metrics, manage stress resilience, and optimize sleep architecture, turning cognitive health into a clear operational asset.

We are currently finalizing corporate implementation agreements ahead of our upcoming August intake cohort. To help us understand your population scope and health goals, we recommend scheduling a brief 10-minute briefing with our corporate liaison team.

You can select a convenient slot directly on our clinical calendar link below:

[ Schedule a Corporate Wellness Briefing Call ]

Alternatively, a member of our B2B partnership team will follow up directly with your human resources department within two business days to deliver our comprehensive corporate program overview package.

Thank you for your proactive commitment to your team's long-term cognitive vitality.

Best regards,

Emer Sexton
Founder & CEO, NeuroNourish`,
} as const;

export const NN_DISCOVERY = {
  brand: "NeuroNourish Clinic",
  eyebrow: "Discovery call",
  headline: "The First Step Is Simply a Conversation",
  subtext:
    "Whether you've completed our brain health quiz or are exploring options for the first time, book a discovery call to speak with our team about your goals.",
  highlights: [
    "15-minute complimentary intake conversation",
    "Talk through your goals, concerns, and fit for the programme",
    "No live quiz walkthrough — we focus on what matters next",
    "No obligation — collaborative care from day one",
  ],
  whatHappensTitle: "What happens on the call",
  whatHappens: [
    {
      step: "1",
      title: "Share your goals",
      detail: "We listen to what you're noticing — memory, focus, energy, or family history.",
    },
    {
      step: "2",
      title: "Understand your context",
      detail:
        "We discuss your lifestyle and priorities. We do not walk through quiz results line by line on this call.",
    },
    {
      step: "3",
      title: "See if it's a fit",
      detail: "We explain the 12-month pathway honestly — and only recommend next steps that make sense.",
    },
  ],
  formTitle: "Request your discovery call",
  formLead:
    "Share a few details and our care team will confirm a time by email — usually within one business day.",
  formIntroWithCalendly: "Can't find a slot? Leave your details and we'll confirm a time by email.",
  fallbackTitle: "Request your discovery call",
  fallback:
    "Share a few details and our care team will confirm a time by email — usually within one business day.",
  ctaContact: "Request a Call",
  ctaHint: "15 minutes · Complimentary · No obligation",
  calendlyTitle: "Pick a time that works",
  calendlySubtext:
    "Choose an open slot below. You'll get an email confirmation as soon as you book.",
  calendlyPrompt: "Load the calendar when you're ready — it only loads once, to keep this page fast.",
  calendlyButton: "Show available times",
  formIntro: "Prefer to leave your details? We'll confirm a time by email.",
  formSubmit: "Request my discovery call",
  successTitle: "Request received",
  successBody:
    "Thank you. Our care team will confirm a complimentary 15-minute discovery call by email — usually within one business day.",
  successQuizCta: "While you wait, take the brain health quiz",
  successQuizHint: "Free · 3 minutes · Helps us prepare for your call",
  quizAltTitle: "Not ready to talk yet?",
  quizAltBody: "Start with the free brain health quiz — then book a call when you're ready.",
  quizAltCta: "Take the Brain Health Quiz",
  faqTitle: "Before you book",
  faq: [
    {
      q: "Who will I speak with?",
      a: "A member of the NeuroNourish care team.",
    },
    {
      q: "Do I need quiz results first?",
      a: "No. The call focuses on your goals and fit — not a live walkthrough of quiz results. Your emailed report covers your score in detail.",
    },
    {
      q: "Is there any obligation?",
      a: "None. The call is complimentary. We only recommend next steps if the programme is a genuine fit.",
    },
  ],
  recoveredCard: {
    headline: "Welcome back — let's find a time that works",
    subtext:
      "Schedules change. Your quiz insights are still on file. Request a fresh 15-minute window below and we'll confirm by email.",
  },
  standardCard: {
    headline: "Schedule your complimentary discovery consultation",
    subtext:
      "Select an open time slot below to sit down with our care team, explore your goals, and determine if our 12-month pathway matches what you need.",
  },
  schedulingFooter: "You'll receive a calendar confirmation by email after booking.",
  preCallTitle: "Have ready before you join",
  preCall: [
    "A quiet 15 minutes and any recent health concerns you want to mention",
    "Your quiz score or emailed report if you have one (optional)",
    "Questions about assessment, programme tiers, or whether NeuroNourish is a fit",
  ],
  recoveredAssessmentCta: "Or continue to the cognitive assessment",
} as const;

/** Internal care-team script for the complimentary 15-minute discovery consultation (/discovery). */
export const NN_DISCOVERY_CALL_SCRIPT = {
  durationMinutes: 15,
  flow: [
    "Phase 1: Empathetic Grounding",
    "Phase 2: Active Biomarker Intake",
    "Phase 3: Shifting the Timeline",
    "Phase 4: Safe Boundary Commitment",
  ] as const,
  phases: [
    {
      id: "grounding",
      phase: 1,
      title: "The Warm Greeting & Empathetic Grounding",
      minuteRange: "00–03",
      goal:
        "Establish a safe environment, validate the client's experiences without pity, and outline the purpose of the call.",
      script: `Hello [Client Name], thank you for scheduling this time to connect. The purpose of our conversation today is very simple: we want to look at your current baseline, understand any specific cognitive changes or long-term concerns you have, and see if our 12-month programme is the right partnership for your life.

I reviewed your initial Brain Health Quiz inputs, and I want to validate what you shared. Experiencing persistent brain fog, slower thinking speed, or moments where words are forgotten can feel frustrating and isolating. But please understand that your brain is fully capable of adapting and building resilience at any stage of life—provided it has the right strategy. You are not helpless, and you are in the right place.`,
      crmNote: "Log primary emotional drivers and quiz score reference in case notes.",
    },
    {
      id: "intake",
      phase: 2,
      title: "Active Intake & Uncovering Modifiable Triggers",
      minuteRange: "03–08",
      goal:
        "Gather contextual data regarding history, family background, and modifiable lifestyle risk factors.",
      script: `To help me understand your unique biological profile, could you talk me through what you are noticing most on a daily basis? For example, does your mental energy drop at a specific time of day? Are you carrying a family history of cognitive decline that keeps you awake at night?

[Listen actively without interrupting. Note keywords for their primary concern in the CRM workspace.]

Thank you for sharing that. What you are describing highlights why standard wellness tips don't work. Your daily focus, sleep quality, and memory performance are directly connected to underlying systemic markers—such as your metabolic efficiency, glycemic balance, and silent inflammatory levels.`,
      crmNote: "Capture daily pattern, family history flag, and top modifiable trigger keywords.",
    },
    {
      id: "timeline",
      phase: 3,
      title: "Explaining the 12-Month Timeline Science",
      minuteRange: "08–12",
      goal:
        "Address objections regarding programme length and explain why short-term quick fixes fail the nervous system.",
      script: `This is exactly why we do not offer short-term fixes, generic supplement routines, or quick 30-day detoxes. Your nervous system simply does not function that way. Shifting complex metabolic baselines and building lasting neuroplasticity requires an extended, structured period of consistent care.

Our 12-month programme provides a complete, 360-degree approach. We bring your data to life using your custom NeuroNourish mobile app for daily meal and tracking inputs, paired with continuous 1-on-1 personal coaching. We begin with an intensive focus during the first three months to establish your core habits, followed by structured monitoring for the rest of your year to ensure your progress becomes a permanent foundation.`,
      crmNote: "Note any timeline or commitment objections for nurture follow-up.",
    },
    {
      id: "close",
      phase: 4,
      title: "Closing with Clear Next Steps & Boundaries",
      minuteRange: "12–15",
      goal:
        "Present a friction-free transition to the €90 clinical baseline assessment while maintaining strict capacity boundaries.",
      script: `Because we maintain rigorous clinical oversight and personalised coaching for every single participant, our active client cohorts for the upcoming August intake are strictly capped.

The immediate next step to replace uncertainty with objective data is to unlock your true clinical baseline. This happens through our Scientific Cognitive Assessment. For an initial investment of €90, we register you on our clinically validated testing panel to map your precise processing speed and memory focus areas, while tracking your core lifestyle parameters. From there, we can finalise your complete 12-month roadmap.

I can activate your secure assessment portal directly inside your account right now while we are on this call. Does that feel like the right path forward for you?`,
      crmNote:
        "If yes → trigger assessment checkout. If not → book follow-up or enroll discovery_post_call nurture.",
      assessmentOffer: {
        priceLabel: "€90",
        product: "Scientific Cognitive Assessment",
        programmeAnchor: "€3,550 12-month programme",
      },
    },
  ],
} as const;

/** 3-step nurture for leads who miss a scheduled discovery call (2h · 48h · 5d). */
export const NN_MISSED_CALL_NURTURE = {
  step1: {
    delay: "2 hours post-missed slot",
    subject: "Sorry we missed each other today — NeuroNourish Clinic",
    body: `Dear [First Name],

We missed you on our scheduled discovery consultation call earlier today. We completely understand that overstretched professional calendars, acute family responsibilities, and unexpected daily demands can alter our routines at a moment's notice.

Please do not concern yourself with the missed time slot. Your long-term brain wellness and independence remain our absolute priority, and we are ready to restart our conversation whenever your schedule clears.

We have safely preserved your initial baseline quiz insights inside your secure client file. To pick a fresh, convenient 15-minute consultation review window with our care team, simply use our open calendar pathway here:

[ Re-schedule My Discovery Consultation ]

We look forward to connecting soon and helping you navigate your path to cognitive resilience with clarity.

In collaborative partnership,
Emer Sexton
Founder & CEO, NeuroNourish`,
  },
  step2: {
    delay: "48 hours post-missed slot",
    subject: "Your long-term brain health goals are still worth a conversation",
    body: `Dear [First Name],

A few days ago, you took a proactive step toward prioritizing your cognitive clarity by booking an initial baseline conversation with our team. Even though daily schedules prevented us from connecting, your reasons for reaching out still matter.

Whether you started noticing early memory changes, felt frustrated by persistent afternoon brain fog, or wanted an evidence-led roadmap to proactively manage a family history of dementia—those concerns deserve a structured plan. Protecting your cognitive stamina is a multi-decade asset strategy, much like standard financial planning for retirement.

You do not have to navigate early health changes with uncertainty or anxiety. Our 12-month Personalised Brain Health Programme is built to turn complex clinical neuroscience into simple, prioritized everyday actions tailored entirely to your biology.

Let's find a convenient time to walk through your numbers and outline your care path this week:

[ Re-book My 15-Minute Review Session Here ]

Best regards,
The NeuroNourish Care Team`,
  },
  step3: {
    delay: "5 days post-missed slot",
    subject: "Keeping the door open for your cognitive wellness protocol",
    body: `Dear [First Name],

As we approach our live August intake cohort launch and finalize our resource allocations across our incoming participants, we are reaching out one final time to keep the door open for your care protocol.

To guarantee high-touch expert accountability, individual safety profiles, and rigorous clinical oversight for every single participant, our program capacities are strictly capped. Consequently, your assigned clinical advisory staff, personal health coach, and advanced laboratory data-tracking metrics can only be reserved for a limited time.

Taking control of your future brain health does not have to feel overwhelming. You do not have to perform perfectly—you simply need to partner with an expert team dedicated to protecting your future clarity.

If you are ready to replace worry with objective metrics and lock in your august cohort spot before enrollment paths close, let's connect for an initial consultation.

[ Secure My August Onboarding Conversation ]

Warm regards,
Emer Sexton
Founder & CEO, NeuroNourish`,
  },
} as const;

/** 3-step cold re-engagement when a clinician downloads the briefing pack but does not book (72h · 6d · 10d). */
export const NN_B2B_BRIEFING_FOLLOWUP = {
  step1: {
    delay: "72 hours post-download",
    subject: "Reducing practice overhead: Scalable preventative neurology data",
    body: `Dear [Clinical Partner],

A few days ago, you requested our institutional briefing materials outlining the NeuroNourish 12-month Personalised Brain Health Programme. I trust the documentation clarified our multi-pillar approach to modifying long-term dementia risk profiles.

The primary constraint independent clinics face when addressing cognitive anxiety is rarely a lack of neuroscience—it is the intense time required to monitor lifestyle modifications. Conducting regular nutritional assessments, tracking biomarker adjustments, and maintaining accountability loops can quickly overwhelm standard primary care schedules.

NeuroNourish functions directly as a secure extension of your practice. We absorb the operational time burden under strict CORU dietetic supervision, while supplying your medical team with clear, longitudinal outcome data at key baseline intervals.

Let's schedule a short, 10-minute briefing call this week to review our platform reporting formats and discuss setting up a dedicated referral gateway for your clinic.

[ Schedule Your 10-Minute Clinical Briefing Call ]

Best regards,
Emer Sexton
Founder & CEO, NeuroNourish`,
  },
  step2: {
    delay: "6 days post-download",
    subject: "Replacing clinical assumptions with structured biomarker data",
    body: `Dear [Clinical Partner],

To secure predictable outcomes in cognitive longevity, preventative lifestyle medicine must be managed with the same rigorous data tracking as primary pharmacotherapy.

When your patients join a NeuroNourish program, we analyze specific laboratory blood panels to isolate the underlying root causes of cognitive shifts, tracking systemic biomarkers across core neurological pillars:

• Metabolic Terrain: Evaluating fasting insulin, HbA1c, and advanced lipid sub-fractions impacting long-term cerebral perfusion.
• Inflammatory Indicators: Monitoring high-sensitivity C-reactive protein (hs-CRP) and underlying cytokine vectors.
• Endocrine Profiles: Mapping key hormonal balances and critical cellular micronutrient values.

Our technology platform synthesizes this data alongside validated cognitive screenings (such as the MoCA framework) to track patient adherence and biological improvements over 12 months, providing your clinic with clear, measurable proof of progress.

We invite you to connect with our liaison team for a brief, 5-minute platform demonstration to view how we structure these diagnostic reporting matrices for our medical partners.

[ Request a 5-Minute Platform Walkthrough ]

In partnership,
The NeuroNourish Clinical Team`,
  },
  step3: {
    delay: "10 days post-download",
    subject: "Preserving practice autonomy: Our clinical boundary guidelines",
    body: `Dear [Clinical Partner],

When integrating an allied care solution into your patient workflow, maintaining complete clarity regarding clinical boundaries and medical liability is a core operational priority.

NeuroNourish operates strictly as a collaborative lifestyle medicine and functional nutrition provider. We do not manage acute pathology, alter primary medical prescriptions, or intervene in your core therapeutic treatments. Your practice retains complete sovereign clinical oversight over the patient's primary medical trajectory.

Our platform focuses entirely on the daily execution and monitoring of the modifiable lifestyle variables that support long-term brain health. Furthermore, our architecture contains clear safety checkpoints: if red-flag neurological indicators emerge during our continuous tracking loops, the patient is immediately routed back to your clinic with all active data logs attached.

As we finalize our practice integrations for our upcoming August cohort intake, we are capping our active referral nodes to maintain elite clinical supervision. Secure your clinic's placement by connecting for an initial call before our onboarding window closes.

[ Secure an August Practice Integration Call ]

Warm regards,
Emer Sexton
Founder & CEO, NeuroNourish`,
  },
} as const;

/** 3-step nurture when a clinician misses a scheduled practice briefing call (2h · 48h · 5d). */
export const NN_B2B_MISSED_BRIEFING_NURTURE = {
  step1: {
    delay: "2 hours post-no-show",
    subject: "Re-scheduling your NeuroNourish practice briefing call",
    body: `Dear [Dr. Last Name / Clinical Partner],

We missed you on our scheduled clinical briefing call earlier today. We completely understand that acute patient demands, emergent clinical cases, and overstretched primary care schedules can unexpectedly disrupt your calendar.

Please do not concern yourself with the missed slot. Our core objective remains supporting your practice with a scalable, structured referral pathway for preventative cognitive care.

Whenever your clinical schedule allows, we are ready to restart our conversation. You can select a fresh, convenient 10-minute briefing time directly on our medical liaison team's calendar link here:

[ Re-schedule Your Practice Briefing Call ]

We look forward to connecting with you soon, reviewing our automated biomarker reporting formats, and discussing your integration parameters.

Best regards,
Emer Sexton
Founder & CEO, NeuroNourish`,
  },
  step2: {
    delay: "48 hours post-no-show",
    subject: "Absorbing the clinical time burden of cognitive lifestyle medicine",
    body: `Dear [Dr. Last Name / Clinical Partner],

A few days ago, you took a proactive step toward expanding your clinic's preventative capabilities by booking an initial integration briefing with our medical team. Even though your schedule prevented us from connecting, the challenge we aim to solve for your practice remains highly relevant.

GPs and specialized clinical clinicians frequently report that the primary barrier to delivering effective neuroprotective care is a lack of time. Guiding a patient through intensive, 12-month lifestyle modifications, systemic biomarker monitoring, and direct CORU dietetic supervision requires hours of continuous tracking that standard consultation windows cannot absorb.

NeuroNourish acts as a seamless extension of your existing care team. We handle the full operational tracking load, optimize the patient's modifiable risk terrain, and deliver clear, longitudinal data reports back to your practice at regular intervals.

Let's find a convenient 10-minute window this week to review our clinical workflows and show you how easy it is to refer an anxious patient in under 60 seconds:

[ Select a Convenient Integration Briefing Time ]

In partnership,
The NeuroNourish Clinical Team`,
  },
  step3: {
    delay: "5 days post-no-show",
    subject: "Final onboarding allocations for August partner practices",
    body: `Dear [Dr. Last Name / Clinical Partner],

As we approach our live August intake cohort launch, our corporate and clinical teams are currently finalizing our secure referral nodes and allocating diagnostic resources across our partner healthcare practices in Ireland and the UK.

To guarantee high-touch expert accountability, individual safety profiles, and rigorous clinical oversight for every participant, our program capacities are strictly capped. Consequently, the number of primary care clinics we can integrate as accredited partner practices for this upcoming cohort window is limited.

Onboarding your practice requires zero hardware configuration or software installation. We supply your staff with a secure digital referral gateway and desk-ready physical patient referral materials, enabling your team to route patients into an evidence-based preventative care pathway effortlessly.

If you wish to secure a dedicated referral slot for your practice and preserve your patients' access to our upcoming 12-month intake, let's schedule an initial 10-minute briefing call before our onboarding window closes.

[ Secure an August Practice Integration Call ]

Warm regards,
Emer Sexton
Founder & CEO, NeuroNourish`,
  },
} as const;

/** 3-part post-onboarding welcome sequence (5 min · 48h · 5d) — portal activation, app sync, review booking. */
export const NN_ONBOARDING_WELCOME = {
  step1: {
    delay: "5 minutes post-onboarding",
    subject: "Welcome to NeuroNourish: Your portal is active",
    ctaLabel: "Enter My Patient Dashboard",
    body: `Dear [First Name],

Welcome to your personalized NeuroNourish dashboard. By completing your initial onboarding wizard, you have successfully activated your digital care infrastructure and taken firm ownership of your long-term cognitive wellness.

Our primary goal over the next 12 months is to replace general health guesswork with precise, evidence-led metrics. Your clinical companion dashboard is now live, and your secure online testing token has been successfully registered within our systems.

Your first operational milestone is to complete your standardized online cognitive test panel. This initial evaluation maps your brain's processing speed, working memory, and functional focus areas.

To ensure complete data integrity, your testing profile includes a strict 30-day completion window. Please log into your portal today on a standard desktop computer or laptop to launch your evaluation session:

[ Enter My Patient Dashboard ]

We are honored to stand alongside you as your healthcare partners.

In partnership,
Emer Sexton
Founder & CEO, NeuroNourish`,
  },
  step2: {
    delay: "48 hours post-onboarding",
    subject: "Setting up your daily lifestyle companions",
    ctaLabel: "Access My App Integrations Dashboard",
    body: `Dear [First Name],

A science-driven brain health program doesn't take place in clinic sessions alone—it lives in the micro-habits and practical choices you make every single day.

The custom NeuroNourish mobile app is engineered to bridge the gap between complex clinical data and your everyday routine, turning neuroscience into manageable, stress-free actions. If you haven't already done so during your initial login, we highly recommend verifying your companion app permissions.

By securely syncing your sleep tracking parameters, you allow our clinical team to monitor your deep and REM sleep architecture—the precise windows where your brain clears out metabolic waste. Likewise, enabling activity sync helps us track movement parameters that actively lower systemic insulin resistance throughout your day.

Log into your profile to view your synced apps and review your personalized daily nutrition frameworks:

[ Access My App Integrations Dashboard ]

Best regards,
The NeuroNourish Care Team`,
  },
  step3: {
    delay: "5 days post-onboarding",
    subject: "Scheduling your diagnostic consultation review",
    ctaLabel: "Book My Consultation Review Call",
    body: `Dear [First Name],

Over the past week, you have successfully established your secure portal profile and initialized your daily app tracking loops.

The next milestone in your care pathway is scheduling your complimentary 15-minute diagnostic evaluation review call. Once your raw cognitive scores flow securely into our platform, our team will synthesize your data alongside your historical health timeline to finalize your roadmap.

As a reminder, your initial assessment fee remains fully credited toward your comprehensive, supervised 12-Month Programme for exactly three more weeks. To ensure your clinical cohort allocation, assigned nutrition specialists, and dedicated personal coach are locked in ahead of our launch, secure your review slot on our calendar this week:

[ Book My Consultation Review Call ]

We look forward to walking through your results and building your path to long-term cognitive resilience.

Warm regards,
Emer Sexton
Founder & CEO, NeuroNourish`,
  },
} as const;

/** Post-purchase / profile activation onboarding screens (€90 assessment tier). */
export const NN_CONSUMER_ONBOARDING = {
  trigger:
    "Displayed immediately after a patient purchases the €90 assessment tier or activates their profile.",
  screens: [
    {
      id: "welcome",
      step: 1,
      headline: "Welcome to Your NeuroNourish Dashboard",
      subtext:
        "You have successfully activated your cognitive care infrastructure. Let's begin building your personalized care record.",
      fields: [
        {
          id: "password",
          type: "password" as const,
          label: "Set Secure Password",
          placeholder: "Set Secure Password",
        },
      ],
      cta: "Activate My Portal",
    },
    {
      id: "primary-focus",
      step: 2,
      headline: "What is your primary cognitive goal?",
      subtext:
        "Your biology is entirely unique. Selecting your main area of focus helps our clinical team tailor your 12-month nutrition, biomarker tracking, and lifestyle architecture protocols.",
      options: [
        {
          id: "memory",
          label: "Support & Strengthen My Daily Memory",
        },
        {
          id: "brain-fog",
          label: "Clear Afternoon Brain Fog & Improve Focus",
        },
        {
          id: "prevention",
          label: "Proactive Long-Term Prevention (Family History)",
        },
        {
          id: "executive-stamina",
          label: "Optimize Executive Cognitive Stamina & Energy",
        },
      ],
      cta: "Save and Continue",
    },
    {
      id: "companions",
      step: 3,
      headline: "Connect Your Companions",
      subtext:
        "The NeuroNourish app transforms complex data into simple, everyday actions. To enable real-time insights for your health coach, grant secure permissions to sync your daily metrics.",
      toggles: [
        {
          id: "sleep",
          label: "Sync Daily Sleep Patterns & Architecture",
          hint: "Sync background sleep architecture parameters.",
        },
        {
          id: "movement",
          label: "Track Movement, Steps & Recovery Metrics",
          hint: "Track daily physical steps and recovery indicators.",
        },
        {
          id: "coach-messaging",
          label: "Enable Direct, Real-Time Coach Messaging Notifications",
          hint: "Enable secure, real-time push alerts from your coach.",
        },
      ],
      cta: "Enter My Daily Dashboard",
    },
  ],
} as const;

/** Expanded onboarding microcopy — lifestyle-first, high-density screen copy for /onboarding. */
export const NN_CONSUMER_ONBOARDING_EXPANDED = {
  screen1: {
    stageLabel: "Account Setup",
    headline: "Welcome to Your NeuroNourish Programme Dashboard",
    subtext:
      "Your continuous care infrastructure is now active. To protect your medical privacy and secure your multi-omic tracking metrics, please choose a secure password below.",
    inputLabel: "Create Password",
    inputPlaceholder: "Minimum 8 characters",
    hintText: "Choose a strong password containing letters, numbers, and symbols.",
    ctaButton: "Activate My Portal",
  },
  screen2: {
    stageLabel: "Clinical Personalisation",
    headline: "What is your primary cognitive focus today?",
    subtext:
      "Your biological profile is entirely unique. Selecting your main area of concern helps our clinical team and CORU dietitians prioritize your 12-month nutrition, biomarker tracking, and lifestyle architecture protocols.",
    targets: [
      {
        id: "memory_loss",
        label: "Support & Strengthen My Daily Memory",
        description:
          "For individuals focused on recall, retention, and managing instances of forgotten words.",
      },
      {
        id: "brain_fog",
        label: "Clear Afternoon Brain Fog & Improve Focus",
        description:
          "For professionals seeking steady, sustainable mental energy and executive stamina all day.",
      },
      {
        id: "family_history",
        label: "Proactive Long-Term Prevention",
        description:
          "For individuals with a family history of cognitive decline who want an evidence-based roadmap.",
      },
      {
        id: "cognitive_stamina",
        label: "Optimize Executive Decisions & Mental Speed",
        description:
          "For high-performance leaders aiming to maximize structural brain longevity and clarity.",
      },
    ],
    ctaButton: "Save and Continue",
  },
  screen3: {
    stageLabel: "Ecosystem Sync",
    headline: "Connect Your Digital Care Companions",
    subtext:
      "The NeuroNourish app turns complex clinical data into simple, everyday actions. To enable real-time tracking insights for your personal health coach, grant secure permissions to sync your daily lifestyle parameters.",
    toggles: {
      sleep: {
        label: "Sync Sleep Architecture",
        description:
          "Enables automatic monitoring of deep, light, and REM sleep cycles to optimize clear cognitive recovery.",
      },
      movement: {
        label: "Track Movement & Physical Recovery",
        description:
          "Syncs step counts and activity thresholds to help you lower insulin resistance naturally throughout the day.",
      },
      messaging: {
        label: "Enable Real-Time Coach Messaging",
        description:
          "Connects a direct chat channel to receive continuous, compassionate human accountability and professional feedback loops.",
      },
    },
    ctaButton: "Enter My Daily Dashboard",
  },
} as const;

export const NN_QUIZ_PAGE = {
  eyebrow: "Brain health quiz",
  headline: "What's Your Brain Health Score?",
  subtext:
    "A 3-minute check built around the latest evidence in cognitive nutrition and brain ageing, designed for stressed working adults and anyone taking brain health seriously.",
  highlights: [
    "About 3 minutes · 18 evidence-led questions",
    "Score, archetype, and next-step guidance",
    "Email your report when you finish",
  ],
  timeEstimate: "About 3 minutes · 18 questions",
  resumeBanner: "Welcome back — we saved your progress on this device.",
  resumeContinue: "Continue where you left off",
  resumeRestart: "Start over",
  disclaimer:
    "Your answers are private. Results are not a medical diagnosis. Built on the 2024 Lancet Commission on dementia prevention, the FINGER multidomain intervention trial, the MIND diet research at Rush University, and Irish data from TILDA, the HSE and the FSAI.",
} as const;

export const NN_QUIZ_CAPTURE = {
  eyebrow: "Almost done",
  headline: "Where should we send your score?",
  subtext:
    "You've answered every question. Leave your name and email so we can save your results and send your personalised report.",
  consent: "I agree to receive my quiz results and relevant NeuroNourish updates by email.",
  cta: "See my results →",
  fieldsHint: "Takes 10 seconds",
  progressLabel: "18 of 18 answered",
  error: "Couldn’t save — check your details and try again.",
  backLabel: "← Back",
  discoverySoft: "Prefer to talk instead?",
  discoveryCta: "Book a discovery call",
} as const;

/** Mid-quiz idle recovery — soft discovery off-ramp (not mid-quiz email capture). */
export const NN_QUIZ_ABANDON = {
  eyebrow: "Take a breath",
  headline: "Prefer to talk it through?",
  subtext:
    "You're partway through the quiz. Book a complimentary 15-minute discovery call and we'll pick up from where you are — or continue whenever you're ready.",
  ctaBook: "Book a discovery call",
  ctaContinue: "Continue the quiz",
  ctaLater: "Finish later",
  discoveryBanner:
    "You stepped away from the brain health quiz — you can finish it anytime. This call focuses on your goals, not a live walkthrough of answers.",
  discoveryBannerCta: "Return to the quiz",
} as const;

export const NN_QUIZ_REPORT_CTA = {
  titlePrefix: "Your",
  titleSuffix: "report — free",
  body:
    "We'll email you a full breakdown of your archetype, the 4-week protocol matched to your pattern, and an invitation to Emer's next Brain Reset Masterclass.",
  sendingToPrefix: "Sending to",
  cta: "Email my report",
  privacy: "Sent to the email you already shared. GDPR-compliant. Unsubscribe anytime.",
  success: "Report on its way — check your inbox shortly.",
  successWithPhone: "Report sent — Emer may follow up on the number you shared.",
  phoneUpsellTitle: "Want Emer to walk you through this?",
  phoneUpsellBody: "Add your mobile and she’ll call about your archetype and next steps.",
  phoneLabel: "Mobile",
  phonePlaceholder: "087 123 4567",
  phoneHintIdle: "Irish 08… (10 digits) or UK 07… (11 digits)",
  phoneCta: "Add mobile for a call",
  phoneSkip: "No thanks — email is enough",
  phoneConsent: "I agree Emer may call me about my results and NeuroNourish programmes.",
} as const;

export const NN_FUNNEL_TRUST = [
  "CORU dietitian-supervised",
  "Clinical oversight",
  "Ireland & UK delivery",
] as const;

export const NN_QUIZ_RESULTS = {
  eyebrow: "Your results",
  scoreLabel: "Brain health score / 100",
  disclaimer:
    "This is not a medical diagnosis. A clinician-reviewed assessment provides objective insight.",
  nextStepsTitle: "Prefer to talk it through?",
  nextSteps: [
    {
      label: "Book a complimentary discovery call",
      href: "/discovery",
    },
  ],
  ctaAssessment: "Start My Assessment",
  ctaAssessmentHint: "Credited toward enrolment within 30 days",
  ctaDiscovery: "Or book a discovery call",
  ctaDiscoveryHint: "15-minute call · No obligation",
  ctaContact: "Contact Our Team",
  ctaProgramme: "Find Your Programme",
  emptyHeadline: "Complete the quiz to see your score",
  emptyBody:
    "Your results need a full quiz session. Take the 3-minute quiz, or book a discovery call if you'd rather talk first.",
  emptyCtaQuiz: "Take the brain health quiz",
  emptyCtaDiscovery: "Book a discovery call",
} as const;

export const NN_CONTACT = {
  eyebrow: "Contact",
  headline: "Contact Our Team",
  subtext: "Share a few details and we'll be in touch.",
  highlights: [
    "Typical response within one business day",
    "NovaUCD, Dublin · Cavan Digital Hub · Ireland & UK (online)",
    "Prefer a low-friction start? Take the brain health quiz first",
    "Partnership enquiries welcome from clinicians & organisations",
  ],
  quizLink: "Take the Brain Health Quiz",
  discoveryLink: "Or book a discovery call",
  discoveryHint: "15 minutes · Complimentary · No obligation",
} as const;

export const NN_TEAM = {
  eyebrow: "Team",
  headline: "Led by Emer Sexton",
  subtext:
    "Clinical direction from Ireland's first ReCODE practitioner, with CORU dietitian oversight and dedicated coaching between visits. Full named clinician profiles publish here as the roster is released.",
  members: [
    {
      name: "Emer Sexton",
      role: "Founder · Nutraceuticals · ReCODE practitioner",
      bio: "Leads clinical direction and High-Touch programme walkthroughs.",
      href: "/about",
      hrefLabel: "Read Emer's full story",
    },
    {
      name: "CORU dietitian collaboration",
      role: "Clinical nutrition oversight",
      bio: "Programme nutrition protocols supervised with CORU-registered dietitians.",
      href: "/shop/dietetic-consultation",
      hrefLabel: "Dietetic consultation",
    },
    {
      name: "Care & coaching",
      role: "Day-to-day support",
      bio: "One-to-one coaching and app-guided habit support between clinical touchpoints.",
      href: "/programme",
      hrefLabel: "Explore programme tiers",
    },
  ],
  ctaAbout: "Read Emer's full story",
  ctaDiscovery: "Book a discovery call",
} as const;

export const NN_ABOUT = {
  eyebrow: "About",
  headline: "The Vision Behind NeuroNourish",
  subtext: "The Future of Brain Health is Proactive.",
  visionBody: [
    "NeuroNourish was created to bridge the gap between dementia prevention research and everyday action. Drawing on evidence from nutrition, neuroscience, neurology and neuropsychology, our programme brings together personalised nutrition, cognitive assessment, blood biomarkers, lifestyle medicine and behaviour change into one practical, evidence-based approach to brain health.",
    "Because science only changes lives when people can apply it.",
  ],
  founderEyebrow: "Built by Emer Sexton",
  founderBelief: "Brain health is shaped by the decisions we make every day.",
  founderBody: [
    "Emer founded NeuroNourish with one belief: brain health is shaped by the decisions we make every day.",
    "Drawing on her background in nutraceuticals, ReCODE®, PreCODE®, functional medicine principles, and nutrition and health coaching, she brought together expertise across nutrition, neuroscience, neurology and neuropsychology to create a personalised brain health programme that translates complex science into practical action.",
    "Every recommendation is designed to be evidence-based, personalised with precision, and realistic enough to become part of everyday life.",
  ],
  credentials: [
    "Health Coach · IINH",
    "BSc Nutraceuticals · TU Dublin",
    "ReCODE® practitioner · Apollo Health",
    "Irish Independent 30 Under 30",
  ],
  bio: [
    "Emer grew up in Stradone, Co. Cavan. A cycling accident in 2020 led to years rebuilding her cognitive health — an experience that shaped her obsession with evidence-based brain health and prevention.",
    "With a BSc in Nutraceuticals from TU Dublin, training through Apollo Health, and as Ireland's first ReCODE practitioner, Emer founded NeuroNourish to offer the structured, proactive care she saw missing.",
    "NeuroNourish operates from Cavan Digital Hub and NovaUCD, with a team of 13 across nutrition, clinical research, software, and AI — delivering programmes across Ireland and the UK.",
  ],
  cta: "Book a Cognitive Assessment",
  ctaHref: "/shop/cognitive-assessment",
  ctaHint: "€89.99 · Remote CNS Vital Signs baseline",
  teamLink: "Meet the team",
  discoveryLink: "Or book a discovery call",
  programmeSoft: "Explore programme tiers",
} as const;

export const NN_BLOG = {
  eyebrow: "Blog",
  headline: "Insights to Help You Care for Your Brain Every Day",
  subtext:
    "Evidence-led articles on sleep, nutrition, movement, and daily habits — written for adults taking a proactive approach to brain health.",
  cta: "Take the Brain Health Quiz",
  ctaHint: "3 minutes · Habit baseline for your next conversation",
  posts: [
    {
      slug: "sleep-brain-investment",
      title: "Why Better Sleep Is One of the Most Powerful Investments You Can Make in Your Brain",
      excerpt: "How sleep architecture directly influences memory consolidation and mental clarity.",
      imageTheme: "sleep",
      readTime: "5 min read",
    },
    {
      slug: "movement-brain-health",
      title: "Can Everyday Movement Help Support Long-Term Brain Health?",
      excerpt: "The evidence linking daily physical activity to cognitive reserve and neuroplasticity.",
      imageTheme: "movement",
      readTime: "4 min read",
    },
    {
      slug: "foods-brain-loves",
      title: "The Foods Your Brain Loves: Building a Plate That Supports Cognitive Health",
      excerpt: "Practical nutrition frameworks for sustained mental energy and focus.",
      imageTheme: "nutrition",
      readTime: "6 min read",
    },
    {
      slug: "energy-levels-brain",
      title: "What Your Energy Levels Could Be Telling You About Your Brain",
      excerpt: "When fatigue and brain fog may signal deeper metabolic patterns worth investigating.",
      imageTheme: "energy",
      readTime: "4 min read",
    },
    {
      slug: "small-habits-cognitive-wellbeing",
      title: "Small Habits That Can Make a Big Difference to Cognitive Wellbeing",
      excerpt: "Micro-changes that compound into measurable lifestyle improvements over time.",
      imageTheme: "habits",
      readTime: "4 min read",
    },
    {
      slug: "blood-sugar-brain-health",
      title: "Understanding the Link Between Blood Sugar and Brain Health",
      excerpt: "Why glucose stability matters for focus, mood, and long-term cognitive protection.",
      imageTheme: "metabolic",
      readTime: "5 min read",
    },
  ] satisfies BlogPost[],
} as const;

export const NN_CLOSING = {
  eyebrow: "Start here",
  headline: "Start With Your Brain Health Profile",
  subtext:
    "Know your brain. Measure what matters. Change what you can. Track what happens.",
  trustChips: ["Free Brain Health Quiz", "About 3 minutes", "Clear next steps"],
  ctaPrimary: "Or book a consultation",
  ctaQuizHint: "Free · Personalised Brain Health Profile",
  ctaSecondary: "Contact Our Team",
  ctaQuiz: "Take the Free Quiz",
} as const;

export const NN_FAQ = {
  eyebrow: "FAQ",
  headline: "Questions people ask before they start",
  subtext:
    "Clear answers about relevance, assessment, the 12-month programme, and what NeuroNourish does — and does not — claim.",
  disclaimer:
    "NeuroNourish helps people understand cognitive performance, measure relevant factors, identify modifiable areas, and build healthier behaviours. We do not diagnose, treat, cure, or promise to prevent dementia or Alzheimer's disease.",
  items: [
    {
      q: "I'm healthy. Is this still relevant to me?",
      a: "Yes. Many people come to NeuroNourish while they still feel well — because they want a clear baseline, better understanding of modifiable factors, and a plan they can stick to as they age.",
    },
    {
      q: "I have a family history of Alzheimer's disease. Can you tell me if I will develop it?",
      a: "No. NeuroNourish cannot predict whether an individual will develop Alzheimer's disease. We focus on cognitive measurement and modifiable factors associated with brain health — not individual disease prediction.",
    },
    {
      q: "I've noticed changes in my memory. Should I come to NeuroNourish or my GP?",
      a: "If you have sudden, severe, or worrying neurological symptoms, contact your GP or emergency services first. NeuroNourish can complement medical care for people who want measurement, lifestyle support and ongoing tracking — it does not replace medical assessment.",
    },
    {
      q: "Why would I join for 12 months?",
      a: "Meaningful lifestyle change usually needs a baseline, prioritisation, sustained habits, monitoring and reassessment. Twelve months gives enough time to measure, implement, track and review — not just collect advice.",
    },
    {
      q: "Can I just take the cognitive assessment?",
      a: "Yes. The €89.99 cognitive assessment stands on its own. Many people start with the free Brain Health Quiz, then measure cognition, then decide whether a consultation or programme is right for them.",
    },
    {
      q: "Do I need to live in Cavan?",
      a: "No. NeuroNourish delivers across Ireland and the UK with remote and hybrid options. Some appointments can be in person where that suits you.",
    },
    {
      q: "What does the €3,500 programme include?",
      a: "The High-Touch 12-month programme combines baseline assessment, personalised planning, coaching support, lifestyle and nutrition guidance, app tracking and reassessment. See the Programme page for what’s included.",
    },
    {
      q: "Can I pay in instalments?",
      a: "Payment options are available. We discuss the right arrangement during your programme consultation.",
    },
    {
      q: "Is this suitable if I already have a dementia diagnosis?",
      a: "NeuroNourish is not a dementia treatment service. If you already have a diagnosis, speak with your GP or specialist first. We can advise whether lifestyle support is appropriate alongside your medical care.",
    },
    {
      q: "How do you work alongside my existing doctor or GP?",
      a: "With your permission, we can share assessment findings and programme context with your GP or other clinicians so our work supports your wider care.",
    },
  ],
  cta: "Take the Free Brain Health Quiz",
  ctaHint: "About 3 minutes · Personalised profile",
  ctaSecondary: "Contact our team",
} as const;

/** @deprecated Use NN_FAQ.headline */
export const NN_FAQ_HEADLINE = NN_FAQ.headline;

export const NN_ASSESSMENT = {
  eyebrow: "Cognitive health assessment",
  headline: "Cognitive Health Assessment",
  subtext:
    "A clinician-reviewed cognitive assessment with personalised summary — the logical next step after your brain health quiz.",
  price: "€90",
  showPublicPrice: false,
  investmentHeadline: "Secure checkout · Fee confirmed before you pay",
  investmentBody:
    "A clinician-reviewed cognitive baseline with a personalised summary by email. Full fee details appear in secure checkout — credited toward the 12-month programme if you enrol within 30 days.",
  includesLabel: "What's included",
  includes: [
    "Validated cognitive assessment (CNS Vital Signs)",
    "Clinician-reviewed personalised summary by email",
    "Clear recommendation for your next step",
  ],
  disclaimer:
    "This assessment is not a medical diagnosis. Results are interpreted alongside clinical judgement.",
  creditNote:
    "Assessment fee credited toward the 12-month programme if you enrol within 30 days.",
  expiryPolicyLabel: "Please note our clinical expiry policy:",
  expiryPolicy:
    "To ensure absolute scientific accuracy and data integrity, your unique cognitive testing credit includes a structured 30-day completion window. Because your biological markers and lifestyle metrics shift over time, your online evaluation must be completed within 30 days of purchase to ensure your baseline data remains clinically relevant for our care team's final analysis. Extensions are not granted for expired testing credits.",
  cta: "Start My Assessment",
  ctaHint: "Secure checkout · Summary by email",
  ctaDiscovery: "Prefer to talk first? Book a discovery call",
  ctaDiscoveryHint: "15-minute call · No obligation",
} as const;

export const NN_PROGRAMME = {
  brand: "NeuroNourish Clinic",
  eyebrow: "12-month programme",
  headline: "Your 12-Month Personalised Brain Health Programme",
  subtext:
    "A structured pathway combining precision nutrition, biomarkers, lifestyle medicine, coaching, and app tracking — under CORU dietitian oversight.",
  price: "€3,550",
  priceLabel: "Programme investment",
  billingNote: "Shared personally once we confirm the programme is a fit · Capped cohort intake",
  creditNote:
    "A cognitive health assessment is available as a first clinical step; details are confirmed with our care team.",
  showPublicPrice: false,
  investmentHeadline: "Investment discussed on your discovery call",
  investmentBody:
    "We share clear pricing once we understand your goals and confirm the programme is a genuine fit — with no obligation.",
  highlights: [
    "Full intake, biomarkers & validated cognitive baseline",
    "Personalised nutrition under CORU dietitian oversight",
    "Lifestyle, sleep & stress protocols tailored to you",
    "1-on-1 coaching with app tracking for 12 months",
  ],
  inclusionsTitle: "What's included",
  inclusions: [
    {
      title: "Clinical coordination",
      detail: "Full health timeline, intake, and personalised risk mapping.",
    },
    {
      title: "Biomarker tracking",
      detail: "Metabolic, hormonal, and inflammatory markers reviewed across the year.",
    },
    {
      title: "Dietitian supervision",
      detail: "Personalised nutrition planning and 1-on-1 consultations with CORU-registered dietitians.",
    },
    {
      title: "Personal coaching",
      detail: "Ongoing lifestyle mentorship for sleep, movement, stress, and daily habits.",
    },
    {
      title: "NeuroNourish app",
      detail: "12-month access for tracking, trends, and secure coach messaging.",
    },
    {
      title: "Progress checks",
      detail: "Scheduled re-assessments and cognitive monitoring to document change over time.",
    },
  ],
  yearTitle: "How the year unfolds",
  yearPhases: [
    {
      timing: "Months 1–3",
      title: "Build your foundation",
      detail: "Intake, biomarkers, nutrition plan, and intensive habit setup.",
    },
    {
      timing: "Months 4–9",
      title: "Sustain & refine",
      detail: "Coaching, app tracking, and plan adjustments as your data evolves.",
    },
    {
      timing: "Months 10–12",
      title: "Measure & lock in",
      detail: "Re-assessment, progress review, and habits designed to last.",
    },
  ],
  compareTitle: "What’s included in each option",
  compareTiers: ["High-Touch", "Guided", "Self-Led"] as const,
  compareRows: [
    { feature: "Full intake & lifestyle timeline", highTouch: true, guided: true, selfLed: true },
    { feature: "Blood biomarker review", highTouch: true, guided: true, selfLed: false },
    { feature: "Validated cognitive assessment", highTouch: true, guided: true, selfLed: false },
    { feature: "CORU dietitian-supervised nutrition", highTouch: true, guided: true, selfLed: false },
    { feature: "Emer clinical walkthrough touchpoints", highTouch: true, guided: false, selfLed: false },
    { feature: "1-on-1 coaching & accountability", highTouch: true, guided: true, selfLed: false },
    { feature: "NeuroNourish app tracking", highTouch: true, guided: true, selfLed: true },
    { feature: "Scheduled progress reviews", highTouch: true, guided: true, selfLed: false },
    { feature: "Lighter-touch check-ins", highTouch: false, guided: false, selfLed: true },
  ],
  capacityTitle: "Why intake is capped",
  capacityText:
    "Cohorts are limited so every participant gets proper clinical oversight, a dedicated coach, and individualised safety monitoring. Enrolment reserves your place for the full 12 months.",
  faqTitle: "Common questions",
  faq: [
    {
      q: "Do I need a cognitive assessment first?",
      a: "It's recommended but not required. Our care team will advise the best starting point for you on a discovery call.",
    },
    {
      q: "Can I talk to someone before enrolling?",
      a: "Yes — book a complimentary discovery call. Many people prefer a conversation before committing to the full year.",
    },
    {
      q: "Is this a medical treatment for dementia?",
      a: "No. NeuroNourish is a preventative lifestyle medicine programme focused on modifiable risk factors — not a medical diagnosis or dementia treatment.",
    },
    {
      q: "Is the programme available online?",
      a: "Yes. We deliver across Ireland and the UK online, with in-clinic options where available.",
    },
  ],
  checkoutUnavailableTitle: "Ready to enrol?",
  checkoutUnavailableBody:
    "Online checkout is being finalised. Book a discovery call and our care team will reserve your place and guide next steps.",
  cta: "Enrol in the Programme",
  ctaHint: "Secure checkout · Onboarding within one business day",
  ctaDiscovery: "Book Your Discovery Call",
  ctaDiscoveryHint: "15 minutes · Complimentary · No obligation",
  ctaContact: "Or email hello@neuronourish.clinic",
} as const;

export const NN_PROGRAMME_CHECKOUT = {
  headline: "Enrol in the 12-Month Personalised Brain Health Programme",
  subtext:
    "Secure your place in our next intake cohort. Enrolment activates your full year of structured care.",
  priceLabel: NN_PROGRAMME.priceLabel,
  priceValue: NN_PROGRAMME.price,
  billingInterval: NN_PROGRAMME.billingNote,
  breakdownTitle: NN_PROGRAMME.inclusionsTitle,
  /** Flat strings for legacy checklist consumers */
  inclusions: NN_PROGRAMME.inclusions.map((item) => `${item.title}: ${item.detail}`),
  disclosureHeadline: NN_PROGRAMME.capacityTitle,
  disclosureText: NN_PROGRAMME.capacityText,
  cta: "Secure Your Programme Place",
  ctaHint: NN_PROGRAMME.ctaHint,
} as const;

export const NN_STRIPE_PROGRAMME = {
  checkoutDescription:
    "NeuroNourish 12-Month Personalised Brain Health Programme — nutrition, biomarkers, coaching, and app tracking under CORU dietitian oversight.",
  receiptFooter:
    "Thank you for enrolling. Your place is reserved for the next 12 months. Our care team will begin onboarding within one business day.",
} as const;

export const NN_COMPLIANCE =
  "NeuroNourish provides nutritional and lifestyle medicine support for cognitive health. We do not diagnose, treat, or cure dementia or Alzheimer's disease. All care is delivered under clinical oversight with CORU-registered dietitians. Individual results vary.";

export const NN_PRIVACY = {
  title: "Privacy Policy",
  lastUpdated: "21 July 2026",
  contactEmail: "hello@neuronourish.clinic",
  sections: [
    {
      heading: "Who we are",
      body: "NeuroNourish Clinic provides personalised brain health programmes combining nutrition, lifestyle medicine, biomarker review, and coaching. We operate from NovaUCD, Dublin and Cavan Digital Hub, serving clients in Ireland and the UK (online and in clinic). We are not a hospital or emergency medical service.",
    },
    {
      heading: "What we collect",
      highlights: [
        "Contact details (name, email, phone) when you take the quiz, shop, or contact us",
        "Date of birth when you purchase a cognitive assessment (required for age-normed CNS Vital Signs scoring)",
        "Health and lifestyle information you provide in forms and assessments",
        "Cognitive assessment reports and summaries generated after you complete CNS testing",
        "Payment status via Stripe (we do not store full card numbers)",
        "Usage data, cookies, and ad attribution (UTM parameters, Meta pixel)",
      ],
    },
    {
      heading: "How we use your data",
      highlights: [
        "Deliver brain health programmes, assessments, and coaching",
        "Issue and process CNS Vital Signs remote tests and clinician-reviewed summaries",
        "Send transactional and marketing communications (with your consent)",
        "Coordinate care with your GP or specialists when you give permission",
        "Improve our services and measure advertising effectiveness",
      ],
    },
    {
      heading: "Legal basis",
      body: "We process data based on consent (marketing), contract (programme and assessment delivery), and legitimate interests (service improvement and clinical coordination with your permission). You may withdraw marketing consent at any time via unsubscribe links.",
    },
    {
      heading: "Sharing",
      highlights: [
        "Clinical partners and CORU-registered dietitians involved in your care",
        "CNS Vital Signs (cognitive testing platform) using your subject identifier and date of birth",
        "Payment processor (Stripe), email (Resend), SMS (Vonage), scheduling (Calendly)",
        "We do not sell your personal data to third parties",
      ],
    },
    {
      heading: "Cognitive assessment & date of birth",
      body: "When you buy the Cognitive Health Assessment we collect your date of birth solely to generate an age-normed CNS Vital Signs remote test and interpret scores correctly. DOB and reports are stored securely in your care record, accessible to our care team, and are not used for marketing profiling.",
    },
    {
      heading: "Advertising & analytics",
      body: "We use Meta Pixel and similar tools to measure ad effectiveness and improve the site. You can control cookies via your browser settings. Marketing emails always include an unsubscribe link.",
    },
    {
      heading: "Retention & rights",
      body: "We retain health programme and assessment records as required for clinical continuity and legal obligations. You may request access, correction, or deletion of your data by emailing us. EU/UK GDPR rights apply.",
    },
    {
      heading: "Medical disclaimer",
      body: "NeuroNourish programmes and assessment summaries are preventative lifestyle medicine support — not a substitute for emergency care or medical diagnosis. CNS summaries use cautious, non-diagnostic language and are reviewed by our care team before release. If you experience a medical emergency, contact your GP or emergency services.",
    },
  ],
} as const;

export const NN_SUCCESS = {
  assessment: {
    eyebrow: "Thank you",
    headline: "Assessment Purchased",
    subtext:
      "You'll receive your cognitive assessment link by email shortly. Once complete, our team will send your personalised summary.",
    highlights: [
      "Check your inbox for CNS Vital Signs assessment instructions",
      "€90 credited toward the 12-month programme if you enrol within 30 days",
      "Questions? Book a discovery call anytime",
    ],
    ctaProgramme: "View 12-Month Programme",
    ctaOnboarding: "Activate My Portal",
    ctaDiscovery: "Book a Discovery Call",
  },
  programme: {
    eyebrow: "Welcome",
    headline: "You're Enrolled",
    subtext:
      "Thank you for joining the NeuroNourish 12-month programme. Our team will contact you with onboarding details within one business day.",
    highlights: [
      "Download the NeuroNourish app when invited",
      "Prepare recent blood work if available",
      "Your coach will schedule your intake session",
    ],
    ctaApp: "How the App Works",
    ctaDiscovery: "Questions? Book a Call",
  },
} as const;

export const NN_CONCERN_OPTIONS = [
  { value: "memory", label: "Memory & recall" },
  { value: "focus", label: "Focus & mental clarity" },
  { value: "prevention", label: "Dementia prevention" },
  { value: "energy", label: "Energy & mood" },
  { value: "family_history", label: "Family history of cognitive decline" },
  { value: "parent", label: "Concerned about a parent" },
  { value: "healthcare_partnership", label: "Healthcare partnership (clinician / practice)" },
  { value: "other", label: "Something else" },
] as const;

export const NN_META_AD_MATRIX = {
  destinationUrl: "/quiz",
  angles: [
    {
      id: "brain-planning-analogy",
      name: "Financial Planning vs. Brain Planning",
      format: "Narrative long-form",
      primaryText: `We spend decades of our working lives meticulously planning, saving, and investing financially for our retirement. We track the market, we calculate our pensions, and we protect our properties. But very few of us are ever given a clear, evidence-based plan to protect the actual health of the brain we will completely rely on to enjoy that future.

Cognitive longevity doesn't happen by chance; it is shaped by the practical choices we make every day. If you are noticing subtle early shifts—like persistent afternoon brain fog, slower mental processing speed, or moments of forgotten words—those aren't things you simply have to accept as an inevitable part of growing older. They are biological signals to take proactive control.

Our nutrition scientists and clinical experts at NeuroNourish have built a simple, 5-minute digital evaluation based on robust neuroprotective research. Discover your baseline, understand your modifiable lifestyle risk factors, and take your first step toward long-term peace of mind today.`,
      headline: "Support your memory. Strengthen your brain health.",
      description: "Take our free 5-minute Brain Health Assessment.",
      cta: "Learn More",
      creativeDirection: "Warm, editorial portrait of Emer in a modern clinic base",
    },
    {
      id: "daily-vulnerabilities",
      name: "Daily Vulnerabilities",
      format: "Punchy & direct",
      primaryText: `Do you find yourself waking up wondering why you feel mentally exhausted before your afternoon even begins? Or why staying focused through standard executive decision-making takes twice the cognitive stamina it used to?

The brain doesn't shift overnight. It sends quiet, manageable indicators long before a crisis point arrives. Our structured, 12-month Personalised Brain Health Programme replaces uncertainty with clear, objective tracking data.

It starts with a simple 5-minute baseline mapping. Discover how your current nutrition, sleep patterns, movement, and daily environment are actively influencing your mental clarity.`,
      headline: "Why Am I Forgetting Things? Discover the Science.",
      description: "Measure your daily habits against known protective factors.",
      cta: "Sign Up",
      creativeDirection: "Clean digital mock-up of the quiz layout on mobile",
    },
    {
      id: "family-history-proactive",
      name: "Family History & Proactive Ownership",
      format: "Adult children / prevention focus",
      primaryText: `If you carry a family history of cognitive decline, watching the people you love experience a gradual dimming of their sharpness can leave you feeling deeply anxious about your own future. But the science of prevention has evolved.

Research confirms that a significant proportion of long-term dementia risks are driven by modifiable, everyday lifestyle terrain. Your brain remains capable of adapting, growing, and thriving at any stage of life—provided it has the right structural strategy.

NeuroNourish translates complex clinical science into simple, prioritized everyday actions tailored to your unique biology. Take ownership of your long-term cognitive wellness today.`,
      headline: "Built to Protect Your Cognitive Vitality.",
      description: "Backed by clinical science. Grounded in data.",
      cta: "Learn More",
      creativeDirection: "Abstract graphic array showing fluid neural growth pathways",
    },
  ],
} as const;

/** Meta retargeting — cognitive assessment payment drop-offs (quiz completers who did not pay). */
export const NN_META_RETARGETING_MATRIX = {
  destinationUrl: "/shop/cognitive-assessment",
  audience:
    "Quiz completers who visited /shop/cognitive-assessment but did not complete €90 checkout",
  primaryConcernMatch: {
    primaryText: `You recently took our 5-minute Brain Health Assessment and discovered your baseline. But taking that next step—moving from high-level lifestyle insights to concrete, clinical protection—can sometimes feel like a commitment you're not entirely ready to make.

Our €90 Scientific Cognitive Baseline Assessment isn't an arbitrary evaluation. It is a precise, data-driven mapping tool tracking your brain's true processing speed and working memory parameters using validated panels.

We treat this metric as a quality safeguard. Your testing token includes a structured 30-day completion window to ensure your metabolic markers and cognitive scores match your upcoming lifestyle architecture perfectly.

Stop guessing about your mental stamina. Lock in your baseline and get absolute clarity on your data today.`,
    headline: "Unlock Your True Clinical Baseline Score",
    description: "Secure your 30-day cognitive testing window.",
    cta: "Sign Up",
  },
} as const;

/** Meta retargeting — /quiz/results drop-offs (quiz completers who did not book or purchase). */
export const NN_META_QUIZ_RESULTS_RETARGETING = {
  destinationUrl: "/quiz/results",
  audience:
    "Quiz completers who reviewed initial scores on /quiz/results but did not book a discovery call or purchase the baseline assessment",
  tone: "Reassuring, outcome-focused re-engagement",
  angles: [
    {
      id: "worry-to-plan",
      name: "Replacing Worry With a Plan",
      format: "Direct re-engagement",
      primaryText: `You took the first step and completed your Brain Health Assessment. But reviewing your initial metrics can sometimes leave you with more questions than answers.

If your baseline score showed notable room for optimization, it is entirely natural to feel uncertain about what comes next. At NeuroNourish, we believe that your baseline is simply a starting point, not a permanent diagnosis. Your brain is built to adapt and build resilient cognitive reserve at any stage of life—provided it has a precise, evidence-led strategy.

Don't leave your cognitive longevity to chance. Let's replace worry with an actionable, personalized roadmap. Book your complimentary, 15-minute discovery consultation with our care team today, and let's explore what your numbers mean for your future independence.`,
      headline: "Your Brain Health Score Was a Starting Point",
      description: "Replace uncertainty with a personalized 12-month care plan.",
      cta: "Book Now",
      destinationLink: "https://neuronourish.clinic",
      destinationUrl: "/discovery",
    },
    {
      id: "assessment-bridge",
      name: "The Actionable Step",
      format: "The €90 assessment bridge",
      primaryText: `You know your initial baseline score. Now, it's time to build your roadmap.

Moving from high-level lifestyle screening to concrete protection requires objective, clinical data. Our €90 Scientific Cognitive Baseline Assessment uses validated clinical testing panels to map your brain's exact processing speed, focus parameters, and working memory.

To ensure complete data integrity, your evaluation token includes a structured 30-day completion window. This ensures your baseline metrics match your upcoming lifestyle architecture perfectly, giving our nutrition scientists and CORU dietitians a flawless physiological map to tailor your program.

Lock in your testing window today and take ownership of your long-term focus and clarity.`,
      headline: "Move From High-Level Insights to Precise Protection",
      description: "Activate your secure 30-day cognitive testing window for €90.",
      cta: "Sign Up",
      destinationLink: "https://neuronourish.clinic",
      destinationUrl: "/shop/cognitive-assessment",
    },
  ],
} as const;

/** Organic infographic carousel scripts — daily neuroprotection tips for Emer's channels. */
export const NN_ORGANIC_INFOGRAPHIC_MATRIX = {
  carousel1: {
    id: "neural-transformation-timeline",
    title: "The Timeline of Neural Transformation",
    channel: "Organic social (Instagram / LinkedIn carousel)",
    slides: [
      {
        id: "cover",
        visual:
          "Clean ivory backdrop with a fluid gold neural network graphic line animation.",
        headline: "The Biological Timeline of Brain Optimization",
        subtext:
          "What happens to your neural pathways when you shift from guesswork to precision lifestyle medicine?",
      },
      {
        id: "short-term-fallacy",
        visual:
          "A stark vertical line splitting a 30-day window from a 12-month annual path.",
        headline: "Why 30-Day Detoxes Fail the Nervous System",
        highlights: [
          'Short-term "cleanses" ignore the basic biological timeline of neural adaptation.',
          "Shifting deeply rooted metabolic baselines requires extended, supervised intervention.",
          "True neuroprotection is built through cumulative cellular habits, not quick fixes.",
        ],
      },
      {
        id: "phase-1",
        visual: "Clean vector outline of an advanced laboratory blood biomarker report.",
        headline: "Phase 1: Precision Baseline Mapping",
        highlights: [
          "We analyze deep metabolic, inflammatory, and hormonal blood work indicators.",
          "We establish an objective functional starting point using standardized cognitive tests.",
          "Your exact lifestyle architecture is engineered from hard data, not clinical assumptions.",
        ],
        timing: "Months 1–3",
      },
      {
        id: "phase-2",
        visual:
          "A crisp mockup of a smartphone interface displaying daily micro-habit checkboxes.",
        headline: "Phase 2: Building Structural Cognitive Reserve",
        highlights: [
          "Your brain remains fully capable of learning and adapting throughout life.",
          "Consistent, targeted nutrition protocols actively support lifelong neuroplasticity.",
          "Continuous clinical mentorship turns temporary adjustments into permanent, automated behaviors.",
        ],
        timing: "Months 3–12",
      },
      {
        id: "cta",
        visual: "A professional, natural-light portrait of Emer Sexton at NovaUCD.",
        headline: "Stop Guessing About Your Cognitive Future",
        subtext:
          "Take our free 5-minute digital assessment to map your baseline modifiable lifestyle risk factors today.",
        onScreenLinkText: "Head over to our profile link to take the Brain Health Quiz.",
        ctaLabel: "Take the Brain Health Quiz",
        ctaDestination: "/quiz",
      },
    ],
  },
  carousel2: {
    id: "daily-focus-barriers",
    title: "What Your Afternoon Energy Slump is Telling You",
    channel: "Organic social (Instagram / LinkedIn carousel)",
    slides: [
      {
        id: "cover",
        visual: "Clean ivory backdrop with gold accent metabolic curve graphic.",
        headline: "What Your Afternoon Energy Slump is Telling You",
        subtext:
          "Your 3 PM brain fog is not random — it is a metabolic signal from your nervous system.",
      },
      {
        id: "surface-symptom",
        visual: "Split-screen of caffeine cup vs steady energy timeline.",
        headline: "The Surface Symptom",
        highlights: [
          "Reaching for a quick caffeine fix or sugar boost only masks brain fog temporarily.",
          "True mental stamina is driven by your body's underlying metabolic health.",
        ],
      },
      {
        id: "systemic-driver",
        visual: "Glycemic curve diagram with brain icon overlay.",
        headline: "The Systemic Driver: Glycemic & Insulin Control",
        highlights: [
          "Unstable blood sugar curves directly disrupt your brain cell energy.",
          "Sudden drops in mental focus and decision-making clarity follow steep glucose crashes.",
        ],
      },
      {
        id: "solution-framework",
        visual: "Nutrition, sleep, and movement icons in a balanced layout.",
        headline: "The Solution Framework",
        highlights: [
          "Personalised macro adjustments and targeted nutrition stabilize your biomarkers.",
          "Tracking sleep architecture helps keep you sharp throughout the day.",
        ],
      },
      {
        id: "cta",
        visual: "Gold CTA panel on deep slate background.",
        headline: "Don't wait for a cognitive crisis to start prioritizing your mind.",
        subtext:
          "Take ownership of your long-term wellness pathways. Take our 5-minute quiz today.",
        onScreenLinkText: "Take our 5-minute quiz at neuronourish.clinic.",
        ctaLabel: "Discover Your Baseline",
        ctaDestination: "/quiz",
      },
    ],
  },
} as const;

/** 3-part educational newsletter — blood sugar and brain health (Sage archetype). */
export const NN_NEWSLETTER_BLOOD_SUGAR_SERIES = {
  seriesTitle: "Blood Sugar & Brain Health",
  archetype: "Sage",
  audience: "Top-of-funnel subscribers and quiz completers",
  part1: {
    subject: "[Part 1] Why your afternoon energy crash is a brain signal",
    body: `Dear [First Name],

We are frequently taught to view blood sugar regulation purely through the lens of weight management or diabetes prevention. But from a metabolic neurology standpoint, your glycemic control is the primary driver of everyday mental stamina, focus, and decision-making speed.

Your brain accounts for roughly 20% of your body's total energy consumption. Unlike other organs, it cannot store glucose for future use. It relies entirely on a continuous, highly stable delivery pipeline through your bloodstream.

When you experience sudden blood sugar spikes followed by steep crashes—often triggered by high-glycemic meals or hidden nutritional factors—your brain cells experience immediate energy deprivation. That familiar 3 PM afternoon slump, the persistent brain fog, and the sudden difficulty choosing your words are not signs of "normal aging." They are your brain's alarm signals telling you its fuel supply is fluctuating.

Protecting your cognitive vitality requires moving past temporary fixes like a quick caffeine boost or a sugar craving response. Over the next few days, we will break down how chronic blood sugar instability silently impacts long-term neural networks, and how our 12-month Personalised Brain Health Programme replaces glycemic guesswork with precise data.

In collaborative partnership,
The NeuroNourish Clinical Team`,
  },
  part2: {
    subject: "[Part 2] What chronic insulin resistance does to brain networks",
    body: `Dear [First Name],

In our last message, we looked at how short-term blood sugar crashes cause afternoon brain fog. Today, we need to address what happens to your neural pathways over ten, twenty, or thirty years when those glucose fluctuations remain unmanaged.

When your body is constantly forced to manage blood sugar spikes, your cells slowly become desensitized to insulin. This process is known as insulin resistance.

Insulin is a vital neuroprotective hormone. In a healthy brain, it regulates synaptic plasticity, supports working memory, and helps your cells clear out metabolic waste products. When your brain tissue develops insulin resistance, your cells lose the ability to efficiently convert glucose into cellular energy.

This metabolic bottleneck creates an unmanaged inflammatory environment within your nervous system, a process peer-reviewed neurology papers frequently refer to as "type 3 diabetes."

The brain doesn't shift overnight; it sends manageable, early indicators decades before a point of crisis arrives. This biological reality is why our 12-month programme starts with comprehensive blood panels to isolate your exact glycemic indicators, allowing our CORU-registered dietitians to design custom macro adjustments tailored entirely to your metabolism.

Tomorrow, we will share three simple, evidence-based nutritional adjustments you can implement immediately to stabilize your daily cognitive energy.

Best regards,
The NeuroNourish Clinical Team`,
  },
  part3: {
    subject: "[Part 3] Three daily steps to stabilize your cognitive energy",
    body: `Dear [First Name],

Over the past week, we have explored how unmanaged blood sugar fluctuations impact your daily focus and long-term neural health. Today, let's focus on practical, evidence-based lifestyle actions you can use to protect your mental clarity.

Here are three structural dietary habits that support steady cognitive fuel delivery:

1. Prioritize Protein and Fiber Sequencing: Altering the order of your meal matters. Consuming high-quality protein and fiber before carbohydrates creates a physical buffer in your digestive tract, smoothing out your post-meal glucose curves and eliminating afternoon crashes.
2. Align with Circadian Light: Your insulin sensitivity drops naturally as evening approaches. Consuming your largest metabolic meals during peak daylight hours protects your system from prolonged overnight glucose exposure.
3. Utilize Post-Meal Functional Movement: A simple 10-minute walk within half an hour of eating allows your skeletal muscles to clear glucose directly from your bloodstream without requiring an intensive insulin spike.

While these everyday habits are powerful, true long-term cognitive protection requires an individualized approach built around your unique medical history.

Our personalised brain health programmes combine advanced biomarker analysis, continuous digital monitoring, and weekly 1-on-1 coaching to turn evidence-led science into permanent, stress-free daily routines.

If you are ready to take control of your cognitive vitality, the first step is simply a conversation. Click below to book a complimentary 15-minute discovery consultation with our care team today.

[ Book Your Discovery Consultation Call ]

Warm regards,
Emer Sexton
Founder & CEO, NeuroNourish`,
    ctaLabel: "Book Your Discovery Consultation Call",
    ctaDestination: "/discovery",
  },
} as const;

/** 3-part educational newsletter — gut-brain axis and memory protection (Sage archetype). */
export const NN_NEWSLETTER_GUT_BRAIN_SERIES = {
  seriesTitle: "Gut-Brain & Memory Protection",
  archetype: "Sage",
  audience: "Top-of-funnel subscribers and quiz completers",
  part1: {
    subject: "[Part 1] Why your digestive health dictates your memory performance",
    body: `Dear [First Name],

When we notice early memory changes, persistent brain fog, or a sudden drop in processing speed, we instinctively look for answers exclusively within our minds. But modern metabolic neurology reveals a different reality: your cognitive clarity is deeply influenced by your digestive tract.

Often referred to by neuroscientists as the "second brain," the enteric nervous system contains over 100 million neurons. Your gut lining and your central nervous system are in a constant, real-time dialogue along a biological highway called the vagus nerve.

When your digestive environment experiences chronic irritation, poor nutrient absorption, or unmanaged blood sugar fluctuations, it triggers a cascade of inflammatory signals. These signals travel directly upstream, altering your brain's cellular energy and disrupting the neural pathways that manage memory retention and focus.

Protecting your cognitive vitality requires a comprehensive approach that bridges the gap between your gut and your brain cell networks. In our next message, we will explore the precise relationship between microbiome balance and long-term neuroprotection.

In collaborative partnership,
The NeuroNourish Clinical Team`,
  },
  part2: {
    subject: "[Part 2] The silent link between gut bacteria and cognitive aging",
    body: `Dear [First Name],

In our last message, we looked at how digestive inflammation sends warning signals up to your brain. Today, we need to address the chemical messengers driving that communication link: your gut microbiome.

Your intestinal bacteria are responsible for producing a significant proportion of your body's neurotransmitters—including GABA and serotonin, which directly modulate mood, mental stamina, and stress resilience. Furthermore, a diverse, healthy microbiome manufactures short-chain fatty acids (SCFAs), which act as structural shields protecting the blood-brain barrier.

When your gut ecosystem loses its microbial diversity, your protective barriers can become compromised. This allows metabolic waste products to trigger low-grade neuroinflammation—a key driver of accelerated cognitive aging and memory dimming.

At NeuroNourish, our 12-month Personalised Brain Health Programme completely rejects generalized wellness advice. We use advanced blood work panels and biomarker tracking to evaluate your systemic metabolic and gut-brain indicators. This allows our CORU dietitians to design highly targeted nutritional roadmaps built on your unique biology.

Tomorrow, we will outline three simple, evidence-based daily changes you can implement immediately to optimize your gut-brain axis.

Best regards,
The NeuroNourish Clinical Team`,
  },
  part3: {
    subject: "[Part 3] Three daily steps to protect your gut-brain axis",
    body: `Dear [First Name],

Over the past week, we have explored how your digestive tract, microbiome diversity, and neuroinflammation directly shape your daily mental clarity and memory performance. Today, let's look at three practical, evidence-based habits you can use to protect your gut-brain axis:

1. Prioritize Polyphenol-Rich Prebiotics: Consuming deeply colored foods—such as wild berries, dark leafy greens, and green tea—supplies your gut bacteria with vital compounds that actively lower neuroinflammatory indicators.
2. Mind your Digestive Sequencing: Eating high-quality fiber and protein before complex carbohydrates buffers your digestive tract, smoothing out blood sugar responses that disrupt cerebral energy.
3. Practice Deliberate Stress Mitigation: Chronic stress hormones physically alter your intestinal lining and disrupt microbiome balance. Dedicating just 5 minutes to deep, paced breathing before major meals safely activates vagal tone, supporting optimal absorption.

While these daily routines are powerful, true long-term cognitive protection requires an individualized approach built on objective data.

Our 12-month supervised care protocols combine precision nutrition, biomarker reviews, and continuous app-based coaching to turn clinical neuroscience into a personalized, stress-free path forward. If you are ready to stop guessing about your future brain health, let's start with a conversation. Click below to book a complimentary 15-minute discovery consultation with our care team.

[ Book Your Discovery Consultation Call ]

Warm regards,
Emer Sexton
Founder & CEO, NeuroNourish`,
    ctaLabel: "Book Your Discovery Consultation Call",
    ctaDestination: "/discovery",
  },
} as const;

/** 3-step enterprise follow-up when employer briefing pack goes cold (48h · 5d · 9d). */
export const NN_ENTERPRISE_BRIEFING_NURTURE = {
  step1: {
    delay: "48 hours post-inquiry",
    subject: "Quantifying the organizational cost of executive cognitive fatigue",
    body: `Dear [Contact Name],

A few days ago, you requested our enterprise documentation regarding workplace brain wellness and performance protocols. I trust the material provided a useful look at how our platform translates complex neuroscience into high-utility corporate performance structures.

In high-performance corporate environments, cognitive stamina is an operational asset. When senior leadership teams experience persistent brain fog or drops in mental processing speed due to stress or poor sleep architecture, it directly impacts your firm's decision-making speed.

NeuroNourish eliminates this friction. Rather than providing generic wellness tips, our 12-month programme uses advanced data tracking to map and optimize employee focus, sleep metrics, and recovery markers. We help your business protect your senior talent while improving overall productivity.

Let's schedule a brief, 10-minute briefing with our corporate liaison team to discuss your population goals this month.

[ Secure an Enterprise Briefing Call Here ]

Best regards,
Emer Sexton
Founder & CEO, NeuroNourish`,
  },
  step2: {
    delay: "5 days post-inquiry",
    subject: "Moving from wellness perks to measurable health outcomes",
    body: `Dear [Contact Name],

Most corporate wellness benefits share a common flaw: they rely on self-reported feedback and cannot prove an objective return on investment.

NeuroNourish approaches corporate wellness with clinical precision. When your executives enter our 12-month protocol, we look at the underlying root causes of cognitive fatigue by tracking advanced biomarker panels alongside standardized cognitive tests.

Through our secure mobile application, your employees receive simple daily tasks to manage stress resilience and track their personal metrics. Your human resources team receives anonymized, aggregated dashboard readouts showing clear improvements in workforce focus and energy levels over time.

Protect your talent with a data-driven strategy. Let's find a convenient time for a quick, 5-minute video walkthrough of our enterprise interface layout.

[ Request an Interface Demonstration ]

In partnership,
The NeuroNourish Corporate Team`,
  },
  step3: {
    delay: "9 days post-inquiry",
    subject: "Capped executive allocation for our upcoming August intake",
    body: `Dear [Contact Name],

We are currently wrapping up our corporate implementation agreements and allocating our coaching resources for the upcoming August intake cohort.

To maintain strict clinical oversight, personalized data analysis, and high-touch accountability for every participant, our intake capacity is strictly capped. If you want to integrate an evidence-based cognitive health protocol into your senior benefits framework this year, the window to secure your allocation is closing.

Onboarding your organization requires zero operational friction or complex admin setup. We handle everything from baseline onboarding to continuous tracking, providing your team with an elegant, data-secure health pathway that protects their performance and long-term vitality.

Let's connect for a quick 10-minute call before our cohort intake closes for the season.

[ Secure an August Corporate Integration Call ]

Warm regards,
Emer Sexton
Founder & CEO, NeuroNourish`,
  },
} as const;

export const NN_META_AD_CAMPAIGN = {
  structure: "Single campaign → three ad sets (one per creative angle) → quiz landing page",
  audienceSegments: [
    "Health-conscious adults aged 45–65",
    "Custom interests: functional medicine, longevity, brain health",
    "Lookalike audiences built from CRM and discovery call lists",
  ],
  tracking: {
    pixelEvents: ["Lead", "CompleteRegistration"],
    utmCampaign: "nn-quiz-august-launch",
    utmMedium: "paid_social",
    utmContent: "angle-{id}",
  },
  complianceNotes: [
    "No unscientific cure claims",
    "No crude dementia scare tactics",
    "Lead with human outcomes and modifiable lifestyle factors",
  ],
  /** Example destination URLs — use buildMetaQuizLandingUrl() for production links. */
  exampleDestinationBase: "https://neuronourish.clinic/quiz",
  exampleUtmQuery:
    "utm_source=meta&utm_medium=paid_social&utm_campaign=nn-quiz-august-launch&utm_content=angle-{id}",
} as const;

export const NN_FOUNDER_ABOUT = {
  eyebrow: "Vision",
  headline: "The Vision Behind NeuroNourish",
  title:
    "Background in nutraceuticals, ReCODE & PreCODE, functional medicine principles, and nutrition & health coaching",
  credentialsShort:
    "Nutraceuticals · ReCODE & PreCODE · Nutrition & health coaching · 30 Under 30 Honouree",
  teaser: "The Future of Brain Health is Proactive.",
  pullQuote: "Because science only changes lives when people can apply it.",
  highlights: [
    "Personalised nutrition, cognitive assessment, and blood biomarkers",
    "Lifestyle medicine and behaviour-change coaching in one programme",
    "Evidence from nutrition, neuroscience, neurology and neuropsychology",
  ],
  body: [
    "NeuroNourish was created to bridge the gap between dementia prevention research and everyday action. Drawing on evidence from nutrition, neuroscience, neurology and neuropsychology, our programme brings together personalised nutrition, cognitive assessment, blood biomarkers, lifestyle medicine and behaviour change into one practical, evidence-based approach to brain health.",
  ],
  builtByEyebrow: "Built by Emer Sexton",
  builtBy:
    "Emer founded NeuroNourish with one belief: brain health is shaped by the decisions we make every day. Drawing on her background in nutraceuticals, ReCODE®, PreCODE®, functional medicine principles, and nutrition and health coaching, she brought together expertise across nutrition, neuroscience, neurology and neuropsychology to create a personalised brain health programme that translates complex science into practical action.",
  builtByClose:
    "Every recommendation is designed to be evidence-based, personalised with precision, and realistic enough to become part of everyday life.",
  quote:
    "What I lived through gave me an insight no textbook could match: I know exactly what it feels like when your brain no longer cooperates. Later, watching my grandfather decline with Alzheimer's, I realized that the same evidence-based strategies that help a brain recover are the ones that protect it from future disease. I founded NeuroNourish to give adults a proactive, structured plan to take control of their cognitive future long before a crisis occurs.",
  attribution: "— Emer Sexton",
  cta: "Read Full Story",
  ctaHint: "",
} as const;
