import {
  NURTURE_EMAIL_SCHEDULE,
  SAMPLE_EMAIL_CONTEXT,
  buildJourneyEmail,
} from "@/lib/journey-emails";
import { WINBACK_SEQUENCE_ID } from "@/lib/winback-eligibility";
import {
  WINBACK_LONG_SCHEDULE,
  WINBACK_LONG_SEQUENCE_ID,
  WINBACK_STANDARD_SCHEDULE,
  type WinbackStep,
} from "@/lib/winback-schedule";

export type SequenceFlowChannel = "email" | "sms";

export type SequenceFlowStepDef = {
  step: number;
  day: number;
  channel: SequenceFlowChannel;
  label: string;
  waitLabel: string | null;
};

export type SequenceFlowDef = {
  id: string;
  name: string;
  description: string;
  trigger: string;
  triggerDetail: string;
  queueHref: string | null;
  steps: SequenceFlowStepDef[];
};

function waitLabel(day: number, prevDay: number): string | null {
  const gap = day - prevDay;
  if (gap <= 0) return null;
  if (gap === 1) return "Wait 1 day";
  return `Wait ${gap} days`;
}

function nurtureSteps(): SequenceFlowStepDef[] {
  return NURTURE_EMAIL_SCHEDULE.map((entry, index) => {
    const prevDay = index > 0 ? NURTURE_EMAIL_SCHEDULE[index - 1]!.day : 0;
    return {
      step: index + 1,
      day: entry.day,
      channel: "email",
      label: buildJourneyEmail(entry.id, SAMPLE_EMAIL_CONTEXT).subject,
      waitLabel: index === 0 ? null : waitLabel(entry.day, prevDay),
    };
  });
}

function winbackStepLabel(entry: WinbackStep): string {
  if (entry.channel === "email" && entry.emailId) {
    return buildJourneyEmail(entry.emailId, SAMPLE_EMAIL_CONTEXT).subject;
  }
  return entry.label;
}

function winbackSteps(schedule: WinbackStep[]): SequenceFlowStepDef[] {
  return schedule.map((entry, index) => {
    const prevDay = index > 0 ? schedule[index - 1]!.day : 0;
    return {
      step: index + 1,
      day: entry.day,
      channel: entry.channel,
      label: winbackStepLabel(entry),
      waitLabel: index === 0 ? null : waitLabel(entry.day, prevDay),
    };
  });
}

/** Read-only catalog of multi-step automations (single source of truth for the visual viewer). */
export const SEQUENCE_FLOWS: SequenceFlowDef[] = [
  {
    id: "long_timeframe_nurture",
    name: "Long-timeframe nurture",
    description: "5 marketing emails over 30 days for researching / long-horizon leads.",
    trigger: "Form completed",
    triggerDetail: "Qualified lead selects a long timeframe (researching / 90+ days).",
    queueHref: "/workspace/pipeline",
    steps: nurtureSteps(),
  },
  {
    id: WINBACK_SEQUENCE_ID,
    name: "Win-back — standard",
    description: "Re-engage lost leads (no response, etc.) with email + SMS over 30 days.",
    trigger: "Case marked lost",
    triggerDetail:
      'Manual enroll when closing — eligible reasons: "No response", etc. (not "Funding no longer needed").',
    queueHref: "/workspace/re-engagement",
    steps: winbackSteps(WINBACK_STANDARD_SCHEDULE),
  },
  {
    id: WINBACK_LONG_SEQUENCE_ID,
    name: "Win-back — long",
    description: "Gentle re-engagement when funding is no longer needed — 3 emails over 90 days.",
    trigger: "Case marked lost",
    triggerDetail: 'Manual enroll when lost reason is "Funding no longer needed".',
    queueHref: "/workspace/re-engagement",
    steps: winbackSteps(WINBACK_LONG_SCHEDULE),
  },
];

export function getSequenceFlowDef(id: string): SequenceFlowDef | undefined {
  return SEQUENCE_FLOWS.find((flow) => flow.id === id);
}
