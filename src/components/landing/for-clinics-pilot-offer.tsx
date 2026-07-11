import Link from "next/link";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { SalesCalendlyLink } from "@/components/landing/sales-calendly-embed";
import { Section, ctaPrimary } from "@/components/landing/layout";
import {
  HEALTHCARE_FOR_CLINICS,
  HEALTHCARE_FOR_CLINICS_PILOT_INCLUDED,
  HEALTHCARE_FOR_CLINICS_PILOT_YOU_PROVIDE,
} from "@/lib/healthcare-lp-copy";
import { cn } from "@/lib/utils";

export function ForClinicsPilotOffer() {
  const copy = HEALTHCARE_FOR_CLINICS;

  return (
    <Section id="pilot-offer" className="scroll-mt-24 bg-white">
      <div className="overflow-hidden rounded-3xl border border-gold/25 bg-gradient-to-br from-brand-cream via-white to-brand-cream/30 shadow-xl ring-1 ring-slate-200/80">
        <div className="border-b border-gold/20 bg-navy px-6 py-4 sm:px-8 sm:py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-bold uppercase tracking-widest text-gold">Pilot offer</p>
            <span className="inline-flex w-fit items-center rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-gold">
              {copy.pilotScarcity}
            </span>
          </div>
        </div>

        <div className="p-6 sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div>
              <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
                <p className="font-display text-5xl font-medium leading-none text-navy sm:text-6xl">
                  {copy.pilotPrice}
                </p>
                <div className="pb-1">
                  <p className="text-lg font-semibold text-navy sm:text-xl">{copy.pilotPerConsult}</p>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {copy.pilotPerConsultLabel}
                  </p>
                </div>
              </div>
              <p className="mt-3 font-display text-xl text-navy sm:text-2xl">{copy.pilotDetail}</p>

              <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3.5">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden />
                <p className="text-sm font-medium leading-relaxed text-emerald-900">{copy.guarantee}</p>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-slate-600">{copy.pilotRoi}</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-widest text-navy">What&apos;s included</h3>
                <ul className="mt-3 space-y-2">
                  {HEALTHCARE_FOR_CLINICS_PILOT_INCLUDED.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold-ink" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-navy">You provide</h3>
                <ul className="mt-3 space-y-2">
                  {HEALTHCARE_FOR_CLINICS_PILOT_YOU_PROVIDE.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-start gap-4 border-t border-slate-200/80 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <SalesCalendlyLink className={cn(ctaPrimary, "min-h-[52px] px-8 text-base shadow-lg")}>
                {copy.cta}
              </SalesCalendlyLink>
              <p className="mt-2 text-xs text-slate-500">{copy.ctaNote}</p>
            </div>
            <p className="text-sm text-slate-600">
              Questions after the pilot?{" "}
              <Link href="#faq-after-pilot" className="font-semibold text-gold-ink underline underline-offset-2">
                See what happens next →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
