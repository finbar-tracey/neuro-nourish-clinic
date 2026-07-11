import type { AdAngle } from "@/lib/ad-angles";
import { metaLpAngleMarketing } from "@/lib/meta-lp-copy";
import { sectionPaddingBand, containerMax, containerX } from "@/components/landing/layout";
import { PhoneLink } from "@/components/landing/phone-link";

type Props = {
  headline?: string;
  subline?: string;
  angle?: AdAngle;
};

export function MidPageCta({ angle = "default", headline, subline }: Props) {
  const config = metaLpAngleMarketing(angle);
  const title = headline ?? config.finalCtaHeadline;
  const subtitle =
    subline ?? `${config.finalCtaSubline.split("—")[0].trim()} · No obligation`;

  return (
    <section className={`bg-gold ${sectionPaddingBand}`}>
      <div className={`${containerMax} ${containerX}`}>
        <div className="flex flex-col items-center gap-8 text-center md:flex-row md:justify-between md:text-left">
          <div className="max-w-xl">
            <h2 className="font-display text-2xl font-medium capitalize text-navy md:text-3xl">
              {title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-navy/90 md:text-base">
              {subtitle}
            </p>
          </div>
          <div className="flex w-full shrink-0 flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
            <a
              href="#quote-form"
              className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-3.5 text-sm font-semibold text-navy shadow-lg transition hover:bg-brand-cream"
            >
              Start Free Enquiry
            </a>
            <PhoneLink
              contentName="LP Mid CTA Phone"
              className="inline-flex items-center justify-center rounded-lg border border-navy/20 px-8 py-3.5 text-sm font-semibold text-navy transition hover:bg-navy/5"
            >
              020 7177 4141
            </PhoneLink>
          </div>
        </div>
      </div>
    </section>
  );
}
