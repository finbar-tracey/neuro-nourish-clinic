import Link from "next/link";
import { ExpressionOfInterestForm } from "@/components/forms/expression-of-interest-form";
import { HighlightList, PageContainer, PageHeader } from "@/components/neuronourish/content";
import { NeuroNourishShell } from "@/components/neuronourish/shell";
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
        <p className="mt-4 text-sm text-ink/75">
          <Link href="/quiz" className="text-slate-blue underline">
            {NN_CONTACT.quizLink}
          </Link>
        </p>
        <div className="mt-8">
          <ExpressionOfInterestForm />
        </div>
      </PageContainer>
    </NeuroNourishShell>
  );
}
