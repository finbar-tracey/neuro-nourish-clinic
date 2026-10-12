import { NeuroNourishShell } from "@/components/neuronourish/shell";
import { NnScrollReveal } from "@/components/neuronourish/nn-scroll-reveal";
import { StickyCta } from "@/components/neuronourish/sticky-cta";
import { JsonLd } from "@/components/neuronourish/structured-data";
import {
  AssessmentFoldSection,
  B2bSection,
  ClosingCtaSection,
  FaqSection,
  FounderSection,
  FunnelJourneySection,
  HeroSection,
  OutcomesSection,
  PartnerStrip,
  ProgrammeFoldSection,
  QuizFoldSection,
  TodayFutureSection,
  WhyBrainHealthSection,
} from "@/components/neuronourish/content";
import { neuronourishHomeJsonLd } from "@/lib/neuronourish-seo";

/** Homepage order — Finbar developer handover §37. */
export function NeuroNourishHomePage() {
  return (
    <NeuroNourishShell>
      <JsonLd data={neuronourishHomeJsonLd()} />
      <NnScrollReveal />
      <HeroSection />

      <WhyBrainHealthSection className="nn-defer-section nn-reveal" />

      <TodayFutureSection className="nn-defer-section nn-reveal" />

      <FunnelJourneySection className="nn-defer-section nn-reveal" />

      <QuizFoldSection className="nn-defer-section nn-reveal" />

      <AssessmentFoldSection className="nn-defer-section nn-reveal" />

      <ProgrammeFoldSection className="nn-defer-section nn-reveal" />

      <FounderSection className="nn-defer-section nn-reveal" />

      <OutcomesSection className="nn-reveal" />

      <PartnerStrip className="nn-defer-section nn-reveal" />

      <B2bSection className="nn-defer-section nn-reveal" />

      <FaqSection id="faq" className="nn-defer-section nn-reveal" />

      <ClosingCtaSection className="nn-defer-section nn-reveal" />
      <StickyCta />
    </NeuroNourishShell>
  );
}
