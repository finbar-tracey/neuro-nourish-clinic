import { NeuroNourishShell } from "@/components/neuronourish/shell";
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
      <HeroSection />

      <QuizFoldSection className="nn-defer-section" />

      <FounderSection className="nn-defer-section" />

      <OutcomesSection />

      <JourneySection className="nn-defer-section" />

      <WhySection className="nn-defer-section" />

      <PartnerStrip className="nn-defer-section" />

      <B2bSection className="nn-defer-section" />

      <FaqSection id="faq" className="nn-defer-section" />

      <ClosingCtaSection className="nn-defer-section" />
      <StickyCta />
    </NeuroNourishShell>
  );
}
