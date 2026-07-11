import { ctaPrimary, sectionPaddingBand, containerMax, containerX } from "@/components/landing/layout";
import { HEALTHCARE_IMPLANTS_MID_CTA } from "@/lib/healthcare-lp-copy";
import { cn } from "@/lib/utils";

export function HealthcareImplantsMidCta() {
  const copy = HEALTHCARE_IMPLANTS_MID_CTA;

  return (
    <section className={cn("hero-pattern bg-navy text-white", sectionPaddingBand)}>
      <div className={cn(containerMax, containerX, "text-center")}>
        <h2 className="font-display text-2xl font-medium md:text-3xl">{copy.headline}</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-slate-300 sm:text-base">{copy.subline}</p>
        <a href="#quote-form" className={cn(ctaPrimary, "mt-8")}>
          {copy.button}
        </a>
      </div>
    </section>
  );
}
