import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { NN_BRAND, NN_LOGO } from "@/lib/neuronourish-brand";
import { NN_HERO } from "@/lib/neuronourish-copy";

export type BrandAuditCheck = {
  id: string;
  category: string;
  name: string;
  pass: boolean;
  detail?: string;
};

export type BrandGuidelinesAuditResult = {
  checks: BrandAuditCheck[];
  totalChecks: number;
  passedChecks: number;
  gaps: string[];
};

export type BuildGateAuditResult = {
  pass: boolean;
  gaps: string[];
};

const REQUIRED_INFRASTRUCTURE_FILES = [
  "src/lib/neuronourish-copy.ts",
  "src/lib/neuronourish-nurture.ts",
  "src/components/workspace/case-print-action.tsx",
  "docs/NEURONOURISH_GO_LIVE.md",
] as const;

const PROHIBITED_VOICE_TERMS = [
  "victim",
  "suffering",
  "broken",
  "failing",
  "miracle",
  "guaranteed",
] as const;

function readFile(root: string, rel: string): string {
  return readFileSync(resolve(root, rel), "utf8");
}

function safeRead(root: string, rel: string): string | null {
  const abs = resolve(root, rel);
  if (!existsSync(abs)) return null;
  return readFileSync(abs, "utf8");
}

function addCheck(
  checks: BrandAuditCheck[],
  id: string,
  category: string,
  name: string,
  pass: boolean,
  detail?: string,
) {
  checks.push({ id, category, name, pass, detail });
}

