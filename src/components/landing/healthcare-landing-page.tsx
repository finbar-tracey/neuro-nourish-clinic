import { HealthcareLeadForm } from "@/components/forms/healthcare-lead-form";
import { MetaViewContent } from "@/components/analytics/meta-pixel";
import { HealthcareImplantsFaq } from "@/components/landing/healthcare-implants-faq";
import { HealthcareImplantsFooter } from "@/components/landing/healthcare-implants-footer";
import { HealthcareImplantsHeader } from "@/components/landing/healthcare-implants-header";
import { HealthcareImplantsMidCta } from "@/components/landing/healthcare-implants-mid-cta";
import { HealthcareImplantsSteps } from "@/components/landing/healthcare-implants-steps";
import { HealthcarePatientComplianceStrip } from "@/components/landing/healthcare-patient-compliance-strip";
import { HealthcareStickyCta } from "@/components/landing/healthcare-sticky-cta";
import {
  HEALTHCARE_IMPLANTS_HERO,
  HEALTHCARE_TRUST_STRIP,
} from "@/lib/healthcare-lp-copy";
import { healthcareClinicPublicName, partnerCity } from "@/lib/vertical-config";

export function HealthcareLandingPage() {
  const partner = healthcareClinicPublicName();
  const city = partnerCity();

  return (
    <>
      <MetaViewContent contentName="Healthcare LP — implants" />

      <HealthcareImplantsHeader />

      <main id="main-content" className="pb-20 md:pb-16">
        <section className="hero-pattern bg-navy text-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:items-start lg:py-14">
            <div className="order-1 lg:order-2">
              <HealthcareLeadForm />
            </div>
            <div className="order-2 space-y-6 lg:order-1 lg:pt-4">
              <div>
                <p className="mb-2 text-sm font-medium uppercase tracking-wider text-gold">
                  {HEALTHCARE_IMPLANTS_HERO.responseBadge}
                </p>
                <h1 className="font-display text-3xl font-medium leading-tight sm:text-4xl">
                  {HEALTHCARE_IMPLANTS_HERO.headline}{" "}
                  <span className="text-gold">{HEALTHCARE_IMPLANTS_HERO.highlight}</span>
                </h1>
                <p className="mt-3 text-sm text-slate-300 sm:text-base">
                  at {partner}, {city}
                </p>
                <ul className="mt-6 space-y-3">
                  {HEALTHCARE_IMPLANTS_HERO.bullets.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-200 sm:text-base">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-wrap gap-2">
                {HEALTHCARE_TRUST_STRIP.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-slate-100"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <HealthcarePatientComplianceStrip />
        <HealthcareImplantsSteps />
        <HealthcareImplantsMidCta />
        <HealthcareImplantsFaq />
      </main>

      <HealthcareImplantsFooter />
      <HealthcareStickyCta label="Book free consultation" href="#quote-form" />
    </>
  );
}
