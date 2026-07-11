import { SectionEyebrow } from "@/components/neuronourish/shell";
import { PageContainer } from "@/components/neuronourish/content/container";
import { PartnerLogo, type PartnerLogoItem } from "@/components/neuronourish/content/partner-logo";
import { NN_PARTNERS } from "@/lib/neuronourish-copy";

export function PartnerStrip({ className = "" }: { className?: string }) {
  const partners: PartnerLogoItem[] = NN_PARTNERS.groups.flatMap((group) =>
    group.partners.map((partner) => ({
      name: partner.name,
      logo: partner.logo,
      href: "href" in partner ? partner.href : undefined,
      width: partner.width,
      height: partner.height,
    })),
  );

  return (
    <section
      id="partners"
      className={`nn-partners-section bg-deep-slate px-4 py-10 text-ivory sm:px-6 sm:py-12 ${className}`}
    >
      <PageContainer width="xl" className="text-center">
        <SectionEyebrow>{NN_PARTNERS.eyebrow}</SectionEyebrow>
        <h2 className="nn-display-section mx-auto mt-3 max-w-3xl text-ivory">{NN_PARTNERS.headline}</h2>
        <p className="nn-body mx-auto mt-3 max-w-2xl text-sky-blue">{NN_PARTNERS.subtext}</p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-5">
          {partners.map((partner) => (
            <PartnerLogo key={partner.name} partner={partner} />
          ))}
        </div>

        <p className="mx-auto mt-8 max-w-xl text-xs leading-relaxed text-lavender/90">
          {NN_PARTNERS.footnote}
        </p>
      </PageContainer>
    </section>
  );
}
