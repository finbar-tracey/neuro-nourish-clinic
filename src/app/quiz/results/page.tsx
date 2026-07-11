import Link from "next/link";
import { CheckList } from "@/components/neuronourish/content/highlight-list";
import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { QuizResultsPanel } from "@/components/neuronourish/content/quiz-results-panel";
import { NeuroNourishShell } from "@/components/neuronourish/shell";

type Props = {
  searchParams: Promise<{ leadId?: string; score?: string }>;
};

export default async function QuizResultsPage({ searchParams }: Props) {
  const params = await searchParams;
  const score = Math.min(100, Math.max(0, Number(params.score) || 0));
  const leadId = params.leadId ?? "";

  return (
    <NeuroNourishShell>
      <PageSection className="nn-quiz-results-section">
        <PageContainer width="md" className="py-4 sm:py-8">
          <QuizResultsPanel score={score} leadId={leadId} />
        </PageContainer>
      </PageSection>
    </NeuroNourishShell>
  );
}
