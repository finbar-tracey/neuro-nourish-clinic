import crypto from "node:crypto";

import {
  captureOperationalFields,
  normalizeOperationalLead,
} from "@/lib/operational-queue";
import { captureCaseDefaults, humanTimelineForCapture } from "@/lib/case-capture";
import {
  computeExpectedCommission,
  computeExpectedValue,
  STAGE_PROBABILITY,
} from "@/lib/case-stages";

import type {
  Activity,
  ActivityType,
  AutomationAction,
  AutomationRule,
  AutomationRun,
  AutomationTrigger,
  CaseDocument,
  Lead,
  LeadStatus,
  Note,
  Task,
} from "@/generated/prisma/client";
import { readCrmStore, writeCrmStore } from "@/lib/crm-persistence";
import { invalidateWorkspaceCasesCache } from "@/lib/workspace-cases-cache";

let storeMutation: Promise<void> = Promise.resolve();

async function mutateStore(mutator: (store: Awaited<ReturnType<typeof readCrmStore>>) => void) {
  storeMutation = storeMutation.then(async () => {
    const store = await readCrmStore();
    mutator(store);
    await writeCrmStore(store);
    invalidateWorkspaceCasesCache();
  });
  await storeMutation;
}

function newId() {
  return crypto.randomBytes(12).toString("hex");
}

function now() {
  return new Date();
}

type LeadWhere = {
  status?: LeadStatus | { in: LeadStatus[] };
  updatedAt?: { lt: Date };
  createdAt?: { gte: Date };
  qualificationTier?: string | null;
  formCompleted?: boolean;
  OR?: Array<Pick<LeadWhere, "qualificationTier" | "formCompleted">>;
};

function matchesLeadWhere(lead: Lead, where?: LeadWhere): boolean {
  if (!where) return true;

  const { OR, ...rest } = where;
  if (OR?.length && !OR.some((clause) => matchesLeadWhere(lead, clause))) {
    return false;
  }

  if (rest.status) {
    if (typeof rest.status === "string") {
      if (lead.status !== rest.status) return false;
    } else if (!rest.status.in.includes(lead.status)) {
      return false;
    }
  }
  if (rest.updatedAt?.lt && !(lead.updatedAt < rest.updatedAt.lt)) return false;
  if (rest.createdAt?.gte && !(lead.createdAt >= rest.createdAt.gte)) return false;
  if (rest.qualificationTier !== undefined && lead.qualificationTier !== rest.qualificationTier) {
    return false;
  }
  if (rest.formCompleted !== undefined && lead.formCompleted !== rest.formCompleted) return false;
  return true;
}

type TaskWhere = {
  completed?: boolean;
  dueDate?: { lte: Date };
  title?: { startsWith: string };
  leadId?: string;
  id?: string;
};

type TaskOrderBy = { dueDate?: "asc" | "desc"; createdAt?: "asc" | "desc" };

