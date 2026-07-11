#!/usr/bin/env npx tsx
/**
 * Journey email implementation audit — /10 score. No sends.
 *
 * Run: npm run email:audit
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

import {
  JOURNEY_EMAIL_IDS,
  NURTURE_EMAIL_SCHEDULE,
  buildJourneyEmail,
} from "../src/lib/journey-emails";
import { emailCatalog } from "../src/lib/email-catalog";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

type ScoreItem = { label: string; points: number; ok: boolean; detail?: string };
const items: ScoreItem[] = [];

function score(label: string, points: number, ok: boolean, detail?: string) {
  items.push({ label, points, ok, detail });
  console.log(`${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
}

console.log("\nJourney email audit\n");

const templates = read("src/lib/email-templates.ts");
const journey = read("src/lib/journey-emails.ts");
const send = read("src/lib/journey-email-send.ts");
const engine = read("src/lib/case-engine.ts");
const caseDetail = read("src/components/workspace/case-detail.tsx");
const leadsRoute = read("src/app/api/leads/[id]/route.ts");
const exportScript = read("scripts/export-email-previews.ts");

score(
  "Branded template (navy, orange, logo)",
  1,
  templates.includes("#f98e38") && templates.includes("logo.png"),
);
score(
  "Single source of truth (journey-emails.ts)",
  1,
  journey.includes("BUILDERS") && JOURNEY_EMAIL_IDS.length >= 18,
  `${JOURNEY_EMAIL_IDS.length} templates`,
);
score(
  "Stage emails wired on transition",
  1.5,
  send.includes("STAGE_EMAILS") && engine.includes("maybeSendStageEmail"),
);
score(
  "Capture → qualified → booking emails use journey sender",
  1,
  read("src/lib/complete-notifications.ts").includes("sendJourneyEmail") &&
    read("src/lib/priority-call-booking.ts").includes("sendJourneyEmail"),
);
score(
  "Document request + chase emails",
  1,
  read("src/lib/case-documents.ts").includes('"document-request"') &&
    read("src/lib/process-operational.ts").includes('"document-chase-24h"') &&
    read("src/lib/process-operational.ts").includes('"document-chase-48h"'),
);
score(
  "Nurture sequence (5 emails)",
  0.5,
  NURTURE_EMAIL_SCHEDULE.length === 5 &&
    read("src/lib/nurture-sequence.ts").includes("NURTURE_EMAIL_SCHEDULE"),
);
score(
  "Workspace pipeline advance + emails",
  1,
  caseDetail.includes("advanceStage") && leadsRoute.includes("advanceStage"),
);
score(
  "All catalog entries live (no planned gaps)",
  1,
  emailCatalog().every((e) => e.status === "live"),
  `${emailCatalog().length} templates`,
);
score(
  "Dedup tags prevent duplicate stage emails",
  0.5,
  journey.includes("journeyEmailSentTag") && send.includes("hasJourneyEmailBeenSent"),
);
score(
  "HTML + PDF preview export",
  1,
  exportScript.includes("pdf") && exportScript.includes("blb-email-design-guide.pdf"),
);

const earned = items.filter((i) => i.ok).reduce((s, i) => s + i.points, 0);
const total = items.reduce((s, i) => s + i.points, 0);
const rating = Math.round(earned);

console.log(`\nScore: ${rating}/10 (${earned}/${total} points)`);
console.log(
  earned >= total
    ? "\nVerdict: Production-grade journey emails — wired, branded, and previewable.\n"
    : "\nVerdict: Gaps remain — see failed checks above.\n",
);

if (process.env.EMAIL_AUDIT_EXPORT !== "false") {
  process.stdout.write("▶ Regenerating email previews… ");
  const result = spawnSync("npm", ["run", "email:preview"], {
    stdio: "pipe",
    shell: true,
    cwd: root,
  });
  const pdfDir = join(root, "email-previews", "pdf");
  const combinedPdf = join(root, "email-previews", "blb-email-design-guide.pdf");
  const pdfCount = existsSync(pdfDir)
    ? readFileSync(join(root, "email-previews", "index.html"), "utf8").match(/\.html/g)?.length ?? 0
    : 0;
  if (result.status === 0 && existsSync(combinedPdf)) {
    console.log("✅");
    console.log(`   Combined PDF: email-previews/blb-email-design-guide.pdf`);
    if (existsSync(pdfDir)) {
      console.log(`   Individual PDFs: email-previews/pdf/*.pdf`);
    }
  } else {
    console.log("⚠️  (run npm run email:preview manually)");
  }
}

// Smoke-build every template
for (const id of JOURNEY_EMAIL_IDS) {
  buildJourneyEmail(id);
}

process.exit(earned >= total ? 0 : 1);
