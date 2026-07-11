"use client";

import { useEffect, useMemo, useState } from "react";
import { NN_QUIZ_FOLD } from "@/lib/neuronourish-copy";
import {
  getQuizPreviewSteps,
  NN_QUIZ_QUESTION_COUNT,
} from "@/lib/neuronourish-quiz-data";

export function QuizPreviewVisual() {
  const steps = useMemo(
    () => getQuizPreviewSteps(NN_QUIZ_FOLD.previewQuestionCount),
    [],
  );
  const [active, setActive] = useState(0);
  const [selectedOption, setSelectedOption] = useState(0);
  const [mounted, setMounted] = useState(false);
  const step = steps[active] ?? steps[0];

  useEffect(() => {
    setMounted(true);
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || steps.length === 0) return;

    const tick = setInterval(() => {
      setActive((i) => {
        const next = (i + 1) % steps.length;
        setSelectedOption(0);
        return next;
      });
    }, 3400);
    return () => clearInterval(tick);
  }, [steps.length]);

  if (!step) return null;

  return (
    <div className="rounded-2xl border border-mist bg-linen/25 p-6 shadow-sm sm:p-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="nn-badge">{NN_QUIZ_FOLD.badge}</span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-ink/45">
          {NN_QUIZ_FOLD.previewLabel}
        </span>
      </div>

      <div className="rounded-xl border border-mist bg-ivory p-4">
        <div className="flex items-center justify-between gap-3 text-[10px] font-medium uppercase tracking-wider text-ink/50">
          <span className="truncate">{step.section}</span>
          <span className="shrink-0">
            Q {step.questionNumber} / {NN_QUIZ_QUESTION_COUNT}
          </span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-linen">
          <div
            className="h-full rounded-full bg-gold transition-all duration-700 ease-out"
            style={{ width: mounted ? `${step.progress}%` : "0%" }}
          />
        </div>
        <p
          key={step.id}
          className="nn-display-card mt-4 text-slate-blue nn-quiz-question"
        >
          {step.question}
        </p>
        <div className="mt-4 space-y-2" role="list" aria-label="Sample answer options">
          {step.options.map((opt, i) => (
            <div
              key={`${step.id}-${opt}`}
              role="listitem"
              className={`rounded-lg border px-3 py-2 text-sm leading-snug transition-colors duration-300 ${
                i === selectedOption
                  ? "border-gold bg-gold/10 text-deep-slate"
                  : "border-mist text-ink/70"
              }`}
            >
              {opt}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-6 text-center">
        <div>
          <p className="font-display text-3xl text-slate-blue">
            {NN_QUIZ_FOLD.previewStatMinutes}
          </p>
          <p className="text-xs text-ink/60">{NN_QUIZ_FOLD.previewStatMinutesLabel}</p>
        </div>
        <div className="h-10 w-px bg-mist" aria-hidden />
        <div>
          <p className="font-display text-3xl text-slate-blue">{NN_QUIZ_QUESTION_COUNT}</p>
          <p className="text-xs text-ink/60">{NN_QUIZ_FOLD.previewStatQuestionsLabel}</p>
        </div>
      </div>
      <p className="mt-6 text-center text-xs leading-relaxed text-ink/50">
        {NN_QUIZ_FOLD.disclaimer}
      </p>
    </div>
  );
}
