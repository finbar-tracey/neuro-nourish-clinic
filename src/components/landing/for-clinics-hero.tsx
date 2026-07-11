import { CheckCircle2 } from "lucide-react";
import { SalesCalendlyEmbed, SalesCalendlyLink } from "@/components/landing/sales-calendly-embed";
import { ctaPrimary } from "@/components/landing/layout";
import { hasSalesCalendlyEmbed } from "@/lib/for-clinics-config";
import {
  HEALTHCARE_B2B_TRUST_STRIP,
  HEALTHCARE_FOR_CLINICS_HERO,
} from "@/lib/healthcare-lp-copy";
import { cn } from "@/lib/utils";

export function ForClinicsHero() {
  const copy = HEALTHCARE_FOR_CLINICS_HERO;
  const hasCalendly = hasSalesCalendlyEmbed();

  return (
    <section id="for-clinics-hero" className="hero-pattern bg-navy text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12 lg:py-16">
        <div className="space-y-5 lg:py-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold uppercase tracking-wider text-gold">{copy.eyebrow}</p>
            <span className="rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold">
              {copy.pilotScarcity}
            </span>
          </div>
          <h1 className="font-display text-3xl font-medium leading-[1.1] sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
            {copy.headline}{" "}
            <span className="text-gold">{copy.headlineHighlight}</span>
          </h1>
          <p className="font-display text-2xl font-medium text-gold sm:text-3xl">{copy.headlinePrice}</p>
          <p className="max-w-lg text-base leading-relaxed text-slate-300 sm:text-lg">{copy.subline}</p>

          <ul className="flex flex-wrap gap-2 pt-1">
            {HEALTHCARE_B2B_TRUST_STRIP.map((item) => (
              <li
                key={item}
                className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100"
              >
                {item}
              </li>
            ))}
          </ul>

          <ul className="space-y-2.5">
            {copy.bullets.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-slate-200 sm:text-base">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden />
                {item}
              </li>
            ))}
          </ul>

          <p className="border-l-2 border-gold/80 pl-3 text-sm leading-relaxed text-slate-300">
            {copy.proofLine}
          </p>

          {hasCalendly ? (
            <a
              href="#calendly-booking"
              className={cn(ctaPrimary, "w-full sm:w-auto lg:hidden")}
            >
              {copy.cta}
            </a>
          ) : (
            <SalesCalendlyLink className={cn(ctaPrimary, "w-full sm:w-auto")}>
              {copy.cta}
            </SalesCalendlyLink>
          )}
        </div>

        <div className="lg:sticky lg:top-24">
          <SalesCalendlyEmbed className="scroll-mt-24" />
        </div>
      </div>
    </section>
  );
}
