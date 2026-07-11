import { FacebookLeadForm } from "@/components/forms/facebook-lead-form";
import { MetaViewContent } from "@/components/analytics/meta-pixel";
import { BrandLogo } from "@/components/brand/logo";
import {
  ComparisonSection,
  DanielExpertCard,
  FaqSection,
  FinalCtaSection,
  GoogleReviewsSection,
  HowItWorksSection,
  KeyFactsSection,
  MidPageCta,
  OfferSection,
  ProblemSection,
  RiskReversalSection,
  UseCasesSection,
} from "@/components/landing/below-fold-sections";
import { GoogleRatingBadge } from "@/components/landing/google-rating-badge";
import { HeroCopy } from "@/components/landing/hero-copy";
import { MetaComplianceStrip } from "@/components/landing/meta-compliance-strip";
import { PhoneLink } from "@/components/landing/phone-link";
import { SiteHeader } from "@/components/landing/site-header";
import { SocialProofBar } from "@/components/landing/social-proof-bar";
import { StickyCta } from "@/components/landing/sticky-cta";
import { StarRating } from "@/components/ui/star-rating";
import type { AdAngle } from "@/lib/ad-angles";
import { GOOGLE_REVIEWS } from "@/lib/reviews";
import { META_LP_FOOTER_INTRO, META_LP_TOP_BANNER } from "@/lib/meta-lp-copy";
import { ctaPrimary } from "@/components/landing/layout";
import { Mail, MapPin, Phone } from "lucide-react";

export function FacebookLandingPage({ angle = "default" }: { angle?: AdAngle }) {
  const heroReview = GOOGLE_REVIEWS.find((r) => r.featured)!;

  return (
    <>
      <MetaViewContent contentName={`Facebook LP — ${angle}`} />

      <a
        href="#quote-form"
        className="hidden bg-brand-cream py-2 text-center text-[11px] font-medium text-brand-muted transition hover:bg-brand-cream/80 sm:block sm:py-3 sm:text-xs"
      >
        <span className="hidden sm:inline">
          <span className="font-semibold text-navy underline decoration-gold/50">
            {META_LP_TOP_BANNER}
          </span>
        </span>
      </a>

      <SiteHeader />

      <main id="main-content" className="pb-20 md:pb-0">
        <section className="hero-pattern bg-navy text-white">
          <div className="hidden sm:block">
            <SocialProofBar />
          </div>
          <div className="mx-auto max-w-6xl px-4 pb-8 pt-3 sm:gap-10 sm:px-6 sm:pb-12 sm:pt-8 lg:grid lg:grid-cols-2 lg:items-start lg:gap-14 lg:pb-16 lg:pt-10">
            <div className="order-1 mb-4 lg:order-2 lg:mb-0">
              <MetaComplianceStrip variant="hero" className="mb-4 lg:hidden" />
              <FacebookLeadForm angle={angle} />
            </div>
            <div className="order-2 space-y-8 lg:order-1 lg:pt-2">
              <HeroCopy angle={angle} />
              <blockquote className="rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6">
                <div className="mb-3">
                  <StarRating size="md" />
                </div>
                <p className="text-sm italic leading-relaxed text-slate-200 md:text-base">
                  &ldquo;{heroReview.text}&rdquo;
                </p>
                <footer className="mt-3 text-xs font-medium text-slate-200">
                  — {heroReview.name}, verified Google review
                </footer>
              </blockquote>
            </div>
          </div>
        </section>

        <KeyFactsSection />
        <ProblemSection angle={angle} />
        <DanielExpertCard variant="section" />
        <UseCasesSection angle={angle} />
        <HowItWorksSection />
        <ComparisonSection />
        <OfferSection />
        <GoogleReviewsSection />
        <MidPageCta angle={angle} />
        <RiskReversalSection />
        <FaqSection />
        <FinalCtaSection angle={angle} />
      </main>

      <footer className="bg-navy-dark py-14 text-xs text-slate-400 md:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-10 flex flex-col items-center gap-6 md:flex-row md:justify-between">
            <BrandLogo variant="footer" theme="dark" href="/" />
            <GoogleRatingBadge variant="compact" inverted />
          </div>
          <div className="mb-10 grid gap-6 text-center md:grid-cols-3 md:text-left">
            <div className="flex items-center justify-center gap-2 md:justify-start">
              <MapPin className="h-4 w-4 text-gold" />
              12 Old Bond Street, Mayfair, London
            </div>
            <PhoneLink
              contentName="LP Footer Phone"
              className="flex items-center justify-center gap-2 hover:text-gold md:justify-start"
            >
              <Phone className="h-4 w-4 text-gold" />
              020 7177 4141
            </PhoneLink>
            <a
              href="mailto:daniel@bridgingloansbroker.co.uk"
              className="flex items-center justify-center gap-2 hover:text-gold md:justify-start"
            >
              <Mail className="h-4 w-4 text-gold" />
              daniel@bridgingloansbroker.co.uk
            </a>
          </div>
          <p className="mx-auto max-w-2xl text-center leading-relaxed">
            {META_LP_FOOTER_INTRO}
          </p>
          <MetaComplianceStrip variant="footer" className="mx-auto mt-6 max-w-2xl" />
          <div className="mt-10 text-center">
            <a href="#quote-form" className={ctaPrimary}>
              Start Free Enquiry
            </a>
            <p className="mt-3 text-xs text-slate-400">
              No obligation · Typical response within 2 hours
            </p>
          </div>
          <p className="mt-6 text-center text-[10px] text-slate-400">
            © {new Date().getFullYear()} Bridging Loans Broker. Powered by Edge Mortgages.
            {" · "}
            <a href="/privacy" className="underline hover:text-slate-400">
              Privacy Policy
            </a>
          </p>
        </div>
      </footer>

      <StickyCta />
    </>
  );
}
