import {
  formatBrandAuditHealthLine,
  readBrandAuditReport,
  type BrandAuditSummary,
} from "@/lib/neuronourish-brand-report";
import { emailConfigured } from "@/lib/email";
import { isKvConfigured } from "@/lib/kv-env";
import { metaCapiConfigured, metaCapiDryRun } from "@/lib/meta-capi";
import { notificationsDryRun } from "@/lib/notifications-config";
import { runtimeEnv, runtimeSecret } from "@/lib/runtime-env";
import { smsConfigured } from "@/lib/sms";
import { isNeuronourish } from "@/lib/vertical-config";

export function checkNeuronourishGoLiveHealth() {
  const issues: string[] = [];
  const warnings: string[] = [];

  if (!isNeuronourish()) {
    issues.push("VERTICAL is not neuronourish — set VERTICAL=neuronourish on this deployment");
  }

  const publicVertical = runtimeEnv("NEXT_PUBLIC_VERTICAL")?.toLowerCase();
  if (publicVertical !== "neuronourish") {
    issues.push("NEXT_PUBLIC_VERTICAL must be neuronourish");
  }

  const staging = runtimeEnv("NN_STAGING")?.toLowerCase() === "true";

  const siteUrl = runtimeEnv("NEXT_PUBLIC_SITE_URL");
  if (!siteUrl?.startsWith("https://neuronourish.clinic")) {
    if (staging && siteUrl?.includes("vercel.app")) {
      warnings.push(`Staging site URL in use (${siteUrl}) — DNS cutover to neuronourish.clinic pending`);
    } else {
      warnings.push(
        `NEXT_PUBLIC_SITE_URL should be https://neuronourish.clinic (current: ${siteUrl ?? "unset"})`,
      );
    }
  }

  if (notificationsDryRun()) {
    if (staging) {
      warnings.push("NOTIFICATIONS_DRY_RUN is true — outbound email/SMS disabled (staging OK)");
    } else {
      issues.push("NOTIFICATIONS_DRY_RUN is true — outbound email/SMS disabled");
    }
  }

  if (metaCapiDryRun()) {
    warnings.push("META_CAPI_DRY_RUN is true — Meta CAPI disabled");
  }

  if (!runtimeSecret("WORKSPACE_SECRET")) issues.push("WORKSPACE_SECRET missing");
  if (!runtimeSecret("CRON_SECRET") && !runtimeSecret("WORKSPACE_SECRET")) {
    issues.push("CRON_SECRET missing");
  }

  if (!isKvConfigured()) issues.push("KV_REST_API_URL / KV_REST_API_TOKEN missing");
  if (!emailConfigured()) {
    if (staging) warnings.push("RESEND_API_KEY missing — email delivery disabled on staging");
    else issues.push("RESEND_API_KEY missing");
  }
  if (!runtimeEnv("RESEND_FROM")) warnings.push("RESEND_FROM not set");

  if (!smsConfigured()) warnings.push("Vonage SMS not fully configured (quiz abandon SMS)");
  if (!runtimeSecret("STRIPE_SECRET_KEY")) {
    if (staging) warnings.push("STRIPE_SECRET_KEY missing — payments disabled on staging");
    else issues.push("STRIPE_SECRET_KEY missing");
  }
  if (!runtimeSecret("STRIPE_WEBHOOK_SECRET")) {
    if (staging) warnings.push("STRIPE_WEBHOOK_SECRET missing — payment webhooks disabled on staging");
    else issues.push("STRIPE_WEBHOOK_SECRET missing");
  }
  if (!runtimeEnv("NEXT_PUBLIC_CALENDLY_URL")) {
    warnings.push("NEXT_PUBLIC_CALENDLY_URL missing — discovery page shows fallback");
  }

  if (!metaCapiConfigured()) {
    warnings.push("Meta CAPI not configured (META_CAPI_ACCESS_TOKEN or pixel ID)");
  }
  if (!runtimeEnv("NEXT_PUBLIC_META_PIXEL_ID")) {
    warnings.push("NEXT_PUBLIC_META_PIXEL_ID missing");
  }

  if (!runtimeEnv("PARTNER_NOTIFY_EMAIL") && !runtimeEnv("BROKER_NOTIFY_EMAIL")) {
    warnings.push("PARTNER_NOTIFY_EMAIL not set for ops alerts");
  }
  if (!runtimeEnv("PARTNER_NOTIFY_PHONE") && !runtimeEnv("BROKER_NOTIFY_PHONE")) {
    warnings.push("PARTNER_NOTIFY_PHONE not set for SMS care-team alerts");
  }
  if (!runtimeSecret("CALENDLY_WEBHOOK_SIGNING_KEY")) {
    warnings.push("CALENDLY_WEBHOOK_SIGNING_KEY missing — webhook signature not verified");
  }
  if (!runtimeSecret("CNS_VITAL_SIGNS_API_KEY")) {
    warnings.push("CNS_VITAL_SIGNS_API_KEY missing — automated CNS test links use placeholder URL");
  }
  if (!runtimeSecret("SLACK_PARTNER_WEBHOOK_URL")) {
    warnings.push("SLACK_PARTNER_WEBHOOK_URL missing — Slack care-team alerts disabled");
  }

  const integrationsVerified =
    Boolean(runtimeSecret("STRIPE_SECRET_KEY")) &&
    Boolean(runtimeSecret("STRIPE_WEBHOOK_SECRET")) &&
    emailConfigured() &&
    isKvConfigured() &&
    Boolean(runtimeSecret("WORKSPACE_SECRET"));

  const brandReport = readBrandAuditReport();
  const brandAudit = formatBrandAuditHealthLine(brandReport);

  let status: "healthy" | "degraded" | "unhealthy" =
    issues.length > 0 ? "unhealthy" : warnings.length > 0 ? "degraded" : "healthy";

  if (brandReport?.status === "NON_COMPLIANT") {
    status = status === "unhealthy" ? "unhealthy" : "degraded";
    warnings.push(
      `Brand build artifact non-compliant (${brandReport.passedChecks}/${brandReport.totalChecks})`,
    );
  } else if (!brandReport) {
    status = status === "unhealthy" ? "unhealthy" : "degraded";
    warnings.push("Brand build artifact missing — run build with neuronourish:brand gate");
  }

  const baseUrl = siteUrl?.replace(/\/$/, "") ?? "https://neuronourish.clinic";

  const integrations: "verified" | "verified_with_warnings" | "partial" = integrationsVerified
    ? warnings.length === 0
      ? "verified"
      : "verified_with_warnings"
    : "partial";

  return {
    status,
    ok: issues.length === 0,
    integrations,
    brand_audit: brandAudit,
    brand_report: summarizeBrandReport(brandReport),
    webhooks: {
      stripe: `${baseUrl}/api/stripe/webhook`,
      calendly: `${baseUrl}/api/webhooks/calendly`,
    },
    vertical: runtimeEnv("VERTICAL") ?? null,
    publicVertical,
    siteUrl: siteUrl ?? null,
    stripeConfigured: Boolean(runtimeSecret("STRIPE_SECRET_KEY")),
    calendlyConfigured: Boolean(runtimeEnv("NEXT_PUBLIC_CALENDLY_URL")),
    calendlyWebhookConfigured: Boolean(runtimeSecret("CALENDLY_WEBHOOK_SIGNING_KEY")),
    cnsConfigured: Boolean(runtimeSecret("CNS_VITAL_SIGNS_API_KEY")),
    partnerNotifyConfigured: Boolean(
      runtimeEnv("PARTNER_NOTIFY_EMAIL") || runtimeEnv("BROKER_NOTIFY_EMAIL"),
    ),
    resendConfigured: emailConfigured(),
    smsConfigured: smsConfigured(),
    kvConfigured: isKvConfigured(),
    metaCapiConfigured: metaCapiConfigured(),
    dryRun: notificationsDryRun(),
    issues,
    warnings,
  };
}

function summarizeBrandReport(report: BrandAuditSummary | null) {
  if (!report) return null;
  return {
    status: report.status,
    passedChecks: report.passedChecks,
    totalChecks: report.totalChecks,
    timestamp: report.timestamp,
    buildGatePass: report.buildGate.pass,
  };
}
