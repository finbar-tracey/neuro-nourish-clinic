import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckList } from "@/components/neuronourish/content/highlight-list";
import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { ShopCheckoutButton } from "@/components/neuronourish/shop-checkout-button";
import { NeuroNourishShell, SectionEyebrow } from "@/components/neuronourish/shell";
import { getShopProduct, NN_SHOP } from "@/lib/neuronourish-shop";
import { buildPageMetadata } from "@/lib/seo";

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
  return buildPageMetadata({
    title: `${product.name} | NeuroNourish Shop`,
    description: product.subtext,
    path: `/shop/${product.slug}`,
  });
}

export default async function ShopProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = getShopProduct(slug);
  if (!product) notFound();

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

          <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-mist bg-white/90 p-6 shadow-sm sm:p-8">
            <p className="text-sm font-medium text-slate-blue">What&apos;s included</p>
            <CheckList items={product.includes} className="mt-4" />
            <p className="mt-6 text-center text-sm text-ink/65">{product.priceLabel}</p>
          </div>

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
          </div>
        </PageContainer>
      </PageSection>
    </NeuroNourishShell>
  );
}
