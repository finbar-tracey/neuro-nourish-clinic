#!/usr/bin/env npx tsx
/**
 * Web development audit for NeuroNourish (a11y, touch, security, funnel engineering).
 *
 * Run: npm run neuronourish:webdev
 * Reference: docs/NEURONOURISH_WEB_DEVELOPMENT.md · https://web.dev/articles/vitals
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";

const ROOT = resolve(import.meta.dirname, "..");
config({ path: resolve(ROOT, ".env.local") });
config();

type Check = { id: string; category: string; name: string; pass: boolean; detail?: string; p0?: boolean };
const checks: Check[] = [];

function read(rel: string): string {
  return readFileSync(resolve(ROOT, rel), "utf8");
}

function check(
  id: string,
  category: string,
  name: string,
  pass: boolean,
  detail?: string,
  p0 = true,
) {
  checks.push({ id, category, name, pass, detail, p0 });
}

const layout = read("src/app/layout.tsx");
const shell = read("src/components/neuronourish/shell.tsx");
const input = read("src/components/ui/input.tsx");
const quiz = read("src/components/neuronourish/brain-health-quiz.tsx");
const nextConfig = read("next.config.ts");
const stepper = read("src/components/neuronourish/content/funnel-stepper.tsx");
const catalog = read("src/components/neuronourish/shop-catalog.tsx");
const card = read("src/components/neuronourish/shop-product-card.tsx");
const banner = read("src/components/neuronourish/cns-live-ops-banner.tsx");

// Semantics
check("S1", "Semantics", "HTML lang=en", layout.includes('lang="en"'));
check("S2", "Semantics", "main#main-content", shell.includes('id="main-content"'));
check(
  "S3",
  "Semantics",
  "Skip link component wired",
  existsSync(resolve(ROOT, "src/components/layout/skip-link.tsx")) &&
    read("src/app/layout.tsx").toLowerCase().includes("skip"),
);

// Forms / a11y
check(
  "A1",
  "Accessibility",
  "FieldError uses role=alert or aria-live",
  /role=["']alert["']/.test(input) || /aria-live=/.test(input),
);
check("A2", "Accessibility", "FieldError accepts id for describedby", /id\??:/.test(input) || input.includes("id?:"));
check(
  "A3",
  "Accessibility",
  "Quiz consent has htmlFor/id pairing",
  quiz.includes('htmlFor="quiz-consent"') && quiz.includes('id="quiz-consent"'),
);
check(
  "A4",
  "Accessibility",
  "Quiz inputs set aria-invalid on errors",
  quiz.includes("aria-invalid"),
);

// Touch
check(
  "T1",
  "Touch",
  "GoldButton min-h 48px",
  shell.includes("min-h-[48px]") && shell.includes("GoldButton"),
);
check(
  "T2",
  "Touch",
  "Shop filter chips min-h 44px",
  catalog.includes("min-h-[44px]"),
);
check(
  "T3",
  "Touch",
  "Funnel stepper targets min 44px",
  stepper.includes("min-h-[44px]") && stepper.includes("min-w-[44px]"),
);
check(
  "T4",
  "Touch",
  "Inputs use touch-input class",
  input.includes("touch-input"),
);

// Security
check(
  "SEC1",
  "Security",
  "X-Content-Type-Options nosniff",
  nextConfig.includes("X-Content-Type-Options") && nextConfig.includes("nosniff"),
);
check(
  "SEC2",
  "Security",
  "X-Frame-Options set",
  nextConfig.includes("X-Frame-Options"),
);

// Funnel engineering
check(
  "F1",
  "Funnel",
  "Quiz capture after all questions (end gate)",
  read("src/lib/neuronourish-quiz-data.ts").includes(
    "NN_QUIZ_CAPTURE_AFTER = NN_QUIZ_QUESTIONS.length",
  ),
);
check(
  "F2",
  "Funnel",
  "Shop cards preserve leadId",
  card.includes("leadId") && card.includes("withLead"),
);
check(
  "F3",
  "Funnel",
  "Quiz hydrates leadId from URL",
  quiz.includes("leadId") && (quiz.includes("searchParams") || quiz.includes("URLSearchParams")),
);
check(
  "F4",
  "Funnel",
  "CNS ops banner gated off public by default",
  banner.includes("NN_SHOW_OPS_BANNER"),
);

// Docs
check(
  "DOC1",
  "Documentation",
  "Web development checklist exists",
  existsSync(resolve(ROOT, "docs/NEURONOURISH_WEB_DEVELOPMENT.md")),
);
check(
  "DOC2",
  "Documentation",
  "Mobile checklist exists",
  existsSync(resolve(ROOT, "docs/NEURONOURISH_MOBILE_RESPONSIVE.md")),
);

async function main() {
  const categories = [...new Set(checks.map((c) => c.category))];
  const p0 = checks.filter((c) => c.p0 !== false);
  const p0Pass = p0.filter((c) => c.pass).length;
  const allPass = checks.filter((c) => c.pass).length;

  console.log("\n🛠  NeuroNourish web development audit\n");
  for (const cat of categories) {
    console.log(`\n## ${cat}`);
    for (const c of checks.filter((x) => x.category === cat)) {
      console.log(`${c.pass ? "✅" : "❌"} [${c.id}] ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
    }
  }

  console.log(`\nP0: ${p0Pass}/${p0.length} · Total: ${allPass}/${checks.length}`);
  console.log(
    p0Pass === p0.length
      ? "\nVerdict: PASS (automated P0 webdev checks)\n"
      : "\nVerdict: FAIL — fix P0 issues before webdev sign-off\n",
  );
  console.log("Full checklist: docs/NEURONOURISH_WEB_DEVELOPMENT.md\n");

  process.exit(p0Pass === p0.length ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
