import Link from "next/link";
import { GoldButton } from "@/components/neuronourish/shell";
import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { SectionHeader } from "@/components/neuronourish/content/section-header";
import { NN_PROGRAMME_FOLD } from "@/lib/neuronourish-copy";

export function ProgrammeFoldSection({ className = "" }: { className?: string }) {
  return (
    <PageSection className={`border-y border-linen/70 bg-linen/25 py-14 sm:py-20 ${className}`}>
      <PageContainer width="md" className="text-center">
        <SectionHeader
          eyebrow={NN_PROGRAMME_FOLD.eyebrow}
          headline={NN_PROGRAMME_FOLD.headline}
          subtext={NN_PROGRAMME_FOLD.subtext}
          align="center"
          headlineClassName="max-w-2xl"
        />
        <p className="mt-6 font-display text-4xl text-deep-slate">{NN_PROGRAMME_FOLD.price}</p>
        <p className="mt-2 text-sm text-ink/65">{NN_PROGRAMME_FOLD.priceHint}</p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <GoldButton href={NN_PROGRAMME_FOLD.ctaHref}>{NN_PROGRAMME_FOLD.cta}</GoldButton>
          <Link
            href={NN_PROGRAMME_FOLD.secondaryHref}
            className="text-sm text-ink/65 underline-offset-3 hover:text-deep-slate hover:underline"
          >
            {NN_PROGRAMME_FOLD.secondaryCta} →
          </Link>
        </div>
      </PageContainer>
    </PageSection>
  );
}
