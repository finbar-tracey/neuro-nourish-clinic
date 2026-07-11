import Link from "next/link";
import { ArrowRight, Calendar, Check, Rocket, TrendingUp } from "lucide-react";
import { SalesCalendlyLink } from "@/components/landing/sales-calendly-embed";
import { Section, SectionHeader, ctaPrimary } from "@/components/landing/layout";
import {
  HEALTHCARE_FOR_CLINICS,
  HEALTHCARE_FOR_CLINICS_HOW_IT_WORKS,
} from "@/lib/healthcare-lp-copy";
import { cn } from "@/lib/utils";

const STEP_ICONS = [Calendar, Rocket, TrendingUp] as const;

export function ForClinicsHowItWorks() {
  const copy = HEALTHCARE_FOR_CLINICS_HOW_IT_WORKS;

  return (
    <Section id="how-it-works" className="scroll-mt-24 bg-brand-cream">
      <SectionHeader title={copy.title} description={copy.description} />

      <div className="mb-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {copy.steps.map((step, index) => (
          <div key={step.step} className="flex items-center gap-2 sm:gap-3">
            <span className="rounded-full border border-gold/30 bg-white px-3 py-1 text-xs font-semibold text-navy shadow-sm">
              {step.badge}
            </span>
            {index < copy.steps.length - 1 && (
              <ArrowRight className="h-4 w-4 text-gold-ink/60" aria-hidden />
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-3 md:gap-6">
        {copy.steps.map(({ step, title, desc, badge, highlights }, index) => {
          const Icon = STEP_ICONS[index] ?? Calendar;
          return (
            <article
              key={step}
              className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-100"
            >
              {index < copy.steps.length - 1 && (
                <ArrowRight
                  className="absolute -right-3.5 top-[4.5rem] z-10 hidden h-5 w-5 text-gold-ink md:block lg:-right-4"
                  aria-hidden
                />
              )}

              <div className="border-b border-slate-100 bg-gradient-to-br from-brand-cream/60 to-white px-5 pb-4 pt-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-sm font-bold text-navy shadow-sm">
                    {step}
                  </div>
                  <span className="rounded-full bg-navy/5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-navy">
                    {badge}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy/5 text-gold-ink">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="font-display text-xl font-medium leading-snug text-navy">{title}</h3>
                </div>
              </div>

              <div className="flex flex-1 flex-col px-5 py-4">
                <p className="text-sm leading-relaxed text-slate-600">{desc}</p>
                <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                  {highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-ink" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
        <div className="text-center sm:text-left">
          <SalesCalendlyLink className={cn(ctaPrimary, "min-h-[52px] px-8 text-base shadow-lg")}>
            {HEALTHCARE_FOR_CLINICS.cta}
          </SalesCalendlyLink>
          <p className="mt-2 text-xs text-slate-500">{HEALTHCARE_FOR_CLINICS.ctaNote}</p>
        </div>
        <p className="text-center text-sm text-slate-600 sm:text-left">
          Want the full scope?{" "}
          <Link href="#pilot-offer" className="font-semibold text-gold-ink underline underline-offset-2">
            See pilot offer →
          </Link>
        </p>
      </div>
    </Section>
  );
}
