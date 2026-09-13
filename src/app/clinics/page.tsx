import Link from "next/link";
import {
  GoldButton,
  NeuroNourishShell,
} from "@/components/neuronourish/shell";
import {
  PageContainer,
  PageHeader,
  ScannableBlock,
  ScannableGrid,
} from "@/components/neuronourish/content";
import { LogoMarquee } from "@/components/neuronourish/content/logo-marquee";
import { ClinicianFaqSection } from "@/components/neuronourish/content/clinician-faq-accordion";
import { ExpressionOfInterestForm } from "@/components/forms/expression-of-interest-form";
import {
  NN_CLINICIAN_PARTNERSHIP,
  NN_CLINICS,
  NN_OUTCOMES,
  NN_PARTNERS,
} from "@/lib/neuronourish-copy";
import { buildNeuronourishMetadata } from "@/lib/neuronourish-seo";

export const metadata = buildNeuronourishMetadata("clinics");

function clinicsPartnerLogos() {
  const clinical = NN_OUTCOMES.clinicalPartners.map((p) => ({
    name: p.name,
    logo: p.logo,
    width: p.width,
    height: p.height,
  }));
  const research = NN_PARTNERS.groups.flatMap((group) =>
    group.partners.map((partner) => ({
      name: partner.name,
      logo: partner.logo,
      href: "href" in partner ? partner.href : undefined,
      width: partner.width,
      height: partner.height,
    })),
  );
  const seen = new Set<string>();
  return [...clinical, ...research].filter((item) => {
    if (seen.has(item.name)) return false;
    seen.add(item.name);
    return true;
  });
}

export default function ClinicsPage() {
  return (
    <NeuroNourishShell>
      <PageContainer width="lg" className="py-14 sm:py-16">
        <PageHeader
          eyebrow={NN_CLINICS.eyebrow}
          headline={NN_CLINICS.headline}
          subtext={NN_CLINICS.subtext}
        />
        <div className="mt-8 flex flex-col items-start gap-1.5">
          <GoldButton href="#partnership-briefing">{NN_CLINICS.cta}</GoldButton>
          <span className="text-xs text-ink/55">{NN_CLINICS.heroCtaHint}</span>
        </div>
      </PageContainer>

      <LogoMarquee
        eyebrow={NN_CLINICS.partnersEyebrow}
        headline={NN_CLINICS.partnersHeadline}
        items={clinicsPartnerLogos()}
      />

      <PageContainer width="lg" className="py-14 sm:py-16">
        <p className="nn-eyebrow text-gold">{NN_CLINICS.referral.eyebrow}</p>
        <h2 className="nn-display-section mt-3 max-w-2xl text-deep-slate">
          {NN_CLINICS.referral.headline}
        </h2>
        <p className="nn-body mt-4 max-w-2xl text-ink/75">{NN_CLINICS.referral.subtext}</p>
        <ol className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-6">
          {NN_CLINICS.referral.steps.map((step, index) => (
            <li key={step.title} className="border-l-2 border-gold pl-5">
              <p className="font-display text-sm text-gold">{index + 1}</p>
              <h3 className="nn-display-card mt-2 text-deep-slate">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/75">{step.body}</p>
            </li>
          ))}
        </ol>
      </PageContainer>

      <PageContainer width="lg" className="border-t border-linen/70 pb-14 sm:pb-16">
        <ScannableGrid>
          {NN_CLINICS.pillars.map((pillar) => (
            <ScannableBlock
              key={pillar.title}
              title={pillar.title}
              highlights={pillar.highlights}
            />
          ))}
        </ScannableGrid>
        <div className="mt-10">
          <Link href="/clinics/referral-card" className="nn-text-link text-sm">
            {NN_CLINICS.referralCardLink} →
          </Link>
        </div>
      </PageContainer>

      <ClinicianFaqSection />
      <div id="partnership-briefing">
        <PageContainer width="sm" className="border-t border-linen/80 py-16">
          <PageHeader
            eyebrow={NN_CLINICIAN_PARTNERSHIP.formEyebrow}
            headline={NN_CLINICIAN_PARTNERSHIP.formHeadline}
            subtext={NN_CLINICIAN_PARTNERSHIP.formSubtext}
            as="h2"
          />
          <div className="mt-8">
            <ExpressionOfInterestForm
              intent="partnership"
              submitLabel={NN_CLINICIAN_PARTNERSHIP.submitLabel}
            />
          </div>
          <p className="mt-6 text-center text-xs text-ink/60">
            Prefer email?{" "}
            <Link href="mailto:referrals@neuronourish.clinic" className="nn-text-link">
              referrals@neuronourish.clinic
            </Link>
          </p>
        </PageContainer>
      </div>
    </NeuroNourishShell>
  );
}
