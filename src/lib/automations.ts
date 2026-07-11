import { AutomationAction, AutomationTrigger, LeadStatus, type Lead } from "@/generated/prisma/client";
import { brokerNotifyEmail } from "@/lib/broker-notify";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { funnelStageFromLead, nnStageLabel, quizScoreFromLead } from "@/lib/neuronourish-workspace";
import { isNeuronourish } from "@/lib/vertical-config";

type AutomationConfig = {
  toStatus?: LeadStatus;
  noteContent?: string;
  emailSubject?: string;
  emailBody?: string;
  /** Defaults to lead email */
  recipient?: "lead" | "broker";
  webhookUrl?: string;
  taskTitle?: string;
  taskDescription?: string;
  idleDays?: number;
};

export async function runAutomations(
  trigger: AutomationTrigger,
  lead: Lead,
  context?: { previousStatus?: LeadStatus },
) {
  const rules = await db.automationRule.findMany({
    where: { trigger, enabled: true },
  });

  for (const rule of rules) {
    const config = JSON.parse(rule.config) as AutomationConfig;

    if (
      trigger === AutomationTrigger.STATUS_CHANGED &&
      config.toStatus &&
      context?.previousStatus !== undefined &&
      lead.status !== config.toStatus
    ) {
      continue;
    }

    try {
      await executeAction(rule.action, config, lead, rule.id);
      await db.automationRun.create({
        data: {
          ruleId: rule.id,
          leadId: lead.id,
          status: "success",
          message: `${rule.action} executed successfully`,
        },
      });
    } catch (error) {
      await db.automationRun.create({
        data: {
          ruleId: rule.id,
          leadId: lead.id,
          status: "failed",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  }
}

async function executeAction(
  action: AutomationAction,
  config: AutomationConfig,
  lead: Lead,
  ruleId: string,
) {
  switch (action) {
    case AutomationAction.ADD_NOTE:
      if (config.noteContent) {
        const note = interpolate(config.noteContent, lead);
        await db.note.create({
          data: {
            leadId: lead.id,
            content: note,
            author: "Automation",
          },
        });
        await db.activity.create({
          data: {
            leadId: lead.id,
            type: "AUTOMATION_RUN",
            description: `Automation added note: ${note.slice(0, 80)}`,
            metadata: JSON.stringify({ ruleId }),
          },
        });
      }
      break;

    case AutomationAction.UPDATE_STATUS:
      if (config.toStatus) {
        await db.lead.update({
          where: { id: lead.id },
          data: { status: config.toStatus },
        });
        await db.activity.create({
          data: {
            leadId: lead.id,
            type: "STATUS_CHANGED",
            description: `Status automatically updated to ${config.toStatus}`,
            metadata: JSON.stringify({ ruleId, toStatus: config.toStatus }),
          },
        });
      }
      break;

    case AutomationAction.SEND_EMAIL: {
      const subject = interpolate(config.emailSubject ?? "Follow-up", lead);
      const body = interpolate(config.emailBody ?? "", lead);
      const to =
        config.recipient === "broker" ? brokerNotifyEmail() : lead.email;
      const result = await sendEmail({ to, subject, body });

      await db.activity.create({
        data: {
          leadId: lead.id,
          type: "EMAIL_SENT",
          description: result.sent
            ? `Email sent: ${subject}`
            : `Email logged: ${subject}`,
          metadata: JSON.stringify({
            ruleId,
            to: lead.email,
            subject,
            body,
            sent: result.sent,
            resendId: result.id,
            error: result.error,
          }),
        },
      });
      break;
    }

    case AutomationAction.WEBHOOK:
      if (config.webhookUrl) {
        await fetch(config.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lead, ruleId, timestamp: new Date().toISOString() }),
        }).catch(() => {
          /* webhook failures are logged via automation run */
        });
      }
      break;

    case AutomationAction.CREATE_TASK:
      if (config.taskTitle) {
        await db.task.create({
          data: {
            leadId: lead.id,
            title: interpolate(config.taskTitle, lead),
            description: config.taskDescription
              ? interpolate(config.taskDescription, lead)
              : undefined,
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });
      }
      break;
  }
}

function interpolate(template: string, lead: Lead): string {
  const score = quizScoreFromLead(lead);
  return template
    .replace(/\{\{firstName\}\}/g, lead.firstName)
    .replace(/\{\{lastName\}\}/g, lead.lastName)
    .replace(/\{\{email\}\}/g, lead.email)
    .replace(/\{\{phone\}\}/g, lead.phone)
    .replace(/\{\{loanAmount\}\}/g, lead.loanAmount.toLocaleString("en-GB"))
    .replace(/\{\{loanPurpose\}\}/g, lead.loanPurpose)
    .replace(/\{\{timeframe\}\}/g, lead.timeframe)
    .replace(/\{\{status\}\}/g, lead.status)
    .replace(/\{\{quizScore\}\}/g, score != null ? String(score) : "—")
    .replace(/\{\{funnelStage\}\}/g, isNeuronourish() ? nnStageLabel(lead) : funnelStageFromLead(lead));
}

const CAPTURE_AUTOMATION_RULES = [
  {
    name: "Capture follow-up task",
    description: "Create urgent call task when step 2 contact is captured",
    trigger: AutomationTrigger.LEAD_CAPTURED,
    action: AutomationAction.CREATE_TASK,
    config: JSON.stringify({
      taskTitle: "Call {{firstName}} {{lastName}} — step 2 captured",
      taskDescription:
        "Contact captured before property details. £{{loanAmount}} {{loanPurpose}}. Call within 2 hours.",
    }),
    enabled: true,
  },
] as const;

const NN_CAPTURE_AUTOMATION_RULES = [
  {
    name: "Capture follow-up task",
    description: "Create urgent call task when quiz contact is captured",
    trigger: AutomationTrigger.LEAD_CAPTURED,
    action: AutomationAction.CREATE_TASK,
    config: JSON.stringify({
      taskTitle: "Call {{firstName}} {{lastName}} — quiz contact captured",
      taskDescription:
        "{{funnelStage}}. Quiz score {{quizScore}}/100. Call within 15 minutes.",
    }),
    enabled: true,
  },
] as const;

const LEGACY_LOAN_AUTOMATION_NAMES = [
  "Welcome new lead",
  "Create follow-up task",
  "Contacted lead notification",
  "Capture follow-up task",
] as const;

const LEGACY_CAPTURE_EMAIL_RULE_NAMES = [
  "Capture welcome email",
  "Capture broker alert",
] as const;

export async function disableLegacyCaptureEmailRules() {
  const rules = await db.automationRule.findMany();
  for (const rule of rules) {
    if (
      LEGACY_CAPTURE_EMAIL_RULE_NAMES.includes(
        rule.name as (typeof LEGACY_CAPTURE_EMAIL_RULE_NAMES)[number],
      ) &&
      rule.enabled
    ) {
      await db.automationRule.update({
        where: { id: rule.id },
        data: { enabled: false },
      });
    }
  }
}

export async function ensureCaptureAutomationRules() {
  await disableLegacyCaptureEmailRules();
  const rules = isNeuronourish() ? NN_CAPTURE_AUTOMATION_RULES : CAPTURE_AUTOMATION_RULES;
  const existingRules = await db.automationRule.findMany();
  for (const rule of rules) {
    if (existingRules.some((r) => r.name === rule.name)) continue;
    await db.automationRule.create({ data: rule });
  }
}

export async function ensureNeuronourishAutomationRules() {
  if (!isNeuronourish()) return;

  const existingRules = await db.automationRule.findMany();
  for (const rule of existingRules) {
    const config = rule.config ?? "";
    const isLegacyLoanCopy =
      LEGACY_LOAN_AUTOMATION_NAMES.includes(
        rule.name as (typeof LEGACY_LOAN_AUTOMATION_NAMES)[number],
      ) &&
      (/loan amount|bridging|borrower documents|property details/i.test(config) ||
        rule.name === "Welcome new lead" ||
        rule.name === "Create follow-up task" ||
        rule.name === "Contacted lead notification");
    if (isLegacyLoanCopy && rule.enabled) {
      await db.automationRule.update({
        where: { id: rule.id },
        data: { enabled: false },
      });
    }
  }

  const nnWelcome = {
    name: "Welcome new lead",
    description: "Add a welcome note when a new NeuroNourish enquiry is submitted",
    trigger: AutomationTrigger.LEAD_CREATED,
    action: AutomationAction.ADD_NOTE,
    config: JSON.stringify({
      noteContent:
        "New enquiry from {{firstName}} {{lastName}} — {{funnelStage}}. Quiz score {{quizScore}}/100. Follow up within 15 minutes.",
    }),
    enabled: true,
  };

  const nnTask = {
    name: "Create follow-up task",
    description: "Schedule a follow-up call for new NeuroNourish leads",
    trigger: AutomationTrigger.LEAD_CREATED,
    action: AutomationAction.CREATE_TASK,
    config: JSON.stringify({
      taskTitle: "Call {{firstName}} {{lastName}}",
      taskDescription:
        "NeuroNourish enquiry — {{funnelStage}}. Quiz score {{quizScore}}/100. Offer assessment or discovery call.",
    }),
    enabled: true,
  };

  const refreshed = await db.automationRule.findMany();
  for (const rule of [nnWelcome, nnTask]) {
    const match = refreshed.find((r) => r.name === rule.name);
    if (!match) {
      await db.automationRule.create({ data: rule });
      continue;
    }
    if (!match.enabled || /loan amount|bridging/i.test(match.config)) {
      await db.automationRule.update({
        where: { id: match.id },
        data: { description: rule.description, config: rule.config, enabled: true },
      });
    }
  }
}

export async function seedDefaultAutomations() {
  const count = await db.automationRule.count();
  if (count > 0) {
    await ensureNeuronourishAutomationRules();
    return;
  }

  if (isNeuronourish()) {
    await db.automationRule.createMany({
      data: [
        {
          name: "Welcome new lead",
          description: "Add a welcome note when a new NeuroNourish enquiry is submitted",
          trigger: AutomationTrigger.LEAD_CREATED,
          action: AutomationAction.ADD_NOTE,
          config: JSON.stringify({
            noteContent:
              "New enquiry from {{firstName}} {{lastName}} — {{funnelStage}}. Quiz score {{quizScore}}/100. Follow up within 15 minutes.",
          }),
          enabled: true,
        },
        {
          name: "Create follow-up task",
          description: "Schedule a follow-up call for new NeuroNourish leads",
          trigger: AutomationTrigger.LEAD_CREATED,
          action: AutomationAction.CREATE_TASK,
          config: JSON.stringify({
            taskTitle: "Call {{firstName}} {{lastName}}",
            taskDescription:
              "NeuroNourish enquiry — {{funnelStage}}. Quiz score {{quizScore}}/100. Offer assessment or discovery call.",
          }),
          enabled: true,
        },
        {
          name: "Follow-up nurture enrolled",
          description: "Log when lead enters follow-up pipeline",
          trigger: AutomationTrigger.STATUS_CHANGED,
          action: AutomationAction.ADD_NOTE,
          config: JSON.stringify({
            toStatus: "FOLLOW_UP",
            noteContent:
              "{{firstName}} moved to Follow Up — nurture email sequence active.",
          }),
          enabled: true,
        },
        {
          name: "Stale lead reminder",
          description: "Add note when a new lead has had no contact for 2+ days",
          trigger: AutomationTrigger.LEAD_IDLE,
          action: AutomationAction.ADD_NOTE,
          config: JSON.stringify({
            idleDays: 2,
            noteContent:
              "⚠️ No contact in 2+ days — call {{firstName}} {{lastName}} ({{phone}}) urgently.",
          }),
          enabled: true,
        },
      ],
    });
    return;
  }

  await db.automationRule.createMany({
    data: [
      {
        name: "Welcome new lead",
        description: "Add a welcome note when a new enquiry is submitted",
        trigger: AutomationTrigger.LEAD_CREATED,
        action: AutomationAction.ADD_NOTE,
        config: JSON.stringify({
          noteContent:
            "New enquiry from {{firstName}} {{lastName}}. Loan amount: £{{loanAmount}}. Follow up within 2 hours.",
        }),
        enabled: true,
      },
      {
        name: "Create follow-up task",
        description: "Schedule a follow-up call for new leads",
        trigger: AutomationTrigger.LEAD_CREATED,
        action: AutomationAction.CREATE_TASK,
        config: JSON.stringify({
          taskTitle: "Call {{firstName}} {{lastName}}",
          taskDescription: "Initial consultation call for bridging loan enquiry",
        }),
        enabled: true,
      },
      {
        name: "Contacted lead notification",
        description: "Log email when lead is marked contacted",
        trigger: AutomationTrigger.STATUS_CHANGED,
        action: AutomationAction.SEND_EMAIL,
        config: JSON.stringify({
          toStatus: "CONTACTED",
          emailSubject: "Your bridging loan enquiry – next steps",
          emailBody:
            "Hi {{firstName}}, thank you for your enquiry. Our team will be in touch shortly to discuss your options.",
        }),
        enabled: true,
      },
      {
        name: "Follow-up nurture enrolled",
        description: "Log when lead enters follow-up pipeline",
        trigger: AutomationTrigger.STATUS_CHANGED,
        action: AutomationAction.ADD_NOTE,
        config: JSON.stringify({
          toStatus: "FOLLOW_UP",
          noteContent:
            "{{firstName}} moved to Follow Up — nurture email sequence active.",
        }),
        enabled: true,
      },
      {
        name: "Stale lead reminder",
        description: "Add note when a new lead has had no contact for 2+ days",
        trigger: AutomationTrigger.LEAD_IDLE,
        action: AutomationAction.ADD_NOTE,
        config: JSON.stringify({
          idleDays: 2,
          noteContent:
            "⚠️ No contact in 2+ days — call {{firstName}} {{lastName}} ({{phone}}) urgently.",
        }),
        enabled: true,
      },
    ],
  });
}

export async function processIdleLeads() {
  const rules = await db.automationRule.findMany({
    where: { trigger: AutomationTrigger.LEAD_IDLE, enabled: true },
  });

  for (const rule of rules) {
    const config = JSON.parse(rule.config) as AutomationConfig;
    const idleDays = config.idleDays ?? 3;
    const cutoff = new Date(Date.now() - idleDays * 24 * 60 * 60 * 1000);

    const idleLeads = await db.lead.findMany({
      where: {
        status: { in: ["NEW", "CONTACTED"] },
        updatedAt: { lt: cutoff },
      },
    });

    for (const lead of idleLeads) {
      const alreadyRan = await db.automationRun.findFirst({
        where: {
          ruleId: rule.id,
          leadId: lead.id,
          createdAt: { gte: cutoff },
        },
      });
      if (alreadyRan) continue;

      try {
        await executeAction(rule.action, config, lead, rule.id);
        await db.automationRun.create({
          data: {
            ruleId: rule.id,
            leadId: lead.id,
            status: "success",
            message: `${rule.action} executed for idle lead`,
          },
        });
      } catch (error) {
        await db.automationRun.create({
          data: {
            ruleId: rule.id,
            leadId: lead.id,
            status: "failed",
            message: error instanceof Error ? error.message : "Unknown error",
          },
        });
      }
    }
  }
}
