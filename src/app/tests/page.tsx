import Link from "next/link";
import { Suspense } from "react";
import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { NnFaqBlock } from "@/components/neuronourish/content/nn-faq-accordion";
import { SectionHeader } from "@/components/neuronourish/content/section-header";
import {
  EMER_PORTRAIT_SRC,
  EMER_PORTRAIT_VERSION,
} from "@/components/neuronourish/content/visual-placeholders";
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
  const portraitSrc = `${EMER_PORTRAIT_SRC}?v=${EMER_PORTRAIT_VERSION}`;

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

          <div className="mx-auto mt-10 grid max-w-4xl overflow-hidden rounded-2xl border border-mist/80 bg-white shadow-[0_8px_24px_rgba(26,51,72,0.07)] sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
            <div className="relative min-h-[14rem] bg-deep-slate sm:min-h-full">
              {/* eslint-disable-next-line @next/next/no-img-element -- static brand asset */}
              <img
                src={portraitSrc}
                alt="Emer Sexton, Founder of NeuroNourish Clinic"
                width={1080}
                height={1080}
                className="absolute inset-0 h-full w-full object-cover object-[center_12%]"
              />
            </div>
            <div className="flex flex-col justify-center gap-3 px-6 py-8 text-left sm:px-8">
              <p className="nn-eyebrow text-gold">Clinical leadership</p>
              <h2 className="nn-display-card text-deep-slate">Assessments guided by Emer Sexton</h2>
              <p className="text-sm leading-relaxed text-ink/70">
                Cognitive testing, consultations, and programme pathways are delivered under clinical
                oversight — so you always know who is behind the recommendation.
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
