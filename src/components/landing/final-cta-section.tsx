import { AD_ANGLES, type AdAngle } from "@/lib/ad-angles";
import { metaLpAngleMarketing } from "@/lib/meta-lp-copy";
import { ConversionTrustLine } from "@/components/landing/conversion-trust-line";
import { GoogleRatingBadge } from "@/components/landing/google-rating-badge";
import { ctaOutlineLight, ctaPrimary, Section } from "@/components/landing/layout";
import { PhoneLink } from "@/components/landing/phone-link";

type Props = { angle?: AdAngle };

export function FinalCtaSection({ angle = "default" }: Props) {
  const { finalCtaHeadline, finalCtaSubline } = metaLpAngleMarketing(angle);

  return (
    <Section className="bg-navy" width="tight">
      <div className="text-center text-white">
        <GoogleRatingBadge variant="inline" className="mb-8 justify-center" />
        <h2 className="font-display text-2xl font-medium capitalize md:text-3xl">
          {finalCtaHeadline}
        </h2>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-slate-300">
          {finalCtaSubline}
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a href="#quote-form" className={ctaPrimary}>
            Start Free Enquiry →
          </a>
          <PhoneLink className={ctaOutlineLight} contentName="LP Final CTA Phone">
            020 7177 4141
          </PhoneLink>
        </div>
        <ConversionTrustLine dark className="mt-6" />
      </div>
    </Section>
  );
}
