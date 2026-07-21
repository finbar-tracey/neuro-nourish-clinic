import {
  GoldButton,
  NeuroNourishShell,
  SectionEyebrow,
} from "@/components/neuronourish/shell";
import {
  CheckList,
  PageContainer,
  FounderPortrait,
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
                NeuroNourish Clinic
              </p>
              <div className="mt-5">
                <SectionEyebrow>{NN_ABOUT.eyebrow}</SectionEyebrow>
              </div>
              <h1 className="nn-display-section mt-3 text-slate-blue">
                {NN_FOUNDER_ABOUT.headline}
              </h1>
              <p className="nn-body mx-auto mt-5 max-w-xl text-ink/85 lg:mx-0">
                {NN_FOUNDER_ABOUT.teaser}
              </p>
              <CheckList items={NN_FOUNDER_ABOUT.highlights} className="mt-7 text-left" />
              <div className="mt-8 border-t border-linen/80 pt-6">
                <p className="text-sm font-medium text-deep-slate">
                  {NN_FOUNDER_ABOUT.attribution.replace(/^—\s*/, "")}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-blue">
                  {NN_FOUNDER_ABOUT.credentialsShort}
                </p>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      <PageContainer width="md" className="py-14 sm:py-16">
        <blockquote className="nn-pull-quote animate-[nn-hero-rise_0.6s_ease-out_both] text-ink/85">
          {NN_FOUNDER_ABOUT.quote}
        </blockquote>
        <p className="mt-4 text-sm text-slate-blue">
          {NN_FOUNDER_ABOUT.attribution} · {NN_FOUNDER_ABOUT.title}
        </p>

        <div className="mt-12 space-y-5 border-t border-linen/70 pt-10">
          {NN_ABOUT.bio.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="nn-body text-ink/85">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5">
          <GoldButton href="/quiz">{NN_ABOUT.cta}</GoldButton>
          <a href="/team" className="nn-text-link text-sm">
            Meet the team →
          </a>
          <a href="/discovery" className="nn-text-link text-sm">
            Or book a discovery call →
          </a>
        </div>
      </PageContainer>
    </NeuroNourishShell>
  );
}
