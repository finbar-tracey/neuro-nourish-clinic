import Link from "next/link";
import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { SectionHeader } from "@/components/neuronourish/content/section-header";
import { ShopProductCard } from "@/components/neuronourish/shop-product-card";
import { GoldButton, NeuroNourishShell } from "@/components/neuronourish/shell";
import { NN_PROGRAMME } from "@/lib/neuronourish-copy";
import { shopTierProducts } from "@/lib/neuronourish-shop";
import { buildNeuronourishMetadata } from "@/lib/neuronourish-seo";

export const metadata = buildNeuronourishMetadata("programme");

export default function ProgrammePage() {
  const tiers = shopTierProducts();

  return (
    <NeuroNourishShell>
      <PageSection className="py-14 sm:py-20">
        <PageContainer width="xl">
          <SectionHeader
            eyebrow={NN_PROGRAMME.eyebrow}
            headline={NN_PROGRAMME.headline}
            subtext={NN_PROGRAMME.subtext}
            align="center"
            headlineClassName="max-w-3xl"
          />

          <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed text-ink/75">
            Choose the tier that fits your goals — or book a discovery call if you want guidance
            before you enrol. Purchases happen in the shop; this page is here to help you compare.
          </p>

          {!NN_PROGRAMME.showPublicPrice ? (
            <p className="mx-auto mt-4 max-w-xl text-center text-sm text-slate-blue">
              {NN_PROGRAMME.investmentHeadline}
            </p>
          ) : null}

          <div className="mt-10 flex flex-col items-center gap-1.5">
            <GoldButton href="/discovery">{NN_PROGRAMME.ctaDiscovery}</GoldButton>
            <span className="text-xs text-ink/60">{NN_PROGRAMME.ctaDiscoveryHint}</span>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {tiers.map((tier) => (
              <ShopProductCard key={tier.slug} product={tier} />
            ))}
          </div>

          <p className="mx-auto mt-6 max-w-lg text-center text-sm text-ink/65">
            Light programme includes app-led monitoring.{" "}
            <Link href="/how-the-app-works" className="nn-text-link">
              See how the companion app works
            </Link>
          </p>

          <section className="mt-16" aria-labelledby="programme-year">
            <h2
              id="programme-year"
              className="text-center font-display text-2xl text-slate-blue sm:text-3xl"
            >
              {NN_PROGRAMME.yearTitle}
            </h2>
            <ol className="mt-10 grid gap-6 sm:grid-cols-3">
              {NN_PROGRAMME.yearPhases.map((phase) => (
                <li
                  key={phase.timing}
                  className="rounded-2xl border border-mist bg-white/90 p-6 text-center shadow-sm sm:text-left"
                >
                  <p className="nn-eyebrow text-gold">{phase.timing}</p>
                  <h3 className="mt-3 font-display text-xl text-slate-blue">{phase.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/75">{phase.detail}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-16" aria-labelledby="programme-inclusions">
            <h2
              id="programme-inclusions"
              className="text-center font-display text-2xl text-slate-blue sm:text-3xl"
            >
              {NN_PROGRAMME.inclusionsTitle}
            </h2>
            <ul className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
              {NN_PROGRAMME.inclusions.map((item) => (
                <li
                  key={item.title}
                  className="rounded-2xl border border-mist bg-white/80 p-5 text-left"
                >
                  <p className="text-sm font-medium text-deep-slate">{item.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink/75">{item.detail}</p>
                </li>
              ))}
            </ul>
          </section>

          <ul className="mx-auto mt-12 max-w-xl space-y-3 text-sm text-ink/80">
            {NN_PROGRAMME.highlights.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="text-gold">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <section className="mx-auto mt-16 max-w-2xl" aria-labelledby="programme-faq">
            <h2
              id="programme-faq"
              className="text-center font-display text-2xl text-slate-blue"
            >
              {NN_PROGRAMME.faqTitle}
            </h2>
            <dl className="mt-8 space-y-5">
              {NN_PROGRAMME.faq.map((item) => (
                <div key={item.q} className="rounded-2xl border border-mist bg-white/80 p-5">
                  <dt className="text-sm font-medium text-deep-slate">{item.q}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-ink/75">{item.a}</dd>
                </div>
              ))}
            </dl>
          </section>

          <div className="mx-auto mt-14 max-w-xl rounded-2xl border border-mist bg-linen/20 p-6 text-center">
            <p className="font-display text-lg text-slate-blue">{NN_PROGRAMME.capacityTitle}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink/75">{NN_PROGRAMME.capacityText}</p>
          </div>

          <p className="mx-auto mt-12 max-w-xl text-center text-sm text-ink/65">
            Ready to enrol?{" "}
            <Link href="/shop" className="nn-text-link">
              Browse all shop options
            </Link>
          </p>
        </PageContainer>
      </PageSection>
    </NeuroNourishShell>
  );
}
