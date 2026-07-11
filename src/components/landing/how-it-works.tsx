import { Clock, FileCheck, Search } from "lucide-react";
import {
  ContentCard,
  Section,
  SectionCta,
  SectionHeader,
} from "@/components/landing/layout";
import { META_LP_HOW_IT_WORKS_STEPS } from "@/lib/meta-lp-copy";

const STEP_ICONS = [FileCheck, Search, Clock] as const;

export function HowItWorksSection() {
  return (
    <Section className="bg-brand-cream">
      <SectionHeader
        title="How It Works"
        description="Three quick steps — same as the form above. Drop off after step 2 and we can still call you."
      />

      <div className="relative grid gap-6 md:grid-cols-3 md:gap-8">
        <div className="pointer-events-none absolute left-0 right-0 top-6 hidden h-0.5 bg-gold/25 md:mx-[16.67%] md:block" />
        {META_LP_HOW_IT_WORKS_STEPS.map(({ step, title, desc, time }, index) => {
          const Icon = STEP_ICONS[index] ?? FileCheck;
          return (
            <ContentCard key={step} className="relative">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gold text-sm font-bold text-navy">
                  {step}
                </div>
                <span className="rounded-full bg-brand-cream px-3 py-1 text-xs font-medium text-navy">
                  {time}
                </span>
              </div>
              <Icon className="mb-4 h-6 w-6 text-gold-ink" />
              <h3 className="mb-2 font-semibold text-navy">{title}</h3>
              <p className="text-sm leading-relaxed text-slate-600">{desc}</p>
            </ContentCard>
          );
        })}
      </div>

      <SectionCta
        label="Start Step 1 — Free Enquiry"
        variant="secondary"
        note="2-minute form · No obligation · No hard credit check"
      />
    </Section>
  );
}
