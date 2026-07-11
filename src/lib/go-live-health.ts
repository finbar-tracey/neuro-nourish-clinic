import {
  auditTestEmail,
  brokerNotifyEmail,
  brokerNotifyPhone,
  validateBrokerNotificationEnv,
} from "@/lib/broker-notify";
import { getCrmBackupMeta, isCrmBackupStale, type CrmStoreWithBackup } from "@/lib/crm-backup-meta";
import { readCrmStore } from "@/lib/crm-persistence";
import { emailConfigured } from "@/lib/email";
import { isKvConfigured, kvRestFetch } from "@/lib/kv-env";
import { metaCapiConfigured, metaCapiDryRun } from "@/lib/meta-capi";
import { notificationsDryRun } from "@/lib/notifications-config";
import { runtimeEnv, runtimeSecret, vonageApiSecret } from "@/lib/runtime-env";
import { smsConfigured } from "@/lib/sms";
import { verifyVonageCredentials } from "@/lib/vonage-auth";

async function verifyResend(): Promise<{ ok: boolean; error?: string }> {
  const apiKey = runtimeSecret("RESEND_API_KEY");
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY missing" };

  try {
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (res.ok) return { ok: true };
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    return { ok: false, error: data.message ?? `HTTP ${res.status}` };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Resend check failed",
    };
  }
}

async function verifyKv(): Promise<{ ok: boolean; error?: string }> {
  if (!isKvConfigured()) {
    return { ok: false, error: "KV_REST_API_URL or KV_REST_API_TOKEN missing" };
  }

  try {
    const res = await kvRestFetch("/ping");
    if (res.ok) return { ok: true };
    return { ok: false, error: `KV ping HTTP ${res.status}` };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "KV ping failed",
    };
  }
}

async function verifyGraph(): Promise<{ ok: boolean; configured: boolean; error?: string }> {
  const tenantId = runtimeEnv("MICROSOFT_TENANT_ID") || runtimeEnv("MS_GRAPH_TENANT_ID");
  const clientId = runtimeEnv("MICROSOFT_CLIENT_ID") || runtimeEnv("MS_GRAPH_CLIENT_ID");
  const clientSecret =
    runtimeSecret("MICROSOFT_CLIENT_SECRET") || runtimeSecret("MS_GRAPH_CLIENT_SECRET");
  const organizer =
    runtimeEnv("BROKER_CALENDAR_EMAIL") ||
    runtimeEnv("MICROSOFT_USER_ID") ||
    runtimeEnv("MS_GRAPH_ORGANIZER_EMAIL");

  if (!tenantId || !clientId || !clientSecret || !organizer) {
    return { ok: true, configured: false };
  }

  try {
    const tokenRes = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          scope: "https://graph.microsoft.com/.default",
          grant_type: "client_credentials",
        }),
      },
    );

    if (!tokenRes.ok) {
      const body = await tokenRes.text().catch(() => "");
      return {
        ok: false,
        configured: true,
        error: `Graph token HTTP ${tokenRes.status}: ${body.slice(0, 120)}`,
      };
    }

    const data = (await tokenRes.json()) as { access_token?: string };
    if (!data.access_token) {
      return { ok: false, configured: true, error: "Graph token missing access_token" };
    }

    return { ok: true, configured: true };
  } catch (error) {
    return {
      ok: false,
      configured: true,
      error: error instanceof Error ? error.message : "Graph check failed",
    };
  }
}

function secretIntegrityIssues(): string[] {
  const issues: string[] = [];

  const vonageSecret = vonageApiSecret();
  if (smsConfigured() && vonageSecret && vonageSecret.length < 20) {
    issues.push(
      "VONAGE_API_SECRET looks truncated on server — set VONAGE_API_SECRET_B64 on Vercel",
    );
  }

  const msSecret =
    runtimeSecret("MICROSOFT_CLIENT_SECRET") || runtimeSecret("MS_GRAPH_CLIENT_SECRET");
  const graphConfigured = Boolean(
    (runtimeEnv("MICROSOFT_TENANT_ID") || runtimeEnv("MS_GRAPH_TENANT_ID")) &&
      (runtimeEnv("MICROSOFT_CLIENT_ID") || runtimeEnv("MS_GRAPH_CLIENT_ID")) &&
      msSecret,
  );
  if (graphConfigured && msSecret && msSecret.length < 20) {
    issues.push(
      "MICROSOFT_CLIENT_SECRET looks truncated — set MICROSOFT_CLIENT_SECRET_B64 on Vercel",
    );
  }

  return issues;
}

