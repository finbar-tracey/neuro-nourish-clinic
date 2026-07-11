/**
 * Borrower SMS copy — 10/10 BLB workflow
 *
 * - Sender: BLB-Daniel (UK alpha, max 11 chars; IE uses numeric until ComReg)
 * - Voice: Daniel at BLB, personal broker — never "do not reply"
 * - One primary CTA per message (book / upload / complete); phone on reminders only
 * - GSM-7 safe (no em dashes, emoji, smart quotes)
 */
import type { Lead } from "@/generated/prisma/client";
import { notificationsDryRun } from "@/lib/notifications-config";
import { BROKER_DISPLAY_PHONE, borrowerBookUrl, borrowerResumeUrl } from "@/lib/sms-links";
import { gsmSafeSms } from "@/lib/sms-encoding";
import { smsConfigured } from "@/lib/sms";

export const SMS_SENDER_BRAND = "BLB-Daniel";

function fmtMoney(amount: number): string {
  if (amount >= 1_000_000) {
    const m = amount / 1_000_000;
    return m % 1 === 0 ? `£${m}m` : `£${m.toFixed(1)}m`;
  }
  if (amount >= 10_000) {
    return `£${Math.round(amount / 1000)}k`;
  }
  return `£${amount.toLocaleString("en-GB")}`;
}

/** Step 2 capture — resume eligibility */
export function captureSmsBody(lead: Lead) {
  return gsmSafeSms(
    `Hi ${lead.firstName}, Daniel at BLB received your ${fmtMoney(lead.loanAmount)} enquiry. He will call within 2 hours. Complete eligibility: ${borrowerResumeUrl(lead.id)}`,
  );
}

/** Meta instant form ingest — finish step 3 (no call promise). */
export function metaCompleteLinkSmsBody(lead: Lead, completeUrl: string) {
  return gsmSafeSms(
    `Hi ${lead.firstName}, Daniel at BLB here. Finish your 2-min review: ${completeUrl}`,
  );
}

/** Meta instant form chase — 2h reminder */
export function metaCompleteChase2hSmsBody(lead: Lead, completeUrl: string) {
  return gsmSafeSms(
    `Hi ${lead.firstName}, quick reminder - 2 min to finish your enquiry: ${completeUrl}`,
  );
}

/** Meta instant form chase — 72h winback nudge */
export function metaCompleteChase72hSmsBody(lead: Lead, completeUrl: string) {
  return gsmSafeSms(
    `Hi ${lead.firstName}, Daniel at BLB can still help with your ${fmtMoney(lead.loanAmount)} enquiry. Finish here: ${completeUrl}`,
  );
}

/** Step 3 qualified — book priority call */
export function qualifiedConfirmationSmsBody(lead: Lead) {
  return gsmSafeSms(
    `Hi ${lead.firstName}, Daniel at BLB has your ${fmtMoney(lead.loanAmount)} enquiry. Book your priority call: ${borrowerBookUrl(lead.id)}`,
  );
}

/** 15+ min, no booking */
export function noBookingFollowUpSmsBody(lead: Lead) {
  return gsmSafeSms(
    `Hi ${lead.firstName}, book your priority call with Daniel at BLB: ${borrowerBookUrl(lead.id)}`,
  );
}

/** ~1 hour before call */
export function bookingReminderSmsBody(lead: Lead, displayTime: string) {
  return gsmSafeSms(
    `Hi ${lead.firstName}, reminder: your call with Daniel at BLB is today at ${displayTime}. Questions? Call ${BROKER_DISPLAY_PHONE}.`,
  );
}

/** Priority call just booked */
export function priorityCallConfirmedSmsBody(lead: Lead, displayTime: string) {
  return gsmSafeSms(
    `Hi ${lead.firstName}, your call with Daniel at BLB is confirmed for ${displayTime} today. Check your email for details.`,
  );
}

/** Document request sent */
export function documentRequestSmsBody(lead: Lead, uploadLink: string) {
  return gsmSafeSms(
    `Hi ${lead.firstName}, Daniel at BLB needs documents for your enquiry. Upload here: ${uploadLink}`,
  );
}

/** Document chase 24h */
export function documentChase24hSmsBody(lead: Lead, uploadLink: string) {
  return gsmSafeSms(
    `Hi ${lead.firstName}, Daniel at BLB needs your documents. Upload: ${uploadLink}`,
  );
}

/** Document chase 48h */
export function documentChase48hSmsBody(lead: Lead, uploadLink: string) {
  return gsmSafeSms(
    `Hi ${lead.firstName}, Daniel at BLB is waiting on your documents. Upload: ${uploadLink} or call ${BROKER_DISPLAY_PHONE}.`,
  );
}

/** Missed call follow-up (workspace) */
export function missedCallSmsBody(firstName: string) {
  return gsmSafeSms(
    `Hi ${firstName}, Daniel at BLB tried to reach you. Call back on ${BROKER_DISPLAY_PHONE} when convenient.`,
  );
}

/** Daniel manual SMS from workspace */
export function defaultManualSmsBody(firstName: string) {
  return gsmSafeSms(
    `Hi ${firstName}, Daniel at BLB here. I received your enquiry - when is a good time for a quick call?`,
  );
}

// ── Broker alerts (numeric sender) ──

