import Link from "next/link";
import {
  GoldButton,
  NeuroNourishShell,
  SectionEyebrow,
} from "@/components/neuronourish/shell";
import {
  CheckList,
  PageContainer,
  FounderPortrait,
  FounderTrustStrip,
} from "@/components/neuronourish/content";
import { NN_ABOUT, NN_FOUNDER_ABOUT } from "@/lib/neuronourish-copy";
import { buildNeuronourishMetadata } from "@/lib/neuronourish-seo";

export const metadata = buildNeuronourishMetadata("about");

export default function AboutPage() {
  return (
    <NeuroNourishShell>
      <section className="relative overflow-hidden border-b border-linen/60">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_18%_0%,rgba(201,168,76,0.16),transparent_52%),radial-gradient(ellipse_at_92%_18%,rgba(107,152,178,0.14),transparent_48%)]"
          aria-hidden
        />
        <PageContainer width="lg" className="relative py-14 sm:py-20 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16">
            <div className="nn-about-portrait mx-auto animate-[nn-hero-rise_0.7s_ease-out_both] lg:mx-0">
              <FounderPortrait variant="light" priority />
            </div>
            <div className="animate-[nn-hero-rise_0.7s_ease-out_0.12s_both] text-center lg:text-left">
              <p className="font-display text-3xl tracking-tight text-deep-slate sm:text-4xl lg:text-[2.75rem]">
                NeuroNourish
              </p>
              <div className="mt-5">
                <SectionEyebrow>{NN_ABOUT.eyebrow}</SectionEyebrow>
              </div>
              <h1 className="nn-display-section mt-3 text-slate-blue">{NN_ABOUT.headline}</h1>
              <p className="nn-body mx-auto mt-5 max-w-xl text-ink/85 lg:mx-0">{NN_ABOUT.subtext}</p>
              {NN_ABOUT.visionBody.map((paragraph) => (
                <p key={paragraph.slice(0, 28)} className="nn-body mx-auto mt-4 max-w-xl text-ink/80 lg:mx-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </PageContainer>
      </section>

      <PageContainer width="md" className="py-14 sm:py-16">
        <p className="nn-eyebrow text-gold">{NN_ABOUT.founderEyebrow}</p>
        <p className="nn-display-card mt-3 text-slate-blue">{NN_ABOUT.founderBelief}</p>
        {NN_ABOUT.founderBody.map((paragraph) => (
          <p key={paragraph.slice(0, 28)} className="nn-body mt-5 text-ink/85">
            {paragraph}
          </p>
        ))}

        <CheckList items={NN_ABOUT.credentials} className="mt-8" />

        <div className="mt-12 space-y-5 border-t border-linen/70 pt-10">
          <p className="nn-eyebrow text-slate-blue">Lived experience</p>
          {NN_ABOUT.bio.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="nn-body text-ink/85">
              {paragraph}
            </p>
          ))}
        </div>

        <blockquote className="nn-pull-quote mt-12 text-ink/85">{NN_FOUNDER_ABOUT.quote}</blockquote>
        <p className="mt-4 text-sm text-slate-blue">
          {NN_FOUNDER_ABOUT.attribution} · {NN_FOUNDER_ABOUT.title}
        </p>

        <FounderTrustStrip tone="light" className="mt-12" />

        <div className="mt-12 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5">
          <div className="flex flex-col items-start gap-1.5">
            <GoldButton href={NN_ABOUT.ctaHref}>{NN_ABOUT.cta}</GoldButton>
            <span className="text-xs text-ink/55">{NN_ABOUT.ctaHint}</span>
          </div>
          <Link href="/team" className="nn-text-link text-sm">
            {NN_ABOUT.teamLink} →
          </Link>
          <Link href="/programme" className="nn-text-link text-sm">
            {NN_ABOUT.programmeSoft} →
          </Link>
          <Link href="/discovery" className="nn-text-link text-sm">
            {NN_ABOUT.discoveryLink} →
          </Link>
        </div>
      </PageContainer>
    </NeuroNourishShell>
  );
}
