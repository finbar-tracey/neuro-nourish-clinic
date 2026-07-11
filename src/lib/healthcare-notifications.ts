import type { Lead } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { brandedEmailHtml } from "@/lib/email-templates";
import { runtimeEnv } from "@/lib/runtime-env";
import {
  healthcarePartnerAlertSmsBody,
  healthcareQualifiedEmail,
  healthcareQualifiedSmsBody,
} from "@/lib/healthcare-comms-copy";
import { partnerNotifyPhone } from "@/lib/vertical-config";
import { sendSms } from "@/lib/sms";
import { smsActivityDescription } from "@/lib/sms-copy";

function siteUrl() {
  const raw = runtimeEnv("NEXT_PUBLIC_SITE_URL");
  if (raw?.startsWith("http")) return raw;
  if (raw) return `https://${raw}`;
  return "https://bookedconsult.com";
}

export async function sendHealthcarePartnerAlert(lead: Lead) {
  const body = healthcarePartnerAlertSmsBody(lead);
  const phone = partnerNotifyPhone();
  const result = await sendSms(phone, body, {
    audience: "broker",
    leadId: lead.id,
    purpose: "healthcare-partner-alert",
  });

  await db.activity.create({
    data: {
      leadId: lead.id,
      type: "AUTOMATION_RUN",
      description: smsActivityDescription("Healthcare partner alert SMS", result, { borrower: false }),
      metadata: JSON.stringify({ to: phone, sent: result.sent, error: result.error }),
    },
  });

  return result;
}

export async function sendHealthcareQualifiedConfirmation(lead: Lead) {
  const url = siteUrl();
  const smsBody = healthcareQualifiedSmsBody(lead, url);
  const smsResult = await sendSms(lead.phone, smsBody, {
    audience: "borrower",
    leadId: lead.id,
    purpose: "healthcare-qualified-confirmation",
  });

  await db.activity.create({
    data: {
      leadId: lead.id,
      type: smsResult.sent ? "SMS_SENT" : "AUTOMATION_RUN",
      description: smsResult.sent
        ? "Healthcare qualified confirmation SMS sent"
        : "Healthcare qualified confirmation SMS logged",
      metadata: JSON.stringify({ sent: smsResult.sent, error: smsResult.error }),
    },
  });

  const email = healthcareQualifiedEmail(lead, url);
  const emailResult = await sendEmail({
    to: lead.email,
    subject: email.subject,
    body: email.body,
    category: "transactional",
    htmlOptions: {
      cta: email.cta,
      stageLabel: "Implant consultation enquiry",
      preheader: email.subject,
      showPhoneCta: false,
      showDanielSignature: false,
      healthcareBrand: true,
    },
  });

  await db.activity.create({
    data: {
      leadId: lead.id,
      type: emailResult.sent ? "EMAIL_SENT" : "AUTOMATION_RUN",
      description: emailResult.sent
        ? "Healthcare qualified confirmation email sent"
        : "Healthcare qualified confirmation email logged",
      metadata: JSON.stringify({ subject: email.subject, sent: emailResult.sent, error: emailResult.error }),
    },
  });

  return { sms: smsResult, email: emailResult };
}
