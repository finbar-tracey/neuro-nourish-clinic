#!/usr/bin/env npx tsx
/**
 * Clear all leads, notes, timeline, tasks, and documents from the CRM store.
 * Keeps automation rule definitions. Does not send notifications.
 *
 * Run: npm run workspace:clear
 * Production: WORKSPACE_CLEAR_ENV_FILE=.vercel/.env.production.local npm run workspace:clear
 */
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const vercelProd = resolve(".vercel/.env.production.local");
config();
if (process.env.WORKSPACE_CLEAR_ENV_FILE) {
  config({ path: process.env.WORKSPACE_CLEAR_ENV_FILE, override: true });
} else if (
  !process.env.KV_REST_API_URL &&
  !process.env.UPSTASH_REDIS_REST_URL &&
  existsSync(vercelProd)
) {
  config({ path: vercelProd, override: true });
}

import { clearWorkspaceData, crmStorageMode } from "../src/lib/crm-persistence";

async function main() {
  const mode = crmStorageMode();
  console.log(`\n🧹 Clearing workspace (${mode} store)…\n`);

  if (mode !== "kv" && process.env.VERCEL) {
    throw new Error(
      "KV credentials missing — run: npx vercel env run -e production -- npm run workspace:clear",
    );
  }

  const summary = await clearWorkspaceData();

  console.log("Removed:");
  console.log(`  Leads:              ${summary.removedLeads}`);
  console.log(`  Notes:              ${summary.removedNotes}`);
  console.log(`  Timeline entries:   ${summary.removedActivities}`);
  console.log(`  Tasks:              ${summary.removedTasks}`);
  console.log(`  Case documents:     ${summary.removedDocuments}`);
  console.log(`  Automation runs:    ${summary.removedAutomationRuns}`);
  console.log(`  Notification queue: ${summary.removedNotificationRetries}`);
  console.log(`  SMS outbox:         ${summary.removedSmsOutbox}`);
  console.log("\n✅ Workspace is empty — ready for a live smoke test.\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
