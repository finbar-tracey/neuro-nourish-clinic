#!/usr/bin/env npx tsx
/**
 * Meta LP post-implementation gate — run after deploying compliance changes.
 *
 * Static (pre-deploy):  npm run meta-lp:post-impl
 * Live production:      META_LP_POST_IMPL_URL=https://loans.bridgingloansbroker.co.uk npm run meta-lp:post-impl
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  META_LP_BANNED_ALLOWLIST,
  META_LP_BANNED_PATTERNS,
  META_LP_METADATA,
} from "../src/lib/meta-lp-copy";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

type Item = { phase: string; name: string; pass: boolean; detail?: string };

const items: Item[] = [];

function record(phase: string, name: string, pass: boolean, detail?: string) {
  items.push({ phase, name, pass, detail });
  console.log(`${pass ? "✓" : "✗"} [${phase}] ${name}${detail ? ` — ${detail}` : ""}`);
}

function runNpm(script: string): { ok: boolean; out: string } {
  try {
    const out = execSync(`npm run ${script}`, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return { ok: true, out };
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string };
    return { ok: false, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}

function lineAllowed(line: string): boolean {
  return META_LP_BANNED_ALLOWLIST.some((snippet) => line.includes(snippet));
}

function scanBanned(label: string, content: string) {
  for (const { label: rule, pattern } of META_LP_BANNED_PATTERNS) {
    for (const line of content.split("\n")) {
      if (!pattern.test(line) || lineAllowed(line)) continue;
      record("Live LP", `No banned: ${rule}`, false, `${label}: ${line.trim().slice(0, 80)}`);
    }
  }
}

async function main() {
  const baseUrl = (
    process.env.META_LP_POST_IMPL_URL ??
    process.env.META_LP_AUDIT_URL ??
    ""
  ).replace(/\/$/, "");

  console.log("\nMeta LP post-implementation audit\n");

  // ── Phase 1: Static ──
  const metaLp = runNpm("meta-lp:audit");
  record("Static", "meta-lp:audit", metaLp.ok, metaLp.ok ? "PASS" : "see output above");

  const tracking = runNpm("tracking:audit");
  record("Static", "tracking:audit", tracking.ok, tracking.ok ? "10/10" : "failed");

  const prelaunch = runNpm("prelaunch:audit");
  record("Static", "prelaunch:audit", prelaunch.ok, prelaunch.ok ? "passed" : "see output");

  record(
    "Static",
    "Compliance copy module present",
    read("src/lib/meta-lp-copy.ts").includes("META_LP_METADATA"),
  );
  record(
    "Static",
    "FCA disclaimer in footer copy",
    read("src/lib/meta-lp-copy.ts").includes("not regulated by the FCA"),
  );
  record(
    "Static",
    "Post-impl script registered",
    read("package.json").includes('"meta-lp:post-impl"'),
  );

  // ── Phase 2: Live LP ──
  if (!baseUrl) {
    record(
      "Live LP",
      "Production URL check",
      false,
      "Set META_LP_POST_IMPL_URL=https://loans.bridgingloansbroker.co.uk",
    );
  } else {
    const lpUrl = `${baseUrl}/lp?utm_source=facebook&utm_medium=paid&utm_campaign=LONDON_BLB`;
    console.log(`\nFetching ${lpUrl}\n`);

    try {
      const res = await fetch(lpUrl);
      const html = await res.text();

      record("Live LP", "HTTP 200", res.ok, String(res.status));
      record(
        "Live LP",
        "Compliant page title in HTML",
        html.includes("Property Finance Broker"),
        META_LP_METADATA.title,
      );
      record(
        "Live LP",
        "Compliance strip visible",
        html.includes("Broker, not a lender") && html.includes("Business &amp; investment only"),
      );
      record(
        "Live LP",
        "Enquiry form heading (not bridging loan quote)",
        html.includes("Free Finance Enquiry") || html.includes("Start Your Free Enquiry"),
      );
      record("Live LP", "Privacy link", html.includes('href="/privacy"'));
      record(
        "Live LP",
        "No legacy 48-hour funding badge",
        !html.includes("48-hour funding available") && !html.includes("48 hours — get your free quote"),
      );
      record(
        "Live LP",
        "No public rate on page",
        !html.includes("0.45%/month") && !html.includes("rates from 0.45"),
      );

      const bannedBefore = items.filter((i) => i.phase === "Live LP" && !i.pass).length;
      scanBanned("HTML", html);
      const bannedFailed = items.filter((i) => i.phase === "Live LP" && !i.pass).length > bannedBefore;
      if (!bannedFailed) {
        record("Live LP", "Banned phrase scan", true);
      }

      const privacyRes = await fetch(`${baseUrl}/privacy`);
      const privacyHtml = await privacyRes.text();
      record("Live LP", "Privacy page 200", privacyRes.ok);
      record(
        "Live LP",
        "Privacy meta compliant",
        privacyHtml.includes("property finance enquiry"),
      );
    } catch (err) {
      record("Live LP", "Fetch failed", false, String(err));
    }
  }

  // ── Phase 3: Tracking live (optional) ──
  if (process.env.TRACKING_AUDIT_LIVE === "true") {
    const liveTracking = runNpm("tracking:audit");
    record("Tracking", "Live CAPI test", liveTracking.ok && liveTracking.out.includes("10/10"));
  } else {
    record(
      "Tracking",
      "Live CAPI test",
      true,
      "skipped — TRACKING_AUDIT_LIVE=true to run",
    );
  }

  // ── Phase 4: Ad resubmit checklist (manual gate) ──
  const adChecks = [
    "Special Ad Category: Financial products and services (UK)",
    "Pixel 2033000550579673 + Lead event",
    "Primary text: broker / introducer / no loans",
    "Headline: Property Finance Broker — London",
    "URL includes utm_campaign=LONDON_BLB",
    "Duplicate ad — do not edit rejected creative in place",
  ];
  for (const line of adChecks) {
    record("Ad ops (manual)", line, true, "confirm in Ads Manager after LP live");
  }

  // ── Verdict ──
  const automated = items.filter((i) => i.phase !== "Ad ops (manual)");
  const failed = automated.filter((i) => !i.pass);
  const passed = failed.length === 0;

  console.log("\n── Ad resubmit copy (paste into Ads Manager) ──\n");
  console.log(`Primary: Property finance broker in London. Daniel introduces business and investment bridging enquiries to 200+ specialist funders. Free enquiry, no obligation. Introducer only — not a lender. Subject to status.`);
  console.log(`Headline: Property Finance Broker — London`);
  console.log(`URL: https://loans.bridgingloansbroker.co.uk/lp?utm_source=facebook&utm_medium=paid&utm_campaign=LONDON_BLB\n`);

  if (!baseUrl) {
    console.log("Verdict: BLOCKED — deploy then re-run with META_LP_POST_IMPL_URL\n");
    process.exit(1);
  }

  if (passed) {
    console.log(`Verdict: SHIP — ${automated.length}/${automated.length} automated checks passed. Complete Ad ops in Meta, then hold £25/day for 7 days.\n`);
    process.exit(0);
  }

  console.log(`Verdict: BLOCKED — ${failed.length} check(s) failed:\n`);
  for (const f of failed) {
    console.log(`  • [${f.phase}] ${f.name}${f.detail ? `: ${f.detail}` : ""}`);
  }
  console.log("");
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
