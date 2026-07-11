import { GoldButton } from "@/components/neuronourish/shell";
import { CheckList } from "@/components/neuronourish/content/highlight-list";
import { PageContainer, PageSection } from "@/components/neuronourish/content/container";
import { QuizPreviewVisual } from "@/components/neuronourish/content/quiz-preview-visual";
import { SectionHeader } from "@/components/neuronourish/content/section-header";
import { NN_QUIZ_FOLD } from "@/lib/neuronourish-copy";

export function QuizFoldSection({ className = "" }: { className?: string }) {
  return (
    <PageSection id="quiz" className={`nn-quiz-fold border-t border-linen/80 ${className}`}>
      <PageContainer width="xl">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <SectionHeader
              eyebrow={NN_QUIZ_FOLD.eyebrow}
              headline={NN_QUIZ_FOLD.headline}
              subtext={NN_QUIZ_FOLD.subtext}
            />
            <CheckList items={NN_QUIZ_FOLD.benefits} className="mt-6" />
            <p className="mt-4 text-xs text-ink/50">{NN_QUIZ_FOLD.disclaimer}</p>
            <div className="mt-8 inline-flex flex-col items-center gap-1.5">
              <GoldButton href="/quiz">{NN_QUIZ_FOLD.cta}</GoldButton>
              <span className="text-center text-xs text-ink/55">{NN_QUIZ_FOLD.ctaHint}</span>
            </div>
          </div>
          <QuizPreviewVisual />
        </div>
      </PageContainer>
    </PageSection>
  );
}
