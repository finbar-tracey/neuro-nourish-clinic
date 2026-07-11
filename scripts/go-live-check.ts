#!/usr/bin/env npx tsx
/**
 * Go-live environment checklist — verifies required env vars are set.
 * Uses local .env, then .vercel/.env.production.local, then `vercel env ls production`
 * (Vercel masks secret values in pulled files).
 *
 * Run: npm run go-live:check
 */
import { spawnSync } from "node:child_process";
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const vercelEnv = resolve(".vercel/.env.production.local");
config();
if (process.env.GO_LIVE_ENV_FILE) {
  config({ path: process.env.GO_LIVE_ENV_FILE, override: true });
} else if (existsSync(vercelEnv)) {
  config({ path: vercelEnv, override: true });
}

type EnvCheck = {
  key: string;
  required: boolean;
  category: string;
  note?: string;
};

const CHECKS: EnvCheck[] = [
  { key: "KV_REST_API_URL", required: true, category: "Persistence", note: "Required on Vercel" },
  { key: "KV_REST_API_TOKEN", required: true, category: "Persistence" },
  { key: "WORKSPACE_SECRET", required: true, category: "Auth" },
  { key: "CRON_SECRET", required: true, category: "Auth", note: "Vercel Cron" },
  { key: "NEXT_PUBLIC_SITE_URL", required: true, category: "Site" },
  { key: "NOTIFICATIONS_DRY_RUN", required: true, category: "Notifications", note: "Must not be true in prod" },
  { key: "RESEND_API_KEY", required: true, category: "Email" },
  { key: "RESEND_FROM", required: true, category: "Email" },
  { key: "BROKER_NOTIFY_EMAIL", required: true, category: "Email", note: "daniel@bridgingloansbroker.co.uk" },
  { key: "VONAGE_API_KEY", required: true, category: "SMS" },
  { key: "VONAGE_API_SECRET", required: true, category: "SMS", note: "Or VONAGE_API_SECRET_B64 on Vercel" },
  { key: "VONAGE_FROM_NUMBER", required: true, category: "SMS" },
  { key: "VONAGE_SENDER_ID", required: false, category: "SMS", note: "UK borrower brand sender (max 11 chars)" },
  { key: "BROKER_NOTIFY_PHONE", required: true, category: "SMS" },
  { key: "BLOB_READ_WRITE_TOKEN", required: true, category: "Documents", note: "Vercel Blob" },
  { key: "MICROSOFT_TENANT_ID", required: false, category: "Microsoft Graph" },
  { key: "MICROSOFT_CLIENT_ID", required: false, category: "Microsoft Graph" },
  { key: "MICROSOFT_CLIENT_SECRET", required: false, category: "Microsoft Graph" },
  { key: "BROKER_CALENDAR_EMAIL", required: false, category: "Microsoft Graph" },
  { key: "NEXT_PUBLIC_META_PIXEL_ID", required: false, category: "Meta" },
  { key: "CRM_AUDIT_TEST_EMAIL", required: false, category: "Email", note: "daniel@bridgingloansbroker.co.uk" },
  { key: "META_CAPI_ACCESS_TOKEN", required: false, category: "Meta" },
];

function localValue(key: string): string {
  return process.env[key]?.trim() ?? "";
}

