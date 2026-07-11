import Link from "next/link";
import { ArrowRight, Eye, Lock, ShieldCheck, Target } from "lucide-react";
import { SalesCalendlyLink } from "@/components/landing/sales-calendly-embed";
import { Section, SectionHeader, ctaPrimary } from "@/components/landing/layout";
import {
  HEALTHCARE_FOR_CLINICS,
  HEALTHCARE_FOR_CLINICS_GUARANTEE,
  HEALTHCARE_FOR_CLINICS_GUARANTEES,
} from "@/lib/healthcare-lp-copy";
import { cn } from "@/lib/utils";

const ICONS = [Target, Lock, ShieldCheck, Eye] as const;

export function ForClinicsGuarantee() {
  const section = HEALTHCARE_FOR_CLINICS_GUARANTEE;
  const featured = HEALTHCARE_FOR_CLINICS_GUARANTEES.find((item) => item.featured);
  const supporting = HEALTHCARE_FOR_CLINICS_GUARANTEES.filter((item) => !item.featured);

  return (
    <Section id="guarantee" className="scroll-mt-24 border-y border-slate-200 bg-white">
      <SectionHeader
        align="left"
        title={section.title}
        description={section.description}
        className="mb-8 text-left md:mb-10 [&_h2]:text-left"
      />

      {featured && (
        <Link
          href={`#${featured.faqId}`}
          className="group mb-6 block scroll-mt-24 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/90 via-white to-brand-cream/40 p-6 shadow-sm ring-1 ring-emerald-100 transition hover:border-emerald-300 hover:shadow-md sm:p-8"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 shadow-sm">
              <Target className="h-7 w-7" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-emerald-800">
                  {section.featuredBadge}
                </span>
                <span className="rounded-full border border-emerald-200 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-emerald-900">
                  {featured.badge}
                </span>
              </div>
              <h3 className="font-display text-2xl font-medium text-navy">{featured.title}</h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-700 sm:text-base">
                {featured.desc}
              </p>
              <p className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-gold-ink group-hover:underline">
                {section.faqLink}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
              </p>
            </div>
          </div>
        </Link>
      )}

      <div className="grid gap-5 sm:grid-cols-3">
        {supporting.map(({ title, desc, badge, faqId }) => {
          const index = HEALTHCARE_FOR_CLINICS_GUARANTEES.findIndex((item) => item.title === title);
          const Icon = ICONS[index] ?? ShieldCheck;

          return (
            <article
              key={title}
              className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-brand-cream/40 p-5 shadow-sm ring-1 ring-slate-100"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-gold-ink shadow-sm ring-1 ring-slate-200/60">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-navy ring-1 ring-slate-200/80">
                  {badge}
                </span>
              </div>
              <h3 className="font-display text-lg font-medium text-navy">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{desc}</p>
              {faqId && (
                <Link
                  href={`#${faqId}`}
                  className={cn(
                    "mt-4 inline-flex items-center gap-1 text-xs font-semibold text-gold-ink underline-offset-2 hover:underline",
                  )}
                >
                  {section.faqLink}
                </Link>
              )}
            </article>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SalesCalendlyLink className={cn(ctaPrimary, "min-h-[48px] shadow-md")}>
          {HEALTHCARE_FOR_CLINICS.cta}
        </SalesCalendlyLink>
        <p className="text-sm text-slate-600">
          All four protections are included in the{" "}
          <Link href="#pilot-offer" className="font-semibold text-gold-ink underline underline-offset-2">
            £2,500 pilot offer
          </Link>
          .
        </p>
      </div>
    </Section>
  );
}
