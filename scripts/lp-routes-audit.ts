#!/usr/bin/env npx tsx
/**
 * SMS/email deep-link route audit — /lp/book and resume URLs.
 * Run: npm run lp:routes-audit
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");

type Check = { name: string; pass: boolean; detail?: string };
const checks: Check[] = [];

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

function assert(name: string, pass: boolean, detail?: string) {
  checks.push({ name, pass, detail });
}

const smsLinks = read("src/lib/sms-links.ts");
const smsCopy = read("src/lib/sms-copy.ts");
const journey = read("src/lib/journey-emails.ts");
const bookPage = read("src/app/lp/book/page.tsx");
const bookClient = existsSync(join(root, "src/components/landing/book-page-client.tsx"))
  ? read("src/components/landing/book-page-client.tsx")
  : "";

assert("borrowerBookUrl uses /lp/book", smsLinks.includes("/lp/book?lead="));
assert("borrower links use production origin", smsLinks.includes("borrowerLinkOrigin"));
assert("borrowerResumeUrl uses /lp step 3", smsLinks.includes("/lp?lead=") && smsLinks.includes("step=3"));
assert("No-booking SMS uses book URL", smsCopy.includes("borrowerBookUrl"));
assert(
  "Qualified confirmation email uses book URL",
  journey.includes("borrowerBookUrl") && !journey.includes("/lp/thank-you"),
);
assert("/lp/book page exists", bookPage.includes("BookPageClient"));
assert("Book page client loads lead", bookClient.includes("lead") || bookClient.includes("leadId"));
assert(
  "Book priority call API wired",
  read("src/components/forms/qualified-thank-you.tsx").includes("bookPriorityCall"),
);

const passed = checks.filter((c) => c.pass).length;
console.log("\n🔗 LP deep-link routes audit\n");
for (const c of checks) {
  console.log(`${c.pass ? "✅" : "❌"} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
}
console.log(`\n${passed}/${checks.length} passed\n`);
process.exit(passed === checks.length ? 0 : 1);
