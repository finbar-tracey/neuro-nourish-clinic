import { NeuroNourishShell } from "@/components/neuronourish/shell";
import { NnScrollReveal } from "@/components/neuronourish/nn-scroll-reveal";
import { StickyCta } from "@/components/neuronourish/sticky-cta";
import { JsonLd } from "@/components/neuronourish/structured-data";
import {
  B2bSection,
  ClosingCtaSection,
  FaqSection,
  FounderSection,
  HeroSection,
  JourneySection,
  OutcomesSection,
  PartnerStrip,
  QuizFoldSection,
  WhySection,
} from "@/components/neuronourish/content";
import { neuronourishHomeJsonLd } from "@/lib/neuronourish-seo";

export function NeuroNourishHomePage() {
  return (
    <NeuroNourishShell>
      <JsonLd data={neuronourishHomeJsonLd()} />
      <NnScrollReveal />
      <HeroSection />

      <QuizFoldSection className="nn-defer-section nn-reveal" />

      <FounderSection className="nn-defer-section nn-reveal" />

      <OutcomesSection className="nn-reveal" />

      <JourneySection className="nn-defer-section nn-reveal" />

      <WhySection className="nn-defer-section nn-reveal" />

      <PartnerStrip className="nn-defer-section nn-reveal" />

      <B2bSection className="nn-defer-section nn-reveal" />

      <FaqSection id="faq" className="nn-defer-section nn-reveal" />

      <ClosingCtaSection className="nn-defer-section nn-reveal" />
      <StickyCta />
    </NeuroNourishShell>
  );
}
