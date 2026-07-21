"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Brain,
  Heart,
  Lock,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { NN_CONSUMER_ONBOARDING_EXPANDED } from "@/lib/neuronourish-copy";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3;

const copy = NN_CONSUMER_ONBOARDING_EXPANDED;

function dashboardPath() {
  return "/dashboard";
}

function ConsumerOnboardingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadId = useMemo(() => searchParams.get("leadId") ?? "", [searchParams]);
  const email = useMemo(() => searchParams.get("email") ?? "", [searchParams]);

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [password, setPassword] = useState("");
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [syncTokens, setSyncTokens] = useState({
    sleep: false,
    movement: false,
    messaging: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const stageLabel =
    currentStep === 1
      ? copy.screen1.stageLabel
      : currentStep === 2
        ? copy.screen2.stageLabel
        : copy.screen3.stageLabel;

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return;

    if (!leadId && !email) {
      setAuthError(
        "Missing patient profile link. Return from your assessment confirmation email.",
      );
      return;
    }

    setIsSubmitting(true);
    setAuthError(null);

    try {
      const response = await fetch("/api/onboarding/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: leadId || undefined,
          email: email || undefined,
          password,
        }),
      });

      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error ?? "Account initialization security barrier hit.");
      }

      setCurrentStep(2);
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : "Failed to initialize account credentials. Please retry.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreferenceSubmit = async () => {
    if (currentStep === 2) {
      if (!selectedGoal) return;
      setCurrentStep(3);
      return;
    }

    if (!leadId && !email) {
      router.push(dashboardPath());
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: leadId || undefined,
          email: email || undefined,
          primaryConcern: selectedGoal,
          syncTokens,
        }),
      });

      const payload = (await response.json()) as { error?: string; leadId?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Data persistence drop.");
      }

      const loginResponse = await fetch("/api/onboarding/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: (payload.leadId ?? leadId) || undefined,
          email: email || undefined,
          password,
        }),
      });

      if (!loginResponse.ok) {
        console.warn("Onboarding complete but automatic session provisioning failed.");
      }

      router.push(dashboardPath());
    } catch (error) {
      console.error("Failed to commit profile metrics to tracking layout:", error);
      router.push(dashboardPath());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory p-6 font-sans text-ink">
      <div className="w-full max-w-xl space-y-6 overflow-hidden rounded-2xl border border-mist/60 bg-white p-8 shadow-xl">
        <div className="flex items-center justify-between border-b border-linen/80 pb-4">
          <div>
            <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-widest text-gold">
              {stageLabel}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-ink/50">
              Step {currentStep} of 3
            </span>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={cn(
                  "h-1.5 w-8 rounded-full transition-all duration-300",
                  currentStep >= step ? "bg-gold" : "bg-linen",
                )}
              />
            ))}
          </div>
        </div>

        {currentStep === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-6">
            <div className="space-y-2">
              <h1 className="font-display text-2xl font-bold tracking-wide text-deep-slate sm:text-3xl">
                {copy.screen1.headline}
              </h1>
              <p className="text-sm leading-relaxed text-ink/70">{copy.screen1.subtext}</p>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="onboarding-password"
                className="block text-xs font-bold uppercase tracking-wider text-deep-slate"
              >
                {copy.screen1.inputLabel}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-ink/40" />
                <input
                  id="onboarding-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={copy.screen1.inputPlaceholder}
                  className="w-full rounded-lg border border-mist/80 bg-ivory py-3 pl-10 pr-4 text-sm font-medium text-ink transition focus:border-gold focus:outline-none"
                />
              </div>
              <span className="block text-[11px] text-ink/60">{copy.screen1.hintText}</span>
            </div>

            {authError ? (
              <p
                className="rounded border border-red-500/10 bg-red-500/5 p-2 text-center text-xs font-medium text-red-600"
                role="alert"
              >
                {authError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={password.length < 8 || isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-gold bg-deep-slate py-3 font-semibold text-white transition hover:bg-deep-slate/90 disabled:pointer-events-none disabled:opacity-50"
            >
              <span>
                {isSubmitting ? "Securing Account…" : copy.screen1.ctaButton}
              </span>
              <ArrowRight className="h-4 w-4 text-gold" />
            </button>
          </form>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="font-display text-2xl font-bold tracking-wide text-deep-slate sm:text-3xl">
                {copy.screen2.headline}
              </h1>
              <p className="text-sm leading-relaxed text-ink/70">{copy.screen2.subtext}</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {copy.screen2.targets.map((target) => {
                const selected = selectedGoal === target.id;
                return (
                  <button
                    key={target.id}
                    type="button"
                    onClick={() => setSelectedGoal(target.id)}
                    className={cn(
                      "flex w-full items-start gap-4 rounded-xl border p-4 text-left transition",
                      selected
                        ? "border-gold bg-gold/5 shadow-sm"
                        : "border-mist/80 bg-white hover:bg-ivory",
                    )}
                  >
                    <Brain
                      className={cn(
                        "mt-0.5 h-5 w-5 shrink-0",
                        selected ? "text-gold" : "text-ink/40",
                      )}
                    />
                    <div>
                      <span className="block text-sm font-bold text-deep-slate">
                        {target.label}
                      </span>
                      <span className="mt-0.5 block text-xs leading-normal text-ink/60">
                        {target.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={handlePreferenceSubmit}
              disabled={!selectedGoal || isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-gold bg-deep-slate py-3 font-semibold text-white transition hover:bg-deep-slate/90 disabled:pointer-events-none disabled:opacity-50"
            >
              <span>{copy.screen2.ctaButton}</span>
              <ArrowRight className="h-4 w-4 text-gold" />
            </button>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="font-display text-2xl font-bold tracking-wide text-deep-slate sm:text-3xl">
                {copy.screen3.headline}
              </h1>
              <p className="text-sm leading-relaxed text-ink/70">{copy.screen3.subtext}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-linen/80 bg-ivory p-4">
                <div className="flex max-w-[80%] items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                  <div>
                    <label
                      htmlFor="sync-sleep"
                      className="block cursor-pointer text-sm font-bold text-deep-slate"
                    >
                      {copy.screen3.toggles.sleep.label}
                    </label>
                    <span className="mt-0.5 block text-xs leading-normal text-ink/60">
                      {copy.screen3.toggles.sleep.description}
                    </span>
                  </div>
                </div>
                <input
                  id="sync-sleep"
                  type="checkbox"
                  checked={syncTokens.sleep}
                  onChange={(e) =>
                    setSyncTokens((prev) => ({ ...prev, sleep: e.target.checked }))
                  }
                  className="h-4 w-4 cursor-pointer accent-gold"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-linen/80 bg-ivory p-4">
                <div className="flex max-w-[80%] items-start gap-3">
                  <Heart className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                  <div>
                    <label
                      htmlFor="sync-movement"
                      className="block cursor-pointer text-sm font-bold text-deep-slate"
                    >
                      {copy.screen3.toggles.movement.label}
                    </label>
                    <span className="mt-0.5 block text-xs leading-normal text-ink/60">
                      {copy.screen3.toggles.movement.description}
                    </span>
                  </div>
                </div>
                <input
                  id="sync-movement"
                  type="checkbox"
                  checked={syncTokens.movement}
                  onChange={(e) =>
                    setSyncTokens((prev) => ({ ...prev, movement: e.target.checked }))
                  }
                  className="h-4 w-4 cursor-pointer accent-gold"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-linen/80 bg-ivory p-4">
                <div className="flex max-w-[80%] items-start gap-3">
                  <MessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                  <div>
                    <label
                      htmlFor="sync-messaging"
                      className="block cursor-pointer text-sm font-bold text-deep-slate"
                    >
                      {copy.screen3.toggles.messaging.label}
                    </label>
                    <span className="mt-0.5 block text-xs leading-normal text-ink/60">
                      {copy.screen3.toggles.messaging.description}
                    </span>
                  </div>
                </div>
                <input
                  id="sync-messaging"
                  type="checkbox"
                  checked={syncTokens.messaging}
                  onChange={(e) =>
                    setSyncTokens((prev) => ({ ...prev, messaging: e.target.checked }))
                  }
                  className="h-4 w-4 cursor-pointer accent-gold"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handlePreferenceSubmit}
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-gold bg-deep-slate py-3 font-semibold text-white transition hover:bg-deep-slate/90 disabled:pointer-events-none disabled:opacity-50"
            >
              <span>
                {isSubmitting ? "Finalizing Profile Setup…" : copy.screen3.ctaButton}
              </span>
              <ShieldCheck className="h-4 w-4 text-gold" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ConsumerOnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ivory p-6 font-sans text-ink">
          <p className="text-sm text-ink/60">Loading onboarding…</p>
        </div>
      }
    >
      <ConsumerOnboardingWizard />
    </Suspense>
  );
}
