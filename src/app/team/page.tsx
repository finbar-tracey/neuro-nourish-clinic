import Link from "next/link";
import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { NnCard, NnCardGrid } from "@/components/neuronourish/content/nn-card";
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

          <NnCardGrid className="mt-12" columns={3}>
            {NN_TEAM.members.map((member) => (
              <NnCard
                key={member.name}
                title={member.name}
                body={
                  <>
                    <p className="text-xs font-medium uppercase tracking-wide text-gold">
                      {member.role}
                    </p>
                    <p className="mt-3">{member.bio}</p>
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
