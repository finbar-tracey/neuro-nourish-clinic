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
      className={`nn-partners-section border-y border-linen/40 bg-linen/20 px-4 py-8 text-deep-slate sm:px-6 sm:py-9 ${className}`}
    >
      <PageContainer width="xl" className="text-center">
        <SectionEyebrow>{NN_PARTNERS.eyebrow}</SectionEyebrow>
        <h2 className="mt-2 font-display text-xl text-slate-blue sm:text-2xl">
          {NN_PARTNERS.headline}
        </h2>
        {NN_PARTNERS.subtext ? (
          <p className="nn-body mx-auto mt-2 max-w-2xl text-ink/70">{NN_PARTNERS.subtext}</p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {partners.map((partner) => (
            <PartnerLogo key={partner.name} partner={partner} />
          ))}
        </div>

        <p className="mx-auto mt-5 max-w-xl text-xs leading-relaxed text-ink/55">
          {NN_PARTNERS.footnote}
        </p>
      </PageContainer>
    </section>
  );
}