export function brokerNewLeadSmsBody(lead: Lead, purpose: string) {
  return gsmSafeSms(
    `New BLB lead\n${lead.firstName} ${lead.lastName}\n${fmtMoney(lead.loanAmount)}\n${purpose}\nCall within 15 mins\n${lead.phone}`,
  );
}

/** Meta partial — soft alert only (do not call yet). */
export function brokerMetaAwaitingSmsBody(
  lead: Lead,
  purpose: string,
  timeline: string,
  crmUrl: string,
) {
  return gsmSafeSms(
    `Meta enquiry\n${lead.firstName} ${lead.lastName}\n${fmtMoney(lead.loanAmount)} ${purpose}\n${timeline}\nAwaiting qualification\n${crmUrl}`,
  );
}

/** Meta qualified + urgent timeline */
export function brokerHotLeadSmsBody(lead: Lead, purpose: string) {
  return gsmSafeSms(
    `HOT Meta lead\n${lead.firstName} ${lead.lastName}\n${fmtMoney(lead.loanAmount)} ${purpose}\n7-day timeline\nCall within 2h\n${lead.phone}`,
  );
}

/** Meta qualified + 30/90 day timeline */
export function brokerWarmLeadSmsBody(lead: Lead, purpose: string) {
  return gsmSafeSms(
    `WARM Meta lead\n${lead.firstName} ${lead.lastName}\n${fmtMoney(lead.loanAmount)} ${purpose}\nQualified today - call same day\n${lead.phone}`,
  );
}

export function brokerPriorityCallSmsBody(
  lead: Lead,
  displayTime: string,
  loanPurpose: string,
  teamsLink?: string | null,
) {
  const lines = [
    "BLB call booked",
    `${lead.firstName} ${lead.lastName}`,
    `${fmtMoney(lead.loanAmount)} ${loanPurpose}`,
    displayTime,
    lead.phone,
  ];
  if (teamsLink) lines.push(`Teams: ${teamsLink}`);
  return gsmSafeSms(lines.join("\n"));
}

export function brokerCallReminderSmsBody(
  firstName: string,
  lastName: string,
  displayTime: string,
) {
  return gsmSafeSms(
    `BLB: Call with ${firstName} ${lastName} in ~1 hour (${displayTime}).`,
  );
}

export function brokerDocumentsCompleteSmsBody(firstName: string, lastName: string) {
  return gsmSafeSms(`BLB: All documents uploaded - ${firstName} ${lastName}. Review in workspace.`);
}

/** Win-back day 3 — short nudge */
export function winbackSmsDay3Body(lead: Lead) {
  return gsmSafeSms(
    `Hi ${lead.firstName}, Daniel at BLB - still happy to help with your ${fmtMoney(lead.loanAmount)} bridging enquiry. Book a call: ${borrowerBookUrl(lead.id)}`,
  );
}

/** Win-back day 30 — final SMS check-in */
export function winbackSmsDay30Body(lead: Lead) {
  return gsmSafeSms(
    `Hi ${lead.firstName}, Daniel at BLB here if bridging finance becomes relevant again. Request a quote anytime: ${borrowerBookUrl(lead.id)}`,
  );
}

export const WINBACK_SMS_BODIES: Record<"winback-sms-day-3" | "winback-sms-day-30", (lead: Lead) => string> = {
  "winback-sms-day-3": winbackSmsDay3Body,
  "winback-sms-day-30": winbackSmsDay30Body,
};

/** Qualified lead booking chase — alternating SMS by day */
export function qualifiedBookingChaseSmsBody(lead: Lead, day: number) {
  if (day >= 6) {
    return gsmSafeSms(
      `Hi ${lead.firstName}, last chance to book your call with Daniel at BLB on your ${fmtMoney(lead.loanAmount)} enquiry: ${borrowerBookUrl(lead.id)}`,
    );
  }
  if (day >= 4) {
    return gsmSafeSms(
      `Hi ${lead.firstName}, Daniel at BLB is ready to review your ${fmtMoney(lead.loanAmount)} enquiry. Book here: ${borrowerBookUrl(lead.id)}`,
    );
  }
  if (day >= 2) {
    return gsmSafeSms(
      `Hi ${lead.firstName}, quick nudge - book your priority call with Daniel at BLB: ${borrowerBookUrl(lead.id)}`,
    );
  }
  return gsmSafeSms(
    `Hi ${lead.firstName}, Daniel at BLB tried to reach you. Book your priority call: ${borrowerBookUrl(lead.id)}`,
  );
}

export const SMS_NOT_CONFIGURED = "SMS logged (Vonage not configured)";

type SmsResult = { sent: boolean; error?: string };

/** Timeline label for SMS automations — correct in dry-run, live, and unconfigured states. */
export function smsActivityDescription(
  label: string,
  result: SmsResult,
  options?: { borrower?: boolean },
): string {
  if (result.sent) {
    return options?.borrower === false ? `${label} sent` : `${label} sent to lead`;
  }
  if (result.error) return `${label} failed: ${result.error}`;
  if (notificationsDryRun() && smsConfigured()) return `${label} logged (dry-run)`;
  if (!smsConfigured()) return `${label} logged (Vonage not configured)`;
  return `${label} logged`;
}

/** GSM-7 single-segment target for cost control */
export const SMS_SEGMENT_TARGET = 160;

export function smsSegmentCount(body: string): number {
  const len = gsmSafeSms(body).length;
  return len <= 160 ? 1 : Math.ceil(len / 153);
}
