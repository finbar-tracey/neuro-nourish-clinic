#!/usr/bin/env npx tsx
/**
 * Branding & design audit for NeuroNourish (guidelines PDF + public surfaces).
 *
 * Run: npm run neuronourish:design
 * Also covered by build: npm run neuronourish:brand
 * Reference: docs/NEURONOURISH_BRANDING_DESIGN.md · docs/NeuroNourish_Brand_Guidelines.pdf
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { config } from "dotenv";
import { runNeuronourishBrandGuidelinesAudit } from "../src/lib/neuronourish-brand-audit";

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

function walkTsx(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walkTsx(full, acc);
    else if (/\.(tsx|ts)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

const brand = runNeuronourishBrandGuidelinesAudit(ROOT);
for (const c of brand.checks) {
  check(`BRAND-${c.id}`, c.category, c.name, c.pass, c.detail);
}

const nnFiles = walkTsx(resolve(ROOT, "src/components/neuronourish"));
const nnBundle = nnFiles.map((f) => readFileSync(f, "utf8")).join("\n");
const copy = read("src/lib/neuronourish-copy.ts");
const globals = read("src/app/globals.css");
const mark = read("src/components/brand/neuronourish-mark.tsx");
const sectionHeader = read("src/components/neuronourish/content/section-header.tsx");

check(
  "DES-T1",
  "Design typography",
  "Display scale utilities present",
  [".nn-display-hero", ".nn-display-section", ".nn-display-card", ".nn-eyebrow", ".nn-body"].every(
    (c) => globals.includes(c),
  ),
);
check(
  "DES-T2",
  "Design typography",
  "Section headers use full-contrast Deep Slate (#1B3A5C)",
  sectionHeader.includes("text-deep-slate"),
);
check(
  "DES-T3",
  "Design typography",
  "No italic class in neuronourish components",
  !/(^|[\s"'`])italic([\s"'`]|$)/.test(nnBundle),
);

check(
  "DES-C1",
  "Design colour",
  "No emerald/amber in neuronourish components",
  !/emerald-|amber-/.test(nnBundle),
);
check(
  "DES-C2",
  "Design colour",
  "Gold CTA token present",
  globals.toLowerCase().includes("#c9a84c"),
);
check(
  "DES-C3",
  "Design colour",
  "Ivory + linen tokens present",
  globals.toLowerCase().includes("#f5f0e6") && globals.toLowerCase().includes("#d4c8b8"),
);

check(
  "DES-S1",
  "Design surfaces",
  "Shell ivory canvas",
  read("src/components/neuronourish/shell.tsx").includes("bg-ivory"),
);
check(
  "DES-S2",
  "Design surfaces",
  "Key grids use elevated white NnCard surfaces",
  read("src/components/neuronourish/content/nn-card.tsx").includes("bg-white") &&
    read("src/components/neuronourish/content/why-benefits-grid.tsx").includes("NnCard") &&
    read("src/components/neuronourish/content/journey-timeline.tsx").includes("NnCard") &&
    read("src/components/neuronourish/shop-product-card.tsx").includes("NnCard"),
);

check(
  "DES-L1",
  "Design logo",
  "Mark uses approved brain asset",
  mark.includes("neuronourish-brain.png") && mark.includes("NN_BRAND_ASSETS"),
);
check(
  "DES-L2",
  "Design logo",
  "Footer lockup assets referenced",
  mark.includes("logoDark") && mark.includes("neuronourish-logo"),
);
check(
  "DES-L3",
  "Design logo",
  "No drop-shadow on mark",
  !mark.includes("drop-shadow"),
);

check(
  "DES-V1",
  "Design voice",
  "Copy has no too late / fear of scare framing",
  !/\btoo late\b/i.test(copy) && !/\bfear of\b/i.test(copy),
);
check(
  "DES-V2",
  "Design voice",
  "Gold text-link utility exists",
  globals.includes(".nn-text-link"),
);

check(
  "DES-DOC",
  "Documentation",
  "Branding & design checklist exists",
  existsSync(resolve(ROOT, "docs/NEURONOURISH_BRANDING_DESIGN.md")),
);
check(
  "DES-PDF",
  "Documentation",
  "Brand guidelines PDF present",
  existsSync(resolve(ROOT, "docs/NeuroNourish_Brand_Guidelines.pdf")),
);

async function main() {
  const categories = [...new Set(checks.map((c) => c.category))];
  const p0 = checks.filter((c) => c.p0 !== false);
  const p0Pass = p0.filter((c) => c.pass).length;
  const allPass = checks.filter((c) => c.pass).length;

  console.log("\n🎨 NeuroNourish branding & design audit\n");
  for (const cat of categories) {
    console.log(`\n## ${cat}`);
    for (const c of checks.filter((x) => x.category === cat)) {
      console.log(`${c.pass ? "✅" : "❌"} [${c.id}] ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
    }
  }

  console.log(`\nP0: ${p0Pass}/${p0.length} · Total: ${allPass}/${checks.length}`);
  console.log(
    p0Pass === p0.length
      ? "\nVerdict: PASS (automated P0 branding & design checks)\n"
      : "\nVerdict: FAIL — fix P0 issues before design sign-off\n",
  );
  console.log("Full checklist: docs/NEURONOURISH_BRANDING_DESIGN.md");
  console.log("Guidelines PDF: docs/NeuroNourish_Brand_Guidelines.pdf\n");

  process.exit(p0Pass === p0.length ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
