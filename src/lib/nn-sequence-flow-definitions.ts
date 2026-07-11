import type { SequenceFlowDef, SequenceFlowStepDef } from "@/lib/sequence-flow-definitions";
import { WINBACK_LONG_SEQUENCE_ID, WINBACK_STANDARD_SCHEDULE, WINBACK_LONG_SCHEDULE } from "@/lib/winback-schedule";
import { WINBACK_SEQUENCE_ID } from "@/lib/winback-eligibility";
import { buildJourneyEmail, SAMPLE_EMAIL_CONTEXT } from "@/lib/journey-emails";
import type { WinbackStep } from "@/lib/winback-schedule";

function waitLabel(day: number, prevDay: number): string | null {
  const gap = day - prevDay;
  if (gap <= 0) return null;
  if (gap < 1) return `Wait ${Math.round(gap * 60)} mins`;
  if (gap === 1) return "Wait 1 day";
  return `Wait ${Math.round(gap)} days`;
}

function stepsFromSubjects(
  subjects: string[],
  delaysHours: number[],
): SequenceFlowStepDef[] {
  let cumulative = 0;
  return subjects.map((label, index) => {
    const delay = delaysHours[index] ?? 0;
    cumulative += delay;
    const prev = index === 0 ? 0 : cumulative - delay;
    const wait =
      index === 0
        ? null
        : delay < 1
          ? `Wait ${Math.round(delay * 60)} mins`
          : delay < 24
            ? `Wait ${Math.round(delay)} hours`
            : waitLabel(Math.round(cumulative / 24), Math.round(prev / 24));
    return {
      step: index + 1,
      day: Math.max(0, Math.round(cumulative / 24)),
      channel: "email" as const,
      label,
      waitLabel: wait,
    };
  });
}

function winbackSteps(schedule: WinbackStep[]): SequenceFlowStepDef[] {
  return schedule.map((entry, index) => {
    const prevDay = index > 0 ? schedule[index - 1]!.day : 0;
    return {
      step: index + 1,
      day: entry.day,
      channel: entry.channel,
      label:
        entry.channel === "email" && entry.emailId
          ? buildJourneyEmail(entry.emailId, SAMPLE_EMAIL_CONTEXT).subject
          : entry.label,
      waitLabel: index === 0 ? null : waitLabel(entry.day, prevDay),
    };
  });
}

/** NeuroNourish nurture sequences — read-only catalog for the workspace viewer. */
export const NN_SEQUENCE_FLOWS: SequenceFlowDef[] = [
  {
    id: "quiz_abandon",
    name: "Quiz abandon recovery",
    description: "3 emails over 72 hours when a lead starts the quiz but does not finish.",
    trigger: "Quiz partial",
    triggerDetail: "Contact captured mid-quiz — funnel stage quiz_partial.",
    queueHref: "/workspace/inbox",
    steps: stepsFromSubjects(
      [
        "Need help finishing your Brain Health Quiz?",
        "Why knowing your cognitive starting point brings peace of mind",
        "The financial plan vs. the brain plan",
      ],
      [1, 24, 72],
    ),
  },
  {
    id: "quiz_complete",
    name: "Quiz complete nurture",
    description: "4 emails after quiz completion — discovery call and assessment offer.",
    trigger: "Quiz completed",
    triggerDetail: "Brain health quiz submitted with score and segment.",
    queueHref: "/workspace/inbox",
    steps: stepsFromSubjects(
      [
        "Your Brain Health Baseline + Next Steps",
        "Why short-term quick-fixes fail the nervous system",
        "Turning clinical biomarker data into brain clarity",
        "Your cognitive reserve is still modifiable",
      ],
      [2 / 60, 48, 96, 144],
    ),
  },
  {
    id: "blood_sugar_newsletter",
    name: "Blood sugar & brain energy series",
    description: "3-part educational series on insulin, cognition, and daily habits.",
    trigger: "Quiz completed",
    triggerDetail: "Enrolled alongside quiz complete nurture.",
    queueHref: "/workspace/inbox",
    steps: stepsFromSubjects(
      [
        "[Part 1] Why your afternoon energy crash is a brain signal",
        "[Part 2] What chronic insulin resistance does to brain networks",
        "[Part 3] Three daily steps to stabilize your cognitive energy",
      ],
      [24, 72, 120],
    ),
  },
  {
    id: "gut_brain_newsletter",
    name: "Gut-brain axis series",
    description: "3-part educational series on digestion, microbiome, and memory.",
    trigger: "Quiz completed",
    triggerDetail: "Enrolled alongside quiz complete nurture.",
    queueHref: "/workspace/inbox",
    steps: stepsFromSubjects(
      [
        "[Part 1] Why your digestive health dictates your memory performance",
        "[Part 2] The silent link between gut bacteria and cognitive aging",
        "[Part 3] Three daily steps to protect your gut-brain axis",
      ],
      [48, 96, 144],
    ),
  },
  {
    id: "onboarding_welcome",
    name: "Onboarding welcome",
    description: "Welcome sequence after the client completes onboarding.",
    trigger: "Onboarding completed",
    triggerDetail: "Portal onboarding wizard finished.",
    queueHref: "/workspace/completions",
    steps: stepsFromSubjects(
      [
        "Welcome to NeuroNourish: Your portal is active",
        "Setting up your daily lifestyle companions",
        "Scheduling your diagnostic consultation review",
      ],
      [5 / 60, 48, 120],
    ),
  },
  {
    id: "missed_discovery_call",
    name: "Missed discovery call",
    description: "Recovery emails when a booked discovery call is missed.",
    trigger: "Discovery no-show",
    triggerDetail: "Calendly no-show or missed discovery slot.",
    queueHref: "/workspace/callbacks",
    steps: stepsFromSubjects(
      [
        "Sorry we missed each other today — NeuroNourish Clinic",
        "Your long-term brain health goals are still worth a conversation",
        "Keeping the door open for your cognitive wellness protocol",
      ],
      [2, 48, 120],
    ),
  },
  {
    id: WINBACK_SEQUENCE_ID,
    name: "Win-back — standard",
    description: "Re-engage lost leads with email + SMS over 30 days.",
    trigger: "Case marked lost",
    triggerDetail: "Manual enroll from case detail when closing a lead.",
    queueHref: "/workspace/re-engagement",
    steps: winbackSteps(WINBACK_STANDARD_SCHEDULE),
  },
  {
    id: WINBACK_LONG_SEQUENCE_ID,
    name: "Win-back — long",
    description: "Gentle re-engagement when a lead is not ready — 3 emails over 90 days.",
    trigger: "Case marked lost",
    triggerDetail: 'Manual enroll when lost reason is "Not ready to proceed".',
    queueHref: "/workspace/re-engagement",
    steps: winbackSteps(WINBACK_LONG_SCHEDULE),
  },
];
