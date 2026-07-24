#!/usr/bin/env npx tsx
/**
 * CRO audit for NeuroNourish public funnel.
 *
 * Run: npm run neuronourish:cro
 * Reference: docs/NEURONOURISH_CRO.md
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

const quizData = read("src/lib/neuronourish-quiz-data.ts");
const quiz = read("src/components/neuronourish/brain-health-quiz.tsx");
const hero = read("src/components/neuronourish/content/hero-section.tsx");
const closing = read("src/components/neuronourish/content/closing-cta.tsx");
const quizFold = read("src/components/neuronourish/content/quiz-fold-section.tsx");
const results = read("src/components/neuronourish/content/quiz-results-panel.tsx");
const home = read("src/components/neuronourish/home-page.tsx");
const sticky = existsSync(resolve(ROOT, "src/components/neuronourish/sticky-cta.tsx"))
  ? read("src/components/neuronourish/sticky-cta.tsx")
  : "";
const card = read("src/components/neuronourish/shop-product-card.tsx");
const shopPage = read("src/app/shop/page.tsx");
const blogSection = read("src/components/neuronourish/content/blog-section.tsx");
const copy = read("src/lib/neuronourish-copy.ts");
const shopLib = read("src/lib/neuronourish-shop.ts");
const headerDesktop = read("src/components/neuronourish/header-nav-desktop.tsx");

// Continuity
check(
  "C1",
  "Continuity",
  "Quiz capture after all questions (end gate)",
  quizData.includes("NN_QUIZ_CAPTURE_AFTER = NN_QUIZ_QUESTIONS.length"),
);
check(
  "C2",
  "Continuity",
  "Capture gate uses name + email + consent only",
  quiz.includes('htmlFor="fn"') &&
    quiz.includes('htmlFor="em"') &&
    quiz.includes('id="quiz-consent"') &&
    !quiz.includes('htmlFor="ln"'),
);
check(
  "C3",
  "Continuity",
  "Shop cards preserve leadId",
  card.includes("leadId") && card.includes("withLead"),
);
check(
  "C4",
  "Continuity",
  "Quiz hydrates leadId from URL",
  quiz.includes("URLSearchParams") && quiz.includes("leadId"),
);
check(
  "C5",
  "Continuity",
  "Results preserve leadId on next-step links",
  results.includes("withLead") &&
    copy.includes("/shop/cognitive-assessment") &&
    copy.includes('href: "/discovery"'),
);
check(
  "C6",
  "Continuity",
  "Funnel stepper on results",
  results.includes("FunnelStepper"),
);
check(
  "C7",
  "Continuity",
  "Blog section CTA avoids dead /blog redirect",
  !blogSection.includes('href="/blog"') &&
    (blogSection.includes('href="/quiz"') || blogSection.includes('href="/programme"')),
);

// CTA hierarchy
check(
  "H1",
  "CTA hierarchy",
  "Hero gold primary is quiz only (discovery lives in header)",
  hero.includes('GoldButton href="/quiz"') &&
    !hero.includes('href="/discovery"') &&
    !hero.includes("OutlineButton"),
);
check(
  "H2",
  "CTA hierarchy",
  "Closing gold primary is quiz; discovery is text link",
  closing.includes("GoldButton") &&
    closing.includes("ctaQuiz") &&
    closing.includes("nn-text-link") &&
    closing.includes("discoveryTarget"),
);
check(
  "H2b",
  "CTA hierarchy",
  "Closing quiz hint softens score claim (habit baseline)",
  closing.includes("ctaQuizHint") &&
    !closing.includes("Personalised score") &&
    copy.includes('ctaQuizHint: "3 minutes · Habit baseline for your next conversation"'),
);
check(
  "H3",
  "CTA hierarchy",
  "Quiz fold single gold quiz CTA",
  quizFold.includes('GoldButton href="/quiz"') && !quizFold.includes("OutlineButton"),
);
check(
  "H7",
  "CTA hierarchy",
  "Hero brand is NeuroNourish; Emer H1; no geography eyebrow chips",
  hero.includes("NN_HERO.brand") &&
    copy.includes('brand: "NeuroNourish"') &&
    copy.includes("Protect Your Memory") &&
    copy.includes('eyebrow: ""') &&
    !hero.includes("Ireland") &&
    !hero.includes("NovaUCD"),
);
check(
  "H8",
  "CTA hierarchy",
  "OG image matches Emer H1 (not Priya Support your memory)",
  (() => {
    const og = read("src/app/opengraph-image.tsx");
    return (
      og.includes("Protect Your Memory") &&
      og.includes("Optimise Brain Performance") &&
      !og.includes("Support your memory") &&
      !og.includes("NeuroNourish Clinic")
    );
  })(),
);
check(
  "H9",
  "CTA hierarchy",
  "Why fold keeps Find Your Programme CTA",
  read("src/components/neuronourish/content/why-section.tsx").includes('href="/programme"') &&
    copy.includes('cta: "Find Your Programme"'),
);
check(
  "H4",
  "CTA hierarchy",
  "Results primary is Email my report; next steps are text links only",
  (() => {
    const start = results.indexOf("function NextStepsBlock");
    const end = results.indexOf("export function QuizResultsPanel");
    const nextSteps = start >= 0 && end > start ? results.slice(start, end) : "";
    return (
      copy.includes('cta: "Email my report"') &&
      results.includes("NN_QUIZ_REPORT_CTA") &&
      nextSteps.includes("nn-text-link") &&
      !nextSteps.includes("GoldButton")
    );
  })(),
);
check(
  "H5",
  "CTA hierarchy",
  "Header desktop quiz is gold primary",
  headerDesktop.includes("ctaQuiz") && headerDesktop.includes("bg-gold"),
);
check(
  "H6",
  "CTA hierarchy",
  "Home wires sticky mobile quiz CTA",
  home.includes("StickyCta") && sticky.includes("/quiz") && sticky.includes("fixed"),
);

// Friction
check(
  "F1",
  "Friction",
  "Quiz shows question progress",
  quiz.includes("Question {step + 1} of") || quiz.includes("Question {"),
);
check(
  "F2",
  "Friction",
  "Capture microcopy reassures speed / completion",
  copy.includes("fieldsHint") &&
    copy.includes("Takes 10 seconds") &&
    copy.includes("progressLabel") &&
    copy.includes("18 of 18"),
);
check(
  "F3",
  "Friction",
  "Capture offers discovery soft escape",
  quiz.includes("discoverySoft") || quiz.includes("NN_QUIZ_CAPTURE.discovery"),
);
check(
  "F4",
  "Friction",
  "Shop offers quiz path for unsure visitors",
  shopPage.includes("/quiz") && (shopLib.includes("quizCta") || shopPage.includes("quiz")),
);

// Trust
check(
  "T1",
  "Trust",
  "Founder / partners trust logos present",
  read("src/components/neuronourish/content/founder-trust-strip.tsx").includes("NN_FOUNDER_TRUST") &&
    read("src/components/neuronourish/content/partner-strip.tsx").includes("NN_PARTNERS"),
);
check(
  "T2",
  "Trust",
  "Results FunnelTrustBar present",
  results.includes("FunnelTrustBar"),
);
check(
  "T3",
  "Trust",
  "Closing trust chips present",
  closing.includes("trustChips"),
);
check(
  "T4",
  "Trust",
  "Assessment credit hint in results copy",
  copy.includes("ctaAssessmentHint") && copy.includes("Credited toward enrolment"),
);

const abandonLib = read("src/lib/neuronourish-quiz-abandon.ts");
const abandonSheet = read("src/components/neuronourish/quiz-abandon-sheet.tsx");
const discoveryPanel = read("src/components/neuronourish/discovery-booking-panel.tsx");
check(
  "A1",
  "Abandon recovery",
  "Quiz abandon copy + kill switch helper",
  copy.includes("NN_QUIZ_ABANDON") &&
    copy.includes("Prefer to talk it through") &&
    abandonLib.includes("NEXT_PUBLIC_NN_QUIZ_ABANDON") &&
    abandonLib.includes("NN_QUIZ_ABANDON_MIN_ANSWERS = 3") &&
    abandonLib.includes("NN_QUIZ_ABANDON_IDLE_MS = 100_000"),
);
check(
  "A2",
  "Abandon recovery",
  "Quiz wires idle sheet with session/cooldown caps",
  quiz.includes("QuizAbandonSheet") &&
    quiz.includes("markQuizAbandonShown") &&
    quiz.includes("hasQuizAbandonSessionCap") &&
    !/\btoo late\b|\bfear of\b/i.test(copy.slice(copy.indexOf("NN_QUIZ_ABANDON"))),
);
check(
  "A3",
  "Abandon recovery",
  "Abandon sheet primary is discovery; continue is secondary",
  abandonSheet.includes("discoveryHref") &&
    abandonSheet.includes("ctaBook") &&
    abandonSheet.includes("ctaContinue") &&
    abandonSheet.includes('role="dialog"'),
);
check(
  "A4",
  "Abandon recovery",
  "Discovery shows quiz_abandon banner",
  discoveryPanel.includes('source") === "quiz_abandon"') ||
    discoveryPanel.includes("quiz_abandon"),
);

// Docs
check(
  "DOC1",
  "Documentation",
  "CRO checklist exists",
  existsSync(resolve(ROOT, "docs/NEURONOURISH_CRO.md")),
);

async function main() {
  const categories = [...new Set(checks.map((c) => c.category))];
  const p0 = checks.filter((c) => c.p0 !== false);
  const p0Pass = p0.filter((c) => c.pass).length;
  const allPass = checks.filter((c) => c.pass).length;

  console.log("\n📈 NeuroNourish CRO audit\n");
  for (const cat of categories) {
    console.log(`\n## ${cat}`);
    for (const c of checks.filter((x) => x.category === cat)) {
      console.log(`${c.pass ? "✅" : "❌"} [${c.id}] ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
    }
  }

  console.log(`\nP0: ${p0Pass}/${p0.length} · Total: ${allPass}/${checks.length}`);
  console.log(
    p0Pass === p0.length
      ? "\nVerdict: PASS (automated P0 CRO checks)\n"
      : "\nVerdict: FAIL — fix P0 issues before CRO sign-off\n",
  );
  console.log("Full checklist: docs/NEURONOURISH_CRO.md\n");

  process.exit(p0Pass === p0.length ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
