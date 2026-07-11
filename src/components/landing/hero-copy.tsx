import type { AdAngle } from "@/lib/ad-angles";
import { metaLpHero } from "@/lib/meta-lp-copy";
import { ctaPrimary } from "@/components/landing/layout";
import { ConversionTrustLine } from "@/components/landing/conversion-trust-line";
import { DanielExpertCard } from "@/components/landing/daniel-expert";
import { MetaComplianceStrip } from "@/components/landing/meta-compliance-strip";
import { PhoneLink } from "@/components/landing/phone-link";
import { RegulatoryTrustStrip } from "@/components/landing/regulatory-trust-strip";
import { Clock, Phone } from "lucide-react";

type Props = { angle?: AdAngle };

export function HeroCopy({ angle: initialAngle = "default" }: Props) {
  const copy = metaLpHero(initialAngle);

  return (
    <div className="lg:pt-2">
      <div className="mb-5">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white ring-1 ring-white/20">
          <Clock className="h-3.5 w-3.5 text-gold" />
          {copy.responseBadge}
        </div>
      </div>
      <h1 className="font-display mb-5 text-3xl font-medium capitalize leading-tight md:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
        {copy.headline}{" "}
        <span className="text-gold">{copy.highlight}</span>
      </h1>
      <p className="mb-6 text-base leading-relaxed text-slate-200 md:text-lg">
        {copy.solutionBridge}
      </p>
      <MetaComplianceStrip variant="hero" className="mb-8" />
      <ul className="mb-8 space-y-3">
        {copy.bullets.map((item) => (
          <li key={item} className="flex items-center gap-2.5 text-sm text-slate-200">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/25 text-xs text-white">
              ✓
            </span>
            {item}
          </li>
        ))}
      </ul>

      <div className="mb-6 hidden lg:block">
        <a href="#quote-form" className={ctaPrimary}>
          Start Free Enquiry →
        </a>
        <ConversionTrustLine dark className="mt-4 justify-start" />
      </div>

      <DanielExpertCard variant="hero" />
      <div className="mt-5 space-y-3 lg:hidden">
        <RegulatoryTrustStrip variant="dark" />
        <PhoneLink
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 py-3.5 text-sm font-semibold text-white hover:bg-white/10"
          contentName="LP Hero Phone"
        >
          <Phone className="h-4 w-4 text-gold" />
          Prefer to talk? Call 020 7177 4141
        </PhoneLink>
      </div>
    </div>
  );
}
