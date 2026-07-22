import Link from "next/link";
import { Suspense } from "react";
import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { NnFaqBlock } from "@/components/neuronourish/content/nn-faq-accordion";
import { SectionHeader } from "@/components/neuronourish/content/section-header";
import { ShopCatalog } from "@/components/neuronourish/shop-catalog";
import { NeuroNourishShell } from "@/components/neuronourish/shell";
import {
  NN_SHOP,
  shopServiceProducts,
  shopTierProducts,
} from "@/lib/neuronourish-shop";
import { buildNeuronourishMetadata } from "@/lib/neuronourish-seo";

export const metadata = buildNeuronourishMetadata("shop");

export default function ShopPage() {
  const tiers = shopTierProducts();
  const services = shopServiceProducts();

  return (
    <NeuroNourishShell>
      <PageSection className="py-14 sm:py-20">
        <PageContainer width="xl">
          <SectionHeader
            eyebrow={NN_SHOP.eyebrow}
            headline={NN_SHOP.headline}
            subtext={NN_SHOP.subtext}
            align="center"
            headlineClassName="max-w-3xl"
            as="h1"
          />

          <div className="mt-8 flex flex-col items-center gap-1.5">
            <Link href="/quiz" className="nn-text-link text-sm">
              {NN_SHOP.quizCta} →
            </Link>
            <span className="text-xs text-ink/60">{NN_SHOP.quizHint}</span>
            <Link href="/discovery" className="nn-text-link mt-2 text-sm">
              {NN_SHOP.discoveryCta} →
            </Link>
            <span className="text-xs text-ink/60">{NN_SHOP.discoveryHint}</span>
          </div>

          <Suspense fallback={<p className="mt-10 text-center text-sm text-ink/60">Loading catalog…</p>}>
            <ShopCatalog tiers={tiers} services={services} />
          </Suspense>

          <NnFaqBlock
            id="shop-faq"
            title={NN_SHOP.faqTitle}
            items={NN_SHOP.faq}
            className="mt-16"
          />

          <p className="mx-auto mt-14 max-w-xl text-center text-sm text-ink/65">
            Comparing tiers?{" "}
            <Link href="/programme" className="nn-text-link">
              {NN_SHOP.programmeCompareCta}
            </Link>
          </p>
        </PageContainer>
      </PageSection>
    </NeuroNourishShell>
  );
}
