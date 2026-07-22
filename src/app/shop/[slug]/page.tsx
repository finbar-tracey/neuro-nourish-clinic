import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckList } from "@/components/neuronourish/content/highlight-list";
import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { NnCard, NnCardGrid } from "@/components/neuronourish/content/nn-card";
import { ShopCheckoutButton } from "@/components/neuronourish/shop-checkout-button";
import { ShopProductCard } from "@/components/neuronourish/shop-product-card";
import { NeuroNourishShell, SectionEyebrow } from "@/components/neuronourish/shell";
import {
  getShopProduct,
  NN_SHOP,
  shopPublicPriceLabel,
  shopRelatedProducts,
} from "@/lib/neuronourish-shop";
import { buildPageMetadata, NOINDEX_ROBOTS } from "@/lib/seo";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const { NN_SHOP_PRODUCTS } = await import("@/lib/neuronourish-shop");
  return NN_SHOP_PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const product = getShopProduct(slug);
  if (!product) return {};
  const meta = buildPageMetadata({
    title: `${product.name} | NeuroNourish Shop`,
    description: product.subtext,
    path: `/shop/${product.slug}`,
  });
  if (product.placeholderNote) {
    return { ...meta, robots: NOINDEX_ROBOTS };
  }
  return meta;
}

export default async function ShopProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = getShopProduct(slug);
  if (!product) notFound();

  const related = shopRelatedProducts(product.slug);
  const showAppLink = product.slug === "light-programme";

  return (
    <NeuroNourishShell>
      <PageSection className="py-14 sm:py-20">
        <PageContainer width="md">
          <p className="text-center text-sm">
            <Link href="/shop" className="nn-text-link">
              ← Back to shop
            </Link>
          </p>
          <header className="mt-8 text-center">
            <SectionEyebrow>{product.eyebrow}</SectionEyebrow>
            <h1 className="nn-display-section mx-auto mt-3 max-w-2xl text-slate-blue">
              {product.headline}
            </h1>
            <p className="nn-body mx-auto mt-4 max-w-xl text-ink/85">{product.subtext}</p>
            {product.placeholderNote ? (
              <p className="mx-auto mt-4 max-w-md text-xs text-ink/55">
                <span className="nn-badge mr-2">{NN_SHOP.placeholderBadge}</span>
                {product.placeholderNote}
              </p>
            ) : null}
          </header>

          <NnCard
            className="mx-auto mt-10 max-w-lg sm:p-8"
            title="What's included"
            footer={
              <p className="text-center text-sm text-ink/65">{shopPublicPriceLabel(product)}</p>
            }
          >
            <CheckList items={product.includes} className="mt-2" />
          </NnCard>

          <div className="mx-auto mt-10 flex max-w-lg flex-col items-center gap-3">
            {product.ctaType === "buy" ? (
              <Suspense fallback={<p className="text-sm text-ink/60">Loading checkout…</p>}>
                <ShopCheckoutButton product={product} />
              </Suspense>
            ) : null}
            {product.bookHref ? (
              <Link href={product.bookHref} className="nn-text-link text-sm">
                {NN_SHOP.discoveryCta} →
              </Link>
            ) : (
              <Link href="/discovery" className="nn-text-link text-sm">
                {NN_SHOP.discoveryCta} →
              </Link>
            )}
            {showAppLink ? (
              <Link href="/how-the-app-works" className="nn-text-link text-sm">
                See how the companion app works →
              </Link>
            ) : null}
            {product.category === "programme" ? (
              <Link href="/programme" className="text-xs text-ink/55 underline-offset-2 hover:underline">
                Compare all programme tiers
              </Link>
            ) : null}
          </div>
        </PageContainer>

        {related.length > 0 ? (
          <PageContainer width="xl" className="mt-16">
            <h2 className="text-center font-display text-2xl text-slate-blue">
              {NN_SHOP.relatedTitle}
            </h2>
            <Suspense fallback={<p className="mt-8 text-center text-sm text-ink/60">Loading…</p>}>
              <NnCardGrid className="mt-8" columns={3}>
                {related.map((item) => (
                  <ShopProductCard key={item.slug} product={item} />
                ))}
              </NnCardGrid>
            </Suspense>
          </PageContainer>
        ) : null}
      </PageSection>
    </NeuroNourishShell>
  );
}
