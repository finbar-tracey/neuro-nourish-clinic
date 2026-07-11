import { NextResponse } from "next/server";

import {
  auditTestEmail,
  brokerNotifyEmail,
  brokerNotifyPhone,
  validateBrokerNotificationEnv,
} from "@/lib/broker-notify";
import { emailConfigured } from "@/lib/email";
import { notificationsDryRun } from "@/lib/notifications-config";
import { smsConfigured } from "@/lib/sms";
import { verifyVonageCredentials } from "@/lib/vonage-auth";

/** Read-only notification routing check (for go-live / post-deploy verification). */
export async function GET() {
  const issues = validateBrokerNotificationEnv();
  const vonage = smsConfigured() ? await verifyVonageCredentials() : { ok: false, error: "not configured" };
  if (smsConfigured() && !vonage.ok) {
    issues.push(`Vonage credentials invalid: ${vonage.error ?? "unknown"}`);
  }

  return NextResponse.json({
    ok: issues.length === 0,
    dryRun: notificationsDryRun(),
    resendConfigured: emailConfigured(),
    smsConfigured: smsConfigured(),
    vonageAuthOk: vonage.ok,
    vonageBalance: vonage.balance,
    brokerNotifyEmail: brokerNotifyEmail(),
    auditTestEmail: auditTestEmail(),
    brokerNotifyPhone: brokerNotifyPhone(),
    issues,
  });
}
