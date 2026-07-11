import { GoldButton } from "@/components/neuronourish/shell";
import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { SectionHeader } from "@/components/neuronourish/content/section-header";
import { NN_B2B } from "@/lib/neuronourish-copy";

type B2bIcon = (typeof NN_B2B.pillars)[number]["icon"];

function B2bPillarIcon({ icon }: { icon: B2bIcon }) {
  const className = "h-5 w-5 text-gold";

  switch (icon) {
    case "report":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M7 4h7l3 3v13H7V4z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M14 4v4h4M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "integration":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="18" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="1.5" />
          <path d="M9 11l6-3M9 13l6 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "outcomes":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 18V6M10 18V10M16 18V8M22 18V4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
  }
}

export function B2bSection({ className = "" }: { className?: string }) {
  return (
    <PageSection id="healthcare-partnerships" className={`nn-b2b-section border-t border-linen/80 ${className}`}>
      <PageContainer width="xl">
        <SectionHeader
          eyebrow={NN_B2B.eyebrow}
          headline={NN_B2B.headline}
          subtext={NN_B2B.subtext}
          align="center"
          headlineClassName="max-w-3xl"
        />

        <ul className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2.5">
          {NN_B2B.audiences.map((audience) => (
            <li
              key={audience}
              className="rounded-full border border-mist/80 bg-white/70 px-3.5 py-1.5 text-sm text-ink/75"
            >
              {audience}
            </li>
          ))}
        </ul>

        <div className="mt-10 grid gap-5 sm:grid-cols-3 lg:gap-6">
          {NN_B2B.pillars.map((pillar) => (
            <article
              key={pillar.title}
              className="nn-b2b-pillar relative overflow-hidden rounded-2xl border border-mist bg-white/85 p-6 shadow-sm"
            >
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gold/55" aria-hidden />
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/12">
                <B2bPillarIcon icon={pillar.icon} />
              </div>
              <h3 className="nn-display-card mt-4 text-slate-blue">{pillar.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/75">{pillar.description}</p>
            </article>
          ))}
        </div>

        <div className="mx-auto mt-10 grid max-w-2xl gap-4 sm:grid-cols-3">
          {NN_B2B.stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-display text-3xl text-slate-blue">{stat.value}</p>
              <p className="mt-1 text-xs text-ink/60">{stat.label}</p>
            </div>
          ))}
        </div>

        <ul className="mx-auto mt-8 flex max-w-xl flex-col items-center gap-3 text-center">
          {NN_B2B.highlights.map((item) => (
            <li key={item} className="text-sm text-ink/80">
              <span className="mr-2 text-gold" aria-hidden>
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-col items-center gap-3 border-t border-mist/80 pt-10">
          <GoldButton href="/clinics">{NN_B2B.cta}</GoldButton>
          <span className="text-xs text-ink/60">{NN_B2B.ctaHint}</span>
        </div>
      </PageContainer>
    </PageSection>
  );
}
