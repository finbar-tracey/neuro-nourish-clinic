#!/usr/bin/env npx tsx
/**
 * Live Vonage SMS smoke test (10/10 borrower template).
 *
 * Run: npm run sms:test -- 353833057916
 */
import { config } from "dotenv";

config();
process.env.NOTIFICATIONS_DRY_RUN = "false";

import { qualifiedConfirmationSmsBody, SMS_SENDER_BRAND, smsSegmentCount } from "../src/lib/sms-copy";
import { sendSms, smsConfigured } from "../src/lib/sms";

function testPhone(): string | null {
  return process.argv[2]?.trim() || process.env.SMS_TEST_PHONE?.trim() || null;
}

async function main() {
  const to = testPhone();
  console.log("\n📱 Vonage SMS test (10/10 borrower template)\n");

  if (!smsConfigured()) {
    console.error("❌ Vonage not configured.");
    process.exit(1);
  }
  if (!to) {
    console.error("❌ Run: npm run sms:test -- 353833057916\n");
    process.exit(1);
  }

  const body = qualifiedConfirmationSmsBody({
    id: "test-lead",
    firstName: "Joseph",
    loanAmount: 250_000,
  } as Parameters<typeof qualifiedConfirmationSmsBody>[0]);

  const sender = process.env.VONAGE_SENDER_ID?.trim() ?? SMS_SENDER_BRAND;
  console.log(`   Sender: ${sender} (IE uses numeric)`);
  console.log(`   To:     ${to}`);
  console.log(`   Body:   ${body}`);
  console.log(`   Segments: ${smsSegmentCount(body)}\n`);

  const result = await sendSms(to, body, { audience: "borrower", purpose: "smoke-test" });

  if (result.sent) {
    console.log(`✅ SMS sent (${result.id})\n`);
    process.exit(0);
  }
  console.error(`❌ Failed: ${result.error}\n`);
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
