import { LOST_REASONS } from "@/lib/case-stages";

const WINBACK_LOST_REASONS = new Set<string>([
  "No response",
  "Funding no longer needed",
]);

export function canEnrollWinback(lostReason: string | null | undefined): boolean {
  return Boolean(lostReason && WINBACK_LOST_REASONS.has(lostReason));
}

export function suggestWinbackForLostReason(lostReason: string): boolean {
  return lostReason === LOST_REASONS[0];
}

export const WINBACK_SEQUENCE_ID = "lost-standard";
