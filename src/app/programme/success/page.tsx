import Link from "next/link";
import { HighlightList, PageContainer } from "@/components/neuronourish/content";
import { GoldButton, NeuroNourishShell, SectionEyebrow } from "@/components/neuronourish/shell";
import { NN_SUCCESS } from "@/lib/neuronourish-copy";

export default function ProgrammeSuccessPage() {
  const copy = NN_SUCCESS.programme;

  return (
    <NeuroNourishShell>
      <PageContainer width="md" className="py-16 text-center">
        <SectionEyebrow>{copy.eyebrow}</SectionEyebrow>
        <h1 className="mt-3 font-display text-3xl text-deep-slate">{copy.headline}</h1>
        <p className="mt-4 text-sm leading-relaxed text-ink/75">{copy.subtext}</p>
        <div className="mx-auto mt-6 max-w-sm text-left">
          <HighlightList items={copy.highlights} />
        </div>
        <GoldButton href="/how-the-app-works" className="mt-8">
          {copy.ctaApp}
        </GoldButton>
        <Link href="/discovery" className="mt-4 block text-sm text-slate-blue underline">
          {copy.ctaDiscovery}
        </Link>
      </PageContainer>
    </NeuroNourishShell>
  );
}
