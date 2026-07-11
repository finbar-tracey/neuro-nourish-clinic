import type { Lead, Task } from "@/generated/prisma/client";
import {
  isNurtureTaskTitle,
  isWinbackSequenceTask,
  parseWinbackTaskMeta,
} from "@/lib/automation-task-meta";
import { WINBACK_SEQUENCE_ID } from "@/lib/winback-eligibility";
import { NURTURE_EMAIL_SCHEDULE } from "@/lib/journey-emails";
import { WINBACK_LONG_SEQUENCE_ID } from "@/lib/winback-schedule";
import {
  SEQUENCE_FLOWS,
  type SequenceFlowDef,
  type SequenceFlowStepDef,
} from "@/lib/sequence-flow-definitions";
import { NN_SEQUENCE_FLOWS } from "@/lib/nn-sequence-flow-definitions";
import { isNeuronourish } from "@/lib/vertical-config";

const MAX_LEADS_PER_STEP = 8;
const MAX_EXIT_LEADS = 6;

export type StepLeadRef = {
  id: string;
  name: string;
  dueAt: string | null;
  status: "waiting" | "paused";
};

export type SequenceStepFunnel = SequenceFlowStepDef & {
  waiting: number;
  paused: number;
  passed: number;
  dueToday: number;
  nextDueAt: string | null;
  leads: StepLeadRef[];
  leadsOverflow: number;
};

export type SequenceFlowFunnel = {
  id: string;
  name: string;
  description: string;
  trigger: string;
  triggerDetail: string;
  queueHref: string | null;
  enrolled: number;
  active: number;
  paused: number;
  completed: number;
  stopped: number;
  dueToday: number;
  steps: SequenceStepFunnel[];
  completedLeads: Array<{ id: string; name: string }>;
  stoppedLeads: Array<{ id: string; name: string }>;
};

export type SequenceFunnelOverview = {
  totalEnrolled: number;
  totalActive: number;
  totalPaused: number;
  totalDueToday: number;
  totalCompleted: number;
  totalStopped: number;
};

function leadName(lead: Lead) {
  return `${lead.firstName} ${lead.lastName}`.trim();
}

function sortTasksByDue(tasks: Task[]) {
  return [...tasks].sort(
    (a, b) => (a.dueDate?.getTime() ?? 0) - (b.dueDate?.getTime() ?? 0),
  );
}

function isDueToday(date: Date, now = new Date()) {
  const london = (d: Date) =>
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  return london(date) === london(now);
}

function nextWinbackTask(
  leadId: string,
  tasks: Task[],
): { step: number; dueAt: Date | null } | null {
  const pending = sortTasksByDue(
    tasks.filter((t) => t.leadId === leadId && !t.completed && isWinbackSequenceTask(t.title)),
  );
  const meta = parseWinbackTaskMeta(pending[0]?.description);
  if (!meta?.step) return null;
  return { step: meta.step, dueAt: pending[0]?.dueDate ?? null };
}

function nurtureNextTask(
  leadId: string,
  tasks: Task[],
): { step: number; dueAt: Date | null } | null {
  const pending = sortTasksByDue(
    tasks.filter((t) => t.leadId === leadId && !t.completed && isNurtureTaskTitle(t.title)),
  );
  if (pending.length === 0) return null;
  return {
    step: NURTURE_EMAIL_SCHEDULE.length - pending.length + 1,
    dueAt: pending[0]?.dueDate ?? null,
  };
}

function emptyStepStats(def: SequenceFlowDef): SequenceStepFunnel[] {
  return def.steps.map((step) => ({
    ...step,
    waiting: 0,
    paused: 0,
    passed: 0,
    dueToday: 0,
    nextDueAt: null,
    leads: [],
    leadsOverflow: 0,
  }));
}

type StepBucket = {
  waiting: StepLeadRef[];
  paused: StepLeadRef[];
};

function initBuckets(def: SequenceFlowDef): StepBucket[] {
  return def.steps.map(() => ({ waiting: [], paused: [] }));
}

