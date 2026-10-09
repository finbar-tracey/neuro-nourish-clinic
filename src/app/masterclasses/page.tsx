import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { SectionHeader } from "@/components/neuronourish/content/section-header";
import { GoldButton, NeuroNourishShell } from "@/components/neuronourish/shell";
import { buildNeuronourishMetadata } from "@/lib/neuronourish-seo";

export const metadata = buildNeuronourishMetadata("masterclasses");

/** Priority 6 stub — enquiry form and topics land next. */
export default function MasterclassesPage() {
  return (
    <NeuroNourishShell>
      <PageSection className="py-14 sm:py-20">
        <PageContainer width="md" className="text-center">
          <SectionHeader
            eyebrow="Masterclasses"
            headline="Bring Brain Health to Your Organisation or Community"
            subtext="Engaging, practical brain-health masterclasses delivered in person across Ireland or live online."
            align="center"
            headlineClassName="max-w-2xl"
            as="h1"
          />
          <p className="nn-display-card mx-auto mt-10 max-w-xl text-deep-slate">
            Your Brain. Your Future. Your Move.
          </p>
          <p className="mt-3 text-sm text-ink/70">
            The Science of Protecting Memory and Staying Sharper for Longer
          </p>
          <div className="mt-10 flex flex-col items-center gap-3">
            <GoldButton href="/contact">Book a Masterclass</GoldButton>
            <a
              href="/quiz"
              className="text-sm text-ink/65 underline-offset-3 hover:text-deep-slate hover:underline"
            >
              Preview the Brain Health Quiz →
            </a>
          </div>
        </PageContainer>
      </PageSection>
    </NeuroNourishShell>
  );
}
