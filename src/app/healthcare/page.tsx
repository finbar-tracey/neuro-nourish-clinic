import Link from "next/link";
import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { SectionHeader } from "@/components/neuronourish/content/section-header";
import { GoldButton, NeuroNourishShell } from "@/components/neuronourish/shell";
import { buildNeuronourishMetadata } from "@/lib/neuronourish-seo";

export const metadata = buildNeuronourishMetadata("healthcare");

/** Priority 8 stub — referral detail expands from /clinics content. */
export default function HealthcarePage() {
  return (
    <NeuroNourishShell>
      <PageSection className="py-14 sm:py-20">
        <PageContainer width="md" className="text-center">
          <SectionHeader
            eyebrow="For healthcare professionals"
            headline="Refer with clarity"
            subtext="For GPs, dietitians, psychologists, physiotherapists, clinics and other clinicians who want a clear pathway for clients seeking cognitive measurement and lifestyle support."
            align="center"
            headlineClassName="max-w-2xl"
            as="h1"
          />
          <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-ink/70">
            NeuroNourish does not diagnose or treat dementia. We focus on assessment, modifiable
            factors, personalised support and ongoing tracking — with communication back to referring
            professionals where appropriate.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3">
            <GoldButton href="/clinics">Refer a Client</GoldButton>
            <Link
              href="/discovery"
              className="text-sm text-ink/65 underline-offset-3 hover:text-deep-slate hover:underline"
            >
              Speak with our team →
            </Link>
          </div>
        </PageContainer>
      </PageSection>
    </NeuroNourishShell>
  );
}