function pushToBucket(
  buckets: StepBucket[],
  stepIndex: number,
  lead: Lead,
  kind: "waiting" | "paused",
  dueAt: Date | null,
) {
  const bucket = buckets[stepIndex];
  if (!bucket) return;
  const ref: StepLeadRef = {
    id: lead.id,
    name: leadName(lead),
    dueAt: dueAt?.toISOString() ?? null,
    status: kind,
  };
  bucket[kind].push(ref);
}

function finalizeSteps(
  def: SequenceFlowDef,
  buckets: StepBucket[],
  passedByStep: number[],
): SequenceStepFunnel[] {
  return def.steps.map((step, index) => {
    const waitingRefs = buckets[index]?.waiting ?? [];
    const pausedRefs = buckets[index]?.paused ?? [];
    const allRefs = [...waitingRefs, ...pausedRefs];
    const shown = allRefs.slice(0, MAX_LEADS_PER_STEP);

    const dueToday = waitingRefs.filter((l) => l.dueAt && isDueToday(new Date(l.dueAt))).length;
    const nextDue = waitingRefs
      .map((l) => (l.dueAt ? new Date(l.dueAt) : null))
      .filter((d): d is Date => d != null)
      .sort((a, b) => a.getTime() - b.getTime())[0];

    return {
      ...step,
      waiting: waitingRefs.length,
      paused: pausedRefs.length,
      passed: passedByStep[index] ?? 0,
      dueToday,
      nextDueAt: nextDue?.toISOString() ?? null,
      leads: shown,
      leadsOverflow: Math.max(0, allRefs.length - shown.length),
    };
  });
}

function nurtureProgress(leadId: string, tasks: Task[]): number {
  const pending = tasks.filter(
    (t) => t.leadId === leadId && !t.completed && isNurtureTaskTitle(t.title),
  ).length;
  return NURTURE_EMAIL_SCHEDULE.length - pending;
}

function buildPassedCounts(stepCount: number, progressValues: number[]): number[] {
  const passed = Array.from({ length: stepCount }, () => 0);
  for (const progress of progressValues) {
    for (let i = 0; i < Math.min(progress, stepCount); i++) {
      passed[i]++;
    }
  }
  return passed;
}

function buildNurtureFunnel(
  def: SequenceFlowDef,
  leads: Lead[],
  tasks: Task[],
): SequenceFlowFunnel {
  const buckets = initBuckets(def);
  let enrolled = 0;
  let active = 0;
  let completed = 0;
  let stopped = 0;
  let dueToday = 0;
  const progressValues: number[] = [];
  const completedLeads: Array<{ id: string; name: string }> = [];
  const stoppedLeads: Array<{ id: string; name: string }> = [];

  for (const lead of leads) {
    if (!lead.nurtureEnrolled) continue;

    const pendingNurture = tasks.some(
      (t) => t.leadId === lead.id && !t.completed && isNurtureTaskTitle(t.title),
    );
    const inFollowUp = lead.status === "FOLLOW_UP";

    if (!inFollowUp && !pendingNurture) {
      if (lead.winbackEnrolled || lead.status === "LOST") {
        stopped++;
        if (stoppedLeads.length < MAX_EXIT_LEADS) {
          stoppedLeads.push({ id: lead.id, name: leadName(lead) });
        }
      }
      continue;
    }

    enrolled++;

    if (!pendingNurture && inFollowUp) {
      completed++;
      progressValues.push(def.steps.length);
      if (completedLeads.length < MAX_EXIT_LEADS) {
        completedLeads.push({ id: lead.id, name: leadName(lead) });
      }
      continue;
    }

    if (!inFollowUp) {
      stopped++;
      if (stoppedLeads.length < MAX_EXIT_LEADS) {
        stoppedLeads.push({ id: lead.id, name: leadName(lead) });
      }
      continue;
    }

    active++;
    const progress = nurtureProgress(lead.id, tasks);
    progressValues.push(progress);

    const next = nurtureNextTask(lead.id, tasks);
    if (next != null) {
      pushToBucket(buckets, next.step - 1, lead, "waiting", next.dueAt);
      if (next.dueAt && isDueToday(next.dueAt)) dueToday++;
    }
  }

  const passedByStep = buildPassedCounts(def.steps.length, progressValues);

  return {
    id: def.id,
    name: def.name,
    description: def.description,
    trigger: def.trigger,
    triggerDetail: def.triggerDetail,
    queueHref: def.queueHref,
    enrolled,
    active,
    paused: 0,
    completed,
    stopped,
    dueToday,
    steps: finalizeSteps(def, buckets, passedByStep),
    completedLeads,
    stoppedLeads,
  };
}

