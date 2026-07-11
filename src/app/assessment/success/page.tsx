import Link from "next/link";
import { HighlightList, PageContainer } from "@/components/neuronourish/content";
import { GoldButton, NeuroNourishShell, SectionEyebrow } from "@/components/neuronourish/shell";
import { NN_SUCCESS } from "@/lib/neuronourish-copy";

type AssessmentSuccessPageProps = {
  searchParams: Promise<{ leadId?: string; session_id?: string }>;
};

export default async function AssessmentSuccessPage({ searchParams }: AssessmentSuccessPageProps) {
  const params = await searchParams;
  const copy = NN_SUCCESS.assessment;
  const onboardingHref = params.leadId
    ? `/onboarding?leadId=${encodeURIComponent(params.leadId)}`
    : "/onboarding";

  return (
    <NeuroNourishShell>
      <PageContainer width="md" className="py-16 text-center">
        <SectionEyebrow>{copy.eyebrow}</SectionEyebrow>
        <h1 className="mt-3 font-display text-3xl text-deep-slate">{copy.headline}</h1>
        <p className="mt-4 text-sm leading-relaxed text-ink/75">{copy.subtext}</p>
        <div className="mx-auto mt-6 max-w-sm text-left">
          <HighlightList items={copy.highlights} />
        </div>
        <GoldButton href={onboardingHref} className="mt-8">
          {copy.ctaOnboarding}
        </GoldButton>
        <Link href="/programme" className="mt-4 block text-sm text-slate-blue underline">
          {copy.ctaProgramme}
        </Link>
        <Link href="/discovery" className="mt-4 block text-sm text-slate-blue underline">
          {copy.ctaDiscovery}
        </Link>
      </PageContainer>
    </NeuroNourishShell>
  );
}
