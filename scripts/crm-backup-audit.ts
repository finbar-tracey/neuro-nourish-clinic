#!/usr/bin/env npx tsx
/**
 * CRM weekly backup — post-implementation audit (10/10 prompt).
 *
 * Run: npm run crm:backup
 * Live: CRM_BACKUP_AUDIT_LIVE=true npm run crm:backup
 */
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import { NextRequest } from "next/server";

config();
process.env.NOTIFICATIONS_DRY_RUN = "true";

import { GET as backupGet } from "@/app/api/workspace/backup/route";
import { GET as cronIdle } from "@/app/api/cron/process-idle/route";
import { GET as exportGet } from "@/app/api/leads/export/route";
import {
  buildCrmBackupAttachments,
  buildCrmBackupEmailBody,
  buildCrmBackupFile,
  buildCrmBackupFileFromStore,
  buildCrmBackupSummary,
  buildLeadsCsv,
  CRM_BACKUP_GZIP_THRESHOLD_BYTES,
  CRM_BACKUP_VERSION,
  CRM_LEADS_CSV_HEADERS,
  hashStorePayload,
  type CrmBackupFile,
  verifyCrmBackupFile,
} from "@/lib/crm-backup";
import {
  backupWeekKey,
  getCrmBackupMeta,
  isCrmBackupStale,
  savePreImportSnapshot,
  type CrmStoreWithBackup,
} from "@/lib/crm-backup-meta";
import { readCrmStore } from "@/lib/crm-persistence";
import { db } from "@/lib/db";
import { checkGoLiveHealth } from "@/lib/go-live-health";
import { processWeeklyCrmBackup } from "@/lib/weekly-crm-backup";

type Severity = "P0" | "P1" | "P2";

type Check = {
  id: string;
  section: string;
  pass: boolean;
  detail?: string;
  severity: Severity;
};

const checks: Check[] = [];
const findings: Array<{ severity: Severity; area: string; finding: string }> = [];
const cleanupIds: string[] = [];
const runId = Date.now();
let tempBackupPath: string | null = null;

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function readIncludes(path: string, needle: string) {
  return read(path).includes(needle);
}

function check(
  id: string,
  section: string,
  pass: boolean,
  detail?: string,
  severity: Severity = "P0",
) {
  checks.push({ id, section, pass, detail, severity });
  if (!pass) {
    findings.push({ severity, area: section, finding: `${id}: ${detail ?? "failed"}` });
  }
}

function authedGet(url: string) {
  const secret = process.env.WORKSPACE_SECRET ?? "test";
  return new NextRequest(url, { headers: { cookie: `workspace_token=${secret}` } });
}

function cronAuthHeader() {
  const secret = process.env.CRON_SECRET ?? process.env.WORKSPACE_SECRET ?? "test";
  return { authorization: `Bearer ${secret}` };
}

async function runLiveAudits(baseUrl: string) {
  try {
    check("L1", "Production", Boolean(process.env.RESEND_API_KEY), "RESEND_API_KEY set");
    check(
      "L2",
      "Production",
      process.env.NOTIFICATIONS_DRY_RUN !== "true",
      `NOTIFICATIONS_DRY_RUN=${process.env.NOTIFICATIONS_DRY_RUN ?? "unset"}`,
    );

    const healthRes = await fetch(`${baseUrl}/api/health/go-live`);
    const health = (await healthRes.json()) as { crmBackup?: { stale?: boolean } };
    check(
      "L3",
      "Production",
      healthRes.ok && health.crmBackup != null,
      `health crmBackup (${healthRes.status})`,
    );
    check(
      "L4",
      "Production",
      health.crmBackup?.stale === false,
      `stale=${String(health.crmBackup?.stale)}`,
      "P1",
    );
  } catch (error) {
    check(
      "L3",
      "Production",
      false,
      error instanceof Error ? error.message : "live fetch failed",
    );
  }
}

