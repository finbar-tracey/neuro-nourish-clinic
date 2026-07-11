#!/usr/bin/env npx tsx
/**
 * CRM end-to-end audit. Run: npm run crm:audit
 * Requires RESEND_API_KEY in .env for live email test to CRM_AUDIT_TEST_EMAIL.
 */
import { config } from "dotenv";
config();
process.env.NOTIFICATIONS_DRY_RUN = process.env.NOTIFICATIONS_DRY_RUN ?? "true";

import { notificationsDryRun } from "../src/lib/notifications-config";
import { auditTestEmail } from "../src/lib/broker-notify";
import { crmScoreFromAudit, runCrmAudit } from "../src/lib/crm-audit";

async function main() {
  const testEmail = auditTestEmail();
  const dryRun = notificationsDryRun();
  console.log(`\n🔍 Bridging Loans Broker — CRM Audit`);
  console.log(`   Test email: ${testEmail}`);
  if (dryRun) console.log(`   Notifications: dry-run (no outbound email)\n`);
  else console.log();

  const report = await runCrmAudit({ sendTestEmail: !dryRun, cleanup: true });
  const { overall, summary } = crmScoreFromAudit(report);

  for (const c of report.checks) {
    const icon = c.passed ? "✅" : "❌";
    console.log(`${icon} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
    if (c.error) console.log(`   ↳ ${c.error}`);
  }

  console.log(`\n📊 Audit score: ${report.score}/10 checks passed`);
  console.log(`📈 CRM rating: ${overall}/10`);
  console.log(`   ${summary}\n`);

  if (report.emailSent) {
    console.log(`📧 Test email sent to ${testEmail} (Resend: ${report.resendId})\n`);
  } else if (dryRun) {
    console.log(`📧 Test email skipped (NOTIFICATIONS_DRY_RUN=true)\n`);
  } else if (!process.env.RESEND_API_KEY) {
    console.log(`⚠️  Set RESEND_API_KEY in .env to send live test email\n`);
  }

  process.exit(report.passed ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
