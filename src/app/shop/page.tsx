import Link from "next/link";
import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { SectionHeader } from "@/components/neuronourish/content/section-header";
import { ShopProductCard } from "@/components/neuronourish/shop-product-card";
import { NeuroNourishShell } from "@/components/neuronourish/shell";
import { NN_SHOP, shopServiceProducts, shopTierProducts } from "@/lib/neuronourish-shop";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Shop | NeuroNourish",
  description: NN_SHOP.subtext,
  path: "/shop",
});

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
          />

          <div className="mt-8 flex flex-col items-center gap-1.5">
            <Link href="/discovery" className="nn-text-link text-sm">
              {NN_SHOP.discoveryCta} →
            </Link>
            <span className="text-xs text-ink/60">{NN_SHOP.discoveryHint}</span>
          </div>

          <section className="mt-16" aria-labelledby="shop-tiers">
            <h2 id="shop-tiers" className="text-center font-display text-2xl text-slate-blue">
              {NN_SHOP.tiersTitle}
            </h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {tiers.map((product) => (
                <ShopProductCard key={product.slug} product={product} />
              ))}
            </div>
          </section>

          <section className="mt-16" aria-labelledby="shop-services">
            <h2 id="shop-services" className="text-center font-display text-2xl text-slate-blue">
              {NN_SHOP.productsTitle}
            </h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((product) => (
                <ShopProductCard key={product.slug} product={product} />
              ))}
            </div>
          </section>

          <p className="mx-auto mt-14 max-w-xl text-center text-sm text-ink/65">
            Prefer the full programme story first?{" "}
            <Link href="/programme" className="nn-text-link">
              Explore the 12-month pathway
            </Link>
          </p>
        </PageContainer>
      </PageSection>
    </NeuroNourishShell>
  );
}