async function main() {
  const liveMode = process.env.CRM_BACKUP_AUDIT_LIVE === "true";
  const baseUrl =
    process.env.CRM_GO_LIVE_BASE_URL?.replace(/\/$/, "") ??
    process.env.POSTLAUNCH_BASE_URL?.replace(/\/$/, "") ??
    "https://loans.bridgingloansbroker.co.uk";
  const pkg = read("package.json");
  const weeklySrc = read("src/lib/weekly-crm-backup.ts");
  const emailSrc = read("src/lib/email.ts");

  // ── A Charter ──
  const charterFiles = [
    "src/lib/crm-backup.ts",
    "src/lib/crm-backup-meta.ts",
    "src/lib/weekly-crm-backup.ts",
    "scripts/restore-crm-backup.ts",
    "scripts/crm-backup-audit.ts",
    "src/app/api/workspace/backup/route.ts",
  ];
  check("A1", "Charter", charterFiles.every((f) => existsSync(f)), "core files");
  check(
    "A2",
    "Charter",
    readIncludes("src/lib/crm-persistence.ts", "crmBackupMeta") &&
      readIncludes("src/lib/crm-persistence.ts", "preImportBackups"),
    "store fields",
  );
  check("A3", "Charter", pkg.includes("crm:backup"), "npm script");
  check(
    "A4",
    "Charter",
    readIncludes("scripts/master-go-live-audit.ts", "crm:backup"),
    "master go-live",
  );
  check(
    "A5",
    "Charter",
    readIncludes("src/components/workspace/shell.tsx", "Full backup"),
    "shell CTA",
    "P1",
  );

  // ── B Backup payload ──
  const store = await readCrmStore();
  const file = buildCrmBackupFile(store);
  check("B1", "Backup payload", file.backupVersion === CRM_BACKUP_VERSION, file.backupVersion);
  check("B2", "Backup payload", verifyCrmBackupFile(file).ok, "checksum ok");
  check(
    "B3",
    "Backup payload",
    file.summary.leadCount === store.leads.length,
    `leads ${file.summary.leadCount}`,
  );
  check(
    "B4",
    "Backup payload",
    Array.isArray(file.documentManifest),
    "document manifest",
  );
  check(
    "B5",
    "Backup payload",
    CRM_LEADS_CSV_HEADERS.includes("Win-back Status") &&
      CRM_LEADS_CSV_HEADERS.includes("Import Batch"),
    "extended csv headers",
  );
  check(
    "B6",
    "Backup payload",
    CRM_BACKUP_GZIP_THRESHOLD_BYTES === 500 * 1024,
    String(CRM_BACKUP_GZIP_THRESHOLD_BYTES),
    "P1",
  );

  const tampered: CrmBackupFile = {
    ...file,
    checksumSha256: "0".repeat(64),
  };
  check(
    "B7",
    "Backup payload",
    !verifyCrmBackupFile(tampered).ok,
    "tamper detected",
  );

  // ── C Weekly email ──
  check(
    "C1",
    "Weekly email",
    weeklySrc.includes("brokerNotifyEmail()"),
    "daniel recipient",
  );
  check(
    "C2",
    "Weekly email",
    weeklySrc.includes('category: "transactional"'),
    "transactional",
  );
  check(
    "C3",
    "Weekly email",
    weeklySrc.includes("sha256:"),
    "checksum in subject",
  );
  check(
    "C4",
    "Weekly email",
    weeklySrc.includes("sendFailureAlert"),
    "failure alert fn",
  );
  check(
    "C5",
    "Weekly email",
    weeklySrc.includes("lastCrmBackupFailureWeekKey"),
    "failure idempotency",
  );
  const body = buildCrmBackupEmailBody(file);
  check(
    "C6",
    "Weekly email",
    body.includes(file.checksumSha256) && body.includes("CRM Backups"),
    "body copy",
    "P1",
  );
  check(
    "C7",
    "Weekly email",
    buildCrmBackupAttachments(file).length === 2,
    "json + csv attachments",
  );
  check(
    "C8",
    "Weekly email",
    emailSrc.includes("attachments"),
    "resend attachments",
  );

  // ── D Idempotency & scheduling ──
  check(
    "D1",
    "Scheduling",
    weeklySrc.includes("minute >= 15"),
    "08:15 stagger",
    "P1",
  );
  check(
    "D2",
    "Scheduling",
    weeklySrc.includes("lastCrmBackupWeekKey"),
    "meta idempotency",
  );
  check(
    "D3",
    "Scheduling",
    weeklySrc.includes("FORCE_CRM_BACKUP"),
    "force hook",
    "P1",
  );
  check(
    "D4",
    "Scheduling",
    readIncludes("src/app/api/cron/process-idle/route.ts", "processWeeklyCrmBackup"),
    "cron wired",
  );
  check(
    "D5",
    "Scheduling",
    readIncludes("src/app/api/workspace/process-idle/route.ts", "processWeeklyCrmBackup"),
    "workspace idle wired",
  );

  const cronRes = await cronIdle(
    new NextRequest("http://localhost/api/cron/process-idle", {
      headers: cronAuthHeader(),
    }),
  );
  const cronBody = (await cronRes.json()) as { crmBackup?: { skipped?: string } };
  check("D6", "Scheduling", cronRes.status === 200, String(cronRes.status));
  check("D7", "Scheduling", Boolean(cronBody.crmBackup), "crmBackup in response");

  const dry = await processWeeklyCrmBackup();
  check("D8", "Scheduling", dry.skipped === "dry_run", String(dry.skipped));
  check(
    "D9",
    "Scheduling",
    typeof dry.checksum === "string" && dry.checksum.length === 64,
    "dry-run checksum",
  );

  process.env.FORCE_CRM_BACKUP = "true";
  const forced = await processWeeklyCrmBackup();
  check(
    "D10",
    "Scheduling",
    forced.skipped === "dry_run",
    "FORCE respects dry-run",
    "P1",
  );
  delete process.env.FORCE_CRM_BACKUP;

  // ── E On-demand backup ──
  const jsonRes = await backupGet(authedGet("http://localhost/api/workspace/backup"));
  check("E1", "On-demand", jsonRes.status === 200, `json ${jsonRes.status}`);
  const jsonHeaders = jsonRes.headers;
  check(
    "E2",
    "On-demand",
    jsonHeaders.get("X-CRM-Backup-Checksum")?.length === 64,
    "checksum header",
    "P1",
  );

  const csvRes = await backupGet(
    authedGet("http://localhost/api/workspace/backup?format=csv"),
  );
  check("E3", "On-demand", csvRes.status === 200, `csv ${csvRes.status}`);
  const csvText = await csvRes.text();
  check("E4", "On-demand", csvText.startsWith("First Name,"), "csv content");

  const unauth = await backupGet(new NextRequest("http://localhost/api/workspace/backup"));
  check("E5", "On-demand", unauth.status === 401, String(unauth.status));

  check(
    "E6",
    "On-demand",
    readIncludes("src/app/api/workspace/backup/route.ts", "MANUAL_BACKUP_COOLDOWN"),
    "rate limit",
    "P1",
  );

  // ── F Pre-import snapshot ──
  check(
    "F1",
    "Pre-import",
    readIncludes("src/lib/sequence-csv-import/commit-import.ts", "savePreImportSnapshot"),
    "commit hook",
    "P1",
  );
  check(
    "F2",
    "Pre-import",
    readIncludes("src/lib/sequence-csv-import/types.ts", "preBackupChecksum"),
    "batch field",
    "P1",
  );

  const preFile = await buildCrmBackupFileFromStore();
  const preBatchId = `audit_pre_${runId}`;
  await savePreImportSnapshot({
    batchId: preBatchId,
    createdAt: new Date().toISOString(),
    checksumSha256: preFile.checksumSha256,
    store: JSON.parse(JSON.stringify(preFile.store)) as typeof preFile.store,
  });
  const afterPre = (await readCrmStore()) as CrmStoreWithBackup;
  check(
    "F3",
    "Pre-import",
    Boolean(afterPre.preImportBackups?.[preBatchId]),
    "snapshot stored",
    "P1",
  );

  // ── G Restore CLI ──
  check("G1", "Restore", existsSync("scripts/restore-crm-backup.ts"), "script exists");
  check(
    "G2",
    "Restore",
    readIncludes("scripts/restore-crm-backup.ts", "--confirm"),
    "confirm gate",
  );
  check(
    "G3",
    "Restore",
    readIncludes("scripts/restore-crm-backup.ts", "--dry-run"),
    "dry-run flag",
  );
  check(
    "G4",
    "Restore",
    readIncludes("scripts/restore-crm-backup.ts", "pre-restore"),
    "pre-restore file",
  );
  check(
    "G5",
    "Restore",
    readIncludes("scripts/restore-crm-backup.ts", "verifyCrmBackupFile"),
    "checksum validate",
  );

  tempBackupPath = join(process.cwd(), `.crm-backup-audit-${runId}.json`);
  writeFileSync(tempBackupPath, JSON.stringify(file, null, 2), "utf8");
  const loaded = JSON.parse(readFileSync(tempBackupPath, "utf8")) as CrmBackupFile;
  check("G6", "Restore", verifyCrmBackupFile(loaded).ok, "fixture file valid");

  // ── H Health ──
  const health = await checkGoLiveHealth();
  check("H1", "Health", "crmBackup" in health, "crmBackup field", "P1");
  check(
    "H2",
    "Health",
    typeof (health as { crmBackup?: { stale?: boolean } }).crmBackup?.stale === "boolean",
    "stale flag",
    "P1",
  );
  const meta = getCrmBackupMeta(store);
  check(
    "H3",
    "Health",
    typeof isCrmBackupStale(meta) === "boolean",
    String(isCrmBackupStale(meta)),
    "P1",
  );

  // ── I Security ──
  check(
    "I1",
    "Security",
    readIncludes("src/app/api/workspace/backup/route.ts", "verifyWorkspaceAuth"),
    "backup auth",
  );
  check(
    "I2",
    "Security",
    readIncludes("src/app/api/cron/process-idle/route.ts", "verifyCronAuth"),
    "cron auth",
  );
  check(
    "I3",
    "Security",
    !read("scripts/restore-crm-backup.ts").includes("writeCrmStore") ||
      read("scripts/restore-crm-backup.ts").includes("--confirm"),
    "restore gated",
  );
  check(
    "I4",
    "Security",
    buildCrmBackupEmailBody(file).includes("borrower PII"),
    "pii notice",
    "P1",
  );

  // ── J DR round-trip ──
  const lead = await db.lead.create({
    data: {
      firstName: "Backup",
      lastName: "Audit",
      email: `crm-backup-audit-${runId}@test.local`,
      phone: "07999999999",
      loanPurpose: "purchase",
      loanAmount: 250_000,
      termMonths: 12,
      propertyType: "residential",
      propertyValue: 400_000,
      propertyLocation: "Leeds",
      timeframe: "30_days",
      source: "csv_import",
      importBatchId: `batch_${runId}`,
      importCampaign: "audit_campaign",
      lawfulBasis: "existing_customer",
    },
  });
  cleanupIds.push(lead.id);

  const csv = buildLeadsCsv([lead]);
  check("J1", "DR round-trip", csv.includes("audit_campaign"), "import columns in csv");
  check("J2", "DR round-trip", csv.includes(`batch_${runId}`), "batch id in csv");

  const exportRes = await exportGet(authedGet("http://localhost/api/leads/export"));
  check("J3", "DR round-trip", exportRes.status === 200, "export route");
  check(
    "J4",
    "DR round-trip",
    readIncludes("src/app/api/leads/export/route.ts", "buildLeadsCsv"),
    "shared csv builder",
  );

  const roundTrip = buildCrmBackupFile(await readCrmStore());
  const summary = buildCrmBackupSummary(roundTrip.store);
  check(
    "J5",
    "DR round-trip",
    hashStorePayload(roundTrip.store) === roundTrip.checksumSha256,
    "checksum round-trip",
  );
  check(
    "J6",
    "DR round-trip",
    summary.leadCount === roundTrip.summary.leadCount,
    "summary counts",
  );

  // ── K Upstream regression ──
  for (const [id, script] of [
    ["K1", "crm:post-implementation"],
    ["K2", "sequence:import"],
    ["K3", "workspace:post-implementation"],
    ["K4", "go-live:master"],
  ] as const) {
    check(id, "Upstream", pkg.includes(script), script, "P1");
  }
  check("K5", "Upstream", pkg.includes('"build"'), "build script", "P1");

  // ── L Production advisory ──
  if (liveMode) {
    await runLiveAudits(baseUrl);
  } else {
    check(
      "L0",
      "Production",
      true,
      "advisory — CRM_BACKUP_AUDIT_LIVE=true for prod checks",
      "P1",
    );
  }

  // ── M Known gaps ──
  check(
    "M1",
    "Known gaps",
    !readIncludes("src/lib/crm-backup.ts", "password"),
    "no password zip",
    "P2",
  );
  check(
    "M2",
    "Known gaps",
    !existsSync("src/app/api/workspace/backup/restore/route.ts"),
    "no public restore API",
    "P2",
  );
  check(
    "M3",
    "Known gaps",
    buildCrmBackupEmailBody(file).includes("Documents (metadata)"),
    "blob bytes not attached",
    "P2",
  );

  for (const id of cleanupIds) {
    await db.lead.delete({ where: { id } }).catch(() => null);
  }
  if (tempBackupPath && existsSync(tempBackupPath)) {
    unlinkSync(tempBackupPath);
  }

  const passed = checks.filter((c) => c.pass).length;
  const p0Failed = checks.filter((c) => !c.pass && c.severity === "P0");
  const p1Failed = checks.filter((c) => !c.pass && c.severity === "P1");
  const p2Failed = checks.filter((c) => !c.pass && c.severity === "P2");

  const score =
    p0Failed.length > 0
      ? Math.max(4, 10 - p0Failed.length)
      : p1Failed.length > 2
        ? 8
        : p1Failed.length > 0
          ? 9
          : 10;

  let verdict: "SHIP" | "SHIP WITH FIXES" | "DO NOT SHIP";
  if (p0Failed.length > 0) verdict = "DO NOT SHIP";
  else if (p1Failed.length > 0) verdict = "SHIP WITH FIXES";
  else verdict = "SHIP";

  console.log("\n══════════════════════════════════════════════════════════");
  console.log("CRM WEEKLY BACKUP POST-IMPLEMENTATION AUDIT");
  console.log("══════════════════════════════════════════════════════════\n");

  const bySection = new Map<string, Check[]>();
  for (const c of checks) {
    const list = bySection.get(c.section) ?? [];
    list.push(c);
    bySection.set(c.section, list);
  }

  for (const [section, list] of bySection) {
    console.log(`## ${section}`);
    for (const c of list) {
      const sev = c.severity !== "P0" ? ` [${c.severity}]` : "";
      console.log(`  ${c.pass ? "✓" : "✗"} ${c.id}${sev}${c.detail ? ` — ${c.detail}` : ""}`);
    }
    console.log("");
  }

  console.log(`RESULT: ${passed}/${checks.length} checks passed`);
  console.log(`P0 failures: ${p0Failed.length} · P1: ${p1Failed.length} · P2: ${p2Failed.length}`);
  console.log(`SCORE: ${score}/10`);
  console.log(`VERDICT: ${verdict}\n`);

  if (findings.length > 0) {
    console.log("FINDINGS:");
    for (const f of findings) {
      console.log(`  [${f.severity}] ${f.area} — ${f.finding}`);
    }
    console.log("");
  }

  if (!liveMode) {
    console.log("💡 Live checks: CRM_BACKUP_AUDIT_LIVE=true npm run crm:backup\n");
  }

  console.log(`Week key: ${backupWeekKey()}\n`);

  if (p0Failed.length > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
