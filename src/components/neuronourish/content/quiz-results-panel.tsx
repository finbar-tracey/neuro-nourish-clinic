"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { FunnelStepper } from "@/components/neuronourish/content/funnel-stepper";
import { FunnelTrustBar } from "@/components/neuronourish/content/funnel-trust-bar";
import { GoldButton, SectionEyebrow } from "@/components/neuronourish/shell";
import { NN_QUIZ_REPORT_CTA, NN_QUIZ_RESULTS } from "@/lib/neuronourish-copy";
import {
  NN_QUIZ_ARCHETYPES,
  NN_QUIZ_CATEGORY_LABELS,
  NN_QUIZ_RESULT_STORAGE_KEY,
  fromStoredQuizResult,
  getQuizSegment,
  type QuizCategory,
  type QuizResult,
  type StoredQuizResult,
} from "@/lib/neuronourish-quiz-data";
import {
  formatPhoneInput,
  phoneValidationError,
  normalizePhone,
  isValidPhone,
  phoneDigitHint,
} from "@/lib/phone-ie";

function barColor(pct: number) {
  if (pct >= 70) return "#6E8E6A";
  if (pct >= 50) return "#1B6CA8";
  if (pct >= 30) return "#C28A2C";
  return "#B0492E";
}

function fallbackResult(score: number): QuizResult {
  return {
    score,
    catPercents: {
      context: score,
      cognition: score,
      nutrition: score,
      sleep_stress: score,
      lifestyle: score,
      risk: score,
    },
    segment: getQuizSegment(score),
    archetype: NN_QUIZ_ARCHETYPES.builder,
    insight: null,
  };
}

function withLead(href: string, leadId: string) {
  if (!leadId) return href;
  const join = href.includes("?") ? "&" : "?";
  return `${href}${join}leadId=${encodeURIComponent(leadId)}`;
}

