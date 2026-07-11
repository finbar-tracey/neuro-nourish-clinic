#!/usr/bin/env npx tsx
/**
 * Ensures broker alerts route to the client inbox — not test addresses.
 * Run: npm run notifications:audit
 * Live: NOTIFICATIONS_AUDIT_BASE_URL=https://loans.bridgingloansbroker.co.uk npm run notifications:audit
 */
import { config } from "dotenv";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import {
  CLIENT_BROKER_EMAIL,
  auditTestEmail,
  brokerNotifyEmail,
  isForbiddenNotificationRecipient,
  validateBrokerNotificationEnv,
} from "../src/lib/broker-notify";

config();
const vercelEnv = join(import.meta.dirname, "..", ".vercel/.env.production.local");
if (process.env.NOTIFICATIONS_AUDIT_ENV_FILE) {
  config({ path: process.env.NOTIFICATIONS_AUDIT_ENV_FILE, override: true });
} else if (existsSync(vercelEnv)) {
  config({ path: vercelEnv, override: true });
}

type Check = { name: string; pass: boolean; detail?: string };
const checks: Check[] = [];

function assert(name: string, pass: boolean, detail?: string) {
  checks.push({ name, pass, detail });
}

const FORBIDDEN_NEEDLES = [
  "hello@arcsight.ai",
  "joe_penman@yahoo.co.uk",
  "@arcsight.ai",
  "joe_penman",
];

function walkTsFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "generated") continue;
      walkTsFiles(full, out);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const srcRoot = join(import.meta.dirname, "..", "src");
for (const file of walkTsFiles(srcRoot)) {
  const rel = file.replace(join(import.meta.dirname, "..") + "/", "");
  if (rel === "src/lib/broker-notify.ts") continue;
  const content = readFileSync(file, "utf8");
  for (const needle of FORBIDDEN_NEEDLES) {
    if (content.includes(needle)) {
      assert(`No forbidden recipient in ${rel}`, false, `contains ${needle}`);
    }
  }
}
if (!checks.some((c) => !c.pass && c.name.startsWith("No forbidden"))) {
  assert("No forbidden test addresses in src/", true);
}

const brokerFiles = [
  "src/lib/capture-notifications.ts",
  "src/lib/journey-email-send.ts",
  "src/lib/priority-call-booking.ts",
  "src/lib/weekly-source-digest.ts",
  "src/lib/automations.ts",
];

for (const rel of brokerFiles) {
  const content = readFileSync(join(import.meta.dirname, "..", rel), "utf8");
  assert(
    `${rel} uses brokerNotifyEmail()`,
    content.includes("brokerNotifyEmail"),
  );
}

assert(
  "crm-audit uses auditTestEmail()",
  readFileSync(join(import.meta.dirname, "..", "src/lib/crm-audit.ts"), "utf8").includes(
    "auditTestEmail",
  ),
);

const broker = brokerNotifyEmail();
const audit = auditTestEmail();
assert("BROKER_NOTIFY_EMAIL not forbidden", !isForbiddenNotificationRecipient(broker), broker);
assert("CRM_AUDIT_TEST_EMAIL not forbidden", !isForbiddenNotificationRecipient(audit), audit);
assert("BROKER_NOTIFY_EMAIL is client inbox", broker.toLowerCase() === CLIENT_BROKER_EMAIL, broker);
assert("CRM_AUDIT_TEST_EMAIL is client inbox", audit.toLowerCase() === CLIENT_BROKER_EMAIL, audit);

for (const issue of validateBrokerNotificationEnv()) {
  assert(`Env: ${issue}`, false, issue);
}

async function liveCheck() {
  const base =
    process.env.NOTIFICATIONS_AUDIT_BASE_URL?.replace(/\/$/, "") ??
    process.env.CRM_GO_LIVE_BASE_URL?.replace(/\/$/, "");
  if (!base) return;

  try {
    const res = await fetch(`${base}/api/health/notifications`, {
      signal: AbortSignal.timeout(15_000),
    });
    assert("Live /api/health/notifications responds", res.ok, String(res.status));
    if (!res.ok) return;

    const data = (await res.json()) as {
      ok?: boolean;
      dryRun?: boolean;
      brokerNotifyEmail?: string;
      auditTestEmail?: string;
      issues?: string[];
    };

    assert("Production notifications ok", data.ok === true, data.issues?.join("; "));
    assert(
      "Production broker email is client inbox",
      data.brokerNotifyEmail?.toLowerCase() === CLIENT_BROKER_EMAIL,
      data.brokerNotifyEmail,
    );
    assert(
      "Production audit test email is client inbox",
      data.auditTestEmail?.toLowerCase() === CLIENT_BROKER_EMAIL,
      data.auditTestEmail,
    );
    assert("Production NOTIFICATIONS_DRY_RUN is off", data.dryRun === false);
  } catch (error) {
    assert(
      "Live /api/health/notifications",
      false,
      error instanceof Error ? error.message : "fetch failed",
    );
  }
}

async function main() {
  await liveCheck();

  const passed = checks.filter((c) => c.pass).length;
  console.log("\n📬 Notification routing audit\n");
  for (const c of checks) {
    console.log(`${c.pass ? "✅" : "❌"} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
  }
  console.log(`\n${passed}/${checks.length} passed\n`);
  process.exit(passed === checks.length ? 0 : 1);
}

void main();
