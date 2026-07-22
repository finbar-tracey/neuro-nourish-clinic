"use client";

import { useMemo, useState } from "react";
import { NnCardGrid } from "@/components/neuronourish/content/nn-card";
import { ShopProductCard } from "@/components/neuronourish/shop-product-card";
import {
  NN_SHOP,
  type ShopCategory,
  type ShopProduct,
} from "@/lib/neuronourish-shop";

const FILTERS: { id: "all" | ShopCategory; label: string }[] = [
  { id: "all", label: NN_SHOP.filterAll },
  { id: "programme", label: NN_SHOP.filterLabels.programme },
  { id: "assessment", label: NN_SHOP.filterLabels.assessment },
  { id: "consultation", label: NN_SHOP.filterLabels.consultation },
  { id: "lab", label: NN_SHOP.filterLabels.lab },
  { id: "supplement", label: NN_SHOP.filterLabels.supplement },
];

export function ShopCatalog({
  tiers,
  services,
}: {
  tiers: ShopProduct[];
  services: ShopProduct[];
}) {
  const [filter, setFilter] = useState<"all" | ShopCategory>("all");

  const visibleTiers = useMemo(
    () => (filter === "all" || filter === "programme" ? tiers : []),
    [tiers, filter],
  );
  const visibleServices = useMemo(() => {
    if (filter === "all") return services;
    if (filter === "programme") return [];
    return services.filter((p) => p.category === filter);
  }, [services, filter]);

  return (
    <>
      <div
        className="mt-10 flex flex-wrap items-center justify-center gap-2"
        role="group"
        aria-label="Filter shop products"
      >
        {FILTERS.map((item) => {
          const active = filter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`min-h-[44px] rounded-full px-4 py-2 text-[12px] font-medium transition ${
                active
                  ? "bg-gold text-deep-slate"
                  : "border border-mist bg-white/80 text-ink/70 hover:border-gold/40 hover:text-deep-slate"
              }`}
              aria-pressed={active}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {visibleTiers.length > 0 ? (
        <section className="mt-16" aria-labelledby="shop-tiers">
          <h2 id="shop-tiers" className="text-center font-display text-2xl text-slate-blue">
            {NN_SHOP.tiersTitle}
          </h2>
          <NnCardGrid className="mt-8" columns={3}>
            {visibleTiers.map((product) => (
              <ShopProductCard key={product.slug} product={product} />
            ))}
          </NnCardGrid>
        </section>
      ) : null}

      {visibleServices.length > 0 ? (
        <section className="mt-16" aria-labelledby="shop-services">
          <h2 id="shop-services" className="text-center font-display text-2xl text-slate-blue">
            {NN_SHOP.productsTitle}
          </h2>
          <NnCardGrid className="mt-8" columns={3}>
            {visibleServices.map((product) => (
              <ShopProductCard key={product.slug} product={product} />
            ))}
          </NnCardGrid>
        </section>
      ) : null}
    </>
  );
}
