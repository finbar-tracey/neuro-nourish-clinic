import Link from "next/link";
import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
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
          />

          <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed text-ink/75">
            Choose the tier that fits your goals — or book a discovery call if you want guidance
            before you enrol. Purchases happen in the shop; this page is here to help you compare.
          </p>

          <div className="mt-10 flex flex-col items-center gap-1.5">
            <GoldButton href="/discovery">{NN_PROGRAMME.ctaDiscovery}</GoldButton>
            <span className="text-xs text-ink/60">{NN_PROGRAMME.ctaDiscoveryHint}</span>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {tiers.map((tier) => (
              <ShopProductCard key={tier.slug} product={tier} />
            ))}
          </div>

          <ul className="mx-auto mt-12 max-w-xl space-y-3 text-sm text-ink/80">
            {NN_PROGRAMME.highlights.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="text-gold">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

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
