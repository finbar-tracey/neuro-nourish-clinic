import type { JourneyEmailId } from "@/lib/journey-emails";
import { WINBACK_SEQUENCE_ID } from "@/lib/winback-eligibility";

export type WinbackSmsId = "winback-sms-day-3" | "winback-sms-day-30";

export type WinbackStep = {
  day: number;
  channel: "email" | "sms";
  emailId?: JourneyEmailId;
  smsId?: WinbackSmsId;
  label: string;
};

export const WINBACK_STANDARD_SCHEDULE: WinbackStep[] = [
  { day: 0, channel: "email", emailId: "winback-lost-day-0", label: "Day 0 email" },
  { day: 3, channel: "sms", smsId: "winback-sms-day-3", label: "Day 3 SMS" },
  { day: 7, channel: "email", emailId: "winback-lost-day-7", label: "Day 7 email" },
  { day: 14, channel: "email", emailId: "winback-lost-day-14", label: "Day 14 email" },
  { day: 30, channel: "sms", smsId: "winback-sms-day-30", label: "Day 30 SMS" },
  { day: 30, channel: "email", emailId: "winback-lost-day-30", label: "Day 30 email" },
];

export const WINBACK_LONG_SCHEDULE: WinbackStep[] = [
  { day: 0, channel: "email", emailId: "winback-long-day-0", label: "Day 0 email" },
  { day: 30, channel: "email", emailId: "winback-long-day-30", label: "Day 30 email" },
  { day: 90, channel: "email", emailId: "winback-long-day-90", label: "Day 90 email" },
];

export const WINBACK_LONG_SEQUENCE_ID = "lost-long";

/** @deprecated use WINBACK_STANDARD_SCHEDULE */
export const WINBACK_LOST_EMAIL_SCHEDULE = WINBACK_STANDARD_SCHEDULE.filter(
  (s) => s.channel === "email" && s.emailId,
).map((s) => ({ day: s.day, id: s.emailId! }));

export function resolveWinbackSchedule(lostReason: string | null | undefined): {
  sequenceId: string;
  steps: WinbackStep[];
} {
  if (lostReason === "Funding no longer needed") {
    return { sequenceId: WINBACK_LONG_SEQUENCE_ID, steps: WINBACK_LONG_SCHEDULE };
  }
  return { sequenceId: WINBACK_SEQUENCE_ID, steps: WINBACK_STANDARD_SCHEDULE };
}

export function winbackScheduleSummary(lostReason: string | null | undefined): string {
  const { steps } = resolveWinbackSchedule(lostReason);
  const lastDay = steps[steps.length - 1]?.day ?? 30;
  const emails = steps.filter((s) => s.channel === "email").length;
  const sms = steps.filter((s) => s.channel === "sms").length;
  const parts = [`${steps.length} steps over ${lastDay} days`, `${emails} emails`];
  if (sms > 0) parts.push(`${sms} SMS`);
  return parts.join(" · ");
}
