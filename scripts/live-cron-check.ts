#!/usr/bin/env npx tsx
/**
 * Ping production cron endpoint (P1 ops check).
 * Requires CRON_SECRET and CRM_GO_LIVE_BASE_URL (or POSTLAUNCH_BASE_URL).
 *
 * Run:
 *   CRM_GO_LIVE_BASE_URL=https://loans.bridgingloansbroker.co.uk npm run cron:check
 */
import { config } from "dotenv";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const vercelEnv = resolve(".vercel/.env.production.local");
config();
if (existsSync(vercelEnv)) {
  for (const line of readFileSync(vercelEnv, "utf8").split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    const value = match[2].trim().replace(/^"(.*)"$/, "$1");
    if (value) process.env[match[1]] = value;
  }
}

const baseUrl = (
  process.env.CRM_GO_LIVE_BASE_URL ??
  process.env.POSTLAUNCH_BASE_URL ??
  "https://loans.bridgingloansbroker.co.uk"
).replace(/\/$/, "");

const secret = process.env.CRON_SECRET ?? process.env.WORKSPACE_SECRET;

async function main() {
  console.log("\n⏱️  Cron endpoint check\n");

  if (!secret) {
    console.log("❌ CRON_SECRET (or WORKSPACE_SECRET) not set locally.");
    console.log("   Set in .env or run: vercel env run -e production -- npm run cron:check\n");
    process.exit(1);
  }

  const url = `${baseUrl}/api/cron/process-idle`;
  console.log(`GET ${url}`);

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${secret}` },
  });

  const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };

  if (res.status === 401) {
    console.log("❌ Unauthorized — CRON_SECRET mismatch with production.\n");
    process.exit(1);
  }

  if (!res.ok || body.ok !== true) {
    console.log(`❌ Cron failed — status ${res.status}`, body.error ?? "");
    process.exit(1);
  }

  console.log("✅ Cron responded ok: true");
  console.log("   idle / nurture / operational jobs ran on server.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
