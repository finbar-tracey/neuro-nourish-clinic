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

/** Emer Version 2 catalog surface — public € prices for one-off tests. */
export default function TestsPage() {
  const tiers = shopTierProducts();
  const services = shopServiceProducts();

  return (
    <NeuroNourishShell>
      <PageSection className="nn-tests-header py-14 sm:py-20">
        <PageContainer width="xl">
          <SectionHeader
            eyebrow={NN_SHOP.eyebrow}
            headline={NN_SHOP.headline}
            subtext={NN_SHOP.subtext}
            align="center"
            headlineClassName="max-w-3xl"
            as="h1"
          />

          <div
            className="mx-auto mt-10 aspect-[21/9] max-w-3xl overflow-hidden rounded-2xl border border-mist/80 bg-gradient-to-br from-linen/80 via-white to-mist/40 shadow-[0_8px_24px_rgba(26,51,72,0.06)]"
            role="img"
            aria-label="Clinical assessment context — photography coming soon"
          >
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
              <p className="nn-eyebrow text-slate-blue">In clinic &amp; at home</p>
              <p className="max-w-md text-sm text-ink/55">
                Cognitive assessment and consultation imagery will appear here.
              </p>
            </div>
          </div>

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
            id="tests-faq"
            title={NN_SHOP.faqTitle}
            items={NN_SHOP.faq}
            className="mt-16"
          />

          <p className="mx-auto mt-14 max-w-xl text-center text-sm text-ink/65">
            Comparing programmes?{" "}
            <Link href="/programme" className="nn-text-link">
              {NN_SHOP.programmeCompareCta}
            </Link>
          </p>
        </PageContainer>
      </PageSection>
    </NeuroNourishShell>
  );
}
