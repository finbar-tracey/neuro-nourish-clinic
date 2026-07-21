import Link from "next/link";
import { Suspense } from "react";
import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { SectionHeader } from "@/components/neuronourish/content/section-header";
import { ShopCatalog } from "@/components/neuronourish/shop-catalog";
import { NeuroNourishShell } from "@/components/neuronourish/shell";
import {
  NN_SHOP,
  shopFeaturedProducts,
  shopServiceProducts,
  shopTierProducts,
} from "@/lib/neuronourish-shop";
import { buildNeuronourishMetadata } from "@/lib/neuronourish-seo";

export const metadata = buildNeuronourishMetadata("shop");

export default function ShopPage() {
  const featured = shopFeaturedProducts().filter((p) =>
    ["cognitive-assessment", "premium-programme", "medium-programme"].includes(p.slug),
  );
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
            <ShopCatalog featured={featured} tiers={tiers} services={services} />
          </Suspense>

          <section className="mx-auto mt-16 max-w-2xl" aria-labelledby="shop-faq">
            <h2 id="shop-faq" className="text-center font-display text-2xl text-slate-blue">
              {NN_SHOP.faqTitle}
            </h2>
            <dl className="mt-8 space-y-5">
              {NN_SHOP.faq.map((item) => (
                <div key={item.q} className="rounded-2xl border border-mist bg-white/80 p-5">
                  <dt className="text-sm font-medium text-deep-slate">{item.q}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-ink/75">{item.a}</dd>
                </div>
              ))}
            </dl>
          </section>

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
