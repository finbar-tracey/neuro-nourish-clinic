import Link from "next/link";
import { Check, X } from "lucide-react";
import { SalesCalendlyLink } from "@/components/landing/sales-calendly-embed";
import { Section, SectionHeader, ctaPrimary } from "@/components/landing/layout";
import {
  HEALTHCARE_FOR_CLINICS,
  HEALTHCARE_FOR_CLINICS_COMPARISON,
} from "@/lib/healthcare-lp-copy";
import { bookedConsultBrandName } from "@/lib/vertical-config";
import { cn } from "@/lib/utils";

export function ForClinicsComparison() {
  const copy = HEALTHCARE_FOR_CLINICS_COMPARISON;
  const brand = bookedConsultBrandName();

  return (
    <Section id="comparison" className="scroll-mt-24 bg-white">
      <SectionHeader
        align="left"
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        className="mb-8 text-left md:mb-10 [&_h2]:text-left"
      />

      <div className="space-y-4 md:hidden">
        {copy.rows.map((row) => (
          <div
            key={row.label}
            className={cn(
              "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
              row.highlight && "ring-2 ring-gold/40",
            )}
          >
            <p className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-navy">
              {row.label}
            </p>
            <div className="flex items-start gap-2.5 border-b border-slate-100 px-4 py-3 text-sm text-slate-600">
              <X className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" aria-hidden />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  {copy.agencyLabel}
                </p>
                <p className="mt-0.5">{row.agency}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 bg-brand-cream/70 px-4 py-3 text-sm font-medium text-navy">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-ink" aria-hidden />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-gold-ink">{brand}</p>
                <p className="mt-0.5">{row.bookedConsult}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 shadow-md md:block">
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-[1.1fr_1fr_1.1fr]">
              <div className="bg-navy p-5 text-sm font-semibold text-slate-300">
                {copy.featureColumnLabel}
              </div>
              <div className="border-l border-white/10 bg-navy p-5 text-center text-sm font-semibold text-slate-300">
                {copy.agencyLabel}
              </div>
              <div className="relative border-l border-gold/30 bg-navy p-5 pt-8 text-center text-sm font-semibold text-white">
                <span className="absolute left-1/2 top-3 -translate-x-1/2 whitespace-nowrap rounded-full bg-gold px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-navy shadow-md">
                  {copy.recommendedBadge}
                </span>
                {brand}
              </div>
            </div>

            {copy.rows.map((row, i) => (
              <div
                key={row.label}
                className={cn(
                  "grid grid-cols-[1.1fr_1fr_1.1fr] text-sm",
                  i % 2 === 0 ? "bg-white" : "bg-slate-50/80",
                  row.highlight && "bg-gold/[0.06] ring-1 ring-inset ring-gold/25",
                )}
              >
                <div className="border-t border-slate-100 p-5 font-semibold text-navy">{row.label}</div>
                <div className="flex items-start gap-2.5 border-l border-t border-slate-100 p-5 text-slate-600">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" aria-hidden />
                  {row.agency}
                </div>
                <div className="flex items-start gap-2.5 border-l-4 border-gold/60 border-t border-slate-100 bg-brand-cream/50 p-5 font-medium text-navy">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-ink" aria-hidden />
                  {row.bookedConsult}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-sm font-medium text-navy md:text-left">{copy.summaryLine}</p>

      <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <SalesCalendlyLink className={cn(ctaPrimary, "min-h-[48px] w-full shadow-md sm:w-auto")}>
          {HEALTHCARE_FOR_CLINICS.cta}
        </SalesCalendlyLink>
        <Link
          href={copy.pilotHref}
          className="text-sm font-semibold text-gold-ink underline underline-offset-2 hover:text-navy"
        >
          {copy.pilotLink} →
        </Link>
      </div>
      <p className="mt-3 text-center text-xs text-slate-600 sm:text-left">{HEALTHCARE_FOR_CLINICS.ctaNote}</p>
    </Section>
  );
}
