#!/usr/bin/env npx tsx
/**
 * NeuroNourish go-live audit — static codebase + optional live URL checks.
 *
 * Run: npm run neuronourish:go-live
 * Live: NN_GO_LIVE_BASE_URL=https://neuronourish.clinic npm run neuronourish:go-live
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";

const ROOT = resolve(import.meta.dirname, "..");
config({ path: resolve(ROOT, ".env.local") });
config();
const BASE_URL = process.env.NN_GO_LIVE_BASE_URL?.replace(/\/$/, "");

type Check = { id: string; pass: boolean; detail: string; severity: "P0" | "P1" };

const checks: Check[] = [];

function add(id: string, pass: boolean, detail: string, severity: Check["severity"] = "P0") {
  checks.push({ id, pass, detail, severity });
}

function fileIncludes(relPath: string, needles: string[]) {
  const path = resolve(ROOT, relPath);
  if (!existsSync(path)) return { ok: false, detail: `missing: ${relPath}` };
  const text = readFileSync(path, "utf8");
  const missing = needles.filter((n) => !text.includes(n));
  if (missing.length) return { ok: false, detail: `missing in ${relPath}: ${missing.join(", ")}` };
  return { ok: true, detail: relPath };
}

async function main() {
  console.log("\n🧠 NeuroNourish go-live audit\n");
  const vertical = process.env.VERTICAL?.toLowerCase();
  const pubVertical = process.env.NEXT_PUBLIC_VERTICAL?.toLowerCase();
  add("env-vertical", vertical === "neuronourish", `VERTICAL=${vertical ?? "unset"}`);
  add("env-public-vertical", pubVertical === "neuronourish", `NEXT_PUBLIC_VERTICAL=${pubVertical ?? "unset"}`);

  // ── Copy deck ──
  const copy = fileIncludes("src/lib/neuronourish-copy.ts", [
    "NN_JOURNEY_STEPS",
    "NN_WHY_BENEFITS",
    "NN_CLINICS",
    "NN_DISCOVERY",
    "NN_QUIZ_RESULTS",
    "NN_PRIVACY",
    "highlights:",
  ]);
  add("copy-deck", copy.ok, copy.detail);

  // ── Content system ──
  const contentIndex = existsSync(resolve(ROOT, "src/components/neuronourish/content/index.ts"));
  add("content-components", contentIndex, "src/components/neuronourish/content/");

  // ── Funnel pages ──
  const pages = [
    "src/app/page.tsx",
    "src/components/neuronourish/home-page.tsx",
    "src/app/quiz/page.tsx",
    "src/app/quiz/results/page.tsx",
    "src/app/assessment/page.tsx",
    "src/app/programme/page.tsx",
    "src/app/discovery/page.tsx",
    "src/app/contact/page.tsx",
    "src/app/clinics/page.tsx",
    "src/app/privacy/page.tsx",
    "src/app/about/page.tsx",
    "src/app/blog/page.tsx",
    "src/app/how-the-app-works/page.tsx",
  ];
  const missingPages = pages.filter((p) => !existsSync(resolve(ROOT, p)));
  add("funnel-pages", missingPages.length === 0, missingPages.length ? `missing: ${missingPages.join(", ")}` : `${pages.length} routes`);

  // ── Nurture ──
  const nurture = fileIncludes("src/lib/neuronourish-nurture.ts", [
    "Your Brain Health Baseline + Next Steps",
    "quiz_complete: [2 / 60, 48, 96, 144]",
  ]);
  add("nurture-sequence", nurture.ok, nurture.detail);

  const processor = fileIncludes("src/lib/process-neuronourish-nurture.ts", ["NN nurture"]);
  add("nurture-processor", processor.ok, processor.detail);

  const cron = fileIncludes("src/app/api/cron/process-idle/route.ts", ["processDueNeuronourishNurtureEmails"]);
  add("cron-nn-nurture", cron.ok, cron.detail);

  // ── SEO (indexable for NN) ──
  const seo = fileIncludes("src/lib/seo.ts", ["INDEXABLE_ROBOTS", "isNeuronourish"]);
  add("seo-indexable", seo.ok, seo.detail);

  const nnSeo = fileIncludes("src/lib/neuronourish-seo.ts", ["NN_PAGE_SEO", "neuronourishHomeJsonLd"]);
  add("seo-page-registry", nnSeo.ok, nnSeo.detail);

  const sitemap = fileIncludes("src/app/sitemap.ts", ["isNeuronourish", "neuronourishPublicPaths"]);
  add("sitemap-nn", sitemap.ok, sitemap.detail);

  const ogImage = existsSync(resolve(ROOT, "src/app/opengraph-image.tsx"));
  add("og-image", ogImage, "src/app/opengraph-image.tsx");

  const sfDoc = existsSync(resolve(ROOT, "docs/NEURONOURISH_SCREAMING_FROG_SEO.md"));
  add("screaming-frog-doc", sfDoc, "docs/NEURONOURISH_SCREAMING_FROG_SEO.md");

  // ── Privacy ──
  const privacy = fileIncludes("src/app/privacy/page.tsx", [
    "NeuronourishPrivacy",
    "NN_PRIVACY",
    "isHealthcare",
  ]);
  add("privacy-nn", privacy.ok, privacy.detail);

  // ── Health API ──
  add(
    "health-api",
    existsSync(resolve(ROOT, "src/app/api/health/neuronourish/route.ts")),
    "/api/health/neuronourish",
  );

  // ── Docs ──
  add(
    "go-live-doc",
    existsSync(resolve(ROOT, "docs/NEURONOURISH_GO_LIVE.md")),
    "docs/NEURONOURISH_GO_LIVE.md",
  );

  // ── Integration env (advisory locally) ──
  const integrationKeys = [
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "RESEND_API_KEY",
    "KV_REST_API_URL",
    "WORKSPACE_SECRET",
    "CRON_SECRET",
  ];
  for (const key of integrationKeys) {
    add(`env-${key.toLowerCase()}`, Boolean(process.env[key]?.trim()), key, "P1");
  }
  add(
    "env-calendly",
    Boolean(process.env.NEXT_PUBLIC_CALENDLY_URL?.trim()),
    "NEXT_PUBLIC_CALENDLY_URL",
    "P1",
  );

  // ── Optional live checks ──
  if (BASE_URL) {
    await runLiveChecks(BASE_URL);
  }

  printReport();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function runLiveChecks(base: string) {
  const routes = ["/", "/quiz", "/privacy", "/sitemap.xml", "/robots.txt", "/api/health/neuronourish"];

  for (const route of routes) {
    try {
      const res = await fetch(`${base}${route}`, { redirect: "follow" });
      add(`live${route.replace(/\//g, "-")}`, res.ok, `${route} → HTTP ${res.status}`);
    } catch (error) {
      add(
        `live${route.replace(/\//g, "-")}`,
        false,
        `${route} → ${error instanceof Error ? error.message : "fetch failed"}`,
      );
    }
  }

  try {
    const health = await fetch(`${base}/api/health/neuronourish`).then((r) => r.json());
    add("live-health-ok", health.ok === true, `health.ok=${health.ok}`);
    add(
      "live-health-status",
      health.status === "healthy" || health.status === "degraded",
      `health.status=${health.status ?? "unset"}`,
    );
    add(
      "live-integrations",
      typeof health.integrations === "string" &&
        (health.integrations.startsWith("verified") ||
          (health.ok === true && health.integrations === "partial")),
      `integrations=${health.integrations ?? "unset"}`,
    );
    add(
      "live-brand-audit",
      typeof health.brand_audit === "string" &&
        (health.brand_audit.includes("passed automatically via build artifact") ||
          /^\d+\/\d+ passed/.test(health.brand_audit)),
      `brand_audit=${health.brand_audit ?? "unset"}`,
    );
    add(
      "live-brand-compliant",
      health.brand_report?.status === "COMPLIANT",
      `brand_report.status=${health.brand_report?.status ?? "unset"}`,
    );
  } catch {
    add("live-health-ok", false, "could not parse /api/health/neuronourish");
  }

  try {
    const sitemap = await fetch(`${base}/sitemap.xml`).then((r) => r.text());
    add("live-sitemap-populated", sitemap.includes("<loc>"), "sitemap has URLs");
  } catch {
    add("live-sitemap-populated", false, "sitemap fetch failed");
  }
}

function printReport() {
  const p0 = checks.filter((c) => c.severity === "P0");
  const p0Pass = p0.filter((c) => c.pass).length;
  const p1 = checks.filter((c) => c.severity === "P1");
  const p1Pass = p1.filter((c) => c.pass).length;

  for (const check of checks) {
    const icon = check.pass ? "✅" : check.severity === "P0" ? "❌" : "⚠️ ";
    console.log(`${icon} [${check.severity}] ${check.id} — ${check.detail}`);
  }

  console.log(`\nP0: ${p0Pass}/${p0.length} · P1: ${p1Pass}/${p1.length}`);

  const verdict =
    p0Pass === p0.length
      ? "GO LIVE (automated P0 pass)"
      : "DO NOT GO LIVE (P0 failures — see above)";

  console.log(`\nVerdict: ${verdict}\n`);
  console.log("Full checklist: docs/NEURONOURISH_GO_LIVE.md\n");

  process.exit(p0Pass === p0.length ? 0 : 1);
}

