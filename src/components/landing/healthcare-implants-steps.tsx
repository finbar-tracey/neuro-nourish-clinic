import { Calendar, CheckCircle2, UserRound } from "lucide-react";
import { ContentCard, Section, SectionHeader } from "@/components/landing/layout";
import { HEALTHCARE_CONSULT_STEPS, HEALTHCARE_IMPLANTS_STEPS } from "@/lib/healthcare-lp-copy";

const STEP_ICONS = [Calendar, CheckCircle2, UserRound] as const;

export function HealthcareImplantsSteps() {
  return (
    <Section className="bg-brand-cream/30" compact>
      <SectionHeader
        title={HEALTHCARE_IMPLANTS_STEPS.title}
        description={HEALTHCARE_IMPLANTS_STEPS.description}
      />

      <div className="grid gap-6 md:grid-cols-3">
        {HEALTHCARE_CONSULT_STEPS.map(({ title, desc }, index) => {
          const Icon = STEP_ICONS[index] ?? Calendar;
          return (
            <ContentCard key={title} className="text-center md:text-left">
              <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-gold text-sm font-bold text-navy md:mx-0">
                {index + 1}
              </div>
              <Icon className="mx-auto mb-3 h-6 w-6 text-gold-ink md:mx-0" aria-hidden />
              <h3 className="font-semibold text-navy">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</p>
            </ContentCard>
          );
        })}
      </div>
    </Section>
  );
}