function sortTasks(tasks: Task[], orderBy?: TaskOrderBy): Task[] {
  if (orderBy?.dueDate === "asc") {
    return [...tasks].sort((a, b) => {
      const aDue = a.dueDate?.getTime() ?? Number.POSITIVE_INFINITY;
      const bDue = b.dueDate?.getTime() ?? Number.POSITIVE_INFINITY;
      return aDue - bDue;
    });
  }
  if (orderBy?.dueDate === "desc") {
    return [...tasks].sort((a, b) => {
      const aDue = a.dueDate?.getTime() ?? 0;
      const bDue = b.dueDate?.getTime() ?? 0;
      return bDue - aDue;
    });
  }
  if (orderBy?.createdAt === "asc") {
    return [...tasks].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  return sortByCreatedAtDesc(tasks);
}

function matchesTaskWhere(task: Task, where?: TaskWhere): boolean {
  if (!where) return true;
  if (where.completed !== undefined && task.completed !== where.completed) return false;
  if (where.leadId && task.leadId !== where.leadId) return false;
  if (where.id && task.id !== where.id) return false;
  if (where.dueDate?.lte) {
    if (!task.dueDate || !(task.dueDate <= where.dueDate.lte)) return false;
  }
  if (where.title?.startsWith && !task.title.startsWith(where.title.startsWith)) return false;
  return true;
}

function sortByCreatedAtDesc<T extends { createdAt: Date }>(items: T[]) {
  return [...items].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

const leadModel = {
  async count(args?: { where?: LeadWhere }) {
    const store = await readCrmStore();
    return store.leads.filter((lead) => matchesLeadWhere(lead, args?.where)).length;
  },

  async create({ data }: { data: Partial<Omit<Lead, "createdAt" | "updatedAt">> & Pick<Lead, "firstName" | "lastName" | "email" | "phone" | "loanPurpose" | "loanAmount" | "termMonths" | "propertyType" | "propertyValue" | "propertyLocation" | "timeframe"> }) {
    const timestamp = now();
    const operational = captureOperationalFields(timestamp);
    const caseDefaults = captureCaseDefaults(timestamp);
    const probability = caseDefaults.probability ?? 10;
    const lead: Lead = normalizeOperationalLead({
      id: data.id ?? newId(),
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      loanPurpose: data.loanPurpose,
      loanAmount: data.loanAmount,
      termMonths: data.termMonths,
      propertyType: data.propertyType,
      propertyValue: data.propertyValue,
      propertyLocation: data.propertyLocation,
      ltv: data.ltv ?? null,
      timeframe: data.timeframe,
      hasExistingMortgage: data.hasExistingMortgage ?? false,
      willOccupy: data.willOccupy ?? false,
      hasEverOccupied: data.hasEverOccupied ?? false,
      nurtureEnrolled: data.nurtureEnrolled ?? false,
      formCompleted: data.formCompleted ?? false,
      qualificationTier: data.qualificationTier ?? "unscreened",
      additionalInfo: data.additionalInfo ?? null,
      status: data.status ?? "NEW",
      owner: data.owner ?? operational.owner,
      operationalQueue: data.operationalQueue ?? operational.operationalQueue,
      nextAction: data.nextAction ?? operational.nextAction,
      nextActionAt:
        data.nextActionAt !== undefined ? data.nextActionAt : operational.nextActionAt,
      callbackDueAt:
        data.callbackDueAt !== undefined ? data.callbackDueAt : operational.callbackDueAt,
      priorityCallSlot: data.priorityCallSlot ?? null,
      priorityCallBookedAt: data.priorityCallBookedAt ?? null,
      attributionChannel: data.attributionChannel ?? null,
      firstResponseAt: data.firstResponseAt ?? null,
      responseTimeMinutes: data.responseTimeMinutes ?? null,
      conversationStarted: data.conversationStarted ?? false,
      estimatedCommission:
        data.estimatedCommission ?? computeExpectedCommission(data.loanAmount),
      caseStage: data.caseStage ?? caseDefaults.caseStage,
      riskLevel: data.riskLevel ?? caseDefaults.riskLevel,
      riskReason: data.riskReason ?? caseDefaults.riskReason,
      probability: data.probability ?? probability,
      expectedValue:
        data.expectedValue ??
        computeExpectedValue(data.loanAmount, data.probability ?? probability),
      remindersPaused: data.remindersPaused ?? false,
      winbackEnrolled: data.winbackEnrolled ?? false,
      winbackStatus: data.winbackStatus ?? null,
      winbackSequenceId: data.winbackSequenceId ?? null,
      winbackStep: data.winbackStep ?? 0,
      winbackNextAt: data.winbackNextAt ?? null,
      winbackStoppedReason: data.winbackStoppedReason ?? null,
      source: data.source ?? "landing_page",
      utmSource: data.utmSource ?? null,
      utmMedium: data.utmMedium ?? null,
      utmCampaign: data.utmCampaign ?? null,
      utmContent: data.utmContent ?? null,
      utmTerm: data.utmTerm ?? null,
      fbclid: data.fbclid ?? null,
      gclid: data.gclid ?? null,
      landingPageUrl: data.landingPageUrl ?? null,
      referrer: data.referrer ?? null,
      deviceType: data.deviceType ?? null,
      uploadToken: data.uploadToken ?? null,
      uploadTokenExpiresAt: data.uploadTokenExpiresAt ?? null,
      teamsMeetingUrl: data.teamsMeetingUrl ?? null,
      outlookEventId: data.outlookEventId ?? null,
      documentsRequestedAt: data.documentsRequestedAt ?? null,
      consultationCompletedAt: data.consultationCompletedAt ?? null,
      lostReason: data.lostReason ?? null,
      disqualifiedReason: data.disqualifiedReason ?? null,
      investmentOnly: data.investmentOnly ?? null,
      importBatchId: data.importBatchId ?? null,
      importCampaign: data.importCampaign ?? null,
      metaLeadgenId: data.metaLeadgenId ?? null,
      lawfulBasis: data.lawfulBasis ?? null,
      importedAt: data.importedAt ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
      lastContactedAt: data.lastContactedAt ?? null,
      initialInvoiceAmount: data.initialInvoiceAmount ?? null,
      revenueGenerated: data.revenueGenerated ?? null,
      saleCompletedAt: data.saleCompletedAt ?? null,
      bookingChaseEnrolled: data.bookingChaseEnrolled ?? false,
      bookingChaseStep: data.bookingChaseStep ?? 0,
      bookingChaseNextAt: data.bookingChaseNextAt ?? null,
      noAnswerCount: data.noAnswerCount ?? 0,
      funnelStage: data.funnelStage ?? "quiz_partial",
      quizScore: data.quizScore ?? null,
      primaryConcern: data.primaryConcern ?? null,
      segment: data.segment ?? null,
      revenueEur: data.revenueEur ?? 0,
      pipelineValueEur: data.pipelineValueEur ?? 0,
      discoveryBookedAt: data.discoveryBookedAt ?? null,
      assessmentPaidAt: data.assessmentPaidAt ?? null,
      creditExpiryDate: data.creditExpiryDate ?? null,
      enrolledAt: data.enrolledAt ?? null,
      passwordHash: data.passwordHash ?? null,
      passwordSalt: data.passwordSalt ?? null,
    });

    await mutateStore((store) => {
      store.leads.unshift(lead);
    });

    return lead;
  },

  async update({
    where,
    data,
  }: {
    where: { id: string };
    data: Partial<Omit<Lead, "id">>;
  }) {
    let updated!: Lead;
    await mutateStore((store) => {
      const index = store.leads.findIndex((lead) => lead.id === where.id);
      if (index < 0) throw new Error(`Lead not found: ${where.id}`);
      updated = normalizeOperationalLead({
        ...store.leads[index]!,
        ...data,
        updatedAt: now(),
      });
      store.leads[index] = updated;
    });
    return updated;
  },

  async findUnique({
    where,
    include,
    select,
  }: {
    where: { id: string } | { metaLeadgenId: string };
    include?: {
      notes?: { orderBy?: { createdAt: "desc" | "asc" } };
      activities?: { orderBy?: { createdAt: "desc" | "asc" } };
      tasks?: { orderBy?: { createdAt: "desc" | "asc" } };
      caseDocuments?: boolean;
    };
    select?: Record<string, boolean>;
  }) {
    const store = await readCrmStore();
    const lead = store.leads.find((item) => {
      if ("id" in where) return item.id === where.id;
      return item.metaLeadgenId === where.metaLeadgenId;
    });
    if (!lead) return null;

    if (select) {
      const selected: Record<string, unknown> = {};
      for (const key of Object.keys(select)) {
        if (select[key]) selected[key] = lead[key as keyof Lead];
      }
      return selected as Lead;
    }

    if (!include) return lead;

    const notes = sortByCreatedAtDesc(store.notes.filter((note) => note.leadId === lead.id));
    const activities = sortByCreatedAtDesc(
      store.activities.filter((activity) => activity.leadId === lead.id),
    );
    const tasks = sortByCreatedAtDesc(store.tasks.filter((task) => task.leadId === lead.id));
    const caseDocuments = include.caseDocuments
      ? (store.caseDocuments ?? []).filter((doc) => doc.leadId === lead.id)
      : undefined;

    return {
      ...lead,
      notes,
      activities,
      tasks,
      ...(caseDocuments ? { caseDocuments } : {}),
    };
  },

  async findMany(args?: {
    where?: LeadWhere;
    orderBy?: { createdAt: "desc" | "asc" };
    select?: Record<string, boolean>;
  }): Promise<Lead[]> {
    const store = await readCrmStore();
    let leads = store.leads.filter((lead) => matchesLeadWhere(lead, args?.where));
    leads = sortByCreatedAtDesc(leads);
    if (args?.orderBy?.createdAt === "asc") {
      leads = [...leads].reverse();
    }

    if (args?.select) {
      return leads.map((lead) => {
        const selected: Record<string, unknown> = {};
        for (const key of Object.keys(args.select!)) {
          if (key === "_count") {
            selected._count = {
              notes: store.notes.filter((note) => note.leadId === lead.id).length,
              tasks: store.tasks.filter((task) => task.leadId === lead.id).length,
              activities: store.activities.filter((activity) => activity.leadId === lead.id).length,
            };
          } else if (args.select![key]) {
            selected[key] = lead[key as keyof Lead];
          }
        }
        return selected as Lead;
      });
    }

    return leads;
  },

  async delete({ where }: { where: { id: string } }) {
    await mutateStore((store) => {
      store.leads = store.leads.filter((lead) => lead.id !== where.id);
      store.notes = store.notes.filter((note) => note.leadId !== where.id);
      store.activities = store.activities.filter((activity) => activity.leadId !== where.id);
      store.tasks = store.tasks.filter((task) => task.leadId !== where.id);
      store.automationRuns = store.automationRuns.filter((run) => run.leadId !== where.id);
      if (store.caseDocuments) {
        store.caseDocuments = store.caseDocuments.filter((doc) => doc.leadId !== where.id);
      }
    });
  },
};

const noteModel = {
  async create({
    data,
  }: {
    data: {
      leadId: string;
      content: string;
      author?: string;
    };
  }) {
    const note: Note = {
      id: newId(),
      leadId: data.leadId,
      content: data.content,
      author: data.author ?? "System",
      createdAt: now(),
    };
    await mutateStore((store) => {
      store.notes.unshift(note);
    });
    return note;
  },
};

const activityModel = {
  async create({
    data,
  }: {
    data: {
      leadId?: string | null;
      type: ActivityType;
      description: string;
      metadata?: string | null;
    };
  }) {
    const activity: Activity = {
      id: newId(),
      leadId: data.leadId ?? null,
      type: data.type,
      description: data.description,
      metadata: data.metadata ?? null,
      createdAt: now(),
    };
    await mutateStore((store) => {
      store.activities.unshift(activity);
    });
    return activity;
  },

  async findMany(args?: {
    orderBy?: { createdAt: "desc" | "asc" };
    take?: number;
    include?: {
      lead?: { select?: { firstName?: boolean; lastName?: boolean } };
    };
  }) {
    const store = await readCrmStore();
    let activities = sortByCreatedAtDesc(store.activities);
    if (args?.orderBy?.createdAt === "asc") activities = [...activities].reverse();
    if (args?.take) activities = activities.slice(0, args.take);

    if (args?.include?.lead) {
      return activities.map((activity) => {
        const lead = activity.leadId
          ? store.leads.find((item) => item.id === activity.leadId)
          : null;
        return {
          ...activity,
          lead: lead
            ? {
                firstName: lead.firstName,
                lastName: lead.lastName,
              }
            : null,
        };
      });
    }

    return activities;
  },
};

const taskModel = {
  async createMany({
    data,
  }: {
    data: Array<{
      leadId: string;
      title: string;
      description?: string | null;
      completed?: boolean;
      dueDate?: Date | null;
    }>;
  }) {
    const timestamp = now();
    const tasks: Task[] = data.map((item) => ({
      id: newId(),
      leadId: item.leadId,
      title: item.title,
      description: item.description ?? null,
      completed: item.completed ?? false,
      dueDate: item.dueDate ?? null,
      createdAt: timestamp,
    }));
    await mutateStore((store) => {
      store.tasks.unshift(...tasks);
    });
    return { count: tasks.length };
  },

  async updateMany({
    where,
    data,
  }: {
    where: TaskWhere;
    data: Partial<Pick<Task, "completed" | "title" | "description" | "dueDate">>;
  }) {
    let count = 0;
    await mutateStore((store) => {
      store.tasks = store.tasks.map((task) => {
        if (!matchesTaskWhere(task, where)) return task;
        count += 1;
        return { ...task, ...data };
      });
    });
    return { count };
  },

  async create({
    data,
  }: {
    data: {
      leadId: string;
      title: string;
      description?: string | null;
      completed?: boolean;
      dueDate?: Date | null;
    };
  }) {
    const task: Task = {
      id: newId(),
      leadId: data.leadId,
      title: data.title,
      description: data.description ?? null,
      completed: data.completed ?? false,
      dueDate: data.dueDate ?? null,
      createdAt: now(),
    };
    await mutateStore((store) => {
      store.tasks.unshift(task);
    });
    return task;
  },

  async update({
    where,
    data,
  }: {
    where: { id: string };
    data: Partial<Pick<Task, "completed" | "title" | "description" | "dueDate">>;
  }) {
    let updated!: Task;
    await mutateStore((store) => {
      const index = store.tasks.findIndex((task) => task.id === where.id);
      if (index < 0) throw new Error(`Task not found: ${where.id}`);
      updated = { ...store.tasks[index]!, ...data };
      store.tasks[index] = updated;
    });
    return updated;
  },

  async findFirst({
    where,
    orderBy,
  }: {
    where?: TaskWhere;
    orderBy?: TaskOrderBy;
  }) {
    const store = await readCrmStore();
    const tasks = store.tasks.filter((task) => matchesTaskWhere(task, where));
    return sortTasks(tasks, orderBy)[0] ?? null;
  },

  async findMany(args?: {
    where?: TaskWhere;
    include?: { lead?: boolean };
    take?: number;
    orderBy?: TaskOrderBy;
  }) {
    const store = await readCrmStore();
    let tasks = store.tasks.filter((task) => matchesTaskWhere(task, args?.where));
    tasks = sortTasks(tasks, args?.orderBy);
    if (args?.take) tasks = tasks.slice(0, args.take);

    if (args?.include?.lead) {
      return tasks.map((task) => ({
        ...task,
        lead: store.leads.find((lead) => lead.id === task.leadId) ?? null,
      }));
    }

    return tasks;
  },

  async count({ where }: { where?: TaskWhere }) {
    const store = await readCrmStore();
    return store.tasks.filter((task) => matchesTaskWhere(task, where)).length;
  },

  async groupBy({
    by,
    where,
    _count,
  }: {
    by: ["leadId"];
    where?: TaskWhere;
    _count?: { id?: boolean };
  }) {
    const store = await readCrmStore();
    const tasks = store.tasks.filter((task) => matchesTaskWhere(task, where));
    const grouped = new Map<string, number>();
    for (const task of tasks) {
      grouped.set(task.leadId, (grouped.get(task.leadId) ?? 0) + 1);
    }
    return [...grouped.entries()].map(([leadId, count]) => ({
      leadId,
      _count: { id: count },
    }));
  },
};

const automationRuleModel = {
  async count(args?: { where?: { enabled?: boolean } }) {
    const store = await readCrmStore();
    return store.automationRules.filter((rule) =>
      args?.where?.enabled === undefined ? true : rule.enabled === args.where.enabled,
    ).length;
  },

  async createMany({ data }: { data: Array<Omit<AutomationRule, "id" | "createdAt" | "updatedAt">> }) {
    const timestamp = now();
    await mutateStore((store) => {
      for (const item of data) {
        store.automationRules.push({
          id: newId(),
          ...item,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }
    });
  },

  async create({
    data,
  }: {
    data: {
      name: string;
      description?: string | null;
      trigger: AutomationTrigger;
      action: AutomationAction;
      config: string;
      enabled?: boolean;
    };
  }) {
    const timestamp = now();
    const rule: AutomationRule = {
      id: newId(),
      name: data.name,
      description: data.description ?? null,
      trigger: data.trigger,
      action: data.action,
      config: data.config,
      enabled: data.enabled ?? true,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await mutateStore((store) => {
      store.automationRules.unshift(rule);
    });
    return rule;
  },

  async update({
    where,
    data,
  }: {
    where: { id: string };
    data: Partial<Pick<AutomationRule, "enabled" | "name" | "description" | "config">>;
  }) {
    let updated!: AutomationRule;
    await mutateStore((store) => {
      const index = store.automationRules.findIndex((rule) => rule.id === where.id);
      if (index < 0) throw new Error(`Automation rule not found: ${where.id}`);
      updated = {
        ...store.automationRules[index]!,
        ...data,
        updatedAt: now(),
      };
      store.automationRules[index] = updated;
    });
    return updated;
  },

  async findMany(args?: {
    where?: { trigger?: AutomationTrigger; enabled?: boolean };
    orderBy?: { createdAt: "desc" | "asc" };
    include?: {
      _count?: { select: { runs: boolean } };
      runs?: { orderBy?: { createdAt: "desc" | "asc" }; take?: number };
    };
  }) {
    const store = await readCrmStore();
    let rules = store.automationRules.filter((rule) => {
      if (args?.where?.trigger && rule.trigger !== args.where.trigger) return false;
      if (args?.where?.enabled !== undefined && rule.enabled !== args.where.enabled) return false;
      return true;
    });
    rules = sortByCreatedAtDesc(rules);

    if (!args?.include) return rules;

    return rules.map((rule) => {
      const runs = sortByCreatedAtDesc(
        store.automationRuns.filter((run) => run.ruleId === rule.id),
      );
      return {
        ...rule,
        _count: args.include?._count?.select?.runs
          ? { runs: runs.length }
          : undefined,
        runs: args.include?.runs ? runs.slice(0, args.include.runs.take ?? runs.length) : undefined,
      };
    });
  },
};

const automationRunModel = {
  async create({
    data,
  }: {
    data: {
      ruleId: string;
      leadId?: string | null;
      status: string;
      message?: string | null;
    };
  }) {
    const run: AutomationRun = {
      id: newId(),
      ruleId: data.ruleId,
      leadId: data.leadId ?? null,
      status: data.status,
      message: data.message ?? null,
      createdAt: now(),
    };
    await mutateStore((store) => {
      store.automationRuns.unshift(run);
    });
    return run;
  },

  async findFirst({
    where,
  }: {
    where?: {
      ruleId?: string;
      leadId?: string;
      createdAt?: { gte: Date };
    };
  }) {
    const store = await readCrmStore();
    return (
      store.automationRuns.find((run) => {
        if (where?.ruleId && run.ruleId !== where.ruleId) return false;
        if (where?.leadId && run.leadId !== where.leadId) return false;
        if (where?.createdAt?.gte && !(run.createdAt >= where.createdAt.gte)) return false;
        return true;
      }) ?? null
    );
  },
};

const caseDocumentModel = {
  async create({
    data,
  }: {
    data: {
      leadId: string;
      docKey: string;
      label: string;
      required?: boolean;
      status?: string;
    };
  }) {
    const doc: CaseDocument = {
      id: newId(),
      leadId: data.leadId,
      docKey: data.docKey,
      label: data.label,
      required: data.required ?? true,
      status: data.status ?? "REQUIRED",
      fileName: null,
      fileUrl: null,
      uploadedAt: null,
      createdAt: now(),
    };
    await mutateStore((store) => {
      store.caseDocuments = store.caseDocuments ?? [];
      store.caseDocuments.push(doc);
    });
    return doc;
  },

  async update({
    where,
    data,
  }: {
    where: { id: string };
    data: Partial<Pick<CaseDocument, "status" | "fileName" | "fileUrl" | "uploadedAt">>;
  }) {
    let updated!: CaseDocument;
    await mutateStore((store) => {
      store.caseDocuments = store.caseDocuments ?? [];
      const index = store.caseDocuments.findIndex((d) => d.id === where.id);
      if (index < 0) throw new Error(`Document not found: ${where.id}`);
      updated = { ...store.caseDocuments[index]!, ...data };
      store.caseDocuments[index] = updated;
    });
    return updated;
  },

  async findMany({ where }: { where?: { leadId?: string } }) {
    const store = await readCrmStore();
    const docs = store.caseDocuments ?? [];
    if (!where?.leadId) return docs;
    return docs.filter((d) => d.leadId === where.leadId);
  },
};

export const db = {
  lead: leadModel,
  note: noteModel,
  activity: activityModel,
  task: taskModel,
  caseDocument: caseDocumentModel,
  automationRule: automationRuleModel,
  automationRun: automationRunModel,
};

/** Serialized CRM mutations — use for notification retries and other store extensions. */
export async function runCrmMutation(
  mutator: (store: Awaited<ReturnType<typeof readCrmStore>>) => void,
) {
  return mutateStore(mutator);
}

export { crmStorageMode } from "@/lib/crm-persistence";
