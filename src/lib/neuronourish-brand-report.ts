import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  runNeuronourishBrandGuidelinesAudit,
  runNeuronourishBuildGateAudit,
} from "@/lib/neuronourish-brand-audit";

export const NEURONOURISH_BRAND_REPORT_FILE = ".neuronourish-brand-report.json";

export type BrandAuditSummary = {
  totalChecks: number;
  passedChecks: number;
  timestamp: string;
  status: "COMPLIANT" | "NON_COMPLIANT";
  gaps: string[];
  buildGate: {
    pass: boolean;
    gaps: string[];
  };
};

export function brandReportPath(root = process.cwd()): string {
  return resolve(root, NEURONOURISH_BRAND_REPORT_FILE);
}

export function runBuildTimeBrandAudit(root = process.cwd()): BrandAuditSummary {
  const guidelines = runNeuronourishBrandGuidelinesAudit(root);
  const buildGate = runNeuronourishBuildGateAudit(root);

  const gaps = [...guidelines.gaps, ...buildGate.gaps];
  const status =
    guidelines.passedChecks === guidelines.totalChecks && buildGate.pass
      ? "COMPLIANT"
      : "NON_COMPLIANT";

  const report: BrandAuditSummary = {
    totalChecks: guidelines.totalChecks,
    passedChecks: guidelines.passedChecks,
    timestamp: new Date().toISOString(),
    status,
    gaps,
    buildGate: {
      pass: buildGate.pass,
      gaps: buildGate.gaps,
    },
  };

  writeFileSync(brandReportPath(root), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return report;
}

export function readBrandAuditReport(root = process.cwd()): BrandAuditSummary | null {
  const path = brandReportPath(root);
  if (!existsSync(path)) return null;

  try {
    return JSON.parse(readFileSync(path, "utf8")) as BrandAuditSummary;
  } catch {
    return null;
  }
}

export function formatBrandAuditHealthLine(report: BrandAuditSummary | null): string {
  if (!report) {
    return "Run npm run neuronourish:brand before deploy — target all checks passing";
  }

  const suffix =
    report.status === "COMPLIANT"
      ? "passed automatically via build artifact"
      : "build artifact present — review gaps";

  return `${report.passedChecks}/${report.totalChecks} ${suffix}`;
}