function fetchVercelProductionKeys(): Set<string> {
  const result = spawnSync("npx", ["vercel", "env", "ls", "production"], {
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  const keys = new Set<string>();
  if (result.status !== 0) return keys;

  for (const line of result.stdout.split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s+Encrypted/);
    if (match) keys.add(match[1]);
  }
  return keys;
}

function isConfigured(key: string, vercelKeys: Set<string>): boolean {
  if (localValue(key)) return true;
  if (key === "VONAGE_API_SECRET" && vercelKeys.has("VONAGE_API_SECRET_B64")) return true;
  if (key === "MICROSOFT_CLIENT_SECRET" && vercelKeys.has("MICROSOFT_CLIENT_SECRET_B64")) {
    return true;
  }
  return vercelKeys.has(key);
}

function notificationsLive(vercelKeys: Set<string>): { pass: boolean; detail?: string } {
  const local = localValue("NOTIFICATIONS_DRY_RUN");
  if (local === "true") {
    return { pass: false, detail: "set to true — outbound notifications disabled" };
  }
  if (local === "false") {
    return { pass: true, detail: "false" };
  }
  if (vercelKeys.has("NOTIFICATIONS_DRY_RUN")) {
    return { pass: true, detail: "encrypted on Vercel — confirm value is false or remove key" };
  }
  return { pass: true, detail: "unset (live)" };
}

function brokerEmailLive(
  key: "BROKER_NOTIFY_EMAIL" | "CRM_AUDIT_TEST_EMAIL",
  vercelKeys: Set<string>,
): {
  pass: boolean;
  detail?: string;
} {
  const value = localValue(key);
  if (!value) {
    if (key === "CRM_AUDIT_TEST_EMAIL" && !vercelKeys.has(key)) {
      return { pass: true, detail: "falls back to BROKER_NOTIFY_EMAIL" };
    }
    if (vercelKeys.has(key)) {
      return { pass: true, detail: "encrypted — verify daniel@bridgingloansbroker.co.uk in Vercel" };
    }
    return { pass: false, detail: "not set" };
  }
  const lower = value.toLowerCase();
  if (lower.includes("arcsight") || lower.includes("yahoo") || lower.includes("joe_penman")) {
    return { pass: false, detail: `test address: ${value}` };
  }
  if (lower !== "daniel@bridgingloansbroker.co.uk") {
    return { pass: false, detail: `expected daniel@bridgingloansbroker.co.uk, got ${value}` };
  }
  return { pass: true, detail: value };
}

function main() {
  console.log("\n🔑 Go-live environment checklist\n");

  const vercelKeys = fetchVercelProductionKeys();
  if (vercelKeys.size > 0) {
    console.log(`(Also checked Vercel Production — ${vercelKeys.size} keys listed)\n`);
  } else {
    console.log("(Run `vercel link` + `vercel env ls production` for remote key check)\n");
  }

  let requiredPass = 0;
  let requiredTotal = 0;
  let optionalPass = 0;
  let optionalTotal = 0;

  const byCategory = new Map<string, EnvCheck[]>();
  for (const check of CHECKS) {
    const list = byCategory.get(check.category) ?? [];
    list.push(check);
    byCategory.set(check.category, list);
  }

  for (const [category, checks] of byCategory) {
    console.log(`── ${category} ──`);
    for (const check of checks) {
      let pass = false;
      let extra = "";

      if (check.key === "NOTIFICATIONS_DRY_RUN") {
        const result = notificationsLive(vercelKeys);
        pass = result.pass;
        extra = result.detail ? ` — ${result.detail}` : "";
      } else if (check.key === "BROKER_NOTIFY_EMAIL" || check.key === "CRM_AUDIT_TEST_EMAIL") {
        const configured = isConfigured(check.key, vercelKeys) || check.key === "CRM_AUDIT_TEST_EMAIL";
        const result = brokerEmailLive(check.key, vercelKeys);
        pass = configured && result.pass;
        extra = result.detail ? ` — ${result.detail}` : "";
      } else {
        pass = isConfigured(check.key, vercelKeys);
      }

      const icon = pass ? "✅" : check.required ? "❌" : "⚠️ ";
      const suffix = check.note ? ` (${check.note})` : "";
      console.log(`${icon} ${check.key}${suffix}${extra}`);

      if (check.required) {
        requiredTotal++;
        if (pass) requiredPass++;
      } else {
        optionalTotal++;
        if (pass) optionalPass++;
      }
    }
    console.log();
  }

  const readiness = Math.round((requiredPass / Math.max(requiredTotal, 1)) * 100);
  console.log(`Required: ${requiredPass}/${requiredTotal} (${readiness}% ready)`);
  console.log(`Optional: ${optionalPass}/${optionalTotal} configured`);
  console.log(
    readiness === 100
      ? "\n✅ All required production keys present.\n"
      : "\n⏳ Add missing keys in Vercel → Settings → Environment Variables, then redeploy.\n",
  );

  process.exit(requiredPass === requiredTotal ? 0 : 1);
}

main();
