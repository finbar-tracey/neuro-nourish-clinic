#!/usr/bin/env npx tsx
/**
 * Build-time brand compliance runner — writes .neuronourish-brand-report.json
 *
 * Run: npm run neuronourish:brand
 * Wired into: npm run build / vercel-build (NeuroNourish vertical)
 */
import { resolve } from "node:path";
import {
  runNeuronourishBrandGuidelinesAudit,
  type BrandAuditCheck,
} from "../src/lib/neuronourish-brand-audit";
import { runBuildTimeBrandAudit } from "../src/lib/neuronourish-brand-report";

const ROOT = resolve(import.meta.dirname, "..");

function printGuidelinesReport(checks: BrandAuditCheck[], passed: number, total: number) {
  console.log("\nNeuroNourish Brand Guidelines Audit\n");
  for (const cat of [...new Set(checks.map((c) => c.category))]) {
    console.log(`\n${cat}`);
    for (const c of checks.filter((x) => x.category === cat)) {
      console.log(`  ${c.pass ? "PASS" : "FAIL"} ${c.id} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
    }
  }
  console.log(`\n${passed}/${total} checks passed`);
}

const guidelines = runNeuronourishBrandGuidelinesAudit(ROOT);
printGuidelinesReport(guidelines.checks, guidelines.passedChecks, guidelines.totalChecks);

const report = runBuildTimeBrandAudit(ROOT);

if (report.buildGate.gaps.length > 0) {
  console.log("\nBuild gate gaps:");
  for (const gap of report.buildGate.gaps) {
    console.log(`  FAIL ${gap}`);
  }
}

console.log(
  `\n[NeuroNourish Brand Audit] ${report.passedChecks}/${report.totalChecks} checks passed. Status: ${report.status}`,
);
console.log(`Artifact: ${resolve(ROOT, ".neuronourish-brand-report.json")}`);

if (report.status !== "COMPLIANT") {
  if (guidelines.gaps.length > 0) {
    console.error("\nFailed guideline checks:", guidelines.checks.filter((c) => !c.pass).map((f) => f.id).join(", "));
  }
  process.exit(1);
}

console.log("\nBrand audit: PASS");
