import { NN_FAQ, NN_METADATA } from "@/lib/neuronourish-copy";
import { buildPageMetadata } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site-url";
import type { Metadata } from "next";

/** Centralised page-level SEO — single source for titles, descriptions, paths. */
export const NN_PAGE_SEO = {
  home: {
    title: NN_METADATA.title,
    description: NN_METADATA.description,
    path: "/",
    ogImage: NN_METADATA.ogImage,
  },
  quiz: {
    title: "What's Your Brain Health Score? | NeuroNourish",
    description:
      "Take our 3-minute brain health quiz. Understand how nutrition, sleep, and lifestyle may influence your cognitive wellbeing. Not a medical diagnosis.",
    path: "/quiz",
  },
  quizResults: {
    title: "Your Brain Health Quiz Results | NeuroNourish",
    description:
      "View your brain health score and email your personalised report — with clear next steps toward assessment and the 12-month programme.",
    path: "/quiz/results",
    noindex: true,
  },
  assessment: {
    title: "Cognitive Health Assessment | NeuroNourish",
    description:
      "Clinician-reviewed cognitive assessment with personalised summary — a clear next step after the brain health quiz.",
    path: "/shop/cognitive-assessment",
  },
  assessmentSuccess: {
    title: "Assessment Confirmed | NeuroNourish",
    description: "Your cognitive health assessment purchase is confirmed. Check your email for next steps.",
    path: "/shop/success",
    noindex: true,
  },
  programme: {
    title: "12-Month Personalised Brain Health Programme | NeuroNourish",
    description:
      "Compare Premium, Medium, and Light programme tiers — or book a discovery call before you enrol.",
    path: "/programme",
  },
  programmeSuccess: {
    title: "Programme Enrolment Confirmed | NeuroNourish",
    description: "Welcome to the NeuroNourish 12-month brain health programme. Our team will contact you shortly.",
    path: "/shop/success",
    noindex: true,
  },
  shop: {
    title: "Shop | NeuroNourish",
    description:
      "Programme tiers, cognitive assessment, consultations, blood work review, and more — secure checkout.",
    path: "/shop",
  },
  team: {
    title: "Medical & Care Team | NeuroNourish",
    description:
      "Meet the NeuroNourish clinical and care team — founder-led programmes with dietitian oversight.",
    path: "/team",
  },
  discovery: {
    title: "Book a Discovery Call | NeuroNourish",
    description:
      "Book a complimentary discovery call to discuss your brain health goals and personalised programme options.",
    path: "/discovery",
  },
  contact: {
    title: "Contact NeuroNourish",
    description: "Get in touch with NeuroNourish about our personalised brain health programme.",
    path: "/contact",
  },
  about: {
    title: "About Emer Sexton | NeuroNourish",
    description:
      "Meet Emer Sexton, Founder of NeuroNourish — Ireland's first ReCODE practitioner building personalised brain health programmes.",
    path: "/about",
  },
  clinics: {
    title: "Healthcare Partnerships | NeuroNourish",
    description:
      "Partner with NeuroNourish to deliver evidence-based preventive brain health programmes for clinics and care organisations.",
    path: "/clinics",
  },
  blog: {
    title: "Brain Health Insights Blog | NeuroNourish",
    description: "Evidence-led articles on sleep, nutrition, movement, and cognitive wellbeing.",
    path: "/blog",
    noindex: true,
  },
  app: {
    title: "How the NeuroNourish App Works",
    description:
      "The NeuroNourish companion app is included for programme clients — track meals, sleep, movement, and mood between appointments.",
    path: "/how-the-app-works",
    noindex: true,
  },
  privacy: {
    title: "Privacy Policy | NeuroNourish",
    description:
      "How NeuroNourish collects and uses your data when you use our brain health quiz and programmes.",
    path: "/privacy",
  },
} as const;

export type NeuronourishSeoPage = keyof typeof NN_PAGE_SEO;

export function neuronourishPublicPaths(): string[] {
  const base = Object.values(NN_PAGE_SEO)
    .filter((p) => !("noindex" in p && p.noindex))
    .map((p) => p.path);
  /** Indexable shop SKUs only — exclude placeholder/stub products (Screaming Frog: URL quality). */
  const shopSlugs = [
    "cognitive-assessment",
    "nutrition-consultation",
    "dietetic-consultation",
    "premium-programme",
    "medium-programme",
    "light-programme",
  ].map((slug) => `/shop/${slug}`);
  return [...new Set([...base, ...shopSlugs])];
}

export function buildNeuronourishMetadata(page: NeuronourishSeoPage): Metadata {
  const seo = NN_PAGE_SEO[page];
  const noindex = "noindex" in seo && seo.noindex === true;
  const base = buildPageMetadata({
    title: seo.title,
    description: seo.description,
    path: seo.path,
    ogImage: "ogImage" in seo ? seo.ogImage : NN_METADATA.ogImage,
  });
  if (!noindex) return base;
  return {
    ...base,
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
  };
}

export function neuronourishOrganizationJsonLd() {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    "@id": `${siteUrl}/#organization`,
    name: "NeuroNourish Clinic",
    url: siteUrl,
    logo: `${siteUrl}/icon`,
    image: `${siteUrl}/opengraph-image`,
    description: NN_METADATA.description,
    areaServed: ["Ireland", "United Kingdom"],
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dublin",
      addressCountry: "IE",
    },
    sameAs: [] as string[],
    medicalSpecialty: "Nutrition and lifestyle medicine for cognitive health",
  };
}

export function neuronourishWebsiteJsonLd() {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: siteUrl,
    name: "NeuroNourish Clinic",
    description: NN_METADATA.description,
    publisher: { "@id": `${siteUrl}/#organization` },
    inLanguage: "en-GB",
  };
}

export function neuronourishFaqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: NN_FAQ.items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

export function neuronourishHomeJsonLd() {
  return [neuronourishOrganizationJsonLd(), neuronourishWebsiteJsonLd(), neuronourishFaqJsonLd()];
}
