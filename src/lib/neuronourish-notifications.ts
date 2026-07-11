import type { Lead } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { funnelStageLabel } from "@/lib/neuronourish-funnel";
import { NN_CLINICIAN_PARTNERSHIP } from "@/lib/neuronourish-copy";
import {
  funnelStageFromLead,
  nnStageLabel,
  primaryConcernFromLead,
  quizScoreFromLead,
} from "@/lib/neuronourish-workspace";
import { partnerNotifyEmail, partnerNotifyPhone } from "@/lib/vertical-config";
import { sendSms } from "@/lib/sms";
import { smsActivityDescription } from "@/lib/sms-copy";
import { siteUrl } from "@/lib/site-url";
import { runtimeSecret } from "@/lib/runtime-env";

export type SlackAlertType = "QUIZ_CAPTURED" | "ASSESSMENT_PAID" | "DISCOVERY_BOOKED";

export async function sendSlackAlert(
  type: SlackAlertType,
  details: { name: string; email: string; extra?: string },
) {
  const webhookUrl = runtimeSecret("SLACK_PARTNER_WEBHOOK_URL");
  if (!webhookUrl) return { sent: false };

  let color = "#C9A84C";
  if (type === "ASSESSMENT_PAID") color = "#28a745";

  const slackPayload = {
    attachments: [
      {
        color,
        title: `NeuroNourish Operational Alert: ${type.replace(/_/g, " ")}`,
        fields: [
          { title: "Patient Name", value: details.name, short: true },
          { title: "Secure Email", value: details.email, short: true },
          {
            title: "Activity Context",
            value: details.extra || "No additional logs supplied.",
            short: false,
          },
        ],
        footer: "NeuroNourish Care Pipeline Engine",
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slackPayload),
    });
    return { sent: response.ok };
  } catch (error) {
    console.error("Slack operational logging delivery failure:", error);
    return { sent: false, error: error instanceof Error ? error.message : "Slack fetch failed" };
  }
}

function slackTypeFromPartnerAlert(type: PartnerAlertType): SlackAlertType | null {
  if (type === "DISCOVERY_BOOKED") return "DISCOVERY_BOOKED";
  if (type === "ASSESSMENT_PURCHASED") return "ASSESSMENT_PAID";
  if (type === "LEAD_CREATED") return "QUIZ_CAPTURED";
  return null;
}

export interface ClinicianBriefingPayload {
  name: string;
  clinicName: string;
  email: string;
  phone: string;
  practiceType: string;
  message?: string;
  leadId?: string;
}

/** Alias for B2B briefing webhook and API route payloads. */
export type ClinicianBriefingLeadPayload = ClinicianBriefingPayload;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function practiceTypeLabel(value: string | null | undefined): string {
  if (!value) return "Healthcare partner";
  const match = NN_CLINICIAN_PARTNERSHIP.roleOptions.find((o) => o.value === value);
  if (match) return match.label;
  if (value === "healthcare_partnership") return "Healthcare partnership enquiry";
  return value.replace(/_/g, " ");
}

export function clinicianBriefingPayloadFromLead(
  lead: Lead,
  input?: { clinicName?: string; message?: string },
): ClinicianBriefingPayload {
  return {
    name: `${lead.firstName} ${lead.lastName}`.trim(),
    clinicName: input?.clinicName?.trim() || "Not specified",
    email: lead.email,
    phone: lead.phone,
    practiceType: practiceTypeLabel(lead.primaryConcern ?? lead.loanPurpose),
    message: input?.message,
    leadId: lead.id,
  };
}

