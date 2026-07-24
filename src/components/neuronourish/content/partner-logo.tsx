import Image from "next/image";

export type PartnerLogoItem = {
  name: string;
  logo: string;
  href?: string;
  width: number;
  height: number;
};

export function PartnerLogo({ partner }: { partner: PartnerLogoItem }) {
  const tile = (
    <div className="nn-partner-logo flex h-[4.75rem] w-full min-w-[10rem] max-w-[14rem] items-center justify-center rounded-xl border border-mist/80 bg-white px-5 py-3 transition-all duration-200 hover:border-gold/40 hover:bg-linen/30">
      <Image
        src={partner.logo}
        alt={`${partner.name} logo`}
        width={partner.width}
        height={partner.height}
        className="h-auto max-h-[2.5rem] w-auto max-w-[10.5rem] object-contain"
      />
    </div>
  );

  if (partner.href) {
    return (
      <a
        href={partner.href}
        target="_blank"
        rel="noopener noreferrer"
        className="nn-partner-link focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        aria-label={`Visit ${partner.name} (opens in new tab)`}
      >
        {tile}
      </a>
    );
  }

  return tile;
}
