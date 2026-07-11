import { notificationsDryRun } from "@/lib/notifications-config";
import {
  isHealthcare,
  partnerNotifyEmail as verticalPartnerEmail,
  partnerNotifyPhone as verticalPartnerPhone,
} from "@/lib/vertical-config";

/** Client broker inbox — all internal alert emails should route here in production. */
export const CLIENT_BROKER_EMAIL = "daniel@bridgingloansbroker.co.uk";

const FORBIDDEN_RECIPIENT_PATTERNS = [
  /@arcsight\.ai$/i,
  /joe_penman/i,
  /@yahoo\.co\.uk$/i,
  /@test\.local$/i,
] as const;

const FORBIDDEN_RECIPIENT_EXACT = new Set(
  ["hello@arcsight.ai", "joe_penman@yahoo.co.uk"].map((e) => e.toLowerCase()),
);

export function brokerNotifyEmail(): string {
  return verticalPartnerEmail();
}

/** Daniel's mobile — broker SMS alerts (new lead, booking, docs). Not the public office line. */
export const CLIENT_BROKER_MOBILE = "+447445160345";

export function brokerNotifyPhone(): string {
  return verticalPartnerPhone();
}

/** Workspace CRM audit button + `npm run crm:audit` live test recipient. */
export function auditTestEmail(): string {
  return (
    process.env.CRM_AUDIT_TEST_EMAIL?.trim() ||
    process.env.BROKER_NOTIFY_EMAIL?.trim() ||
    CLIENT_BROKER_EMAIL
  );
}

export function isForbiddenNotificationRecipient(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return true;
  if (FORBIDDEN_RECIPIENT_EXACT.has(normalized)) return true;
  return FORBIDDEN_RECIPIENT_PATTERNS.some((pattern) => pattern.test(normalized));
}

/** Runtime + deploy-time validation for broker-facing notification env. */
export function validateBrokerNotificationEnv(): string[] {
  const issues: string[] = [];

  if (notificationsDryRun()) {
    issues.push("NOTIFICATIONS_DRY_RUN=true — outbound SMS/email are suppressed");
  }

  for (const [label, email] of [
    ["BROKER_NOTIFY_EMAIL", brokerNotifyEmail()],
    ["CRM_AUDIT_TEST_EMAIL", auditTestEmail()],
  ] as const) {
    if (isForbiddenNotificationRecipient(email)) {
      issues.push(`${label} is a blocked test address: ${email}`);
    } else if (
      isHealthcare() &&
      email.toLowerCase() === CLIENT_BROKER_EMAIL
    ) {
      issues.push(`${label} still points at BLB Daniel inbox — set PARTNER_NOTIFY_EMAIL`);
    } else if (
      !isHealthcare() &&
      email.toLowerCase() !== CLIENT_BROKER_EMAIL
    ) {
      issues.push(`${label} is ${email} (expected ${CLIENT_BROKER_EMAIL})`);
    }
  }

  const from = process.env.RESEND_FROM?.trim() ?? "";
  if (from && isHealthcare()) {
    if (!from.toLowerCase().includes("bookedconsult")) {
      issues.push(`RESEND_FROM should use bookedconsult.com for healthcare deploy`);
    }
  } else if (from && !from.toLowerCase().includes("bridgingloansbroker.co.uk")) {
    issues.push(`RESEND_FROM should use the verified bridgingloansbroker.co.uk domain`);
  }

  return issues;
}
