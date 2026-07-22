"use client";

import { useEffect, useId, useRef } from "react";
import Link from "next/link";
import { NN_QUIZ_ABANDON } from "@/lib/neuronourish-copy";

type QuizAbandonSheetProps = {
  open: boolean;
  discoveryHref: string;
  onContinue: () => void;
  onDismiss: () => void;
  onBook: () => void;
};

/**
 * Soft mid-quiz recovery: discovery primary, continue secondary.
 * Desktop: centered dialog. Mobile: bottom sheet.
 */
export function QuizAbandonSheet({
  open,
  discoveryHref,
  onContinue,
  onDismiss,
  onBook,
}: QuizAbandonSheetProps) {
  const titleId = useId();
  const descId = useId();
  const continueRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const t = window.setTimeout(() => continueRef.current?.focus(), 30);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onDismiss();
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open, onDismiss]);

  if (!open) return null;

  return (
    <div className="nn-quiz-abandon fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-deep-slate/45 backdrop-blur-[2px]"
        aria-label="Dismiss"
        onClick={onDismiss}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="nn-quiz-abandon-panel relative z-10 w-full max-w-md rounded-t-2xl border border-mist bg-ivory p-6 shadow-[0_-12px_40px_rgba(26,51,72,0.18)] sm:rounded-2xl sm:p-8"
      >
        <p className="nn-eyebrow text-gold">{NN_QUIZ_ABANDON.eyebrow}</p>
        <h2 id={titleId} className="nn-display-card mt-3 text-slate-blue">
          {NN_QUIZ_ABANDON.headline}
        </h2>
        <p id={descId} className="mt-3 text-sm leading-relaxed text-ink/75">
          {NN_QUIZ_ABANDON.subtext}
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href={discoveryHref}
            className="nn-gold-cta inline-flex min-h-[48px] items-center justify-center rounded-full bg-gold px-6 text-[13px] font-medium text-deep-slate hover:bg-gold/90"
            onClick={onBook}
          >
            {NN_QUIZ_ABANDON.ctaBook}
          </Link>
          <button
            ref={continueRef}
            type="button"
            className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-deep-slate/20 px-6 text-[13px] font-medium text-deep-slate transition hover:bg-linen/40"
            onClick={onContinue}
          >
            {NN_QUIZ_ABANDON.ctaContinue}
          </button>
          <button
            type="button"
            className="nn-text-link mx-auto mt-1 text-sm text-ink/60"
            onClick={onDismiss}
          >
            {NN_QUIZ_ABANDON.ctaLater}
          </button>
        </div>
      </div>
    </div>
  );
}