export async function checkGoLiveHealth() {
  const issues = [...validateBrokerNotificationEnv(), ...secretIntegrityIssues()];

  const dryRun = notificationsDryRun();
  if (dryRun) issues.push("NOTIFICATIONS_DRY_RUN is true — outbound SMS/email disabled");

  const metaDryRun = metaCapiDryRun();
  if (metaDryRun) issues.push("META_CAPI_DRY_RUN is true — Meta CAPI disabled");

  const workspaceSecret = runtimeSecret("WORKSPACE_SECRET");
  const cronSecret = runtimeSecret("CRON_SECRET");
  if (!workspaceSecret) issues.push("WORKSPACE_SECRET missing");
  if (!cronSecret && !workspaceSecret) {
    issues.push("CRON_SECRET missing (falls back to WORKSPACE_SECRET when set)");
  }

  const siteUrl = runtimeEnv("NEXT_PUBLIC_SITE_URL");
  if (!siteUrl?.startsWith("https://")) {
    issues.push("NEXT_PUBLIC_SITE_URL must be https://loans.bridgingloansbroker.co.uk");
  }

  const resend = emailConfigured() ? await verifyResend() : { ok: false, error: "not configured" };
  if (emailConfigured() && !resend.ok) {
    issues.push(`Resend credentials invalid: ${resend.error ?? "unknown"}`);
  }

  const vonage = smsConfigured() ? await verifyVonageCredentials() : { ok: false, error: "not configured" };
  if (smsConfigured() && !vonage.ok) {
    issues.push(`Vonage credentials invalid: ${vonage.error ?? "unknown"}`);
  }

  const kv = await verifyKv();
  if (!kv.ok) issues.push(`KV unavailable: ${kv.error ?? "unknown"}`);

  const blobConfigured = Boolean(runtimeSecret("BLOB_READ_WRITE_TOKEN"));
  if (!blobConfigured) issues.push("BLOB_READ_WRITE_TOKEN missing — document uploads will fail");

  const graph = await verifyGraph();
  if (graph.configured && !graph.ok) {
    issues.push(`Microsoft Graph invalid: ${graph.error ?? "unknown"}`);
  }

  if (!metaCapiConfigured()) {
    issues.push("Meta CAPI not configured (META_CAPI_ACCESS_TOKEN or pixel ID missing)");
  }

  const crmStore = (await readCrmStore()) as CrmStoreWithBackup;
  const crmBackupMeta = getCrmBackupMeta(crmStore);
  const crmBackupStale = isCrmBackupStale(crmBackupMeta);
  if (crmBackupStale && !dryRun) {
    issues.push("CRM weekly backup is stale or missing (>8 days since last backup)");
  }

  return {
    ok: issues.length === 0,
    dryRun,
    metaCapiDryRun: metaDryRun,
    resendConfigured: emailConfigured(),
    resendAuthOk: resend.ok,
    smsConfigured: smsConfigured(),
    vonageAuthOk: vonage.ok,
    vonageBalance: vonage.balance,
    kvOk: kv.ok,
    blobConfigured,
    graphConfigured: graph.configured,
    graphAuthOk: graph.configured ? graph.ok : null,
    metaCapiConfigured: metaCapiConfigured(),
    workspaceSecretSet: Boolean(workspaceSecret),
    cronSecretSet: Boolean(cronSecret),
    brokerNotifyEmail: brokerNotifyEmail(),
    auditTestEmail: auditTestEmail(),
    brokerNotifyPhone: brokerNotifyPhone(),
    siteUrl: siteUrl ?? null,
    crmBackup: {
      lastAt: crmBackupMeta.lastCrmBackupAt,
      lastWeekKey: crmBackupMeta.lastCrmBackupWeekKey,
      checksum: crmBackupMeta.lastCrmBackupChecksum?.slice(0, 8) ?? null,
      stale: crmBackupStale,
    },
    issues,
  };
}