function matchesWinbackSequence(lead: Lead, sequenceId: string): boolean {
  if (lead.winbackSequenceId === sequenceId) return true;
  if (
    sequenceId === WINBACK_SEQUENCE_ID &&
    lead.winbackEnrolled &&
    !lead.winbackSequenceId
  ) {
    return true;
  }
  return false;
}

function buildWinbackFunnel(
  def: SequenceFlowDef,
  sequenceId: string,
  leads: Lead[],
  tasks: Task[],
): SequenceFlowFunnel {
  const buckets = initBuckets(def);
  let enrolled = 0;
  let active = 0;
  let paused = 0;
  let completed = 0;
  let stopped = 0;
  let dueToday = 0;
  const progressValues: number[] = [];
  const completedLeads: Array<{ id: string; name: string }> = [];
  const stoppedLeads: Array<{ id: string; name: string }> = [];

  for (const lead of leads) {
    if (!matchesWinbackSequence(lead, sequenceId)) continue;
    if (!lead.winbackEnrolled && !lead.winbackStatus) continue;

    enrolled++;
    const status = lead.winbackStatus;

    if (status === "completed") {
      completed++;
      progressValues.push(def.steps.length);
      if (completedLeads.length < MAX_EXIT_LEADS) {
        completedLeads.push({ id: lead.id, name: leadName(lead) });
      }
      continue;
    }

    if (status === "stopped") {
      stopped++;
      progressValues.push(Math.max(0, lead.winbackStep));
      if (stoppedLeads.length < MAX_EXIT_LEADS) {
        stoppedLeads.push({ id: lead.id, name: leadName(lead) });
      }
      continue;
    }

    progressValues.push(Math.max(0, lead.winbackStep));
    const next = nextWinbackTask(lead.id, tasks);

    if (status === "paused") {
      paused++;
      if (next != null) {
        pushToBucket(buckets, next.step - 1, lead, "paused", next.dueAt);
      } else if (lead.winbackStep > 0) {
        pushToBucket(
          buckets,
          Math.min(lead.winbackStep, def.steps.length) - 1,
          lead,
          "paused",
          lead.winbackNextAt,
        );
      }
      continue;
    }

    if (status === "active") {
      active++;
      if (next != null) {
        pushToBucket(buckets, next.step - 1, lead, "waiting", next.dueAt);
        if (next.dueAt && isDueToday(next.dueAt)) dueToday++;
      }
    }
  }

  const passedByStep = buildPassedCounts(def.steps.length, progressValues);

  return {
    id: def.id,
    name: def.name,
    description: def.description,
    trigger: def.trigger,
    triggerDetail: def.triggerDetail,
    queueHref: def.queueHref,
    enrolled,
    active,
    paused,
    completed,
    stopped,
    dueToday,
    steps: finalizeSteps(def, buckets, passedByStep),
    completedLeads,
    stoppedLeads,
  };
}

function isNnNurtureTask(title: string): boolean {
  return title.startsWith("NN nurture [");
}

function nnNurtureNextTask(
  leadId: string,
  sequenceId: string,
  tasks: Task[],
): { step: number; dueAt: Date | null } | null {
  const prefix = `NN nurture [${sequenceId}]:`;
  const pending = sortTasksByDue(
    tasks.filter((t) => t.leadId === leadId && !t.completed && t.title.startsWith(prefix)),
  );
  if (pending.length === 0) return null;
  const totalForLead = tasks.filter(
    (t) => t.leadId === leadId && t.title.startsWith(prefix),
  ).length;
  const remaining = pending.length;
  const step = Math.max(1, totalForLead - remaining + 1);
  return { step, dueAt: pending[0]?.dueDate ?? null };
}

