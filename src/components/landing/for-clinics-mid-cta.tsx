import Link from "next/link";
import { SalesCalendlyLink } from "@/components/landing/sales-calendly-embed";
import { containerMax, containerX, ctaOutlineLight, ctaPrimary } from "@/components/landing/layout";
import { HEALTHCARE_FOR_CLINICS, HEALTHCARE_FOR_CLINICS_MID_CTA } from "@/lib/healthcare-lp-copy";
import { cn } from "@/lib/utils";

export function ForClinicsMidCta() {
  const copy = HEALTHCARE_FOR_CLINICS_MID_CTA;

  return (
    <section id="book-call" className="hero-pattern relative overflow-hidden bg-navy py-14 text-white md:py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(249,142,56,0.12),transparent_55%)]" />

      <div className={cn(containerMax, containerX, "relative text-center")}>
        <h2 className="font-display mx-auto max-w-3xl text-3xl font-medium leading-tight md:text-4xl lg:text-[2.5rem]">
          {copy.headline}
        </h2>

        <ul className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {copy.pills.map((pill) => (
            <li
              key={pill}
              className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-slate-100 backdrop-blur-sm sm:text-sm"
            >
              {pill}
            </li>
          ))}
        </ul>

        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-200 sm:text-lg">
          {copy.subline}
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <SalesCalendlyLink
            className={cn(
              ctaPrimary,
              "min-h-[52px] w-full px-8 text-base shadow-lg sm:w-auto sm:min-w-[240px]",
            )}
          >
            {HEALTHCARE_FOR_CLINICS.cta}
          </SalesCalendlyLink>
          <Link href={copy.secondaryHref} className={cn(ctaOutlineLight, "min-h-[52px] w-full sm:w-auto")}>
            {copy.secondaryCta}
          </Link>
        </div>

        <p className="mt-4 text-sm text-slate-400">{HEALTHCARE_FOR_CLINICS.ctaNote}</p>
      </div>
    </section>
  );
}
