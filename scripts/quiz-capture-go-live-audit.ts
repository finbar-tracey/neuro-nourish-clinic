#!/usr/bin/env npx tsx
/**
 * NeuroNourish quiz capture — go-live gate (staging → production).
 *
 * Pre-deploy:
 *   VERTICAL=neuronourish NEXT_PUBLIC_VERTICAL=neuronourish npm run quiz:go-live
 *
 * Against staging/production URL:
 *   NN_GO_LIVE_BASE_URL=https://….vercel.app npm run quiz:go-live
 *
 * Production unlock (after Emer approves staging):
 *   EMER_STAGING_APPROVED=true QUIZ_*_CONFIRMED=true npm run quiz:go-live
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";

config({ path: ".env.local" });
config();

process.env.NOTIFICATIONS_DRY_RUN ??= "true";
process.env.META_CAPI_DRY_RUN ??= "true";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

type Item = { phase: string; name: string; pass: boolean; detail?: string; severity: "P0" | "P1" };
const items: Item[] = [];

function record(
  phase: string,
  name: string,
  pass: boolean,
  detail?: string,
  severity: "P0" | "P1" = "P0",
) {
  items.push({ phase, name, pass, detail, severity });
  const icon = pass ? "✓" : severity === "P0" ? "✗" : "!";
  console.log(`${icon} [${severity}/${phase}] ${name}${detail ? ` — ${detail}` : ""}`);
}

function flag(name: string) {
  return process.env[name] === "true";
}

function runNpm(script: string): { ok: boolean; out: string } {
  try {
    const out = execSync(`npm run ${script}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        VERTICAL: process.env.VERTICAL ?? "neuronourish",
        NEXT_PUBLIC_VERTICAL: process.env.NEXT_PUBLIC_VERTICAL ?? "neuronourish",
        NOTIFICATIONS_DRY_RUN: "true",
        META_CAPI_DRY_RUN: "true",
      },
    });
    return { ok: true, out };
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string; status?: number };
    return { ok: false, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}

async function main() {
  console.log("\nNeuroNourish quiz capture go-live audit\n");

  const vertical = (process.env.VERTICAL ?? "").toLowerCase();
  const pubVertical = (process.env.NEXT_PUBLIC_VERTICAL ?? "").toLowerCase();
  record("Env", "VERTICAL=neuronourish", vertical === "neuronourish", `VERTICAL=${vertical || "unset"}`);
  record(
    "Env",
    "NEXT_PUBLIC_VERTICAL=neuronourish",
    pubVertical === "neuronourish",
    `NEXT_PUBLIC_VERTICAL=${pubVertical || "unset"}`,
  );

  // ── Nested gates ──
  const quizPost = runNpm("quiz:post-implementation");
  record(
    "Gate",
    "quiz:post-implementation",
    quizPost.ok && quizPost.out.includes("PASS"),
    quizPost.ok ? "automated PASS" : "see nested output",
  );

  const nnGoLive = runNpm("neuronourish:go-live");
  record(
    "Gate",
    "neuronourish:go-live",
    nnGoLive.ok && nnGoLive.out.includes("GO LIVE"),
    nnGoLive.ok ? "P0 pass" : "P0 failures — see nested output",
  );

  const brand = runNpm("neuronourish:brand");
  record(
    "Gate",
    "neuronourish:brand",
    brand.ok && (brand.out.includes("39/39") || brand.out.includes("COMPLIANT")),
    brand.ok ? "brand compliant" : "brand gate failed",
  );

  // ── Deploy safety ──
  const projectJson = existsSync(join(root, ".vercel/project.json"))
    ? read(".vercel/project.json")
    : "";
  const linkedName = /"projectName":\s*"([^"]+)"/.exec(projectJson)?.[1] ?? "";
  record(
    "Deploy",
    "Linked project is neuro-nourish-clinic (not loans)",
    linkedName === "neuro-nourish-clinic" || linkedName === "",
    linkedName ? `linked=${linkedName}` : "not linked yet — run deploy:nn-staging",
    linkedName && linkedName !== "neuro-nourish-clinic" ? "P0" : "P1",
  );
  record(
    "Deploy",
    "Go-live doc present",
    existsSync(join(root, "docs/QUIZ_CAPTURE_GO_LIVE.md")),
    "docs/QUIZ_CAPTURE_GO_LIVE.md",
  );
  const pkg = read("package.json");
  record("Deploy", "deploy:nn-staging script", pkg.includes('"deploy:nn-staging"'));
  record("Deploy", "deploy:nn-prod script", pkg.includes('"deploy:nn-prod"'));

  // ── Conversion model needles ──
  const quizData = read("src/lib/neuronourish-quiz-data.ts");
  record("Model", "Soft gate after Q6", quizData.includes("NN_QUIZ_CAPTURE_AFTER = 6"));

  const copy = read("src/lib/neuronourish-copy.ts");
  record("Model", "One-click email report CTA", copy.includes('cta: "Email my report"'));
  record("Model", "Phone upsell after email", copy.includes("phoneUpsellTitle:"));

  const leadSubmit = read("src/lib/neuronourish-lead-submit.ts");
  const softBlock = leadSubmit.slice(
    leadSubmit.indexOf('funnelStage === "quiz_partial"'),
    leadSubmit.indexOf('funnelStage === "quiz_report_request"'),
  );
  record(
    "Model",
    "Soft capture has no partner alert",
    softBlock.includes("enrollNeuronourishNurture") && !softBlock.includes("sendNeuronourishPartnerAlert"),
  );
  record(
    "Model",
    "Hot call nextAction on phone report",
    leadSubmit.includes("Call client — quiz report requested"),
  );

  const resultsUi = read("src/components/neuronourish/content/quiz-results-panel.tsx");
  record("Model", "Report emailReport one-click", resultsUi.includes("async function emailReport"));
  record(
    "Model",
    "Phone upsell after success",
    resultsUi.includes("NN_QUIZ_REPORT_CTA.phoneUpsellTitle"),
  );

  // ── Live (optional) ──
  const baseUrl = (process.env.NN_GO_LIVE_BASE_URL ?? process.env.QUIZ_POST_IMPL_URL ?? "").replace(
    /\/$/,
    "",
  );
  if (baseUrl) {
    for (const route of ["/", "/quiz", "/api/health/neuronourish"]) {
      try {
        const res = await fetch(`${baseUrl}${route}`, { redirect: "follow" });
        record("Live", `GET ${route}`, res.ok, `${res.status}`);
      } catch (err) {
        record("Live", `GET ${route}`, false, err instanceof Error ? err.message : "fetch failed");
      }
    }
    try {
      const soft = await fetch(`${baseUrl}/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vertical: "neuronourish",
          funnelStage: "quiz_partial",
          firstName: "GoLive",
          email: `golive.${Date.now()}@test.local`,
          consent: true,
          quizProgress: 6,
          phone: "",
        }),
      });
      const json = (await soft.json()) as { ok?: boolean; leadId?: string };
      record(
        "Live",
        "Soft capture API",
        soft.ok && Boolean(json.leadId),
        json.leadId ? `leadId=${json.leadId}` : `status=${soft.status}`,
      );
    } catch (err) {
      record("Live", "Soft capture API", false, err instanceof Error ? err.message : "failed");
    }
  } else {
    record("Live", "NN_GO_LIVE_BASE_URL unset (skipped)", true, "set after staging deploy", "P1");
  }

  // ── Emer / manual ──
  const emer = flag("EMER_STAGING_APPROVED");
  record(
    "Manual",
    "Emer staging approved",
    emer,
    emer ? "yes" : "set EMER_STAGING_APPROVED=true after Emer review",
    "P1",
  );
  for (const [env, label] of [
    ["QUIZ_SOFT_GATE_CONFIRMED", "Soft gate E2E"],
    ["QUIZ_RESULTS_REVEAL_CONFIRMED", "Results reveal E2E"],
    ["QUIZ_REPORT_OPTIONAL_PHONE_CONFIRMED", "Phone upsell E2E"],
    ["QUIZ_CRM_WIRING_CONFIRMED", "CRM wiring E2E"],
  ] as const) {
    const ok = flag(env);
    record("Manual", label, ok, ok ? "yes" : `set ${env}=true`, "P1");
  }

  // ── Summary ──
  const p0 = items.filter((i) => i.severity === "P0");
  const p0Fail = p0.filter((i) => !i.pass);
  const p1 = items.filter((i) => i.severity === "P1");
  const p1Pass = p1.filter((i) => i.pass).length;

  console.log("\n────────────────────────────────────────");
  console.log(`P0: ${p0.length - p0Fail.length}/${p0.length} · P1: ${p1Pass}/${p1.length}`);
  if (p0Fail.length) {
    console.log("\nP0 failures:");
    for (const f of p0Fail) console.log(`  ✗ [${f.phase}] ${f.name}${f.detail ? ` — ${f.detail}` : ""}`);
  }

  const prodReady = p0Fail.length === 0 && emer && flag("QUIZ_SOFT_GATE_CONFIRMED");
  if (p0Fail.length) {
    console.log("\nVerdict: DO NOT DEPLOY (P0 failures)\n");
    console.log("Doc: docs/QUIZ_CAPTURE_GO_LIVE.md\n");
    process.exit(1);
  }

  if (prodReady) {
    console.log("\nVerdict: GO LIVE TO PRODUCTION (P0 + Emer approval)\n");
  } else {
    console.log(
      "\nVerdict: GO STAGING (P0 pass) — await Emer approval before deploy:nn-prod\n",
    );
  }
  console.log("Doc: docs/QUIZ_CAPTURE_GO_LIVE.md\n");
  process.exit(0);
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
