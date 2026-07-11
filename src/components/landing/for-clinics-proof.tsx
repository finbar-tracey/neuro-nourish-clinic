import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Play } from "lucide-react";
import { LoomEmbed } from "@/components/landing/loom-embed";
import { SalesCalendlyLink } from "@/components/landing/sales-calendly-embed";
import { Section, SectionHeader, ctaPrimary } from "@/components/landing/layout";
import { pilotLoomUrl } from "@/lib/for-clinics-config";
import { HEALTHCARE_FOR_CLINICS_LOOM } from "@/lib/healthcare-lp-copy";
import { cn } from "@/lib/utils";

function CaptureFlowPreview() {
  const copy = HEALTHCARE_FOR_CLINICS_LOOM;

  return (
    <div className="space-y-4">
      <div className="hero-pattern relative aspect-[16/10] overflow-hidden rounded-2xl border border-slate-200 bg-navy shadow-xl sm:aspect-video">
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2">
            {copy.captureFlowSteps.map((step, index) => (
              <li
                key={step.label}
                className="relative rounded-lg border border-white/15 bg-white/10 px-2.5 py-2 backdrop-blur-sm sm:px-3 sm:py-2.5"
              >
                <p className="text-[10px] font-bold uppercase tracking-wide text-gold sm:text-[11px]">
                  {index + 1}. {step.label}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-200 sm:text-xs">{step.detail}</p>
                {index < copy.captureFlowSteps.length - 1 && (
                  <ArrowRight
                    className="absolute -right-2.5 top-1/2 hidden h-3.5 w-3.5 -translate-y-1/2 text-gold sm:block"
                    aria-hidden
                  />
                )}
              </li>
            ))}
          </ol>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <SalesCalendlyLink
            className="group flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/30 bg-white/10 shadow-lg backdrop-blur-sm transition hover:scale-105 hover:border-gold hover:bg-gold/20"
            aria-label={copy.fallbackCta}
          >
            <Play className="ml-1 h-7 w-7 fill-white text-white group-hover:text-gold" aria-hidden />
          </SalesCalendlyLink>
          <p className="mt-4 max-w-xs text-sm font-medium text-white">{copy.fallbackTitle}</p>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-slate-600">{copy.fallbackDescription}</p>
    </div>
  );
}

function PatientLpPreview() {
  const copy = HEALTHCARE_FOR_CLINICS_LOOM;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-gold-ink">
          {copy.patientPreviewTitle}
        </p>
        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200">
          Live LP
        </span>
      </div>

      <Link
        href="/lp/implants"
        target="_blank"
        rel="noopener noreferrer"
        className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg ring-1 ring-slate-100 transition hover:border-gold/50 hover:shadow-xl"
      >
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-100 px-3 py-2.5">
          <div className="flex gap-1" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="min-w-0 flex-1 truncate rounded-md bg-white px-2.5 py-1 text-center text-[11px] text-slate-500">
            {copy.patientPreviewUrl}
          </div>
        </div>

        <div className="relative aspect-[1200/630] bg-navy">
          <Image
            src="/og/implants.png"
            alt="Patient implant consultation landing page preview"
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-navy/0 transition group-hover:bg-navy/10" />
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-100 bg-brand-cream/40 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-snug text-slate-600">{copy.patientPreviewDescription}</p>
          <span className="inline-flex shrink-0 items-center gap-1 self-start rounded-lg bg-gold/15 px-3 py-1.5 text-sm font-semibold text-gold-ink transition group-hover:bg-gold/25 sm:self-center">
            {copy.patientPreviewCta}
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </span>
        </div>
      </Link>
    </div>
  );
}

export function ForClinicsProof() {
  const loomUrl = pilotLoomUrl();
  const hasLoom = loomUrl.includes("loom.com");
  const copy = HEALTHCARE_FOR_CLINICS_LOOM;

  return (
    <Section id="proof" className="scroll-mt-24 bg-white">
      <SectionHeader
        align="left"
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        className="mb-8 text-left md:mb-10 [&_h2]:text-left"
      />

      <div className="grid gap-10 lg:grid-cols-2 lg:items-stretch lg:gap-8">
        <div className="order-2 lg:order-1">
          {hasLoom ? (
            <div className="space-y-4">
              <LoomEmbed url={loomUrl} title="Consult capture walkthrough" />
              <p className="text-sm text-slate-600">{copy.fallbackDescription}</p>
            </div>
          ) : (
            <CaptureFlowPreview />
          )}
        </div>

        <div className="order-1 lg:order-2">
          <PatientLpPreview />
        </div>
      </div>

      <div className="mt-10 flex flex-col items-start gap-4 border-t border-slate-100 pt-8 sm:flex-row sm:items-center sm:justify-between">
        <SalesCalendlyLink className={cn(ctaPrimary, "min-h-[48px] shadow-md")}>
          {copy.fallbackCta}
        </SalesCalendlyLink>
        <Link
          href="#dashboard"
          className="text-sm font-semibold text-gold-ink underline underline-offset-2 hover:text-navy"
        >
          See the live ops dashboard →
        </Link>
      </div>
    </Section>
  );
}
