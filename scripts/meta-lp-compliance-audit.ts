#!/usr/bin/env npx tsx
/**
 * Meta LP compliance audit — banned loan/rate/speed language on paid landing pages.
 *
 * Static:  npm run meta-lp:audit
 * Live:     META_LP_AUDIT_URL=https://loans.bridgingloansbroker.co.uk/lp npm run meta-lp:audit
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  META_LP_BANNED_ALLOWLIST,
  META_LP_BANNED_PATTERNS,
  META_LP_METADATA,
} from "../src/lib/meta-lp-copy";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

const LP_FILES = [
  "src/app/page.tsx",
  "src/app/lp/page.tsx",
  "src/app/lp/[angle]/page.tsx",
  "src/app/privacy/page.tsx",
  "src/components/landing/fb-landing-page.tsx",
  "src/components/landing/hero-copy.tsx",
  "src/components/landing/meta-compliance-strip.tsx",
  "src/components/landing/key-facts-section.tsx",
  "src/components/landing/offer-section.tsx",
  "src/components/landing/faq-section.tsx",
  "src/components/landing/problem-section.tsx",
  "src/components/landing/comparison-section.tsx",
  "src/components/landing/how-it-works.tsx",
  "src/components/landing/daniel-expert.tsx",
  "src/components/landing/final-cta-section.tsx",
  "src/components/landing/mid-page-cta.tsx",
  "src/components/landing/use-cases-section.tsx",
  "src/components/landing/sticky-cta.tsx",
  "src/components/landing/regulatory-trust-strip.tsx",
  "src/components/forms/facebook-lead-form.tsx",
  "src/components/forms/form-field-ui.tsx",
];

type Result = { ok: boolean; label: string; detail?: string };

const results: Result[] = [];

function check(ok: boolean, label: string, detail?: string) {
  results.push({ ok, label, detail });
  console.log(`${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
}

function lineAllowed(line: string): boolean {
  return META_LP_BANNED_ALLOWLIST.some((snippet) => line.includes(snippet));
}

function scanContent(label: string, content: string) {
  const lines = content.split("\n");
  for (const { label: rule, pattern } of META_LP_BANNED_PATTERNS) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (!pattern.test(line) || lineAllowed(line)) continue;
      check(false, `${label}: banned ${rule}`, `line ${i + 1}: ${line.trim().slice(0, 100)}`);
    }
  }
}

async function main() {
  console.log("\nMeta LP compliance audit\n");

  for (const file of LP_FILES) {
    scanContent(file, read(file));
  }

  check(
    read("src/app/lp/page.tsx").includes("META_LP_METADATA"),
    "LP metadata uses META_LP_METADATA",
  );
  check(
    read("src/components/landing/fb-landing-page.tsx").includes("MetaComplianceStrip"),
    "Compliance strip on landing page",
  );
  check(
    read("src/components/landing/hero-copy.tsx").includes("MetaComplianceStrip"),
    "Compliance strip in hero",
  );
  check(
    !read("src/components/landing/hero-copy.tsx").includes("sr-only"),
    "Hero H1 visible on mobile (not sr-only)",
  );
  check(
    read("src/components/landing/fb-landing-page.tsx").includes("META_LP_FOOTER_INTRO"),
    "Footer broker disclosure",
  );
  check(
    read("src/components/landing/faq-section.tsx").includes("META_LP_FAQ"),
    "FAQ uses compliant copy module",
  );

  const liveUrl = process.env.META_LP_AUDIT_URL?.trim();
  if (liveUrl) {
    console.log(`\nLive URL: ${liveUrl}\n`);
    try {
      const res = await fetch(liveUrl);
      const html = await res.text();
      check(res.ok, `Live ${liveUrl} responds`, String(res.status));
      check(
        html.includes(META_LP_METADATA.title.split(" | ")[0]!),
        "Live HTML title matches compliant metadata",
      );
      scanContent("live HTML", html);
    } catch (err) {
      check(false, "Live URL fetch", String(err));
    }
  }

  const score = results.filter((r) => r.ok).length;
  const total = results.length;
  const passed = results.every((r) => r.ok);

  console.log(`\n${passed ? "PASS" : "FAIL"} — ${score}/${total} checks\n`);
  process.exit(passed ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
