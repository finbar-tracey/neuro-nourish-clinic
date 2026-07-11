import dynamic from "next/dynamic";

function SectionSkeleton({ minHeight = "24rem" }: { minHeight?: string }) {
  return (
    <div
      className="w-full animate-pulse bg-slate-100"
      style={{ minHeight }}
      aria-hidden
    />
  );
}

export const KeyFactsSection = dynamic(
  () =>
    import("@/components/landing/key-facts-section").then((m) => ({
      default: m.KeyFactsSection,
    })),
  { loading: () => <SectionSkeleton minHeight="20rem" /> },
);

export const ProblemSection = dynamic(
  () =>
    import("@/components/landing/problem-section").then((m) => ({
      default: m.ProblemSection,
    })),
  { loading: () => <SectionSkeleton /> },
);

export const DanielExpertCard = dynamic(
  () =>
    import("@/components/landing/daniel-expert").then((m) => ({
      default: m.DanielExpertCard,
    })),
  { loading: () => <SectionSkeleton minHeight="18rem" /> },
);

export const UseCasesSection = dynamic(
  () =>
    import("@/components/landing/use-cases-section").then((m) => ({
      default: m.UseCasesSection,
    })),
  { loading: () => <SectionSkeleton /> },
);

export const HowItWorksSection = dynamic(
  () =>
    import("@/components/landing/how-it-works").then((m) => ({
      default: m.HowItWorksSection,
    })),
  { loading: () => <SectionSkeleton /> },
);

export const ComparisonSection = dynamic(
  () =>
    import("@/components/landing/comparison-section").then((m) => ({
      default: m.ComparisonSection,
    })),
  { loading: () => <SectionSkeleton /> },
);

export const OfferSection = dynamic(
  () =>
    import("@/components/landing/offer-section").then((m) => ({
      default: m.OfferSection,
    })),
  { loading: () => <SectionSkeleton /> },
);

export const GoogleReviewsSection = dynamic(
  () =>
    import("@/components/landing/google-reviews").then((m) => ({
      default: m.GoogleReviewsSection,
    })),
  { loading: () => <SectionSkeleton minHeight="32rem" /> },
);

export const MidPageCta = dynamic(
  () =>
    import("@/components/landing/mid-page-cta").then((m) => ({
      default: m.MidPageCta,
    })),
  { loading: () => <SectionSkeleton minHeight="10rem" /> },
);

export const RiskReversalSection = dynamic(
  () =>
    import("@/components/landing/risk-reversal-section").then((m) => ({
      default: m.RiskReversalSection,
    })),
  { loading: () => <SectionSkeleton /> },
);

export const FaqSection = dynamic(
  () =>
    import("@/components/landing/faq-section").then((m) => ({
      default: m.FaqSection,
    })),
  { loading: () => <SectionSkeleton minHeight="28rem" /> },
);

export const FinalCtaSection = dynamic(
  () =>
    import("@/components/landing/final-cta-section").then((m) => ({
      default: m.FinalCtaSection,
    })),
  { loading: () => <SectionSkeleton minHeight="14rem" /> },
);
