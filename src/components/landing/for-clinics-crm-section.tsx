import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { CrmPreviewMock } from "@/components/landing/crm-preview-mock";
import { SalesCalendlyLink } from "@/components/landing/sales-calendly-embed";
import { Section, SectionHeader, ctaPrimary } from "@/components/landing/layout";
import {
  CRM_WORKSPACE_IMAGE_PNG,
  CRM_WORKSPACE_IMAGE_WEBP,
} from "@/lib/for-clinics-config";
import { HEALTHCARE_FOR_CLINICS, HEALTHCARE_FOR_CLINICS_CRM } from "@/lib/healthcare-lp-copy";
import { cn } from "@/lib/utils";

function crmScreenshotAsset(): { src: string; file: string } | null {
  try {
    const base = path.join(process.cwd(), "public", "images", "for-clinics");
    const webp = path.join(base, "crm-workspace.webp");
    const png = path.join(base, "crm-workspace.png");
    if (fs.existsSync(webp)) return { src: CRM_WORKSPACE_IMAGE_WEBP, file: webp };
    if (fs.existsSync(png)) return { src: CRM_WORKSPACE_IMAGE_PNG, file: png };
    return null;
  } catch {
    return null;
  }
}

function CrmKpiBar() {
  const copy = HEALTHCARE_FOR_CLINICS_CRM;

  return (
    <div className="mt-3 grid grid-cols-3 gap-2">
      {copy.mockKpis.map((kpi) => (
        <div
          key={kpi.label}
          className={cn(
            "rounded-xl border px-3 py-2.5 text-center",
            kpi.tone === "gold"
              ? "border-gold/30 bg-gold/10"
              : "border-slate-200 bg-white",
          )}
        >
          <p className="font-display text-lg font-medium text-navy">{kpi.value}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {kpi.label}
          </p>
        </div>
      ))}
    </div>
  );
}

export function ForClinicsCrmSection() {
  const screenshot = crmScreenshotAsset();
  const copy = HEALTHCARE_FOR_CLINICS_CRM;

  return (
    <Section id="dashboard" className="scroll-mt-24 bg-brand-cream">
      <SectionHeader
        align="left"
        title={copy.title}
        description={copy.description}
        className="mb-8 text-left md:mb-10 [&_h2]:text-left"
      />

      <div className="grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
        <div>
          {screenshot ? (
            <figure>
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ring-1 ring-slate-100">
                <span className="absolute left-4 top-4 z-10 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                  Live
                </span>
                <Image
                  src={screenshot.src}
                  alt={copy.caption}
                  width={1440}
                  height={900}
                  className="h-auto w-full"
                  priority={false}
                />
              </div>
            </figure>
          ) : (
            <div className="relative">
              <span className="absolute left-4 top-4 z-10 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                Live preview
              </span>
              <CrmPreviewMock />
            </div>
          )}
          <CrmKpiBar />
          <p className="mt-3 text-xs text-slate-500">{copy.caption}</p>
        </div>

        <div className="space-y-6">
          <ul className="space-y-4">
            {copy.features.map((feature) => (
              <li key={feature.title} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold-ink" aria-hidden />
                <div>
                  <p className="font-semibold text-navy">{feature.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{feature.detail}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <SalesCalendlyLink className={cn(ctaPrimary, "w-full min-h-[48px] shadow-md")}>
              {copy.bookCallCta}
            </SalesCalendlyLink>
            <p className="mt-3 text-center text-xs text-slate-500">{copy.demoNote}</p>
            <p className="mt-4 text-center text-sm">
              <Link
                href="/lp/implants"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-gold-ink underline underline-offset-2"
              >
                {HEALTHCARE_FOR_CLINICS.patientDemoLabel} →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
