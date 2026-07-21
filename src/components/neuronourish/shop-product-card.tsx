"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ShopProduct } from "@/lib/neuronourish-shop";
import { NN_SHOP } from "@/lib/neuronourish-shop";

function withLead(href: string, leadId: string | null) {
  if (!leadId) return href;
  const join = href.includes("?") ? "&" : "?";
  return `${href}${join}leadId=${encodeURIComponent(leadId)}`;
}

export function ShopProductCard({ product }: { product: ShopProduct }) {
  const searchParams = useSearchParams();
  const leadId = searchParams.get("leadId");

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-mist bg-linen/30 p-6">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gold/55" aria-hidden />
      <p className="nn-eyebrow text-gold">{product.eyebrow}</p>
      <h3 className="nn-display-card mt-2 text-slate-blue">{product.shortName}</h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-ink/75">{product.subtext}</p>
      {product.placeholderNote ? (
        <p className="mt-3 text-xs text-ink/50">
          <span className="nn-badge mr-2">{NN_SHOP.placeholderBadge}</span>
          {product.placeholderNote}
        </p>
      ) : null}
      <p className="mt-4 text-xs font-medium text-slate-blue">
        {product.showPublicPrice ? null : product.priceLabel ?? NN_SHOP.priceHiddenLabel}
      </p>
      <Link
        href={withLead(`/shop/${product.slug}`, leadId)}
        className="nn-text-link mt-5 inline-block text-sm font-medium"
      >
        View details →
      </Link>
    </article>
  );
}
