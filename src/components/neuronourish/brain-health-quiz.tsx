"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { NN_QUIZ_CAPTURE, NN_QUIZ_PAGE } from "@/lib/neuronourish-copy";
import {
  NN_QUIZ_QUESTIONS,
  NN_QUIZ_RESULT_STORAGE_KEY,
  computeQuizResult,
  toStoredQuizResult,
} from "@/lib/neuronourish-quiz-data";
import { normalizeClinicalSegment } from "@/lib/neuronourish-funnel";
import {
  captureTrackingFromUrl,
  loadPersistedTracking,
  trackMetaEvent,
  type TrackingParams,
} from "@/lib/tracking";
import { metaEventId, metaTrackingPayload, fireClientMetaQuizCompleteEvents } from "@/lib/meta-tracking";
import { isValidEmail } from "@/lib/form-validation";
import { OptionPills } from "@/components/forms/option-pills";
import { HighlightList } from "@/components/neuronourish/content";
import { NeuroNourishShell, SectionEyebrow } from "@/components/neuronourish/shell";

const STORAGE_KEY = "nn-quiz-state";

type QuizState = {
  answers: Record<string, number>;
  leadId?: string;
  captured: boolean;
};

export function BrainHealthQuiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [leadId, setLeadId] = useState<string>();
  const [showCapture, setShowCapture] = useState(false);
  const [started, setStarted] = useState(false);
  const [tracking, setTracking] = useState<TrackingParams>({});
  const [capture, setCapture] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    consent: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [finishError, setFinishError] = useState<string | null>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);

  const question = NN_QUIZ_QUESTIONS[step];
  const total = NN_QUIZ_QUESTIONS.length;
  const selectedIndex = question ? answers[question.id] : undefined;

  useEffect(() => {
    const captured = captureTrackingFromUrl();
    setTracking(captured);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: QuizState = JSON.parse(raw);
        setAnswers(saved.answers ?? {});
        setLeadId(saved.leadId);
        if (saved.captured || Object.keys(saved.answers ?? {}).length > 0) {
          setStarted(true);
          const answered = Object.keys(saved.answers ?? {}).length;
          const resumeStep = Math.min(answered, total - 1);
          setStep(resumeStep);
          // Capture only after all questions — if finished without lead, show end gate
          if (answered >= total && !saved.leadId) {
            setShowCapture(true);
          }
        }
      }
    } catch {
      /* ignore */
    }
    const startEventId = metaEventId("quiz-start");
    fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vertical: "neuronourish",
        funnelStage: "quiz_started",
        ...captureTrackingFromUrl(),
        ...metaTrackingPayload(startEventId),
      }),
    }).catch(() => {});
    trackMetaEvent("ViewContent", { content_name: "Brain Health Quiz" }, { eventId: startEventId });
  }, [total]);

  useEffect(() => {
    if (showCapture) {
      firstNameRef.current?.focus();
    }
  }, [showCapture]);

  function persist(state: QuizState) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function selectOption(optionIndex: number) {
    if (!question || submitting) return;
    setFinishError(null);
    const next = { ...answers, [question.id]: optionIndex };
    setAnswers(next);
    persist({ answers: next, leadId, captured: Boolean(leadId) });

    if (step < total - 1) {
      setStep(step + 1);
      return;
    }

    void finishQuiz(next);
  }

  function goBack() {
    if (showCapture) {
      setShowCapture(false);
      setCaptureError(null);
      setStep(total - 1);
      return;
    }
    if (step > 0) setStep(step - 1);
  }

  function validateCapture() {
    const next: Record<string, string> = {};
    if (!capture.firstName.trim()) next.firstName = "Required";
    if (!isValidEmail(capture.email)) next.email = "Valid email required";
    if (!capture.consent) next.consent = "Consent required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submitCapture() {
    if (!validateCapture()) return;
    setSubmitting(true);
    setCaptureError(null);
    try {
      const captureEventId = metaEventId("quiz-capture");
      const trackingPayload = Object.fromEntries(
        Object.entries({ ...loadPersistedTracking(), ...tracking }).filter(
          ([, value]) => typeof value === "string" && value.trim().length > 0,
        ),
      );
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vertical: "neuronourish",
          funnelStage: "quiz_partial",
          firstName: capture.firstName.trim(),
          lastName: "",
          email: capture.email.trim().toLowerCase(),
          phone: "",
          consent: true,
          quizProgress: total,
          ...(leadId ? { leadId } : {}),
          ...trackingPayload,
          ...metaTrackingPayload(captureEventId),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        leadId?: string;
        error?: string;
        errors?: Record<string, string>;
      };
      if (!res.ok || !json.leadId) {
        const fieldError = json.errors
          ? Object.values(json.errors).filter(Boolean)[0]
          : null;
        setCaptureError(fieldError || json.error || NN_QUIZ_CAPTURE.error);
        return;
      }
      setLeadId(json.leadId);
      setShowCapture(false);
      persist({ answers, leadId: json.leadId, captured: true });
      try {
        sessionStorage.setItem("nn-quiz-email", capture.email.trim().toLowerCase());
        sessionStorage.setItem("nn-quiz-first-name", capture.firstName.trim());
      } catch {
        /* ignore */
      }
      trackMetaEvent("Lead", { content_name: "Quiz contact capture" }, {
        eventId: captureEventId,
      });
      await finishQuiz(answers, json.leadId);
    } catch {
      setCaptureError(NN_QUIZ_CAPTURE.error);
    } finally {
      setSubmitting(false);
    }
  }

  async function finishQuiz(finalAnswers: Record<string, number>, resolvedLeadId?: string) {
    const id = resolvedLeadId ?? leadId;
    if (!id) {
      setShowCapture(true);
      return;
    }
    setSubmitting(true);
    setFinishError(null);
    const result = computeQuizResult(finalAnswers);
    const segment = normalizeClinicalSegment(
      result.score,
      result.score < 50 ? "elevated" : result.score < 75 ? "moderate" : "low",
    );
    const eventId = metaEventId("quiz-complete", id);
    try {
      sessionStorage.setItem(
        NN_QUIZ_RESULT_STORAGE_KEY,
        JSON.stringify(toStoredQuizResult(result)),
      );
    } catch {
      /* ignore */
    }
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vertical: "neuronourish",
          funnelStage: "quiz_completed",
          leadId: id,
          quizScore: result.score,
          quizAnswers: finalAnswers,
          segment,
          archetypeKey: result.archetype.key,
          archetypeName: result.archetype.name,
          ...tracking,
          ...metaTrackingPayload(eventId),
        }),
      });
      if (res.ok) {
        fireClientMetaQuizCompleteEvents(id, result.score, eventId);
        localStorage.removeItem(STORAGE_KEY);
        window.location.href = `/quiz/results?leadId=${id}&score=${result.score}`;
        return;
      }
      setFinishError("Couldn’t save your score — tap your last answer again.");
    } catch {
      setFinishError("Couldn’t save your score — check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (showCapture) {
    return (
      <NeuroNourishShell>
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-ink/55">
            <span>{NN_QUIZ_CAPTURE.progressLabel}</span>
            <span className="font-medium text-slate-blue">Almost there</span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-linen">
            <div className="h-full bg-gold transition-all" style={{ width: "100%" }} />
          </div>

          <div className="mt-10 text-center">
            <SectionEyebrow>{NN_QUIZ_CAPTURE.eyebrow}</SectionEyebrow>
            <h2 className="mt-3 font-display text-2xl text-deep-slate sm:text-3xl">
              {NN_QUIZ_CAPTURE.headline}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink/75">
              {NN_QUIZ_CAPTURE.subtext}
            </p>
          </div>

          <form
            className="mx-auto mt-8 max-w-md space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void submitCapture();
            }}
          >
            <div>
              <Label htmlFor="fn">First name</Label>
              <Input
                ref={firstNameRef}
                id="fn"
                value={capture.firstName}
                onChange={(e) => setCapture({ ...capture, firstName: e.target.value })}
                autoComplete="given-name"
                autoCapitalize="words"
              />
              <FieldError message={errors.firstName} />
            </div>
            <div>
              <Label htmlFor="em">Email</Label>
              <Input
                id="em"
                type="email"
                value={capture.email}
                onChange={(e) => setCapture({ ...capture, email: e.target.value })}
                autoComplete="email"
                inputMode="email"
              />
              <FieldError message={errors.email} />
            </div>
            <label className="flex gap-3 text-left text-sm text-ink/80">
              <input
                type="checkbox"
                checked={capture.consent}
                onChange={(e) => setCapture({ ...capture, consent: e.target.checked })}
                className="mt-1"
              />
              {NN_QUIZ_CAPTURE.consent}
            </label>
            <FieldError message={errors.consent} />
            {captureError ? <p className="text-sm text-red-700">{captureError}</p> : null}
            <Button
              type="submit"
              className="w-full bg-gold text-deep-slate hover:bg-gold/90"
              disabled={submitting}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : NN_QUIZ_CAPTURE.cta}
            </Button>
            <div className="flex items-center justify-between gap-3">
              <Button type="button" variant="outline" onClick={goBack} disabled={submitting}>
                {NN_QUIZ_CAPTURE.backLabel}
              </Button>
              <p className="text-xs text-ink/50">{NN_QUIZ_CAPTURE.fieldsHint}</p>
            </div>
          </form>
        </div>
      </NeuroNourishShell>
    );
  }

  if (!started) {
    return (
      <NeuroNourishShell>
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
          <SectionEyebrow>{NN_QUIZ_PAGE.eyebrow}</SectionEyebrow>
          <h1 className="mt-3 text-center font-display text-3xl text-deep-slate sm:text-4xl">
            {NN_QUIZ_PAGE.headline}
          </h1>
          <p className="mt-3 text-center text-base leading-relaxed text-ink/75">
            {NN_QUIZ_PAGE.subtext}
          </p>
          <div className="mx-auto mt-6 max-w-md">
            <HighlightList items={NN_QUIZ_PAGE.highlights} />
          </div>
          <div className="mt-10 flex justify-center">
            <Button
              className="bg-gold px-8 text-deep-slate hover:bg-gold/90"
              onClick={() => setStarted(true)}
            >
              Begin the assessment
            </Button>
          </div>
          <p className="mt-8 text-center text-xs text-ink/50">{NN_QUIZ_PAGE.disclaimer}</p>
        </div>
      </NeuroNourishShell>
    );
  }

  return (
    <NeuroNourishShell>
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="flex items-center justify-between text-xs uppercase tracking-wide text-ink/55">
          <span>
            Question {step + 1} of {total}
          </span>
          <span className="font-medium text-slate-blue">{question?.section}</span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-linen">
          <div
            className="h-full bg-gold transition-all"
            style={{ width: `${((step + 1) / total) * 100}%` }}
          />
        </div>

        {question ? (
          <div className="mt-10">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-blue">
              {question.section}
            </p>
            <h2 className="mt-3 text-center font-display text-2xl text-deep-slate sm:text-3xl">
              {question.prompt}
            </h2>
            {question.note ? (
              <p className="mx-auto mt-4 max-w-xl rounded-lg bg-linen/50 px-4 py-3 text-center text-sm italic text-ink/70">
                {question.note}
              </p>
            ) : null}
            <OptionPills
              className="mt-8"
              columns={1}
              options={question.options.map((o, idx) => ({
                value: String(idx),
                label: o.label,
              }))}
              value={selectedIndex != null ? String(selectedIndex) : ""}
              onChange={(v) => selectOption(Number(v))}
            />
            <div className="mt-8 flex items-center justify-between gap-3">
              {step > 0 ? (
                <Button variant="outline" onClick={goBack}>
                  ← Back
                </Button>
              ) : (
                <span />
              )}
              {submitting ? (
                <p className="flex items-center gap-2 text-sm text-ink/60">
                  <Loader2 className="h-4 w-4 animate-spin" /> Calculating your score…
                </p>
              ) : null}
            </div>
            {finishError ? <p className="mt-4 text-center text-sm text-red-700">{finishError}</p> : null}
          </div>
        ) : null}

        <p className="mt-12 text-center text-xs text-ink/50">
          {NN_QUIZ_PAGE.disclaimer}{" "}
          <Link href="/privacy" className="underline">
            Privacy
          </Link>
        </p>
      </div>
    </NeuroNourishShell>
  );
}
