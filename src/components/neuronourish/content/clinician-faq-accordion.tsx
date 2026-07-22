import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { NnFaqAccordion } from "@/components/neuronourish/content/nn-faq-accordion";
import { NN_CLINICIAN_FAQ } from "@/lib/neuronourish-copy";

export function ClinicianFaqSection({ className = "" }: { className?: string }) {
  return (
    <PageSection className={`nn-faq-section border-t border-linen/80 ${className}`}>
      <PageContainer width="lg">
        <h2 className="nn-display-section mb-8 text-center text-slate-blue">
          {NN_CLINICIAN_FAQ.headline}
        </h2>
        <NnFaqAccordion
          items={NN_CLINICIAN_FAQ.items}
          groupName="clinician-faq"
          defaultOpenIndex={0}
        />
      </PageContainer>
    </PageSection>
  );
}
