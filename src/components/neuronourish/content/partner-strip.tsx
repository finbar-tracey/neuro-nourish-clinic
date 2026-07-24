import { LogoMarquee, type LogoMarqueeItem } from "@/components/neuronourish/content/logo-marquee";
import { NN_PARTNERS } from "@/lib/neuronourish-copy";

export function PartnerStrip({ className = "" }: { className?: string }) {
  const partners: LogoMarqueeItem[] = NN_PARTNERS.groups.flatMap((group) =>
    group.partners.map((partner) => ({
      name: partner.name,
      logo: partner.logo,
      href: "href" in partner ? partner.href : undefined,
      width: partner.width,
      height: partner.height,
    })),
  );

  return (
    <LogoMarquee
      className={className}
      eyebrow={NN_PARTNERS.eyebrow}
      headline={NN_PARTNERS.headline}
      footnote={NN_PARTNERS.footnote}
      items={partners}
    />
  );
}