function buildNnNurtureFunnel(
  def: SequenceFlowDef,
  leads: Lead[],
  tasks: Task[],
): SequenceFlowFunnel {
  const buckets = initBuckets(def);
  let enrolled = 0;
  let active = 0;
  let paused = 0;
  let completed = 0;
  let stopped = 0;
  let dueToday = 0;
  const progressValues: number[] = [];
  const completedLeads: Array<{ id: string; name: string }> = [];
  const stoppedLeads: Array<{ id: string; name: string }> = [];
  const prefix = `NN nurture [${def.id}]:`;

  for (const lead of leads) {
    const sequenceTasks = tasks.filter(
      (t) => t.leadId === lead.id && t.title.startsWith(prefix),
    );
    if (sequenceTasks.length === 0) continue;

    enrolled++;
    const pending = sequenceTasks.filter((t) => !t.completed);
    const next = nnNurtureNextTask(lead.id, def.id, tasks);

    if (lead.status === "LOST" || lead.status === "DISQUALIFIED") {
      stopped++;
      progressValues.push(Math.min(lead.winbackStep, def.steps.length));
      if (stoppedLeads.length < MAX_EXIT_LEADS) {
        stoppedLeads.push({ id: lead.id, name: leadName(lead) });
      }
      continue;
    }

    if (pending.length === 0) {
      completed++;
      progressValues.push(def.steps.length);
      if (completedLeads.length < MAX_EXIT_LEADS) {
        completedLeads.push({ id: lead.id, name: leadName(lead) });
      }
      continue;
    }

    if (lead.remindersPaused) {
      paused++;
      if (next != null) {
        pushToBucket(buckets, next.step - 1, lead, "paused", next.dueAt);
      }
      continue;
    }

    active++;
    progressValues.push(Math.max(0, (next?.step ?? 1) - 1));
    if (next != null) {
      pushToBucket(buckets, next.step - 1, lead, "waiting", next.dueAt);
      if (next.dueAt && isDueToday(next.dueAt)) dueToday++;
    }
  }

  const passedByStep = buildPassedCounts(def.steps.length, progressValues);

  return {
    id: def.id,
    name: def.name,
    description: def.description,
    trigger: def.trigger,
    triggerDetail: def.triggerDetail,
    queueHref: def.queueHref,
    enrolled,
    active,
    paused,
    completed,
    stopped,
    dueToday,
    steps: finalizeSteps(def, buckets, passedByStep),
    completedLeads,
    stoppedLeads,
  };
}

export function getSequenceFlowCatalog(): SequenceFlowDef[] {
  return isNeuronourish() ? NN_SEQUENCE_FLOWS : SEQUENCE_FLOWS;
}

export function computeSequenceFunnelStats(
  leads: Lead[],
  tasks: Task[],
): { flows: SequenceFlowFunnel[]; overview: SequenceFunnelOverview } {
  const catalog = getSequenceFlowCatalog();
  const flows = catalog.map((def) => {
    if (isNeuronourish()) {
      if (def.id === WINBACK_LONG_SEQUENCE_ID || def.id === WINBACK_SEQUENCE_ID) {
        return buildWinbackFunnel(
          def,
          def.id === WINBACK_LONG_SEQUENCE_ID ? WINBACK_LONG_SEQUENCE_ID : WINBACK_SEQUENCE_ID,
          leads,
          tasks,
        );
      }
      return buildNnNurtureFunnel(def, leads, tasks);
    }
    if (def.id === "long_timeframe_nurture") {
      return buildNurtureFunnel(def, leads, tasks);
    }
    if (def.id === WINBACK_LONG_SEQUENCE_ID) {
      return buildWinbackFunnel(def, WINBACK_LONG_SEQUENCE_ID, leads, tasks);
    }
    return buildWinbackFunnel(def, WINBACK_SEQUENCE_ID, leads, tasks);
  });

  const overview: SequenceFunnelOverview = {
    totalEnrolled: flows.reduce((s, f) => s + f.enrolled, 0),
    totalActive: flows.reduce((s, f) => s + f.active, 0),
    totalPaused: flows.reduce((s, f) => s + f.paused, 0),
    totalDueToday: flows.reduce((s, f) => s + f.dueToday, 0),
    totalCompleted: flows.reduce((s, f) => s + f.completed, 0),
    totalStopped: flows.reduce((s, f) => s + f.stopped, 0),
  };

  return { flows, overview };
}
