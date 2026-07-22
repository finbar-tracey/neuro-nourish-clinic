import { Suspense } from "react";
import Link from "next/link";
import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { NnCard, NnCardGrid } from "@/components/neuronourish/content/nn-card";
import { NnFaqBlock } from "@/components/neuronourish/content/nn-faq-accordion";
import { SectionHeader } from "@/components/neuronourish/content/section-header";
import { ShopProductCard } from "@/components/neuronourish/shop-product-card";
import { GoldButton, NeuroNourishShell } from "@/components/neuronourish/shell";
import { NN_PROGRAMME } from "@/lib/neuronourish-copy";
import { shopTierProducts } from "@/lib/neuronourish-shop";
import { buildNeuronourishMetadata } from "@/lib/neuronourish-seo";

export const metadata = buildNeuronourishMetadata("programme");

export default function ProgrammePage() {
  const tiers = shopTierProducts();

  return (
    <NeuroNourishShell>
      <PageSection className="py-14 sm:py-20">
        <PageContainer width="xl">
          <SectionHeader
            eyebrow={NN_PROGRAMME.eyebrow}
            headline={NN_PROGRAMME.headline}
            subtext={NN_PROGRAMME.subtext}
            align="center"
            headlineClassName="max-w-3xl"
            as="h1"
          />

          <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed text-ink/75">
            Choose the tier that fits your goals — or book a discovery call if you want guidance
            before you enrol. Purchases happen in the shop; this page is here to help you compare.
          </p>

          {!NN_PROGRAMME.showPublicPrice ? (
            <p className="mx-auto mt-4 max-w-xl text-center text-sm text-slate-blue">
              {NN_PROGRAMME.investmentHeadline}
            </p>
          ) : null}

          <div className="mt-10 flex flex-col items-center gap-1.5">
            <GoldButton href="/discovery">{NN_PROGRAMME.ctaDiscovery}</GoldButton>
            <span className="text-xs text-ink/60">{NN_PROGRAMME.ctaDiscoveryHint}</span>
          </div>

          <Suspense fallback={<p className="mt-14 text-center text-sm text-ink/60">Loading tiers…</p>}>
            <NnCardGrid className="mt-14">
              {tiers.map((tier) => (
                <ShopProductCard key={tier.slug} product={tier} />
              ))}
            </NnCardGrid>
          </Suspense>

          <p className="mx-auto mt-6 max-w-lg text-center text-sm text-ink/65">
            Light programme includes app-led monitoring.{" "}
            <Link href="/how-the-app-works" className="nn-text-link">
              See how the companion app works
            </Link>
          </p>

          <section className="mt-16" aria-labelledby="programme-year">
            <h2
              id="programme-year"
              className="text-center font-display text-2xl text-slate-blue sm:text-3xl"
            >
              {NN_PROGRAMME.yearTitle}
            </h2>
            <NnCardGrid as="ol" className="mt-10">
              {NN_PROGRAMME.yearPhases.map((phase) => (
                <NnCard
                  key={phase.timing}
                  as="li"
                  eyebrow={phase.timing}
                  title={phase.title}
                  body={phase.detail}
                />
              ))}
            </NnCardGrid>
          </section>

          <section className="mt-16" aria-labelledby="programme-inclusions">
            <h2
              id="programme-inclusions"
              className="text-center font-display text-2xl text-slate-blue sm:text-3xl"
            >
              {NN_PROGRAMME.inclusionsTitle}
            </h2>
            <NnCardGrid as="ul" className="mt-10">
              {NN_PROGRAMME.inclusions.map((item) => (
                <NnCard key={item.title} as="li" title={item.title} body={item.detail} />
              ))}
            </NnCardGrid>
          </section>

          <ul className="mx-auto mt-12 max-w-xl space-y-3 text-sm text-ink/80">
            {NN_PROGRAMME.highlights.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="text-gold">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <NnFaqBlock
            id="programme-faq"
            title={NN_PROGRAMME.faqTitle}
            items={NN_PROGRAMME.faq}
            className="mt-16"
          />

          <NnCard
            className="mx-auto mt-14 max-w-xl"
            align="center"
            title={NN_PROGRAMME.capacityTitle}
            body={NN_PROGRAMME.capacityText}
          />

          <p className="mx-auto mt-12 max-w-xl text-center text-sm text-ink/65">
            Ready to enrol?{" "}
            <Link href="/shop" className="nn-text-link">
              Browse all shop options
            </Link>
          </p>
        </PageContainer>
      </PageSection>
    </NeuroNourishShell>
  );
}