function clinicianBriefingAlertHtml(payload: ClinicianBriefingPayload): string {
  const workspaceUrl = `${siteUrl()}/workspace/cases/${payload.leadId ?? ""}`;
  const loginUrl = `${siteUrl()}/workspace/login`;

  return `
    <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #d4af37; padding: 24px; background-color: #fcfbf7; border-radius: 8px;">
      <h2 style="color: #1a2e3b; font-family: serif; border-bottom: 1px solid rgba(26,46,59,0.1); padding-bottom: 12px; margin-top: 0;">
        New High-Value B2B Lead Captured
      </h2>
      <p style="font-size: 14px; color: #4a5568;">A healthcare professional has requested an institutional briefing package and partner integration call for the upcoming August intake cohort.</p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #ffffff; border-radius: 4px; overflow: hidden; border: 1px solid rgba(26,46,59,0.05);">
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #edf2f7; font-weight: bold; width: 35%; color: #1a2e3b;">Clinician Name:</td>
          <td style="padding: 12px; border-bottom: 1px solid #edf2f7; color: #4a5568;">${escapeHtml(payload.name)}</td>
        </tr>
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #edf2f7; font-weight: bold; color: #1a2e3b;">Practice/Clinic:</td>
          <td style="padding: 12px; border-bottom: 1px solid #edf2f7; color: #4a5568;">${escapeHtml(payload.clinicName)}</td>
        </tr>
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #edf2f7; font-weight: bold; color: #1a2e3b;">Practice Type:</td>
          <td style="padding: 12px; border-bottom: 1px solid #edf2f7; color: #4a5568; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px;">${escapeHtml(payload.practiceType)}</td>
        </tr>
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #edf2f7; font-weight: bold; color: #1a2e3b;">Email Address:</td>
          <td style="padding: 12px; border-bottom: 1px solid #edf2f7; color: #4a5568;"><a href="mailto:${escapeHtml(payload.email)}" style="color: #d4af37; text-decoration: none;">${escapeHtml(payload.email)}</a></td>
        </tr>
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #edf2f7; font-weight: bold; color: #1a2e3b;">Contact Phone:</td>
          <td style="padding: 12px; border-bottom: 1px solid #edf2f7; color: #4a5568;">${escapeHtml(payload.phone)}</td>
        </tr>
        ${
          payload.message
            ? `
        <tr>
          <td style="padding: 12px; font-weight: bold; color: #1a2e3b; vertical-align: top;">Notes/Message:</td>
          <td style="padding: 12px; color: #4a5568; font-style: italic; line-height: 1.5;">"${escapeHtml(payload.message)}"</td>
        </tr>
        `
            : ""
        }
      </table>

      <div style="margin-top: 24px; text-align: center;">
        <a href="${payload.leadId ? workspaceUrl : loginUrl}"
           style="background-color: #1a2e3b; color: #ffffff; border: 1px solid #d4af37; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block; font-size: 14px;">
          Open NeuroNourish Workspace CRM
        </a>
      </div>
      <p style="font-size: 11px; color: #a0aec0; text-align: center; margin-top: 20px;">Automated clinical pipeline transmission securely executed.</p>
    </div>
  `;
}

export async function sendClinicianBriefingAlert(payload: ClinicianBriefingPayload) {
  const adminEmail = partnerNotifyEmail();
  const adminPhone = partnerNotifyPhone();

  const smsText = `[B2B LEAD INBOUND] Clinician Briefing Requested: ${payload.name} (${payload.clinicName}) - ${payload.practiceType}. Review workspace immediately.`;

  const emailSubject = `URGENT B2B PROSPECT: Clinician Briefing Request – ${payload.clinicName}`;
  const emailHtml = clinicianBriefingAlertHtml(payload);
  const emailPlain = [
    "New high-value B2B lead captured.",
    "",
    `Clinician: ${payload.name}`,
    `Practice/Clinic: ${payload.clinicName}`,
    `Practice type: ${payload.practiceType}`,
    `Email: ${payload.email}`,
    `Phone: ${payload.phone}`,
    payload.message ? `Message: ${payload.message}` : null,
    "",
    payload.leadId
      ? `Open in CRM: ${siteUrl()}/workspace/cases/${payload.leadId}`
      : `Workspace: ${siteUrl()}/workspace/login`,
  ]
    .filter(Boolean)
    .join("\n");

  const smsResult = await sendSms(adminPhone, smsText, {
    audience: "broker",
    leadId: payload.leadId,
    purpose: "neuronourish-clinician-briefing",
  });

  if (payload.leadId) {
    await db.activity.create({
      data: {
        leadId: payload.leadId,
        type: "AUTOMATION_RUN",
        description: smsActivityDescription("Clinician briefing alert SMS", smsResult, {
          borrower: false,
        }),
        metadata: JSON.stringify({ to: adminPhone, sent: smsResult.sent, error: smsResult.error }),
      },
    });
  }

  const emailResult = await sendEmail({
    to: adminEmail,
    subject: emailSubject,
    body: emailPlain,
    html: emailHtml,
    category: "transactional",
  });

  if (payload.leadId) {
    await db.activity.create({
      data: {
        leadId: payload.leadId,
        type: emailResult.sent ? "EMAIL_SENT" : "AUTOMATION_RUN",
        description: emailResult.sent
          ? "Clinician briefing alert email sent to care team"
          : "Clinician briefing alert email logged",
        metadata: JSON.stringify({ to: adminEmail, sent: emailResult.sent, error: emailResult.error }),
      },
    });
  }

  return { sms: smsResult, email: emailResult };
}

export type PartnerAlertType =
  | "LEAD_CREATED"
  | "DISCOVERY_BOOKED"
  | "ASSESSMENT_PURCHASED"
  | "PROGRAMME_ENROLLED";

function partnerAlertSms(lead: Lead): string {
  const stage = nnStageLabel(lead);
  const score = quizScoreFromLead(lead);
  const concern = primaryConcernFromLead(lead);
  const scorePart = score != null ? ` · Score ${score}/100` : "";
  const concernPart = concern ? ` · ${concern}` : "";
  return `NeuroNourish: ${lead.firstName} ${lead.lastName} — ${stage}${scorePart}${concernPart}. CRM: ${siteUrl()}/workspace/cases/${lead.id}`;
}

