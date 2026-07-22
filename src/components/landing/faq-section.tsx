import { META_LP_FAQ } from "@/lib/meta-lp-copy";
import { Section, SectionCta, SectionHeader } from "@/components/landing/layout";
import { LandingFaqAccordion } from "@/components/landing/faq-accordion";

export function FaqSection() {
  return (
    <Section id="faq" className="bg-brand-cream" width="tight">
      <SectionHeader
        title="Frequently Asked Questions"
        description="Objections answered upfront — so you can enquire with confidence."
      />

      <LandingFaqAccordion
        groupName="meta-lp-faq"
        defaultOpenIndex={0}
        items={META_LP_FAQ.map(({ q, a, category }) => ({
          q,
          a,
          badge:
            category === "objection" ? (
              <span className="mt-0.5 shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-700">
                No risk
              </span>
            ) : undefined,
        }))}
      />

      <SectionCta
        label="Ready? Start Free Enquiry"
        note="No obligation · No hard credit check · 2-minute form"
        showPhone
      />
    </Section>
  );
}
