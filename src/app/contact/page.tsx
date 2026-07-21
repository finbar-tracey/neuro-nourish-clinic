import Link from "next/link";
import { ExpressionOfInterestForm } from "@/components/forms/expression-of-interest-form";
import { HighlightList, PageContainer, PageHeader } from "@/components/neuronourish/content";
import { GoldButton, NeuroNourishShell } from "@/components/neuronourish/shell";
import { NN_CONTACT } from "@/lib/neuronourish-copy";
import { buildNeuronourishMetadata } from "@/lib/neuronourish-seo";

export const metadata = buildNeuronourishMetadata("contact");

export default function ContactPage() {
  return (
    <NeuroNourishShell>
      <PageContainer width="sm" className="py-16">
        <PageHeader
          eyebrow={NN_CONTACT.eyebrow}
          headline={NN_CONTACT.headline}
          subtext={NN_CONTACT.subtext}
        />
        <div className="mt-4">
          <HighlightList items={NN_CONTACT.highlights} />
        </div>
        <div className="mt-6 flex flex-col items-start gap-2">
          <GoldButton href="/discovery">Book a discovery call</GoldButton>
          <span className="text-xs text-ink/55">{NN_CONTACT.discoveryHint}</span>
          <p className="mt-2 text-sm text-ink/75">
            <Link href="/quiz" className="nn-text-link">
              {NN_CONTACT.quizLink}
            </Link>
          </p>
        </div>
        <div className="mt-8">
          <ExpressionOfInterestForm />
        </div>
      </PageContainer>
    </NeuroNourishShell>
  );
}
