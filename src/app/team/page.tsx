import Link from "next/link";
import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { NnCard, NnCardGrid } from "@/components/neuronourish/content/nn-card";
import { SectionHeader } from "@/components/neuronourish/content/section-header";
import { FounderPortrait } from "@/components/neuronourish/content/visual-placeholders";
import { GoldButton, NeuroNourishShell } from "@/components/neuronourish/shell";
import { NN_TEAM } from "@/lib/neuronourish-copy";
import { buildNeuronourishMetadata } from "@/lib/neuronourish-seo";

export const metadata = buildNeuronourishMetadata("team");

function MemberInitials({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[linear-gradient(145deg,var(--brand-deep-slate),color-mix(in_oklab,var(--brand-deep-slate)_70%,var(--brand-deep-violet)))] font-display text-xl text-ivory shadow-[0_8px_20px_rgba(27,58,92,0.18)]"
      aria-hidden
    >
      {initials || "NN"}
    </div>
  );
}

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

          <div className="mx-auto mt-12 flex max-w-3xl flex-col items-center gap-6 rounded-3xl border border-mist/90 bg-white p-6 shadow-[0_12px_32px_rgba(27,58,92,0.1)] sm:gap-8 sm:p-8 md:flex-row md:items-center md:gap-10">
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
                align="center"
                title={member.name}
                body={
                  <>
                    <div className="mb-5">
                      <MemberInitials name={member.name} />
                    </div>
                    <p className="text-xs font-medium uppercase tracking-wide text-ink/55">
                      {member.role}
                    </p>
                    <p className="mt-3">{member.bio}</p>
                    <p className="mt-4 text-xs text-ink/45">Named profiles publishing soon.</p>
                  </>
                }
                footer={
                  member.href ? (
                    <Link
                      href={member.href}
                      className="inline-block text-sm font-medium text-deep-slate underline-offset-3 hover:underline"
                    >
                      {member.hrefLabel} →
                    </Link>
                  ) : undefined
                }
              />
            ))}
          </NnCardGrid>
        </PageContainer>
      </PageSection>
    </NeuroNourishShell>
  );
}
