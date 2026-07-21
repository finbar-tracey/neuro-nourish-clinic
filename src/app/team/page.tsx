import Link from "next/link";
import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { SectionHeader } from "@/components/neuronourish/content/section-header";
import { GoldButton, NeuroNourishShell } from "@/components/neuronourish/shell";
import { NN_TEAM } from "@/lib/neuronourish-copy";
import { buildNeuronourishMetadata } from "@/lib/neuronourish-seo";

export const metadata = buildNeuronourishMetadata("team");

export default function TeamPage() {
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

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {NN_TEAM.members.map((member) => (
              <article
                key={member.name}
                className="relative overflow-hidden rounded-2xl border border-mist bg-white/90 p-6 shadow-sm"
              >
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gold/55" aria-hidden />
                <h3 className="nn-display-card text-slate-blue">{member.name}</h3>
                <p className="mt-2 text-xs font-medium uppercase tracking-wide text-gold">
                  {member.role}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-ink/75">{member.bio}</p>
                {member.href ? (
                  <Link href={member.href} className="nn-text-link mt-4 inline-block text-sm">
                    {member.hrefLabel} →
                  </Link>
                ) : null}
              </article>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center gap-3">
            <GoldButton href="/about">{NN_TEAM.ctaAbout}</GoldButton>
            <Link href="/discovery" className="nn-text-link text-sm">
              {NN_TEAM.ctaDiscovery} →
            </Link>
          </div>
        </PageContainer>
      </PageSection>
    </NeuroNourishShell>
  );
}
