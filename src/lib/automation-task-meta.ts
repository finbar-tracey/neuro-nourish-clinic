import type { JourneyEmailId } from "@/lib/journey-emails";
import type { WinbackSmsId } from "@/lib/winback-schedule";

export type WinbackTaskMeta = {
  kind: "winback";
  channel: "email" | "sms";
  journeyEmailId?: JourneyEmailId;
  smsId?: WinbackSmsId;
  step: number;
  total: number;
  sequenceId: string;
};

export function winbackEmailTaskTitle(subject: string) {
  return `Win-back email: ${subject}`;
}

export function winbackSmsTaskTitle(label: string) {
  return `Win-back SMS: ${label}`;
}

export function isWinbackSequenceTask(title: string) {
  return title.startsWith("Win-back email:") || title.startsWith("Win-back SMS:");
}

/** @deprecated */
export function isWinbackTaskTitle(title: string) {
  return isWinbackSequenceTask(title);
}

export function isNurtureTaskTitle(title: string) {
  return title.startsWith("Send nurture email:");
}

export function encodeWinbackTaskMeta(meta: WinbackTaskMeta): string {
  return JSON.stringify(meta);
}

export function parseWinbackTaskMeta(description: string | null | undefined): WinbackTaskMeta | null {
  if (!description?.startsWith("{")) return null;
  try {
    const parsed = JSON.parse(description) as WinbackTaskMeta;
    if (parsed.kind !== "winback") return null;
    if (parsed.channel === "email" && !parsed.journeyEmailId) return null;
    if (parsed.channel === "sms" && !parsed.smsId) return null;
    return parsed;
  } catch {
    return null;
  }
}