/** 39-check brand guidelines matrix — docs/NeuroNourish_Brand_Guidelines.pdf */
export function runNeuronourishBrandGuidelinesAudit(
  root = process.cwd(),
): BrandGuidelinesAuditResult {
  const checks: BrandAuditCheck[] = [];

  const globals = readFile(root, "src/app/globals.css");
  const layout = readFile(root, "src/app/layout.tsx");
  const header = readFile(root, "src/components/neuronourish/header.tsx");
  const footer = readFile(root, "src/components/neuronourish/shell.tsx");
  const home = readFile(root, "src/components/neuronourish/home-page.tsx");
  const founder = readFile(root, "src/components/neuronourish/content/founder-section.tsx");
  const copy = readFile(root, "src/lib/neuronourish-copy.ts");
  const mark = readFile(root, "src/components/brand/neuronourish-mark.tsx");

  for (const [name, hex] of Object.entries(NN_BRAND)) {
    addCheck(
      checks,
      "C1",
      "Colour",
      `Token ${name} (${hex}) in globals.css`,
      globals.toLowerCase().includes(hex.toLowerCase()),
    );
  }

  addCheck(checks, "C2", "Colour", "Nav uses Deep Slate background", header.includes("bg-deep-slate"));
  addCheck(checks, "C3", "Colour", "Footer uses Deep Slate background", footer.includes("bg-deep-slate"));
  addCheck(
    checks,
    "C4",
    "Colour",
    "Ivory page background on shell",
    footer.includes("bg-ivory text-ink"),
  );
  addCheck(
    checks,
    "C5",
    "Colour",
    "Max one Deep Violet section on homepage",
    (founder.match(/bg-deep-violet/g) ?? []).length === 1 &&
      !(home.match(/bg-deep-violet/g) ?? []).length,
  );
  addCheck(
    checks,
    "C6",
    "Colour",
    "Plum used in partner strip",
    readFile(root, "src/components/neuronourish/content/partner-strip.tsx").includes("bg-plum") ||
      readFile(root, "src/components/neuronourish/content/partner-logo.tsx").includes("bg-plum"),
  );
  addCheck(
    checks,
    "C7",
    "Colour",
    "Lavender badges in scannable blocks",
    readFile(root, "src/components/neuronourish/content/scannable-block.tsx").includes("nn-badge"),
  );
  addCheck(
    checks,
    "C8",
    "Colour",
    "Mist borders on cards",
    readFile(root, "src/components/neuronourish/content/scannable-block.tsx").includes("border-mist"),
  );

  addCheck(checks, "T1", "Typography", "Inter loaded with weight 300 (footer)", layout.includes('"300"'));
  addCheck(checks, "T2", "Typography", "Playfair Display loaded", layout.includes("Playfair_Display"));
  addCheck(checks, "T3", "Typography", "Hero display class (52px+)", globals.includes(".nn-display-hero"));
  addCheck(checks, "T4", "Typography", "Section H2 at 32px", globals.includes(".nn-display-section"));
  addCheck(checks, "T5", "Typography", "Card H3 at 20px weight 500", globals.includes(".nn-display-card"));
  addCheck(
    checks,
    "T6",
    "Typography",
    "Body 16px / 1.75 / 65ch",
    globals.includes(".nn-body") && globals.includes("65ch"),
  );
  addCheck(checks, "T7", "Typography", "Eyebrow 11px uppercase tracked", globals.includes(".nn-eyebrow"));
  addCheck(checks, "T8", "Typography", "Pull quote with gold rule", globals.includes(".nn-pull-quote"));
  addCheck(
    checks,
    "T9",
    "Typography",
    "Light-section headings use Slate Blue",
    readFile(root, "src/components/neuronourish/content/section-header.tsx").includes("text-slate-blue"),
  );
  addCheck(checks, "T10", "Typography", "No italics in marketing copy", !copy.includes("italic"));
  addCheck(
    checks,
    "T11",
    "Typography",
    "Button text 13px medium",
    footer.includes("text-[13px] font-medium"),
  );

  addCheck(checks, "L1", "Logo", "Reversed logo on dark header", header.includes('theme="dark"'));
  addCheck(
    checks,
    "L2",
    "Logo",
    "Reversed footer lockup on dark footer",
    footer.includes('variant="footer"') && footer.includes('theme="dark"'),
  );
  addCheck(
    checks,
    "L3",
    "Logo",
    `Icon min height ≥ ${NN_LOGO.minIconHeightPx}px`,
    mark.includes("h-10 w-10") || mark.includes("h-9 w-9"),
  );
  addCheck(
    checks,
    "L4",
    "Logo",
    "Brand PNG assets present",
    existsSync(resolve(root, "public/brand/neuronourish-brain.png")),
  );
  addCheck(checks, "L5", "Logo", "Logo served without drop-shadow effects", !mark.includes("drop-shadow"));

  addCheck(checks, "V1", "Voice & CTA", "Gold primary CTA buttons", footer.includes("bg-gold"));
  addCheck(checks, "V2", "Voice & CTA", "Gold text-link utility", globals.includes(".nn-text-link"));
  addCheck(
    checks,
    "V3",
    "Voice & CTA",
    "Founder section CTA is gold button",
    founder.includes('<GoldButton href="/about">'),
  );
  const heroCopy = JSON.stringify(NN_HERO);
  addCheck(
    checks,
    "V4",
    "Voice & CTA",
    "No fear-language in hero copy",
    !heroCopy.includes("too late") && !heroCopy.includes("risk everything"),
  );

  addCheck(
    checks,
    "D1",
    "Documentation",
    "Brand guidelines PDF in docs/",
    existsSync(resolve(root, "docs/NeuroNourish_Brand_Guidelines.pdf")),
  );

  const passedChecks = checks.filter((c) => c.pass).length;
  const gaps = checks
    .filter((c) => !c.pass)
    .map((c) => `${c.id} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);

  return {
    checks,
    totalChecks: checks.length,
    passedChecks,
    gaps,
  };
}

function hasProhibitedVoiceTerm(copyContent: string, term: string): boolean {
  const regex = new RegExp(`\\b${term}\\b`, "gi");
  let match: RegExpExecArray | null;
  while ((match = regex.exec(copyContent)) !== null) {
    const index = match.index;
    const window = copyContent.slice(Math.max(0, index - 48), index + term.length + 48);
    if (/do not.*cure/i.test(window)) continue;
    if (/no unscientific cure/i.test(window)) continue;
    if (/no crude dementia scare/i.test(window)) continue;
    return true;
  }
  return false;
}

/** CI build gate — structural files, voice safeguards, funnel handlers. */
export function runNeuronourishBuildGateAudit(root = process.cwd()): BuildGateAuditResult {
  const gaps: string[] = [];

  for (const file of REQUIRED_INFRASTRUCTURE_FILES) {
    if (!existsSync(resolve(root, file))) {
      gaps.push(`Missing critical infrastructure file: ${file}`);
    }
  }

  const copyContent = safeRead(root, "src/lib/neuronourish-copy.ts");
  if (copyContent) {
    for (const term of PROHIBITED_VOICE_TERMS) {
      if (hasProhibitedVoiceTerm(copyContent, term)) {
        gaps.push(`Brand voice violation: prohibited term "${term}" in copy engine`);
      }
    }

    if (hasProhibitedVoiceTerm(copyContent, "cure")) {
      gaps.push('Brand voice violation: prohibited term "cure" in copy engine');
    }

    if (
      /dementia scare/i.test(copyContent) &&
      !/no crude dementia scare/i.test(copyContent)
    ) {
      gaps.push('Brand voice violation: prohibited "dementia scare" tactic language');
    }

    if (!/personalised brain health programme/i.test(copyContent)) {
      gaps.push(
        'Positioning violation: missing core "personalised brain health programme" anchor copy',
      );
    }

    if (
      !copyContent.includes("NN_ORGANIC_INFOGRAPHIC_MATRIX") ||
      !copyContent.includes("NN_NEWSLETTER_GUT_BRAIN_SERIES")
    ) {
      gaps.push(
        "Marketing content gap: missing organic infographic matrix or gut-brain newsletter series",
      );
    }
  } else {
    gaps.push("Missing critical infrastructure file: src/lib/neuronourish-copy.ts");
  }

  const nurtureContent = safeRead(root, "src/lib/neuronourish-nurture.ts");
  if (nurtureContent) {
    if (
      !nurtureContent.includes("sendPartialQuizEmail1") ||
      !nurtureContent.includes("discovery_post_call") ||
      !nurtureContent.includes("clinician_briefing_followup") ||
      !nurtureContent.includes("employer_briefing_followup") ||
      !nurtureContent.includes("missed_discovery_call") ||
      !nurtureContent.includes("missed_b2b_briefing_call") ||
      !nurtureContent.includes("blood_sugar_newsletter") ||
      !nurtureContent.includes("gut_brain_newsletter") ||
      !nurtureContent.includes("enrollProgrammeNurture") ||
      !nurtureContent.includes("enrollOnboardingWelcomeNurture") ||
      !nurtureContent.includes("enrollGutBrainNewsletterSeries") ||
      !nurtureContent.includes("enrollEnterpriseBriefingNurture") ||
      !nurtureContent.includes("clinicianBriefingFollowupEmails")
    ) {
      gaps.push(
        "Funnel automation gap: missing drop-off, post-discovery, B2B briefing, or missed-call handlers",
      );
    }
  } else {
    gaps.push("Missing critical infrastructure file: src/lib/neuronourish-nurture.ts");
  }

  const authSessionContent = safeRead(root, "src/lib/neuronourish-auth-session.ts");
  if (!authSessionContent?.includes("getActivePatientSession")) {
    gaps.push("Portal auth gap: missing patient session layer (neuronourish-auth-session.ts)");
  }

  return { pass: gaps.length === 0, gaps };
}
