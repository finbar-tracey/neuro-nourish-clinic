import Link from "next/link";
import {
  GoldButton,
  OutlineButton,
  SectionEyebrow,
} from "@/components/neuronourish/shell";
import { PageContainer } from "@/components/neuronourish/content/container";
import { NN_CLOSING } from "@/lib/neuronourish-copy";

export function ClosingCtaSection({
  primaryHref,
  quizHref,
  discoveryHref,
  className = "",
}: {
  /** Quiz CTA — preferred name is quizHref; primaryHref kept for older call sites */
  primaryHref?: string;
  quizHref?: string;
  /** @deprecated Kept for call-site compatibility; secondary CTA removed. */
  secondaryHref?: string;
  /** Discovery soft link — was previously misnamed quizHref */
  discoveryHref?: string;
  className?: string;
}) {
  const quizTarget = quizHref ?? primaryHref ?? "/quiz";
  const discoveryTarget = discoveryHref ?? "/discovery";

  return (
    <section
      id="get-started"
      className={`nn-closing-section bg-deep-slate px-4 py-16 sm:px-6 sm:py-20 lg:py-24 ${className}`}
    >
      <PageContainer width="md" className="text-center">
        <SectionEyebrow>{NN_CLOSING.eyebrow}</SectionEyebrow>
        <h2 className="nn-display-section mx-auto mt-3 max-w-2xl text-ivory">{NN_CLOSING.headline}</h2>
        <p className="nn-body mx-auto mt-4 max-w-xl text-sky-blue">{NN_CLOSING.subtext}</p>

        <ul className="mx-auto mt-8 flex max-w-lg flex-wrap justify-center gap-2.5">
          {NN_CLOSING.trustChips.map((chip) => (
            <li
              key={chip}
              className="rounded-full border border-ivory/15 bg-white/5 px-3.5 py-1.5 text-sm text-mist"
            >
              {chip}
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-col items-center gap-1.5">
          <GoldButton href={quizTarget}>{NN_CLOSING.ctaQuiz}</GoldButton>
          <span className="text-xs text-sky-blue/80">Free · 3 minutes · Personalised score</span>
        </div>

        <Link
          href={discoveryTarget}
          className="nn-text-link mt-6 inline-block text-sm text-mist hover:text-ivory"
        >
          {NN_CLOSING.ctaPrimary} →
        </Link>
      </PageContainer>
    </section>
  );
}

export function CtaPair({
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  onDark = false,
}: {
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  onDark?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
      <GoldButton href={primaryHref}>{primaryLabel}</GoldButton>
      <OutlineButton
        href={secondaryHref}
        className={onDark ? "border-ivory/30 text-ivory hover:bg-white/10" : ""}
      >
        {secondaryLabel}
      </OutlineButton>
    </div>
  );
}
