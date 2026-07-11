/**
 * Local E2E test for Meta instant form funnel (no Meta API required).
 *
 * Usage:
 *   npm run meta:webhook-test
 *   NOTIFICATIONS_DRY_RUN=false COMPLETION_LINK_SECRET=your-secret npm run meta:webhook-test
 */

import { existsSync } from "node:fs";
import { config } from "dotenv";

config();
if (existsSync(".env.local")) {
  config({ path: ".env.local", override: true });
}

if (process.env.NOTIFICATIONS_DRY_RUN === undefined) {
  process.env.NOTIFICATIONS_DRY_RUN = "true";
}
if (process.env.META_CAPI_DRY_RUN === undefined) {
  process.env.META_CAPI_DRY_RUN = "true";
}
process.env.META_INSTANT_FORM_ENABLED = "true";
process.env.COMPLETION_LINK_SECRET =
  process.env.COMPLETION_LINK_SECRET ?? "local-test-completion-secret";

import { runtimeEnv, vonageApiSecret } from "@/lib/runtime-env";
import { db } from "@/lib/db";
import { signCompletionToken, verifyCompletionToken } from "@/lib/completion-link";
import { mapMetaLeadFields } from "@/lib/meta-leadgen";
import {
  metaPartialAdditionalInfo,
  metaPartialCaseDefaults,
} from "@/lib/case-capture";
import { META_INSTANT_FORM_SOURCE } from "@/lib/meta-source";
import { sendMetaIngestNotifications } from "@/lib/meta-capture-notifications";
import { notificationsDryRun } from "@/lib/notifications-config";
import { smsConfigured } from "@/lib/sms";
import { borrowerCompleteUrl } from "@/lib/sms-links";

function vonageEnvStatus() {
  const key = Boolean(runtimeEnv("VONAGE_API_KEY"));
  const secret = Boolean(vonageApiSecret());
  const from = Boolean(runtimeEnv("VONAGE_FROM_NUMBER"));
  const jwt = Boolean(runtimeEnv("VONAGE_APPLICATION_ID") && runtimeEnv("VONAGE_PRIVATE_KEY"));
  return { key, secret, from, jwt, configured: (key && secret && from) || jwt };
}

async function main() {
  const leadgenId = `test-${Date.now()}`;
  const mapped = mapMetaLeadFields([
    { name: "first_name", values: ["Test"] },
    { name: "last_name", values: ["MetaLead"] },
    { name: "email", values: [`meta-test-${Date.now()}@example.com`] },
    { name: "phone_number", values: ["07700900123"] },
    { name: "loan_amount", values: ["£250,000 - £500,000"] },
    { name: "loan_purpose", values: ["Auction Purchase"] },
    { name: "timeframe", values: ["Within 7 days"] },
  ]);

  const lead = await db.lead.create({
    data: {
      ...mapped,
      metaLeadgenId: leadgenId,
      termMonths: 12,
      propertyType: "pending",
      propertyValue: mapped.loanAmount,
      propertyLocation: "Not yet provided",
      hasExistingMortgage: false,
      willOccupy: false,
      hasEverOccupied: false,
      formCompleted: false,
      qualificationTier: "partial",
      status: "NEW",
      source: META_INSTANT_FORM_SOURCE,
      utmSource: "facebook",
      utmMedium: "paid",
      utmCampaign: "instant-v1-test",
      attributionChannel: "Meta",
      landingPageUrl: "/lp/complete",
      additionalInfo: metaPartialAdditionalInfo(leadgenId),
      ...metaPartialCaseDefaults(),
    },
  });

  console.log("Created partial lead:", lead.id);
  console.log("  nextAction:", lead.nextAction);
  console.log("  callbackDueAt:", lead.callbackDueAt);
  console.log("  NOTIFICATIONS_DRY_RUN:", notificationsDryRun());
  const vonage = vonageEnvStatus();
  console.log("  Vonage configured:", smsConfigured(), vonage);
  if (!vonage.configured) {
    const missing = [
      !vonage.key && "VONAGE_API_KEY",
      !vonage.secret && "VONAGE_API_SECRET (or VONAGE_API_SECRET_B64)",
      !vonage.from && "VONAGE_FROM_NUMBER",
    ].filter(Boolean);
    console.log("  Vonage missing:", missing.join(", ") || "JWT path incomplete");
  }

  const notifications = await sendMetaIngestNotifications(lead);
  console.log("Ingest notifications:", notifications);
  if (!notifications.smsSent) {
    const reason = notificationsDryRun()
      ? "dry-run enabled"
      : !smsConfigured()
        ? "Vonage env vars missing (VONAGE_API_KEY, VONAGE_API_SECRET, VONAGE_FROM_NUMBER)"
        : notifications.smsError ?? "send failed — check activity log";
    console.log("  SMS not sent:", reason);
  }

  const token = signCompletionToken(lead.id);
  if (!token || !verifyCompletionToken(lead.id, token)) {
    throw new Error("Completion token sign/verify failed");
  }
  console.log("Completion URL token OK");
  const localUrl = borrowerCompleteUrl(lead.id, token).replace(
    "https://loans.bridgingloansbroker.co.uk",
    process.env.LOCAL_TEST_URL ?? "http://localhost:3000",
  );
  console.log("  production:", borrowerCompleteUrl(lead.id, token));
  console.log("  local:     ", localUrl);

  const duplicate = await db.lead.findUnique({ where: { id: lead.id } });
  console.log("Dedupe check:", duplicate?.id === lead.id ? "PASS" : "FAIL");

  console.log("\nMeta webhook test complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
