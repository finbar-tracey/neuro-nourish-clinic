#!/usr/bin/env npx tsx
/**
 * SMS copy 10/10 audit — GSM safety, voice, CTA rules.
 * Run: npm run sms:audit
 */
import { config } from "dotenv";

config();
import {
  captureSmsBody,
  qualifiedConfirmationSmsBody,
  noBookingFollowUpSmsBody,
  bookingReminderSmsBody,
  brokerPriorityCallSmsBody,
  priorityCallConfirmedSmsBody,
  documentRequestSmsBody,
  documentChase24hSmsBody,
  documentChase48hSmsBody,
  missedCallSmsBody,
  defaultManualSmsBody,
  SMS_SENDER_BRAND,
  smsSegmentCount,
} from "../src/lib/sms-copy";

const sampleLead = {
  id: "sample-lead-id",
  firstName: "Joseph",
  lastName: "Penman",
  loanAmount: 250_000,
  loanPurpose: "purchase",
  phone: "07445160345",
} as Parameters<typeof captureSmsBody>[0];

const FORBIDDEN = [/do not reply/i, /no reply/i, /automated message/i, /\u2014/, /\u2013/];

const templates: { name: string; body: string; broker?: boolean }[] = [
  { name: "capture", body: captureSmsBody(sampleLead) },
  { name: "qualified", body: qualifiedConfirmationSmsBody(sampleLead) },
  { name: "no-booking", body: noBookingFollowUpSmsBody(sampleLead) },
  { name: "booking-reminder", body: bookingReminderSmsBody(sampleLead, "2:30pm") },
  { name: "call-confirmed", body: priorityCallConfirmedSmsBody(sampleLead, "2:30pm") },
  {
    name: "broker-priority",
    broker: true,
    body: brokerPriorityCallSmsBody(
      sampleLead,
      "2:30pm",
      "purchase",
      "https://teams.microsoft.com/l/meetup-join/example",
    ),
  },
  { name: "document-request", body: documentRequestSmsBody(sampleLead, "https://loans.bridgingloansbroker.co.uk/upload/abc") },
  { name: "doc-chase-24h", body: documentChase24hSmsBody(sampleLead, "https://loans.bridgingloansbroker.co.uk/upload/abc") },
  { name: "doc-chase-48h", body: documentChase48hSmsBody(sampleLead, "https://loans.bridgingloansbroker.co.uk/upload/abc") },
  { name: "missed-call", body: missedCallSmsBody("Joseph") },
  { name: "manual", body: defaultManualSmsBody("Joseph") },
];

function main() {
  console.log("\n📱 SMS copy audit (10/10 BLB workflow)\n");
  console.log(`   Sender brand: ${SMS_SENDER_BRAND}`);
  console.log(`   Env sender:   ${process.env.VONAGE_SENDER_ID ?? "(not set)"}\n`);

  let passed = 0;
  let failed = 0;

  if (process.env.VONAGE_SENDER_ID && process.env.VONAGE_SENDER_ID !== SMS_SENDER_BRAND) {
    console.log(`⚠️  VONAGE_SENDER_ID should be "${SMS_SENDER_BRAND}"`);
    failed++;
  } else {
    passed++;
  }

  for (const t of templates) {
    const issues: string[] = [];
    const segments = smsSegmentCount(t.body);

    for (const re of FORBIDDEN) {
      if (re.test(t.body)) issues.push(`forbidden pattern ${re}`);
    }
    if (!t.broker && !t.body.includes("Daniel")) issues.push("missing Daniel");
    if (/[^\x00-\x7F]/.test(t.body)) issues.push("non-GSM character");

    const icon = issues.length === 0 ? "✅" : "❌";
    console.log(`${icon} ${t.name} (${t.body.length} chars, ${segments} segment${segments > 1 ? "s" : ""})`);
    if (issues.length) {
      issues.forEach((i) => console.log(`   ↳ ${i}`));
      failed++;
    } else {
      passed++;
    }
  }

  const score = Math.round((passed / (passed + failed)) * 10);
  console.log(`\n📊 Score: ${score}/10 (${passed} passed, ${failed} failed)\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