function partnerAlertEmail(lead: Lead, details?: string) {
  const stage = funnelStageFromLead(lead);
  const score = quizScoreFromLead(lead);
  const concern = primaryConcernFromLead(lead);
  return {
    subject: `NeuroNourish — ${lead.firstName} ${lead.lastName}`,
    body: [
      details,
      `Stage: ${funnelStageLabel(stage)}`,
      score != null ? `Quiz score: ${score}/100` : null,
      concern ? `Primary concern: ${concern}` : null,
      `Phone: ${lead.phone}`,
      `Email: ${lead.email}`,
      "",
      `Open in CRM: ${siteUrl()}/workspace/cases/${lead.id}`,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

export async function sendPartnerAlert(input: {
  type: PartnerAlertType;
  name: string;
  email: string;
  details: string;
  leadId?: string;
}) {
  const phone = partnerNotifyPhone();
  const notifyEmail = partnerNotifyEmail();
  const smsBody = `NeuroNourish ${input.type.replace(/_/g, " ")}: ${input.name} (${input.email}). ${input.details}${
    input.leadId ? ` CRM: ${siteUrl()}/workspace/cases/${input.leadId}` : ""
  }`;

  const smsResult = await sendSms(phone, smsBody, {
    audience: "broker",
    leadId: input.leadId,
    purpose: `neuronourish-${input.type.toLowerCase()}`,
  });

  if (input.leadId) {
    await db.activity.create({
      data: {
        leadId: input.leadId,
        type: "AUTOMATION_RUN",
        description: smsActivityDescription(`NeuroNourish ${input.type} alert SMS`, smsResult, {
          borrower: false,
        }),
        metadata: JSON.stringify({ to: phone, sent: smsResult.sent, error: smsResult.error }),
      },
    });
  }

  const emailResult = await sendEmail({
    to: notifyEmail,
    subject: `NeuroNourish — ${input.type.replace(/_/g, " ").toLowerCase()}: ${input.name}`,
    body: [input.details, `Contact: ${input.name}`, `Email: ${input.email}`, input.leadId ? `CRM: ${siteUrl()}/workspace/cases/${input.leadId}` : ""]
      .filter(Boolean)
      .join("\n"),
    category: "transactional",
  });

  if (input.leadId) {
    await db.activity.create({
      data: {
        leadId: input.leadId,
        type: emailResult.sent ? "EMAIL_SENT" : "AUTOMATION_RUN",
        description: emailResult.sent
          ? `NeuroNourish ${input.type} alert email sent`
          : `NeuroNourish ${input.type} alert email logged`,
        metadata: JSON.stringify({ to: notifyEmail, sent: emailResult.sent, error: emailResult.error }),
      },
    });
  }

  const slackType = slackTypeFromPartnerAlert(input.type);
  if (slackType) {
    void sendSlackAlert(slackType, {
      name: input.name,
      email: input.email,
      extra: input.details,
    });
  }

  return { sms: smsResult, email: emailResult };
}

export async function sendNeuronourishPartnerAlert(
  lead: Lead,
  options?: { sms?: boolean; details?: string },
) {
  const phone = partnerNotifyPhone();
  const email = partnerNotifyEmail();
  const sendSmsAlert = options?.sms !== false && Boolean(lead.phone?.trim());

  let smsResult = { sent: false as boolean, error: null as string | null };
  if (sendSmsAlert) {
    const result = await sendSms(phone, partnerAlertSms(lead), {
      audience: "broker",
      leadId: lead.id,
      purpose: "neuronourish-partner-alert",
    });
    smsResult = { sent: result.sent, error: result.error ?? null };

    await db.activity.create({
      data: {
        leadId: lead.id,
        type: "AUTOMATION_RUN",
        description: smsActivityDescription("NeuroNourish partner alert SMS", result, {
          borrower: false,
        }),
        metadata: JSON.stringify({ to: phone, sent: result.sent, error: result.error }),
      },
    });
  }

  const mail = partnerAlertEmail(lead, options?.details);
  const emailResult = await sendEmail({
    to: email,
    subject: mail.subject,
    body: mail.body,
    category: "transactional",
  });

  await db.activity.create({
    data: {
      leadId: lead.id,
      type: emailResult.sent ? "EMAIL_SENT" : "AUTOMATION_RUN",
      description: emailResult.sent
        ? "NeuroNourish partner alert email sent"
        : "NeuroNourish partner alert email logged",
      metadata: JSON.stringify({ to: email, sent: emailResult.sent, error: emailResult.error }),
    },
  });

  void sendSlackAlert("QUIZ_CAPTURED", {
    name: `${lead.firstName} ${lead.lastName}`.trim(),
    email: lead.email,
    extra: mail.body.split("\n").slice(0, 3).join(" · "),
  });

  return { sms: smsResult, email: emailResult };
}
