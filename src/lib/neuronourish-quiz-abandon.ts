/**
 * Quiz abandon recovery — idle soft off-ramp to discovery.
 * Kill switch: NEXT_PUBLIC_NN_QUIZ_ABANDON=false
 */

export const NN_QUIZ_ABANDON_MIN_ANSWERS = 3;
export const NN_QUIZ_ABANDON_IDLE_MS = 100_000;
export const NN_QUIZ_ABANDON_RECENT_MS = 5_000;
export const NN_QUIZ_ABANDON_COOLDOWN_DAYS = 7;

const SESSION_KEY = "nn_quiz_abandon_seen";
const COOLDOWN_KEY = "nn_quiz_abandon_cooldown";

export function isQuizAbandonEnabled(): boolean {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_NN_QUIZ_ABANDON === "false") {
    return false;
  }
  return true;
}

export function hasQuizAbandonSessionCap(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return true;
  }
}

export function hasQuizAbandonCooldown(): boolean {
  try {
    const raw = localStorage.getItem(COOLDOWN_KEY);
    if (!raw) return false;
    const until = Number(raw);
    if (!Number.isFinite(until)) return false;
    return Date.now() < until;
  } catch {
    return false;
  }
}

export function markQuizAbandonShown(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
    const until = Date.now() + NN_QUIZ_ABANDON_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(COOLDOWN_KEY, String(until));
  } catch {
    /* ignore */
  }
}

export function buildQuizAbandonDiscoveryHref(opts: {
  step: number;
  answersCount: number;
  leadId?: string;
}): string {
  const params = new URLSearchParams({
    source: "quiz_abandon",
    step: String(opts.step + 1),
    answers: String(opts.answersCount),
  });
  if (opts.leadId) params.set("leadId", opts.leadId);
  return `/discovery?${params.toString()}`;
}

export type QuizAbandonEvent =
  | "quiz_abandon_eligible"
  | "quiz_abandon_shown"
  | "quiz_abandon_continue"
  | "quiz_abandon_book"
  | "quiz_abandon_dismiss";

export function trackQuizAbandonEvent(
  event: QuizAbandonEvent,
  detail: { step: number; answersCount: number; leadId?: string },
): void {
  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("nn:quiz-abandon", { detail: { event, ...detail } }),
      );
    }
  } catch {
    /* ignore */
  }
}
