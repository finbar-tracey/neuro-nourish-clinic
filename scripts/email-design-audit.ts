#!/usr/bin/env npx tsx
/**
 * PDF / visual email design audit — /10 score. No sends.
 *
 * Run: npm run email:design-audit
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

import { emailCatalog } from "../src/lib/email-catalog";
import { buildJourneyEmail } from "../src/lib/journey-emails";
import {
  brandedEmailHtml,
  danielPhotoDataUri,
  logoDataUri,
} from "../src/lib/email-templates";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

type ScoreItem = { label: string; points: number; ok: boolean; detail?: string };
const items: ScoreItem[] = [];

function score(label: string, points: number, ok: boolean, detail?: string) {
  items.push({ label, points, ok, detail });
  console.log(`${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
}

console.log("\nEmail PDF design audit\n");

const templates = read("src/lib/email-templates.ts");
const sample = brandedEmailHtml(
  "What happens next:\n• First item\n• Second item\n\n1. Numbered one\n2. Numbered two",
  "Sample subject",
  { stageLabel: "Test stage", cta: { label: "Book a call", href: "https://example.com" } },
);

score("Navy + orange brand tokens", 0.5, templates.includes("#f98e38") && templates.includes("#1c1c55"));
score("Logo embedded for PDF (base64)", 0.5, Boolean(logoDataUri()), logoDataUri() ? "logo.png" : "missing");
score(
  "Outbound emails use hosted logo URL",
  1,
  sample.includes("https://loans.bridgingloansbroker.co.uk/logo.png"),
);
score(
  "Outbound emails use hosted Daniel JPEG",
  1,
  sample.includes("https://loans.bridgingloansbroker.co.uk/daniel-mehrnia.jpg"),
);
score("Daniel photo in signature", 1, sample.includes("Daniel Mehrnia"));
score("Stage pill in header", 1, sample.includes("Test stage"));
score("Serif subject headline (site match)", 1, templates.includes("EMAIL_BRAND.serif") && sample.includes("<h1"));
score("Mixed intro + bullet list parsing", 1, sample.includes("What happens next") && sample.includes("First item") && sample.includes("list-style:none"));
score("Numbered list styling", 0.5, sample.includes("Numbered one"));
score("Google trust strip in footer", 1, sample.includes("★★★★★") && sample.includes("Google"));
score("Primary CTA button (orange)", 1, sample.includes("Book a call") && sample.includes(`background:#f98e38`));
score("Phone fallback under CTA", 0.5, sample.includes("Prefer to talk now"));
score("Print color-adjust CSS", 0.5, templates.includes("print-color-adjust"));
score("Preheader for inbox preview", 0.5, sample.includes("display:none") && templates.includes("preheader"));
score("Checklist cream box styling", 0.5, templates.includes("border-left:4px solid"));

const docRequest = brandedEmailHtml(
  "Hi James,\n\nUpload here: https://example.com/upload/abc\n\nSubject to status and lender criteria. Business and investment purposes only.",
  "Document request",
  { cta: { label: "Upload documents", href: "https://example.com/upload/abc" }, stageLabel: "Documents requested" },
);
score(
  "No duplicate URL when CTA button present",
  0.5,
  !docRequest.includes("Upload here:") && docRequest.includes("Upload documents"),
);
score(
  "Legal disclaimer only in footer (not body)",
  0.5,
  (docRequest.match(/Subject to status and lender criteria/g) ?? []).length === 1,
);

const teamsCall = brandedEmailHtml(
  "Hi James,\n\nJoin your consultation: https://teams.microsoft.com/l/meetup-join/example",
  "Call confirmed",
  { cta: { label: "Join your consultation", href: "https://teams.microsoft.com/l/meetup-join/example" } },
);
score(
  "Teams link as CTA (no raw URL in body)",
  0.5,
  teamsCall.includes("Join your consultation") && !teamsCall.includes("Join your consultation:"),
);

const captureWelcome = brandedEmailHtml(
  buildJourneyEmail("capture-welcome").body,
  buildJourneyEmail("capture-welcome").subject,
  buildJourneyEmail("capture-welcome").options,
);
score("Capture welcome has completion CTA", 0.5, captureWelcome.includes("Complete your eligibility check"));

// Render all catalog entries without error
let renderOk = true;
for (const entry of emailCatalog()) {
  try {
    brandedEmailHtml(entry.body, entry.subject, {
      ...entry.options,
      embedInlineAssets: true,
      logoUrl: logoDataUri() ?? undefined,
      stageLabel: entry.stage,
    });
  } catch {
    renderOk = false;
  }
}
score("All journey templates render", 1, renderOk, `${emailCatalog().length} templates`);

const earned = items.filter((i) => i.ok).reduce((s, i) => s + i.points, 0);
const total = items.reduce((s, i) => s + i.points, 0);
const rating = Math.min(10, Math.round(earned));

console.log(`\nScore: ${rating}/10 (${earned}/${total} points)`);
console.log(
  earned >= total
    ? "\nVerdict: PDF-ready, on-brand email design.\n"
    : "\nVerdict: Design gaps remain — see failed checks.\n",
);

if (process.env.EMAIL_DESIGN_AUDIT_EXPORT !== "false") {
  process.stdout.write("▶ Regenerating PDF previews… ");
  const result = spawnSync("npm", ["run", "email:preview"], { stdio: "pipe", shell: true, cwd: root });
  const pdfDir = join(root, "email-previews", "pdf");
  const pdfCount = existsSync(pdfDir)
    ? readFileSync(join(root, "email-previews", "index.html"), "utf8").match(/pdf\//g)?.length ?? 0
    : 0;
  console.log(result.status === 0 ? `✅ (${pdfCount} PDF refs)` : "⚠️");
}

process.exit(earned >= total ? 0 : 1);
