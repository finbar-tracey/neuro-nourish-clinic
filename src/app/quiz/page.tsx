import dynamic from "next/dynamic";
import { PageContainer } from "@/components/neuronourish/content";
import { NeuroNourishShell } from "@/components/neuronourish/shell";
import { buildNeuronourishMetadata } from "@/lib/neuronourish-seo";

export const metadata = buildNeuronourishMetadata("quiz");

function QuizLoadingFallback() {
  return (
    <NeuroNourishShell>
      <PageContainer width="md" className="py-16">
        <div className="animate-pulse space-y-4" aria-hidden>
          <div className="h-4 w-24 rounded bg-linen" />
          <div className="h-10 w-2/3 rounded bg-linen" />
          <div className="h-4 w-full rounded bg-linen/70" />
          <div className="mt-8 h-12 w-full rounded-full bg-linen" />
        </div>
        <p className="sr-only">Loading brain health quiz…</p>
      </PageContainer>
    </NeuroNourishShell>
  );
}

const BrainHealthQuiz = dynamic(
  () => import("@/components/neuronourish/brain-health-quiz").then((m) => m.BrainHealthQuiz),
  { loading: () => <QuizLoadingFallback /> },
);

export default function QuizPage() {
  return <BrainHealthQuiz />;
}
