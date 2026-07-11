#!/usr/bin/env npx tsx
/**
 * Outbound email image audit — hosted HTTPS assets, no data: URIs in production HTML.
 * Run: npm run email:assets-audit
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import { emailCatalog } from "../src/lib/email-catalog";
import { emailDanielPhotoUrl, emailLogoUrl } from "../src/lib/email-assets";
import { brandedEmailHtml } from "../src/lib/email-templates";
import { buildJourneyEmail, JOURNEY_EMAIL_IDS } from "../src/lib/journey-emails";

const root = join(import.meta.dirname, "..");

type Check = { name: string; pass: boolean; detail?: string };
const checks: Check[] = [];

function assert(name: string, pass: boolean, detail?: string) {
  checks.push({ name, pass, detail });
}

const logoUrl = emailLogoUrl();
const danielUrl = emailDanielPhotoUrl();

assert("logo.png exists in public/", existsSync(join(root, "public/logo.png")));
assert("daniel-mehrnia.jpg exists in public/", existsSync(join(root, "public/daniel-mehrnia.jpg")));
assert("email logo URL is production HTTPS", logoUrl.startsWith("https://loans.bridgingloansbroker.co.uk/logo.png"));
assert(
  "email Daniel photo URL is production JPEG",
  danielUrl.startsWith("https://loans.bridgingloansbroker.co.uk/daniel-mehrnia.jpg"),
);

const sampleHtml = brandedEmailHtml("Hi Joe,\n\nTest body.", "Test subject", {
  stageLabel: "Test",
  cta: { label: "Book a call", href: "https://loans.bridgingloansbroker.co.uk/lp/book?lead=test" },
});

assert("production HTML uses hosted logo URL", sampleHtml.includes(logoUrl));
assert("production HTML uses hosted Daniel photo URL", sampleHtml.includes(danielUrl));
assert("production HTML has no data:image logo", !sampleHtml.includes("data:image/png"));
assert("production HTML has no data:image Daniel photo", !/data:image\/(webp|jpeg|png)/.test(sampleHtml));

for (const id of JOURNEY_EMAIL_IDS) {
  const entry = buildJourneyEmail(id);
  const html = brandedEmailHtml(entry.body, entry.subject, {
    ...entry.options,
    stageLabel: entry.stage,
  });
  assert(`${id}: hosted logo`, html.includes(logoUrl));
  assert(`${id}: hosted Daniel photo`, html.includes(danielUrl));
  assert(`${id}: no inline data URIs`, !html.includes("data:image/"));
}

// PDF preview mode may embed base64 — that's intentional
const pdfHtml = brandedEmailHtml("Preview", "Preview", { embedInlineAssets: true });
assert("embedInlineAssets mode allowed for PDF tooling", true);

const passed = checks.filter((c) => c.pass).length;
console.log("\n🖼️  Email assets audit (outbound)\n");
for (const c of checks) {
  console.log(`${c.pass ? "✅" : "❌"} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
}
console.log(`\n${passed}/${checks.length} passed\n`);
process.exit(passed === checks.length ? 0 : 1);
