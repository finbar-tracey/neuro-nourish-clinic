import Link from "next/link";
import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { NnCard, NnCardGrid } from "@/components/neuronourish/content/nn-card";
import { SectionHeader } from "@/components/neuronourish/content/section-header";
import { FounderPortrait } from "@/components/neuronourish/content/visual-placeholders";
import { GoldButton, NeuroNourishShell } from "@/components/neuronourish/shell";
import { NN_TEAM } from "@/lib/neuronourish-copy";
import { buildNeuronourishMetadata } from "@/lib/neuronourish-seo";

export const metadata = buildNeuronourishMetadata("team");

export default function TeamPage() {
  const [emer, ...others] = NN_TEAM.members;

  return (
    <NeuroNourishShell>
      <PageSection className="py-14 sm:py-20">
        <PageContainer width="lg">
          <SectionHeader
            eyebrow={NN_TEAM.eyebrow}
            headline={NN_TEAM.headline}
            subtext={NN_TEAM.subtext}
            align="center"
            headlineClassName="max-w-2xl"
            as="h1"
          />

          <div className="mx-auto mt-12 flex max-w-3xl flex-col items-center gap-6 rounded-3xl border border-mist/90 bg-white p-6 shadow-[0_8px_24px_rgba(26,51,72,0.07)] sm:gap-8 sm:p-8 md:flex-row md:items-center md:gap-10">
            <div className="shrink-0">
              <FounderPortrait size="sm" priority />
            </div>
            <div className="min-w-0 flex-1 text-center md:text-left">
              <h2 className="nn-display-card text-deep-slate">{emer.name}</h2>
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-ink/55">
                {emer.role}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-ink/75">{emer.bio}</p>
              {emer.href ? (
                <div className="mt-6 flex flex-col items-center gap-1.5 md:items-start">
                  <GoldButton href={emer.href}>{emer.hrefLabel ?? NN_TEAM.ctaAbout}</GoldButton>
                </div>
              ) : null}
            </div>
          </div>

          <NnCardGrid className="mt-10">
            {others.map((member) => (
              <NnCard
                key={member.name}
                title={member.name}
                body={
                  <>
                    <p className="text-xs font-medium uppercase tracking-wide text-ink/55">
                      {member.role}
                    </p>
                    <p className="mt-3">{member.bio}</p>
                    <p className="mt-4 text-xs text-ink/45">Named profiles publishing soon.</p>
                  </>
                }
                footer={
                  member.href ? (
                    <Link href={member.href} className="nn-text-link inline-block text-sm">
                      {member.hrefLabel} →
                    </Link>
                  ) : undefined
                }
              />
            ))}
          </NnCardGrid>

          <div className="mt-12 flex flex-col items-center gap-2">
            <Link href="/discovery" className="nn-text-link text-sm">
              {NN_TEAM.ctaDiscovery} →
            </Link>
          </div>
        </PageContainer>
      </PageSection>
    </NeuroNourishShell>
  );
}
