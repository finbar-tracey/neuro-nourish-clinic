import { Section, SectionHeader } from "@/components/landing/layout";
import { LandingFaqAccordion } from "@/components/landing/faq-accordion";
import { HEALTHCARE_IMPLANTS_FAQ } from "@/lib/healthcare-lp-copy";

export function HealthcareImplantsFaq() {
  return (
    <Section className="bg-white" width="tight" compact>
      <SectionHeader
        title="Common questions"
        description="Straight answers before you book — free consultation, no obligation."
      />

      <LandingFaqAccordion
        groupName="implants-faq"
        defaultOpenIndex={0}
        items={HEALTHCARE_IMPLANTS_FAQ}
      />

      <div className="mt-10 text-center">
        <a
          href="#quote-form"
          className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-navy px-8 py-3 text-sm font-semibold text-white hover:bg-navy-light"
        >
          Book free consultation
        </a>
      </div>
    </Section>
  );
}
