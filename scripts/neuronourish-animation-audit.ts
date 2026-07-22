#!/usr/bin/env npx tsx
/**
 * Animation / motion audit for NeuroNourish marketing.
 *
 * Run: npm run neuronourish:animation
 * Reference: docs/NEURONOURISH_ANIMATION.md
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

const pkg = read("package.json");
const globals = read("src/app/globals.css");
const home = read("src/components/neuronourish/home-page.tsx");
const hero = read("src/components/neuronourish/content/hero-section.tsx");
const shell = read("src/components/neuronourish/shell.tsx");
const sticky = read("src/components/neuronourish/sticky-cta.tsx");
const quiz = read("src/components/neuronourish/brain-health-quiz.tsx");
const shopCard = read("src/components/neuronourish/shop-product-card.tsx");
const reveal = existsSync(resolve(ROOT, "src/components/neuronourish/nn-scroll-reveal.tsx"))
  ? read("src/components/neuronourish/nn-scroll-reveal.tsx")
  : "";
const appPreview = read("src/components/neuronourish/content/app-preview-visual.tsx");
const quizPreview = read("src/components/neuronourish/content/quiz-preview-visual.tsx");

check(
  "P1",
  "Principles",
  "No framer-motion / gsap / lottie in package.json",
  !/"framer-motion"|"motion"|"gsap"|"lottie"|"@lottiefiles"/.test(pkg),
);
check(
  "P2",
  "Principles",
  "Hero enter animation exists",
  globals.includes(".nn-hero-enter") && globals.includes("nn-hero-rise"),
);
check(
  "P3",
  "Principles",
  "content-visibility defer retained",
  globals.includes(".nn-defer-section") && globals.includes("content-visibility: auto"),
);
check(
  "P4",
  "Principles",
  "prefers-reduced-motion gates hero + reveal + quiz fade",
  globals.includes("prefers-reduced-motion: reduce") &&
    globals.includes(".nn-reveal") &&
    /prefers-reduced-motion[\s\S]*nn-quiz-question/.test(globals),
);

check(
  "H1",
  "Home motion",
  "Hero uses nn-hero-enter",
  hero.includes("nn-hero-enter"),
);
check(
  "H2",
  "Home motion",
  "Hero trust bar included in stagger",
  globals.includes(".nn-hero-enter .nn-hero-trust-bar") && hero.includes("nn-hero-trust-bar"),
);
check(
  "H3",
  "Home motion",
  "Home wires NnScrollReveal",
  home.includes("NnScrollReveal") && reveal.includes("IntersectionObserver"),
);
check(
  "H4",
  "Home motion",
  "Below-fold sections use nn-reveal",
  (home.match(/nn-reveal/g) ?? []).length >= 6,
);
check(
  "H5",
  "Home motion",
  "Reveal unobserves after first intersect",
  reveal.includes("unobserve"),
);
check(
  "H6",
  "Home motion",
  "Sticky CTA uses CSS slide class (stays mounted)",
  sticky.includes("nn-sticky-cta") &&
    sticky.includes("is-visible") &&
    !sticky.includes("if (!visible) return null"),
);

check(
  "C1",
  "CTA & cards",
  "GoldButton uses nn-gold-cta",
  shell.includes("nn-gold-cta"),
);
check(
  "C2",
  "CTA & cards",
  "Shop cards use NnCard hover lift",
  shopCard.includes("NnCard") && globals.includes(".nn-card:hover"),
);
check(
  "C3",
  "CTA & cards",
  "Marketing card hovers translateY",
  globals.includes(".nn-card:hover") && globals.includes("translateY(-2px)"),
);

check(
  "F1",
  "Funnel",
  "Quiz question remount uses nn-quiz-question",
  quiz.includes("nn-quiz-question") && quiz.includes("key={step}"),
);
check(
  "F2",
  "Funnel",
  "App preview respects reduced motion",
  appPreview.includes("prefers-reduced-motion"),
);
check(
  "F3",
  "Funnel",
  "Quiz preview respects reduced motion",
  quizPreview.includes("prefers-reduced-motion"),
);

check(
  "DOC1",
  "Documentation",
  "Animation checklist exists",
  existsSync(resolve(ROOT, "docs/NEURONOURISH_ANIMATION.md")),
);

async function main() {
  const categories = [...new Set(checks.map((c) => c.category))];
  const p0 = checks.filter((c) => c.p0 !== false);
  const p0Pass = p0.filter((c) => c.pass).length;
  const allPass = checks.filter((c) => c.pass).length;

  console.log("\n✨ NeuroNourish animation audit\n");
  for (const cat of categories) {
    console.log(`\n## ${cat}`);
    for (const c of checks.filter((x) => x.category === cat)) {
      console.log(`${c.pass ? "✅" : "❌"} [${c.id}] ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
    }
  }

  console.log(`\nP0: ${p0Pass}/${p0.length} · Total: ${allPass}/${checks.length}`);
  console.log(
    p0Pass === p0.length
      ? "\nVerdict: PASS (automated P0 animation checks)\n"
      : "\nVerdict: FAIL — fix P0 issues before animation sign-off\n",
  );
  console.log("Full checklist: docs/NEURONOURISH_ANIMATION.md\n");

  process.exit(p0Pass === p0.length ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
