#!/usr/bin/env npx tsx
/**
 * Restore CRM from a weekly backup JSON (or .json.gz).
 *
 *   npx tsx scripts/restore-crm-backup.ts --file ./crm-backup-2026-06-18.json.gz --dry-run
 *   npx tsx scripts/restore-crm-backup.ts --file ./crm-backup-2026-06-18.json.gz --confirm
 */
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";

import { config } from "dotenv";

config();

import {
  buildCrmBackupSummary,
  type CrmBackupFile,
  verifyCrmBackupFile,
} from "@/lib/crm-backup";
import { readCrmStore, writeCrmStore } from "@/lib/crm-persistence";

function parseArgs() {
  const args = process.argv.slice(2);
  let file = "";
  let confirm = false;
  let dryRun = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--file") file = args[++i] ?? "";
    if (args[i] === "--confirm") confirm = true;
    if (args[i] === "--dry-run") dryRun = true;
  }
  return { file, confirm, dryRun };
}

function loadBackup(file: string): CrmBackupFile {
  const raw = readFileSync(file);
  const text = file.endsWith(".gz")
    ? gunzipSync(raw).toString("utf8")
    : raw.toString("utf8");
  return JSON.parse(text) as CrmBackupFile;
}

async function main() {
  const { file, confirm, dryRun } = parseArgs();
  if (!file) {
    console.error("Usage: --file <backup.json|.json.gz> [--dry-run] [--confirm]");
    process.exit(1);
  }

  const backup = loadBackup(file);
  const verified = verifyCrmBackupFile(backup);
  if (!verified.ok) {
    console.error(verified.error);
    process.exit(1);
  }

  const current = await readCrmStore();
  const before = buildCrmBackupSummary(current);
  const after = backup.summary;

  console.log("Backup validated");
  console.log(`  Version: ${backup.backupVersion}`);
  console.log(`  Created: ${backup.createdAt}`);
  console.log(`  Checksum: ${backup.checksumSha256}`);
  console.log("\nCounts (current → backup):");
  console.log(`  Leads: ${before.leadCount} → ${after.leadCount}`);
  console.log(`  Notes: ${before.noteCount} → ${after.noteCount}`);
  console.log(`  Tasks: ${before.taskCount} → ${after.taskCount}`);

  if (dryRun || !confirm) {
    console.log(dryRun ? "\nDry run — no changes written." : "\nPass --confirm to restore.");
    process.exit(0);
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const preRestorePath = `crm-backup-pre-restore-${stamp}.json`;
  writeFileSync(preRestorePath, JSON.stringify(current, null, 2), "utf8");
  console.log(`\nPre-restore snapshot saved: ${preRestorePath}`);

  await writeCrmStore(backup.store);

  const restored = await readCrmStore();
  const check = buildCrmBackupSummary(restored);
  if (check.leadCount !== after.leadCount || check.noteCount !== after.noteCount) {
    console.error("Restore validation failed — counts do not match backup summary");
    process.exit(1);
  }

  console.log("Restore complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
