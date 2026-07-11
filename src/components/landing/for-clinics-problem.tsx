import Link from "next/link";
import { Check, ClipboardList, PoundSterling, UserX, X } from "lucide-react";
import { SalesCalendlyLink } from "@/components/landing/sales-calendly-embed";
import { ContentCard, Section, SectionHeader, ctaPrimary } from "@/components/landing/layout";
import { HEALTHCARE_FOR_CLINICS, HEALTHCARE_FOR_CLINICS_PROBLEM } from "@/lib/healthcare-lp-copy";
import { cn } from "@/lib/utils";

const CARD_ICONS = {
  booking: ClipboardList,
  qualify: UserX,
  retainer: PoundSterling,
} as const;

export function ForClinicsProblem() {
  const copy = HEALTHCARE_FOR_CLINICS_PROBLEM;

  return (
    <Section id={copy.id} className="scroll-mt-24 bg-brand-cream">
      <SectionHeader
        title={copy.headline}
        description={copy.description}
        align="left"
        className="mb-8 text-left md:mb-10 [&_h2]:text-left"
      />

      <div className="grid gap-5 md:grid-cols-3 md:gap-6">
        {copy.items.map((item) => {
          const Icon = CARD_ICONS[item.id];
          return (
            <ContentCard
              key={item.id}
              className="flex h-full flex-col overflow-hidden border-slate-200/80 bg-white p-0"
            >
              <div className="border-b border-slate-100 px-5 pb-4 pt-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-gold/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-gold-ink">
                    {item.stat}
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy/5 text-navy">
                    <Icon className="h-4 w-4" aria-hidden />
                  </div>
                </div>
                <h3 className="font-display text-lg font-medium leading-snug text-navy">{item.title}</h3>
              </div>

              <div className="flex flex-1 flex-col gap-3 px-5 py-4">
                <div className="flex items-start gap-2.5 rounded-lg bg-slate-50 px-3 py-2.5">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  <p className="text-sm leading-snug text-slate-600">{item.problem}</p>
                </div>
                <div className="flex items-start gap-2.5 rounded-lg border border-gold/25 bg-gold/5 px-3 py-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-ink" aria-hidden />
                  <p className="text-sm font-medium leading-snug text-navy">{item.solution}</p>
                </div>
              </div>
            </ContentCard>
          );
        })}
      </div>

      <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={copy.ctaHref}
          className="text-sm font-semibold text-gold-ink underline underline-offset-2 hover:text-navy"
        >
          {copy.cta} →
        </Link>
        <SalesCalendlyLink className={cn(ctaPrimary, "min-h-[48px] shadow-md")}>
          {HEALTHCARE_FOR_CLINICS.cta}
        </SalesCalendlyLink>
      </div>
    </Section>
  );
}
