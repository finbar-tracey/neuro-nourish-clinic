import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Quote, Users } from "lucide-react";
import { SalesCalendlyLink } from "@/components/landing/sales-calendly-embed";
import { Section, SectionHeader, ctaPrimary } from "@/components/landing/layout";
import { clinicTestimonialFromEnv } from "@/lib/for-clinics-config";
import {
  HEALTHCARE_FOR_CLINICS,
  HEALTHCARE_FOR_CLINICS_OPERATOR,
  HEALTHCARE_FOR_CLINICS_OPERATOR_SECTION,
} from "@/lib/healthcare-lp-copy";
import { bookedConsultBrandName } from "@/lib/vertical-config";
import { cn } from "@/lib/utils";

export function ForClinicsOperator() {
  const copy = HEALTHCARE_FOR_CLINICS_OPERATOR;
  const section = HEALTHCARE_FOR_CLINICS_OPERATOR_SECTION;
  const brand = bookedConsultBrandName();
  const testimonial = clinicTestimonialFromEnv();

  return (
    <Section id="who-we-are" className="scroll-mt-24 bg-brand-cream/40">
      <SectionHeader
        align="left"
        eyebrow={testimonial ? section.testimonialEyebrow : section.eyebrow}
        title={testimonial ? section.testimonialTitle : section.title}
        description={testimonial ? section.testimonialDescription : section.description}
        className="mb-8 text-left md:mb-10 [&_h2]:text-left"
      />

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl ring-1 ring-slate-100">
        <div className="flex items-center gap-4 border-b border-gold/20 bg-navy px-6 py-5 sm:px-8">
          {testimonial?.photoUrl ? (
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-white/20">
              <Image
                src={testimonial.photoUrl}
                alt={testimonial.name}
                fill
                className="object-cover"
                sizes="56px"
              />
            </div>
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gold/15 text-gold">
              {testimonial ? (
                <Quote className="h-7 w-7" aria-hidden />
              ) : (
                <Users className="h-7 w-7" aria-hidden />
              )}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-display text-xl font-medium text-white sm:text-2xl">
              {testimonial ? testimonial.name : brand}
            </h3>
            <p className="text-sm font-medium text-gold">
              {testimonial ? testimonial.role : copy.role}
            </p>
          </div>
        </div>

        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            {testimonial ? (
              <blockquote className="font-display text-xl leading-relaxed text-navy sm:text-2xl">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
            ) : (
              <>
                <p className="text-base leading-relaxed text-slate-700">{copy.bio}</p>
                <ul className="mt-5 space-y-3">
                  {copy.bullets.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/15">
                        <Check className="h-3 w-3 text-gold-ink" aria-hidden />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div className="space-y-4">
            {!testimonial && (
              <div className="grid grid-cols-3 gap-3">
                {copy.stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-slate-200 bg-brand-cream/50 px-3 py-3 text-center"
                  >
                    <p className="font-display text-lg font-medium text-navy sm:text-xl">{stat.value}</p>
                    <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-xl border border-gold/25 bg-gradient-to-br from-brand-cream to-white px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-widest text-navy">
                {testimonial ? "What we deliver" : "How we work"}
              </p>
              <ul className="mt-3 space-y-2">
                {copy.credentials.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm font-medium text-navy">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-ink" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-200/80 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <SalesCalendlyLink className={cn(ctaPrimary, "min-h-[44px] text-sm shadow-md sm:shrink-0")}>
            {HEALTHCARE_FOR_CLINICS.cta}
          </SalesCalendlyLink>
          <div className="flex flex-col gap-2 sm:items-end">
            <Link
              href="/lp/implants"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold-ink underline-offset-2 hover:underline"
            >
              {section.patientJourneyCta}
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="#dashboard"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy underline-offset-2 hover:underline"
            >
              {section.dashboardCta}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </Section>
  );
}
