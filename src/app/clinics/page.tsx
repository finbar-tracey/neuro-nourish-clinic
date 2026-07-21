import Link from "next/link";
import {
  GoldButton,
  NeuroNourishShell,
  OutlineButton,
} from "@/components/neuronourish/shell";
import {
  PageContainer,
  PageHeader,
  ScannableBlock,
  ScannableGrid,
} from "@/components/neuronourish/content";
import { ClinicianFaqSection } from "@/components/neuronourish/content/clinician-faq-accordion";
import { ExpressionOfInterestForm } from "@/components/forms/expression-of-interest-form";
import { NN_CLINICIAN_PARTNERSHIP, NN_CLINICS } from "@/lib/neuronourish-copy";
import { buildNeuronourishMetadata } from "@/lib/neuronourish-seo";

export const metadata = buildNeuronourishMetadata("clinics");

export default function ClinicsPage() {
  return (
    <NeuroNourishShell>
      <PageContainer width="lg" className="py-16">
        <PageHeader
          eyebrow={NN_CLINICS.eyebrow}
          headline={NN_CLINICS.headline}
          subtext={NN_CLINICS.subtext}
        />
        <ScannableGrid>
          {NN_CLINICS.pillars.map((pillar) => (
            <ScannableBlock
              key={pillar.title}
              title={pillar.title}
              highlights={pillar.highlights}
              tone="card"
            />
          ))}
        </ScannableGrid>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <GoldButton href="#partnership-briefing">{NN_CLINICS.cta}</GoldButton>
          <OutlineButton href="/clinics/referral-card">{NN_CLINICS.referralCardLink}</OutlineButton>
        </div>
      </PageContainer>
      <ClinicianFaqSection />
      <div id="partnership-briefing">
        <PageContainer width="sm" className="border-t border-linen/80 py-16">
          <PageHeader
            eyebrow={NN_CLINICIAN_PARTNERSHIP.formEyebrow}
            headline={NN_CLINICIAN_PARTNERSHIP.formHeadline}
            subtext={NN_CLINICIAN_PARTNERSHIP.formSubtext}
            as="h2"
          />
          <div className="mt-8">
            <ExpressionOfInterestForm
              intent="partnership"
              submitLabel={NN_CLINICIAN_PARTNERSHIP.submitLabel}
            />
          </div>
          <p className="mt-6 text-center text-xs text-ink/60">
            Prefer email?{" "}
            <Link href="mailto:referrals@neuronourish.clinic" className="nn-text-link">
              referrals@neuronourish.clinic
            </Link>
          </p>
        </PageContainer>
      </div>
    </NeuroNourishShell>
  );
}