function NextStepsBlock({ leadId }: { leadId: string }) {
  return (
    <div className="mt-8 rounded-2xl border border-mist bg-linen/20 p-6 text-left">
      <h3 className="nn-display-card text-slate-blue">{NN_QUIZ_RESULTS.nextStepsTitle}</h3>
      <p className="mt-2 text-sm text-ink/65">
        After your emailed report, choose one next step when you are ready.
      </p>
      <ol className="mt-4 space-y-3 text-sm text-ink/80">
        {NN_QUIZ_RESULTS.nextSteps.map((step, index) => (
          <li key={step.href} className="flex gap-3">
            <span className="font-display text-gold">{index + 1}</span>
            <Link href={withLead(step.href, leadId)} className="nn-text-link text-left">
              {step.label}
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function QuizResultsPanel({ score, leadId }: { score: number; leadId: string }) {
  const [result, setResult] = useState<QuizResult>(() => fallbackResult(score));
  const [hasStoredResult, setHasStoredResult] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [reportStatus, setReportStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [phoneStatus, setPhoneStatus] = useState<"idle" | "sending" | "saved" | "skipped" | "error">(
    "idle",
  );
  const phoneRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let storedOk = false;
    try {
      const raw = sessionStorage.getItem(NN_QUIZ_RESULT_STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as StoredQuizResult;
        if (stored?.score != null && stored.archetypeKey) {
          setResult(fromStoredQuizResult(stored));
          storedOk = true;
        }
      }
    } catch {
      /* ignore */
    }
    setHasStoredResult(storedOk);
    try {
      setEmail(sessionStorage.getItem("nn-quiz-email") ?? "");
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (reportStatus === "sent" && phoneStatus === "idle") {
      phoneRef.current?.focus();
    }
  }, [reportStatus, phoneStatus]);

  async function emailReport() {
    if (!leadId) {
      setPhoneError("Complete the quiz again to request your report.");
      return;
    }
    setPhoneError(null);
    setReportStatus("sending");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vertical: "neuronourish",
          funnelStage: "quiz_report_request",
          leadId,
          phone: "",
        }),
      });
      setReportStatus(res.ok ? "sent" : "error");
    } catch {
      setReportStatus("error");
    }
  }

  async function savePhoneForCall() {
    if (!leadId) return;
    const pe = phoneValidationError(phone, { required: true });
    if (pe) {
      setPhoneError(pe);
      return;
    }
    if (!consent) {
      setPhoneError("Tick consent if you’d like Emer to call.");
      return;
    }
    setPhoneError(null);
    setPhoneStatus("sending");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vertical: "neuronourish",
          funnelStage: "quiz_report_request",
          leadId,
          phone: normalizePhone(phone),
          consent: true,
        }),
      });
      setPhoneStatus(res.ok ? "saved" : "error");
    } catch {
      setPhoneStatus("error");
    }
  }

  const phoneReady = isValidPhone(phone) && consent;
  const digitHint = phone.trim() ? phoneDigitHint(phone) : NN_QUIZ_REPORT_CTA.phoneHintIdle;
  const arch = result.archetype;
  const showEmpty = hydrated && !hasStoredResult && !leadId;

  const categoryRows = (
    Object.entries(NN_QUIZ_CATEGORY_LABELS) as [QuizCategory, string][]
  ).map(([key, label]) => ({
    key,
    label,
    pct: result.catPercents[key] ?? 0,
  }));

  const reportDone =
    reportStatus === "sent" && (phoneStatus === "saved" || phoneStatus === "skipped");

  if (showEmpty) {
    return (
      <div className="nn-quiz-results mx-auto max-w-lg text-center">
        <FunnelStepper active="quiz" />
        <div className="mt-10">
          <SectionEyebrow>{NN_QUIZ_RESULTS.eyebrow}</SectionEyebrow>
          <h1 className="nn-display-section mt-3 text-slate-blue">
            {NN_QUIZ_RESULTS.emptyHeadline}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink/75">
            {NN_QUIZ_RESULTS.emptyBody}
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <GoldButton href="/quiz">{NN_QUIZ_RESULTS.emptyCtaQuiz}</GoldButton>
            <Link href="/discovery" className="nn-text-link text-sm">
              {NN_QUIZ_RESULTS.emptyCtaDiscovery} →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="nn-quiz-results mx-auto max-w-lg text-center">
      <FunnelStepper active="quiz" leadId={leadId || undefined} />
      <div className="mt-8">
        <SectionEyebrow>Your NeuroNourish Brain Health Score</SectionEyebrow>
        <h1 className="nn-display-section mt-3 text-slate-blue">
          Your brain health results
        </h1>
      </div>

      <div
        className="nn-score-ring mx-auto mt-6"
        style={{ "--score-pct": `${result.score}%` } as CSSProperties}
        role="img"
        aria-label={`Brain health score ${result.score} out of 100. ${result.segment.name}.`}
      >
        <div className="nn-score-ring-inner">
          <span className="nn-score-ring-value text-slate-blue" aria-hidden>
            {result.score}
          </span>
        </div>
      </div>

      <p className="mt-4 text-sm text-ink/60">out of 100</p>
      <span className="nn-badge mt-3">{result.segment.name}</span>

      <h2 className="nn-display-section mt-6 text-slate-blue">{result.segment.headline}</h2>
      <p className="mx-auto mt-3 max-w-md text-base leading-[1.75] text-ink/80">
        {result.segment.body}
      </p>

      <div
        className="mt-10 rounded-2xl border border-mist p-6 text-left shadow-sm"
        style={{ background: arch.bg, borderColor: `${arch.color}33` }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-[0.16em]"
          style={{ color: arch.color }}
        >
          Your brain archetype · {arch.eyebrow}
        </p>
        <h3 className="nn-display-section mt-2 text-slate-blue">{arch.name}</h3>
        <p className="mt-3 text-sm leading-relaxed text-ink/80">{arch.tagline}</p>

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/55">
            What your brain does well
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-ink/80">
            {arch.strengths.map((s) => (
              <li key={s} className="flex gap-2">
                <span style={{ color: arch.color }}>•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/55">
            What&apos;s actually happening
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink/80">{arch.pattern}</p>
        </div>

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/55">The good news</p>
          <p className="mt-2 text-sm leading-relaxed text-ink/80">{arch.goodNews}</p>
        </div>

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/55">
            Brains like yours are common among
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink/80">{arch.sharedWith}</p>
        </div>
      </div>

      {hasStoredResult ? (
        <div className="mt-8 rounded-2xl border border-mist bg-linen/30 p-6 text-left">
          <p className="text-sm font-medium text-slate-blue">Where your score is coming from</p>
          <ul className="mt-4 space-y-3">
            {categoryRows.map((row) => (
              <li key={row.key}>
                <div className="mb-1 flex items-center justify-between text-xs text-ink/70">
                  <span>{row.label}</span>
                  <span className="font-semibold tabular-nums">{row.pct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-linen">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${row.pct}%`, background: barColor(row.pct) }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {result.insight ? (
        <div className="mt-8 rounded-2xl border border-mist bg-linen/30 p-6 text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-blue">
            {result.insight.tag}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink/75">{result.insight.text}</p>
        </div>
      ) : null}

      <div className="mt-8 rounded-2xl border border-gold/40 bg-linen/30 p-6 text-left">
        <h3 className="nn-display-card text-slate-blue">
          {NN_QUIZ_REPORT_CTA.titlePrefix}{" "}
          <span className="text-deep-slate">{arch.name}</span>{" "}
          {NN_QUIZ_REPORT_CTA.titleSuffix}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/75">
          We&apos;ll send you a full breakdown of your archetype, {arch.masterclassPromise}, and an
          invitation to Emer&apos;s next Brain Reset Masterclass — built specifically around brains
          like yours.
        </p>
        {email ? (
          <p className="mt-3 text-sm text-ink/60">
            {NN_QUIZ_REPORT_CTA.sendingToPrefix}{" "}
            <span className="font-medium text-deep-slate">{email}</span>
          </p>
        ) : null}

        {reportStatus === "idle" || reportStatus === "sending" || reportStatus === "error" ? (
          <div className="mt-4 space-y-3">
            <Button
              className="w-full bg-gold text-deep-slate hover:bg-gold/90"
              disabled={reportStatus === "sending"}
              onClick={emailReport}
            >
              {reportStatus === "sending" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                NN_QUIZ_REPORT_CTA.cta
              )}
            </Button>
            {reportStatus === "error" ? (
              <p className="text-sm text-red-700">Could not send — please try again.</p>
            ) : null}
            <p className="text-xs text-ink/50">{NN_QUIZ_REPORT_CTA.privacy}</p>
          </div>
        ) : phoneStatus === "saved" ? (
          <div className="mt-4 space-y-3">
            <p className="rounded-lg border border-mist/80 bg-linen/40 px-3 py-2 text-sm text-ink/80">
              {NN_QUIZ_REPORT_CTA.successWithPhone}
            </p>
            <p className="text-sm leading-relaxed text-ink/70">
              Your email includes your score and the path ahead: Emer&apos;s Brain Reset Masterclass,
              then assessment, then the 12-month programme when you&apos;re ready.
            </p>
          </div>
        ) : phoneStatus === "skipped" ? (
          <div className="mt-4 space-y-3">
            <p className="rounded-lg border border-mist/80 bg-linen/40 px-3 py-2 text-sm text-ink/80">
              {NN_QUIZ_REPORT_CTA.success}
            </p>
            <p className="text-sm leading-relaxed text-ink/70">
              Your email includes your score and the path ahead: Emer&apos;s Brain Reset Masterclass,
              then assessment, then the 12-month programme when you&apos;re ready.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="rounded-lg border border-mist/80 bg-linen/40 px-3 py-2 text-sm text-ink/80">
              {NN_QUIZ_REPORT_CTA.success}
            </p>
            <p className="text-sm leading-relaxed text-ink/70">
              Your email includes your score and the path ahead: Emer&apos;s Brain Reset Masterclass,
              then assessment, then the 12-month programme when you&apos;re ready.
            </p>
            <form
              className="rounded-xl border border-mist bg-linen/20 p-4 text-left"
              onSubmit={(e) => {
                e.preventDefault();
                void savePhoneForCall();
              }}
            >
              <p className="text-sm font-medium text-deep-slate">
                {NN_QUIZ_REPORT_CTA.phoneUpsellTitle}
              </p>
              <p className="mt-1 text-sm text-ink/70">{NN_QUIZ_REPORT_CTA.phoneUpsellBody}</p>
              <div className="mt-3">
                <Label htmlFor="report-phone">{NN_QUIZ_REPORT_CTA.phoneLabel}</Label>
                <Input
                  ref={phoneRef}
                  id="report-phone"
                  value={phone}
                  placeholder={NN_QUIZ_REPORT_CTA.phonePlaceholder}
                  onChange={(e) => {
                    setPhone(formatPhoneInput(e.target.value));
                    setPhoneError(null);
                  }}
                  autoComplete="tel"
                  inputMode="tel"
                  autoCapitalize="off"
                />
                {!phoneError && digitHint ? (
                  <p className="mt-1 text-xs text-ink/50">{digitHint}</p>
                ) : null}
                <FieldError message={phoneError ?? undefined} />
              </div>
              <label className="mt-3 flex gap-3 text-sm text-ink/75">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => {
                    setConsent(e.target.checked);
                    setPhoneError(null);
                  }}
                  className="mt-1"
                />
                {NN_QUIZ_REPORT_CTA.phoneConsent}
              </label>
              <Button
                type="submit"
                className="mt-3 w-full bg-gold text-deep-slate hover:bg-gold/90"
                disabled={phoneStatus === "sending" || !phoneReady}
              >
                {phoneStatus === "sending" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  NN_QUIZ_REPORT_CTA.phoneCta
                )}
              </Button>
              {phoneStatus === "error" ? (
                <p className="mt-2 text-sm text-red-700">Could not save — please try again.</p>
              ) : null}
              <button
                type="button"
                className="nn-text-link mt-3 block w-full text-center text-sm"
                onClick={() => setPhoneStatus("skipped")}
              >
                {NN_QUIZ_REPORT_CTA.phoneSkip}
              </button>
            </form>
          </div>
        )}
      </div>

      {reportDone ? <NextStepsBlock leadId={leadId} /> : null}

      <FunnelTrustBar className="mt-6" />

      <p className="mx-auto mt-6 max-w-md rounded-xl border border-mist/80 bg-linen/20 px-4 py-3 text-xs leading-relaxed text-ink/65">
        {NN_QUIZ_RESULTS.disclaimer}
      </p>

      <Link href="/quiz" className="nn-text-link mt-8 inline-block text-sm">
        ↻ Retake the assessment
      </Link>
    </div>
  );
}
