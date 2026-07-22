"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { NnCard } from "@/components/neuronourish/content/nn-card";
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
    <NnCard
      eyebrow={product.eyebrow}
      title={product.shortName}
      body={
        <>
          <p>{product.subtext}</p>
          {product.placeholderNote ? (
            <p className="mt-3 text-xs text-ink/50">
              <span className="nn-badge mr-2">{NN_SHOP.placeholderBadge}</span>
              {product.placeholderNote}
            </p>
          ) : null}
          <p className="mt-4 text-xs font-medium text-slate-blue">
            {product.showPublicPrice ? null : product.priceLabel ?? NN_SHOP.priceHiddenLabel}
          </p>
        </>
      }
      footer={
        <Link
          href={withLead(`/shop/${product.slug}`, leadId)}
          className="nn-text-link inline-block text-sm font-medium"
        >
          View details →
        </Link>
      }
    />
  );
}
