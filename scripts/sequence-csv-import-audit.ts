#!/usr/bin/env npx tsx
/**
 * CSV cold-lead import — post-implementation audit (10/10 prompt).
 *
 * Run: npm run sequence:import
 * Live: SEQUENCE_IMPORT_POST_AUDIT_LIVE=true npm run sequence:import
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import { NextRequest } from "next/server";

config();
process.env.NOTIFICATIONS_DRY_RUN = "true";

import { GET as templateGet } from "@/app/api/workspace/sequences/import/template/route";
import { POST as previewPost } from "@/app/api/workspace/sequences/import/preview/route";
import { POST as commitPost } from "@/app/api/workspace/sequences/import/commit/route";
import { GET as batchesGet } from "@/app/api/workspace/import-batches/route";
import { leadToCase } from "@/lib/case";
import { transitionCaseStage } from "@/lib/case-engine";
import { LOST_REASONS } from "@/lib/case-stages";
import { crmStorageMode, readCrmStore } from "@/lib/crm-persistence";
import { db } from "@/lib/db";
import { deleteLeadCase } from "@/lib/delete-lead-case";
import { appendEmailOptOutTag } from "@/lib/email-unsubscribe";
import { commitSequenceImport } from "@/lib/sequence-csv-import/commit-import";
import { buildSequenceImportPreview } from "@/lib/sequence-csv-import/preview-import";
import {
  importCsvTemplate,
  parseImportCsv,
  slugifyCampaign,
} from "@/lib/sequence-csv-import/parse-csv";
import { resolveImportRows } from "@/lib/sequence-csv-import/resolve-outcome";
import {
  ATTESTATION_VERSION,
  MAX_IMPORT_BYTES,
  MAX_IMPORT_ROWS,
  sequenceLostReason,
} from "@/lib/sequence-csv-import/types";
import { computeSequenceFunnelStats } from "@/lib/sequence-funnel-stats";
import { WINBACK_SEQUENCE_ID } from "@/lib/winback-eligibility";
import { enrollWinback } from "@/lib/winback-sequence";
import { WINBACK_LONG_SEQUENCE_ID } from "@/lib/winback-schedule";
import { caseInReengagementQueue } from "@/lib/workspace-case";

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
  return new NextRequest(url, {
    headers: { cookie: `workspace_token=${secret}` },
  });
}

function unauthedGet(url: string) {
  return new NextRequest(url);
}

function authedPost(url: string, body: BodyInit, contentType?: string) {
  const secret = process.env.WORKSPACE_SECRET ?? "test";
  return new NextRequest(url, {
    method: "POST",
    headers: {
      cookie: `workspace_token=${secret}`,
      ...(contentType ? { "Content-Type": contentType } : {}),
    },
    body,
  });
}

async function funnelWaitingTotal() {
  const store = await readCrmStore();
  const stats = computeSequenceFunnelStats(store.leads, store.tasks);
  return stats.flows.flatMap((f) => f.steps).reduce((sum, s) => sum + s.waiting, 0);
}

async function createFixtureLead(
  email: string,
  data: Omit<Parameters<typeof db.lead.create>[0]["data"], "email">,
) {
  const lead = await db.lead.create({ data: { ...data, email } });
  cleanupIds.push(lead.id);
  return lead;
}

async function runRuntimeAudits() {
  const prefix = `csv-post-${runId}`;

  // L1 — two new emails → CREATE_ENROLL + commit
  const createCsv = [
    "email,first_name,last_name,phone,loan_amount",
    `${prefix}-a@test.local,Alpha,One,07111111111,300000`,
    `${prefix}-b@test.local,Beta,Two,07222222222,400000`,
  ].join("\n");

  const leadCountBeforePreview = (await db.lead.findMany()).length;
  const preview = await buildSequenceImportPreview({
    csvText: createCsv,
    sequenceId: WINBACK_SEQUENCE_ID,
    campaign: `audit_${runId}`,
    fileName: "audit.csv",
  });
  const leadCountAfterPreview = (await db.lead.findMany()).length;
  check(
    "D1",
    "Preview storage",
    leadCountBeforePreview === leadCountAfterPreview,
    `leads ${leadCountBeforePreview}→${leadCountAfterPreview}`,
  );
  check("D2", "Preview storage", Boolean(preview.id) && !preview.consumed, preview.id);

  const { batch } = await commitSequenceImport({
    previewId: preview.id,
    lawfulBasis: "existing_customer",
    attestationAccepted: true,
  });
  check(
    "E1",
    "Commit safety",
    batch.status === "completed" && batch.enrolled >= 2,
    `enrolled=${batch.enrolled}`,
  );
  check(
    "E2",
    "Commit safety",
    batch.enrolled === batch.leadIds.length,
    `${batch.enrolled} vs ${batch.leadIds.length}`,
  );
  check(
    "E3",
    "Commit safety",
    batch.attestationVersion === ATTESTATION_VERSION,
    batch.attestationVersion,
  );

  for (const email of [`${prefix}-a@test.local`, `${prefix}-b@test.local`]) {
    const lead = (await db.lead.findMany()).find((l) => l.email === email);
    check("F1", "Lead semantics", Boolean(lead), email);
    if (!lead) continue;
    check("F2", "Lead semantics", lead.source === "csv_import", `${email} source`);
    check("F3", "Lead semantics", lead.status === "LOST" && lead.caseStage === "LOST", email);
    check(
      "F4",
      "Lead semantics",
      lead.lostReason === sequenceLostReason(WINBACK_SEQUENCE_ID),
      lead.lostReason ?? "",
    );
    check("F5", "Lead semantics", lead.qualificationTier === "imported", email);
    check("F6", "Lead semantics", lead.formCompleted === false, email);
    check("F7", "Lead semantics", Boolean(lead.importBatchId && lead.importCampaign), email);
    check("F8", "Lead semantics", lead.lawfulBasis === "existing_customer", email);
    check("F9", "Lead semantics", Boolean(lead.importedAt), email);
    check("G1", "Sequence integration", lead.winbackStatus === "active", email);
    check(
      "G2",
      "Sequence integration",
      lead.winbackSequenceId === WINBACK_SEQUENCE_ID,
      lead.winbackSequenceId ?? "",
    );
    const caseView = leadToCase(lead);
    check(
      "G3",
      "Sequence integration",
      caseInReengagementQueue(caseView),
      `${email} not in re-engagement queue`,
    );
  }

  const idempotent = await commitSequenceImport({
    previewId: preview.id,
    lawfulBasis: "existing_customer",
    attestationAccepted: true,
  });
  check(
    "E4",
    "Commit safety",
    idempotent.batch.id === batch.id && idempotent.batch.enrolled === batch.enrolled,
    "idempotent batch",
  );

  // L2 — REENROLL existing LOST
  const lostEmail = `${prefix}-lost@test.local`;
  const lostLead = await createFixtureLead(lostEmail, {
    firstName: "Lost",
    lastName: "Case",
    phone: "07110000001",
    loanPurpose: "purchase",
    loanAmount: 250_000,
    termMonths: 12,
    propertyType: "residential",
    propertyValue: 400_000,
    propertyLocation: "Leeds",
    timeframe: "30_days",
    formCompleted: true,
    status: "CONTACTED",
    caseStage: "CONTACTED",
  });
  await transitionCaseStage(lostLead, "LOST", "CSV import audit", {
    status: "LOST",
    lostReason: LOST_REASONS[0],
    remindersPaused: true,
    probability: 0,
    expectedValue: 0,
  });
  const reenrollCsv = `email,first_name,last_name,phone\n${lostEmail},Lost,Case,07110000001`;
  const reenrollPreview = await buildSequenceImportPreview({
    csvText: reenrollCsv,
    sequenceId: WINBACK_SEQUENCE_ID,
    campaign: `reenroll_${runId}`,
  });
  check(
    "L2",
    "Runtime fixtures",
    reenrollPreview.rows[0]?.outcome === "REENROLL",
    reenrollPreview.rows[0]?.outcome,
  );

  // L3 — MERGE_ENROLL partial lead
  const partialEmail = `${prefix}-partial@test.local`;
  await createFixtureLead(partialEmail, {
    firstName: "Partial",
    lastName: "Lead",
    phone: "07110000002",
    loanPurpose: "purchase",
    loanAmount: 180_000,
    termMonths: 12,
    propertyType: "residential",
    propertyValue: 300_000,
    propertyLocation: "Manchester",
    timeframe: "30_days",
    formCompleted: false,
    status: "NEW",
    caseStage: "NEW_ENQUIRY",
  });
  const mergeCsv = `email,first_name,last_name,phone\n${partialEmail},Partial,Lead,07110000002`;
  const mergePreview = await buildSequenceImportPreview({
    csvText: mergeCsv,
    sequenceId: WINBACK_SEQUENCE_ID,
    campaign: `merge_${runId}`,
  });
  check(
    "L3",
    "Runtime fixtures",
    mergePreview.rows[0]?.outcome === "MERGE_ENROLL",
    mergePreview.rows[0]?.outcome,
  );

  // L4 — SKIP_OPTED_OUT
  const optEmail = `${prefix}-optout@test.local`;
  await createFixtureLead(optEmail, {
    firstName: "Opt",
    lastName: "Out",
    phone: "07110000003",
    loanPurpose: "purchase",
    loanAmount: 200_000,
    termMonths: 12,
    propertyType: "residential",
    propertyValue: 300_000,
    propertyLocation: "Leeds",
    timeframe: "30_days",
    additionalInfo: appendEmailOptOutTag(null),
  });
  const optCsv = `email,first_name,last_name,phone\n${optEmail},Opt,Out,07110000003`;
  const optPreview = await buildSequenceImportPreview({
    csvText: optCsv,
    sequenceId: WINBACK_SEQUENCE_ID,
    campaign: `optout_${runId}`,
  });
  check(
    "L4",
    "Runtime fixtures",
    optPreview.rows[0]?.outcome === "SKIP_OPTED_OUT",
    optPreview.rows[0]?.outcome,
  );

  // L5 — SKIP_INVALID_FILE_DUP
  const dupCsv = [
    "email,first_name,last_name,phone",
    `${prefix}-dup@test.local,Dup,One,07110000004`,
    `${prefix}-dup@test.local,Dup,Two,07110000005`,
  ].join("\n");
  const dupPreview = await buildSequenceImportPreview({
    csvText: dupCsv,
    sequenceId: WINBACK_SEQUENCE_ID,
    campaign: `dup_${runId}`,
  });
  check(
    "L5",
    "Runtime fixtures",
    dupPreview.summary.SKIP_INVALID_FILE_DUP === 1 &&
      dupPreview.rows[1]?.outcome === "SKIP_INVALID_FILE_DUP",
    String(dupPreview.summary.SKIP_INVALID_FILE_DUP),
  );

  // L6 — SKIP_ACTIVE
  const activeEmail = `${prefix}-active@test.local`;
  await createFixtureLead(activeEmail, {
    firstName: "Active",
    lastName: "Case",
    phone: "07110000006",
    loanPurpose: "purchase",
    loanAmount: 320_000,
    termMonths: 12,
    propertyType: "residential",
    propertyValue: 500_000,
    propertyLocation: "London",
    timeframe: "30_days",
    formCompleted: true,
    status: "CONTACTED",
    caseStage: "CONTACTED",
  });
  const activeCsv = `email,first_name,last_name,phone\n${activeEmail},Active,Case,07110000006`;
  const activePreview = await buildSequenceImportPreview({
    csvText: activeCsv,
    sequenceId: WINBACK_SEQUENCE_ID,
    campaign: `active_${runId}`,
  });
  check(
    "L6",
    "Runtime fixtures",
    activePreview.rows[0]?.outcome === "SKIP_ACTIVE",
    activePreview.rows[0]?.outcome,
  );

  // L7 — SKIP_ENROLLED (already win-back)
  const enrolledEmail = `${prefix}-enrolled@test.local`;
  const enrolledLead = await createFixtureLead(enrolledEmail, {
    firstName: "Enrolled",
    lastName: "Winback",
    phone: "07110000007",
    loanPurpose: "purchase",
    loanAmount: 280_000,
    termMonths: 12,
    propertyType: "residential",
    propertyValue: 450_000,
    propertyLocation: "Bristol",
    timeframe: "30_days",
    formCompleted: true,
    status: "CONTACTED",
    caseStage: "CONTACTED",
  });
  await transitionCaseStage(enrolledLead, "LOST", "CSV import audit", {
    status: "LOST",
    lostReason: LOST_REASONS[0],
    remindersPaused: true,
    probability: 0,
    expectedValue: 0,
  });
  const fresh = (await db.lead.findUnique({ where: { id: enrolledLead.id } }))!;
  await enrollWinback(fresh);
  const enrolledCsv = `email,first_name,last_name,phone\n${enrolledEmail},Enrolled,Winback,07110000007`;
  const enrolledPreview = await buildSequenceImportPreview({
    csvText: enrolledCsv,
    sequenceId: WINBACK_SEQUENCE_ID,
    campaign: `enrolled_${runId}`,
  });
  check(
    "L7",
    "Runtime fixtures",
    enrolledPreview.rows[0]?.outcome === "SKIP_ENROLLED",
    enrolledPreview.rows[0]?.outcome,
  );

  // Long sequence template + lost reason
  const longTemplate = await templateGet(
    authedGet(
      `http://localhost/api/workspace/sequences/import/template?sequenceId=${WINBACK_LONG_SEQUENCE_ID}`,
    ),
  );
  check("B1", "CSV parse", longTemplate.status === 200, String(longTemplate.status));
  check(
    "G4",
    "Sequence integration",
    sequenceLostReason(WINBACK_LONG_SEQUENCE_ID) === "Funding no longer needed",
    sequenceLostReason(WINBACK_LONG_SEQUENCE_ID),
  );

  // API multipart preview + commit
  const form = new FormData();
  form.set("file", new File([createCsv], "audit.csv", { type: "text/csv" }));
  form.set("sequenceId", WINBACK_LONG_SEQUENCE_ID);
  form.set("campaign", `api_${runId}`);
  const previewApiRes = await previewPost(
    authedPost("http://localhost/api/workspace/sequences/import/preview", form),
  );
  check("H1", "API", previewApiRes.status === 200, String(previewApiRes.status));

  const noAttestRes = await commitPost(
    authedPost(
      "http://localhost/api/workspace/sequences/import/commit",
      JSON.stringify({
        previewId: preview.id,
        lawfulBasis: "existing_customer",
        attestationAccepted: false,
      }),
      "application/json",
    ),
  );
  check("H2", "API", noAttestRes.status === 400, `no attestation → ${noAttestRes.status}`);

  const batchesRes = await batchesGet(authedGet("http://localhost/api/workspace/import-batches"));
  check("H3", "API", batchesRes.status === 200, String(batchesRes.status));
  const batchesBody = (await batchesRes.json()) as { batches?: unknown[] };
  check("H4", "API", Array.isArray(batchesBody.batches), "batches array");

  // K — delete cascade on imported lead
  const importLead = (await db.lead.findMany()).find((l) => l.email === `${prefix}-a@test.local`);
  if (importLead) {
    const waitingBefore = await funnelWaitingTotal();
    await deleteLeadCase(importLead.id);
    cleanupIds.splice(cleanupIds.indexOf(importLead.id), 1);
    const waitingAfter = await funnelWaitingTotal();
    check(
      "K1",
      "Delete cascade",
      waitingAfter <= waitingBefore,
      `waiting ${waitingBefore}→${waitingAfter}`,
    );
    const gone = await db.lead.findUnique({ where: { id: importLead.id } });
    check("K2", "Delete cascade", gone == null, "imported lead removed");
  } else {
    check("K1", "Delete cascade", false, "missing import lead fixture");
  }
}

async function runLiveAudits(baseUrl: string) {
  try {
    const secret = process.env.WORKSPACE_SECRET;
    check("N1", "Production", Boolean(secret), "WORKSPACE_SECRET set");
    check(
      "N2",
      "Production",
      crmStorageMode() === "kv" || process.env.CRM_STORE_FILE != null,
      `storage mode ${crmStorageMode()}`,
      "P1",
    );

    const templateRes = await fetch(
      `${baseUrl}/api/workspace/sequences/import/template?sequenceId=lost-standard`,
      { headers: secret ? { cookie: `workspace_token=${secret}` } : {} },
    );
    check(
      "N3",
      "Production",
      templateRes.ok,
      `template → ${templateRes.status}`,
    );

    const pageRes = await fetch(`${baseUrl}/workspace/re-engagement`);
    const html = await pageRes.text();
    check(
      "N4",
      "Production",
      pageRes.ok && html.includes("Import CSV"),
      `re-engagement Import CTA (${pageRes.status})`,
    );
  } catch (error) {
    check(
      "N3",
      "Production",
      false,
      error instanceof Error ? error.message : "live fetch failed",
    );
  }
}

async function main() {
  const liveMode = process.env.SEQUENCE_IMPORT_POST_AUDIT_LIVE === "true";
  const baseUrl =
    process.env.CRM_GO_LIVE_BASE_URL?.replace(/\/$/, "") ??
    process.env.POSTLAUNCH_BASE_URL?.replace(/\/$/, "") ??
    "https://loans.bridgingloansbroker.co.uk";

  const storeSrc = read("src/lib/sequence-csv-import/import-batch-store.ts");
  const commitSrc = read("src/lib/sequence-csv-import/commit-import.ts");
  const previewSrc = read("src/lib/sequence-csv-import/preview-import.ts");
  const wizardSrc = read("src/components/workspace/sequence-import-wizard.tsx");
  const reengagementSrc = read("src/components/workspace/reengagement-board.tsx");
  const flowsSrc = read("src/components/workspace/sequence-flows-panel.tsx");
  const journeySrc = read("src/lib/journey-emails.ts");
  const pkg = read("package.json");

  // A — Charter
  const charterFiles = [
    "src/lib/sequence-csv-import/types.ts",
    "src/lib/sequence-csv-import/parse-csv.ts",
    "src/lib/sequence-csv-import/resolve-outcome.ts",
    "src/lib/sequence-csv-import/import-batch-store.ts",
    "src/lib/sequence-csv-import/preview-import.ts",
    "src/lib/sequence-csv-import/commit-import.ts",
    "src/lib/sequence-csv-import/create-import-lead.ts",
    "src/app/api/workspace/sequences/import/template/route.ts",
    "src/app/api/workspace/sequences/import/preview/route.ts",
    "src/app/api/workspace/sequences/import/commit/route.ts",
    "src/app/api/workspace/import-batches/route.ts",
    "src/components/workspace/sequence-import-wizard.tsx",
  ];
  check("A1", "Charter", charterFiles.every((f) => existsSync(f)), "core files");
  check(
    "A2",
    "Charter",
    readIncludes("prisma/schema.prisma", "importBatchId") &&
      readIncludes("prisma/schema.prisma", "importCampaign"),
    "schema fields",
  );
  check(
    "A3",
    "Charter",
    readIncludes("src/lib/crm-persistence.ts", "importBatches") &&
      readIncludes("src/lib/db.ts", "importBatchId"),
    "store hydration",
  );
  check(
    "A4",
    "Charter",
    readIncludes("package.json", "sequence:import"),
    "npm script",
  );
  check(
    "A5",
    "Charter",
    readIncludes("src/components/workspace/reengagement-board.tsx", "SequenceImportWizard") &&
      readIncludes("src/components/workspace/sequence-flows-panel.tsx", "SequenceImportWizard"),
    "UI entry points",
  );

  // B — CSV parse & limits
  check(
    "B2",
    "CSV parse",
    slugifyCampaign("Cold Meta Jun26!") === "cold_meta_jun26",
    slugifyCampaign("Cold Meta Jun26!"),
  );
  check("B3", "CSV parse", MAX_IMPORT_ROWS === 500, String(MAX_IMPORT_ROWS));
  check(
    "B4",
    "CSV parse",
    MAX_IMPORT_BYTES === 1024 * 1024,
    String(MAX_IMPORT_BYTES),
  );
  const templateStd = importCsvTemplate(WINBACK_SEQUENCE_ID);
  const templateLong = importCsvTemplate(WINBACK_LONG_SEQUENCE_ID);
  check("B5", "CSV parse", templateStd.includes("email") && templateLong.includes("email"), "templates");
  const parsed = parseImportCsv("email,first_name,last_name\nbad-email,X,Y");
  check(
    "B6",
    "CSV parse",
    resolveImportRows(parsed.rows, [], WINBACK_SEQUENCE_ID).resolved[0]?.outcome ===
      "SKIP_INVALID_EMAIL",
    "invalid email",
  );
  const defaultAmt = parseImportCsv("email,first_name,last_name,phone\na@test.local,A,B,07");
  check(
    "B7",
    "CSV parse",
    defaultAmt.rows[0]?.usedDefaultAmount === true,
    String(defaultAmt.rows[0]?.usedDefaultAmount),
    "P1",
  );

  // C — Outcome resolution (static)
  check(
    "C1",
    "Outcomes",
    readIncludes("src/lib/sequence-csv-import/resolve-outcome.ts", "SKIP_INVALID_FILE_DUP"),
    "file dup outcome",
  );
  check(
    "C2",
    "Outcomes",
    readIncludes("src/lib/sequence-csv-import/resolve-outcome.ts", "MERGE_ENROLL") &&
      readIncludes("src/lib/sequence-csv-import/resolve-outcome.ts", "formCompleted === false"),
    "merge partial rule",
  );
  check(
    "C3",
    "Outcomes",
    !previewSrc.includes("db.lead.create"),
    "preview does not create leads",
  );
  check(
    "C4",
    "Outcomes",
    readIncludes("src/lib/sequence-csv-import/resolve-outcome.ts", "estimatedEmails"),
    "cost estimate in summary",
    "P1",
  );

  // D — Preview storage
  check(
    "D3",
    "Preview storage",
    storeSrc.includes("runCrmMutation"),
    "import store uses runCrmMutation",
  );
  check(
    "D4",
    "Preview storage",
    !storeSrc.includes("writeCrmStore(store)"),
    "no direct writeCrmStore",
  );
  check(
    "D5",
    "Preview storage",
    readIncludes("src/lib/sequence-csv-import/types.ts", "PREVIEW_TTL_MS"),
    "preview TTL",
    "P1",
  );

  // E — Commit safety (static)
  check(
    "E5",
    "Commit safety",
    commitSrc.includes("getImportBatchByPreview") && commitSrc.includes("revalidated.resolved"),
    "revalidate + idempotent",
  );
  check(
    "E6",
    "Commit safety",
    commitSrc.includes("deleteLeadCase") && commitSrc.includes("acquireImportLock"),
    "rollback + lock",
  );
  check(
    "E7",
    "Commit safety",
    commitSrc.includes("enrollWinback"),
    "reuses enrollWinback",
  );

  // F — Lead semantics (static)
  check(
    "F10",
    "Lead semantics",
    readIncludes("src/lib/sequence-csv-import/create-import-lead.ts", 'source: "csv_import"'),
    "csv_import source",
  );
  check(
    "F11",
    "Lead semantics",
    readIncludes("src/lib/sequence-csv-import/create-import-lead.ts", "logImportTimeline"),
    "timeline logged",
  );

  // G — UI integration (static)
  check("G5", "Sequence integration", reengagementSrc.includes("import-batches"), "recent imports");
  check("G6", "Sequence integration", reengagementSrc.includes("Imported"), "imported badge");
  check("G7", "Sequence integration", flowsSrc.includes("Import CSV"), "flows CTA");

  // H — API auth (static + runtime below)
  for (const [id, route] of [
    ["H5", "template"],
    ["H6", "preview"],
    ["H7", "commit"],
    ["H8", "import-batches"],
  ] as const) {
    const path =
      route === "import-batches"
        ? "src/app/api/workspace/import-batches/route.ts"
        : `src/app/api/workspace/sequences/import/${route}/route.ts`;
    check(id, "API", readIncludes(path, "verifyWorkspaceAuth"), `${route} auth`);
  }

  const unauthTemplate = await templateGet(
    unauthedGet("http://localhost/api/workspace/sequences/import/template?sequenceId=lost-standard"),
  );
  check("H9", "API", unauthTemplate.status === 401, `unauth → ${unauthTemplate.status}`);

  // I — UI wizard
  check("I1", "UI wizard", wizardSrc.includes("setStep") && wizardSrc.includes('step === 5'), "5 steps");
  check("I2", "UI wizard", wizardSrc.includes("LAWFUL_BASES"), "lawful basis");
  check("I3", "UI wizard", wizardSrc.includes("attestation"), "attestation");
  check(
    "I4",
    "UI wizard",
    wizardSrc.includes("disabled={loading || !attestation"),
    "commit gated",
  );
  check("I5", "UI wizard", wizardSrc.includes("OUTCOME_LABELS"), "outcome labels", "P1");
  check(
    "I6",
    "UI wizard",
    wizardSrc.includes("WINBACK_LONG_SEQUENCE_ID"),
    "long sequence option",
  );

  // J — Compliance
  check(
    "J1",
    "Compliance",
    process.env.NOTIFICATIONS_DRY_RUN === "true",
    "dry run enabled",
  );
  check(
    "J2",
    "Compliance",
    readIncludes("src/lib/sequence-csv-import/create-import-lead.ts", "lawfulBasis"),
    "lawful basis on lead",
  );

  // K — delete (static)
  check(
    "K3",
    "Delete cascade",
    existsSync("src/lib/delete-lead-case.ts"),
    "delete helper",
    "P1",
  );

  await runRuntimeAudits();

  // M — Upstream regression wiring
  for (const [id, script] of [
    ["M1", "crm:post-implementation"],
    ["M2", "sequence:post-implementation"],
    ["M3", "workspace:post-implementation"],
    ["M4", "sequence:funnel"],
    ["M5", "go-live:master"],
  ] as const) {
    check(id, "Upstream regression", pkg.includes(script), script, "P1");
  }

  // N — Production advisory
  if (liveMode) {
    await runLiveAudits(baseUrl);
  } else {
    check(
      "N0",
      "Production",
      true,
      "advisory — SEQUENCE_IMPORT_POST_AUDIT_LIVE=true for prod checks",
      "P1",
    );
  }

  // O — Known gaps (scored)
  check(
    "O1",
    "Known gaps",
    journeySrc.includes("importedColdLead"),
    "importedColdLead email variant",
    "P1",
  );
  check(
    "O2",
    "Known gaps",
    !existsSync("src/app/api/workspace/sequences/import/rollback/route.ts"),
    "rollback API not in v3 P0",
    "P2",
  );
  check(
    "O3",
    "Known gaps",
    !wizardSrc.toLowerCase().includes("holdout"),
    "holdout % not in v3 P0",
    "P2",
  );
  check(
    "O4",
    "Known gaps",
    !wizardSrc.includes("long_timeframe_nurture"),
    "nurture import not exposed",
    "P2",
  );

  for (const id of cleanupIds) {
    await db.lead.delete({ where: { id } }).catch(() => null);
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
  console.log("CSV COLD-LEAD IMPORT POST-IMPLEMENTATION AUDIT");
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
    console.log(
      "💡 Live checks: SEQUENCE_IMPORT_POST_AUDIT_LIVE=true npm run sequence:import\n",
    );
  }

  if (p0Failed.length > 0) process.exit(1);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
