"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Heart } from "lucide-react";
import { DiscoveryCalendlyEmbed } from "@/components/neuronourish/calendly-embed";
import { CheckList } from "@/components/neuronourish/content/highlight-list";
import { DiscoveryRequestForm } from "@/components/neuronourish/content/discovery-request-form";
import { FunnelTrustBar } from "@/components/neuronourish/content/funnel-trust-bar";
import { SectionEyebrow } from "@/components/neuronourish/shell";
import { NN_DISCOVERY, NN_FOOTER } from "@/lib/neuronourish-copy";

type DiscoveryBookingPanelProps = {
  calendlyUrl?: string;
};

export function DiscoveryBookingPanel({ calendlyUrl }: DiscoveryBookingPanelProps) {
  const searchParams = useSearchParams();
  const leadId = useMemo(() => searchParams.get("leadId") ?? "", [searchParams]);
  const isRecovered = useMemo(() => searchParams.get("recovered") === "true", [searchParams]);
  const hasCalendly = Boolean(calendlyUrl);

  return (
    <div className="mx-auto max-w-2xl">
      {isRecovered ? (
        <div className="mb-10 flex items-start gap-4 border-b border-linen/70 pb-8">
          <div className="mt-0.5 shrink-0 rounded-xl bg-gold/10 p-3">
            <Heart className="h-5 w-5 text-gold" aria-hidden />
          </div>
          <div>
            <h1 className="font-display text-2xl text-deep-slate sm:text-3xl">
              {NN_DISCOVERY.recoveredCard.headline}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ink/75">
              {NN_DISCOVERY.recoveredCard.subtext}
            </p>
          </div>
        </div>
      ) : (
        <header className="text-center">
          <p className="font-display text-2xl tracking-tight text-deep-slate sm:text-3xl">
            {NN_DISCOVERY.brand}
          </p>
          <div className="mt-5">
            <SectionEyebrow>{NN_DISCOVERY.eyebrow}</SectionEyebrow>
          </div>
          <h1 className="nn-display-section mx-auto mt-3 max-w-2xl text-slate-blue">
            {NN_DISCOVERY.headline}
          </h1>
          <p className="nn-body mx-auto mt-4 max-w-xl text-ink/85">{NN_DISCOVERY.subtext}</p>
          <CheckList items={NN_DISCOVERY.highlights} className="mx-auto mt-8 max-w-md text-left" />
          <FunnelTrustBar className="mt-6" />
        </header>
      )}

      <section className="mt-12" aria-labelledby="discovery-what-happens">
        <h2
          id="discovery-what-happens"
          className="text-center font-display text-xl text-slate-blue sm:text-2xl"
        >
          {NN_DISCOVERY.whatHappensTitle}
        </h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-3 sm:gap-4">
          {NN_DISCOVERY.whatHappens.map((item) => (
            <li key={item.step} className="text-center sm:text-left">
              <span className="font-display text-2xl text-gold">{item.step}</span>
              <p className="mt-2 text-sm font-medium text-deep-slate">{item.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink/70">{item.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      {hasCalendly ? (
        <section className="mt-12" aria-labelledby="discovery-calendar">
          <h2
            id="discovery-calendar"
            className="text-center font-display text-xl text-slate-blue sm:text-2xl"
          >
            {NN_DISCOVERY.calendlyTitle}
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-sm text-ink/70">
            {NN_DISCOVERY.calendlySubtext}
          </p>
          <div className="mt-6 overflow-hidden rounded-2xl border border-mist/80 bg-white">
            <DiscoveryCalendlyEmbed
              url={calendlyUrl!}
              leadId={leadId || undefined}
              utmSource={isRecovered ? "crm_recovery" : "discovery_page"}
            />
            <p className="px-4 pb-4 text-center text-[11px] text-ink/50">
              {NN_DISCOVERY.schedulingFooter}
            </p>
          </div>
          <div className="mt-10 border-t border-linen/70 pt-10">
            <p className="mb-1 text-center font-display text-lg text-slate-blue">
              {NN_DISCOVERY.formTitle}
            </p>
            <p className="mb-6 text-center text-sm text-ink/70">
              {NN_DISCOVERY.formIntroWithCalendly}
            </p>
            <DiscoveryRequestForm leadId={leadId || undefined} compactIntro />
          </div>
        </section>
      ) : (
        <section className="mt-12" aria-labelledby="discovery-request">
          <h2
            id="discovery-request"
            className="text-center font-display text-xl text-slate-blue sm:text-2xl"
          >
            {NN_DISCOVERY.formTitle}
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-sm text-ink/70">
            {NN_DISCOVERY.formLead}
          </p>
          <p className="mt-2 text-center text-xs text-ink/55">{NN_DISCOVERY.ctaHint}</p>
          <div className="mt-8">
            <DiscoveryRequestForm leadId={leadId || undefined} compactIntro />
          </div>
          <p className="mt-6 text-center text-sm text-ink/70">
            Or email{" "}
            <Link href={`mailto:${NN_FOOTER.email}`} className="nn-text-link">
              {NN_FOOTER.email}
            </Link>
          </p>
        </section>
      )}

      <section className="mt-14 border-t border-linen/70 pt-10" aria-labelledby="discovery-faq">
        <h2
          id="discovery-faq"
          className="text-center font-display text-xl text-slate-blue sm:text-2xl"
        >
          {NN_DISCOVERY.faqTitle}
        </h2>
        <dl className="mx-auto mt-8 max-w-xl space-y-5">
          {NN_DISCOVERY.faq.map((item) => (
            <div key={item.q}>
              <dt className="text-sm font-medium text-deep-slate">{item.q}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-ink/70">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <aside className="mt-12 border-t border-linen/70 pt-10 text-center">
        <p className="font-display text-lg text-slate-blue">{NN_DISCOVERY.quizAltTitle}</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink/70">{NN_DISCOVERY.quizAltBody}</p>
        <Link
          href={leadId ? `/quiz?leadId=${encodeURIComponent(leadId)}` : "/quiz"}
          className="nn-text-link mt-4 inline-block text-sm"
        >
          {NN_DISCOVERY.quizAltCta} →
        </Link>
      </aside>
    </div>
  );
}
