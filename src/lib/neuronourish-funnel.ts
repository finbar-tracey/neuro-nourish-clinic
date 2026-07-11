/** NeuroNourish consumer funnel stages and commercial config */

export const NN_FUNNEL_STAGES = [
  "eoi_submitted",
  "quiz_started",
  "quiz_partial",
  "quiz_completed",
  "assessment_offered",
  "assessment_purchased",
  "onboarding_started",
  "onboarding_completed",
  "assessment_completed",
  "programme_offered",
  "programme_enrolled",
  "discovery_requested",
  "clinician_briefing_downloaded",
  "b2b_briefing_booked",
  "b2b_briefing_no_show",
  "discovery_no_show",
] as const;

export type NnFunnelStage = (typeof NN_FUNNEL_STAGES)[number];

export const NN_PRICING = {
  assessmentCents: 9000,
  assessmentCurrency: "eur",
  assessmentLabel: "€90",
  programmeCents: 355_000,
  programmeCurrency: "eur",
  programmeLabel: "€3,550",
  assessmentCreditDays: 30,
} as const;

export const NN_EXTERNAL_QUIZ_URL =
  process.env.NEXT_PUBLIC_QUIZ_URL ?? "https://cute-baklava-7fe473.netlify.app/";

export const NN_USE_NATIVE_QUIZ = process.env.NEXT_PUBLIC_NATIVE_QUIZ !== "false";

export function funnelStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    eoi_submitted: "Expression of interest",
    quiz_started: "Quiz started",
    quiz_partial: "Quiz — contact captured",
    quiz_completed: "Quiz completed",
    assessment_offered: "Assessment offered",
    assessment_purchased: "Assessment purchased",
    onboarding_started: "Onboarding — portal credentials set",
    onboarding_completed: "Onboarding complete — programme upgrade track",
    assessment_completed: "Assessment completed",
    programme_offered: "Programme offered",
    programme_enrolled: "Programme enrolled",
    discovery_requested: "Discovery call requested",
    clinician_briefing_downloaded: "Clinical briefing pack — downloaded",
    b2b_briefing_booked: "B2B briefing call booked",
    b2b_briefing_no_show: "B2B briefing call — no-show",
    discovery_no_show: "Discovery call — no-show",
  };
  return labels[stage] ?? stage;
}

export function scoreBand(score: number): "low" | "moderate" | "elevated" {
  if (score >= 75) return "low";
  if (score >= 50) return "moderate";
  return "elevated";
}

export type NnClinicalSegment = "elevated" | "standard";

/**
 * Maps client quiz band labels (low/moderate/elevated) to native CRM segment enums.
 * Scores ≥75 indicate a strong foundation → standard preventative pathway.
 */
export function normalizeClinicalSegment(
  clientScore: number,
  clientSegment?: string | null,
): NnClinicalSegment {
  const sanitized = clientSegment?.toLowerCase().trim();
  if (sanitized === "low") return "standard";
  if (sanitized === "elevated" || sanitized === "moderate" || sanitized === "high") {
    return "elevated";
  }
  if (clientScore >= 75) return "standard";
  return "elevated";
}

export function scoreBandLabel(score: number): string {
  const band = scoreBand(score);
  if (band === "low") return "Strong foundation";
  if (band === "moderate") return "Room to optimise";
  return "Worth exploring further";
}

export function scoreInsight(score: number): string {
  const band = scoreBand(score);
  if (band === "low")
    return "Your responses suggest several habits that support cognitive wellbeing. A structured assessment can help you build on this foundation.";
  if (band === "moderate")
    return "Your responses highlight areas where nutrition, sleep, or lifestyle may be influencing how you feel day to day. Many of these factors can be improved with the right plan.";
  return "Your responses suggest it may be worth exploring your cognitive health more closely. An objective assessment can help clarify your personal risk factors and next steps.";
}
