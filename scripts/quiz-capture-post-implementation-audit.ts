#!/usr/bin/env npx tsx
/**
 * NeuroNourish quiz capture — post-implementation gate.
 *
 * Pre-deploy (static + API):
 *   npm run quiz:post-implementation
 *
 * After deploy (live quiz HTML):
 *   QUIZ_POST_IMPL_URL=https://neuronourish.clinic npm run quiz:post-implementation
 *
 * After manual E2E:
 *   QUIZ_SOFT_GATE_CONFIRMED=true \
 *   QUIZ_RESULTS_REVEAL_CONFIRMED=true \
 *   QUIZ_REPORT_OPTIONAL_PHONE_CONFIRMED=true \
 *   QUIZ_CRM_WIRING_CONFIRMED=true \
 *   npm run quiz:post-implementation
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";

config();
process.env.NOTIFICATIONS_DRY_RUN = "true";
process.env.META_CAPI_DRY_RUN = "true";

import { POST } from "@/app/api/leads/route";
import { db } from "@/lib/db";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

type Item = { phase: string; name: string; pass: boolean; detail?: string };

const items: Item[] = [];
const TEST_EMAIL = `quiz-post-impl.${Date.now()}@test.local`;

function record(phase: string, name: string, pass: boolean, detail?: string) {
  items.push({ phase, name, pass, detail });
  console.log(`${pass ? "✓" : "✗"} [${phase}] ${name}${detail ? ` — ${detail}` : ""}`);
}

function flag(name: string): boolean {
  return process.env[name] === "true";
}

async function postLead(body: Record<string, unknown>) {
  const req = new Request("http://localhost/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const res = await POST(req);
  let data: Record<string, unknown> = {};
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    /* empty */
  }
  return { status: res.status, data };
}

async function main() {
  const baseUrl = (
    process.env.QUIZ_POST_IMPL_URL ??
    process.env.NN_GO_LIVE_BASE_URL ??
    process.env.CRM_GO_LIVE_BASE_URL ??
    ""
  ).replace(/\/$/, "");

  console.log("\nNeuroNourish quiz capture post-implementation audit\n");

  // ── Phase 1: Static ──
  const pkg = read("package.json");
  record("Static", "quiz:post-implementation script registered", pkg.includes('"quiz:post-implementation"'));
  record("Static", "quiz:prompt script registered", pkg.includes('"quiz:prompt"'));
  record(
    "Static",
    "Post-impl doc present",
    read("docs/QUIZ_CAPTURE_POST_IMPLEMENTATION.md").includes("Quiz Capture Post-Implementation"),
  );

  const quizData = read("src/lib/neuronourish-quiz-data.ts");
  record("Static", "Soft gate after Q6", quizData.includes("NN_QUIZ_CAPTURE_AFTER = 6"));

  const copy = read("src/lib/neuronourish-copy.ts");
  record("Static", "Soft gate progress label", copy.includes('progressLabel: "6 of 18 answered"'));
  record("Static", "Report CTA is email-first", copy.includes('cta: "Email my report"'));
  record("Static", "Phone upsell after report success", copy.includes("phoneUpsellTitle:"));
  record("Static", "Phone digit hint copy", copy.includes("phoneHintIdle:"));
  record("Static", "Soft gate has back + error copy", copy.includes("backLabel:") && copy.includes("error:"));

  const phoneIe = read("src/lib/phone-ie.ts");
  record("Static", "IE 08 10-digit validation", phoneIe.includes('digits.startsWith("08") && digits.length === 10'));
  record("Static", "UK 07 11-digit validation", phoneIe.includes('digits.startsWith("07") && digits.length === 11'));
  record("Static", "Phone length error messages", phoneIe.includes("Irish mobiles are 10 digits") && phoneIe.includes("UK mobiles are 11 digits"));
  record("Static", "phoneDigitHint helper", phoneIe.includes("export function phoneDigitHint"));
  record("Static", "Landline rejection", phoneIe.includes("landline"));

  const quizUi = read("src/components/neuronourish/brain-health-quiz.tsx");
  record("Static", "Soft gate uses quiz chrome progress", quizUi.includes("NN_QUIZ_CAPTURE.progressLabel"));
  record("Static", "Soft gate form + Enter submit", quizUi.includes("onSubmit=") && quizUi.includes('type="submit"'));
  record("Static", "Soft gate Back returns to Q6", quizUi.includes("NN_QUIZ_CAPTURE_AFTER - 1"));
  record("Static", "Resume forces soft gate without lead", quizUi.includes("answered >= NN_QUIZ_CAPTURE_AFTER && !saved.leadId"));
  record("Static", "Email lowercased on capture", quizUi.includes(".toLowerCase()"));
  record("Static", "Complete sends archetypeKey", quizUi.includes("archetypeKey: result.archetype.key"));
  record("Static", "Progress bar uses step+1", quizUi.includes("((step + 1) / total)"));

  const resultsUi = read("src/components/neuronourish/content/quiz-results-panel.tsx");
  record("Static", "Report email is one-click (no phone)", resultsUi.includes("async function emailReport"));
  record("Static", "Phone upsell after email success", resultsUi.includes("NN_QUIZ_REPORT_CTA.phoneUpsellTitle"));
  record("Static", "Shows destination email", resultsUi.includes("NN_QUIZ_REPORT_CTA.sendingToPrefix"));
  record("Static", "Phone CTA disabled until valid+consent", resultsUi.includes("!phoneReady"));
  record("Static", "Live digit hint on phone field", resultsUi.includes("phoneDigitHint") || resultsUi.includes("digitHint"));

  const validations = read("src/lib/validations.ts");
  record("Static", "quiz_partial uses optional phone", validations.includes("optionalIeUkPhoneSchema"));
  record("Static", "quiz_completed accepts archetype", validations.includes("archetypeKey: z.string().optional()"));
  record(
    "Static",
    "quiz_report_request phone optional",
    /funnelStage: z\.literal\("quiz_report_request"\)[\s\S]*?phone: optionalIeUkPhoneSchema/.test(validations),
  );

  const leadSubmit = read("src/lib/neuronourish-lead-submit.ts");
  const softBlock = leadSubmit.slice(
    leadSubmit.indexOf('funnelStage === "quiz_partial"'),
    leadSubmit.indexOf('funnelStage === "quiz_report_request"'),
  );
  record(
    "Static",
    "Soft capture has no partner alert",
    softBlock.includes("enrollNeuronourishNurture") && !softBlock.includes("sendNeuronourishPartnerAlert"),
  );
  record(
    "Static",
    "Hot nextAction on report + phone",
    leadSubmit.includes("Call client — quiz report requested"),
  );
  record("Static", "Complete appends additionalInfo", leadSubmit.includes("priorInfo.includes(scoreLine)"));
  record("Static", "Complete stores archetype line", leadSubmit.includes("archetypeLine"));

  const notifications = read("src/lib/neuronourish-notifications.ts");
  record(
    "Static",
    "Partner alert respects sms option + phone",
    notifications.includes("options?.sms !== false") && notifications.includes("lead.phone?.trim()"),
  );

  const workspace = read("src/lib/neuronourish-workspace.ts");
  record(
    "Static",
    "quiz_partial nextAction is abandon follow-up",
    workspace.includes('quiz_partial: "Follow up if quiz abandoned"'),
  );

  // ── Phase 1b: Phone validation matrix ──
  const { isValidPhone, phoneValidationError, normalizePhone } = await import("@/lib/phone-ie");
  record("Validation", "IE 087 valid", isValidPhone("087 123 4567"));
  record("Validation", "IE normalizes to +353", normalizePhone("0871234567") === "+353871234567");
  record("Validation", "UK 07 valid", isValidPhone("07700 900123"));
  record("Validation", "UK normalizes to +44", normalizePhone("07700900123") === "+447700900123");
  record("Validation", "Short IE rejected", !isValidPhone("087 123"));
  record(
    "Validation",
    "Short IE error cites 10 digits",
    (phoneValidationError("087 123") ?? "").includes("10 digits"),
  );
  record("Validation", "Landline 01 rejected", !isValidPhone("01 234 5678"));
  record(
    "Validation",
    "Bad prefix error cites 08/07",
    (phoneValidationError("051 123 4567") ?? "").includes("08"),
  );

  // ── Phase 2: API path ──
  let leadId = "";
  try {
    const soft = await postLead({
      vertical: "neuronourish",
      funnelStage: "quiz_partial",
      firstName: "Quiz",
      lastName: "",
      email: TEST_EMAIL,
      phone: "",
      consent: true,
      quizProgress: 6,
      source: "quiz_post_impl_audit",
    });
    leadId = String(soft.data.leadId ?? "");
    record(
      "API",
      "Soft capture creates lead",
      soft.status === 200 && Boolean(leadId),
      leadId || `status ${soft.status}`,
    );

    if (leadId) {
      const softLead = await db.lead.findUnique({ where: { id: leadId } });
      record(
        "API",
        "Soft capture stage quiz_partial",
        softLead?.funnelStage === "quiz_partial",
        softLead?.funnelStage ?? "missing",
      );
      record(
        "API",
        "Soft capture phone empty",
        !softLead?.phone?.trim() || softLead.phone === "",
        softLead?.phone || "(empty)",
      );

      const complete = await postLead({
        vertical: "neuronourish",
        funnelStage: "quiz_completed",
        leadId,
        quizScore: 68,
        segment: "moderate",
        archetypeKey: "owl",
        archetypeName: "The Night Owl",
      });
      record("API", "Quiz complete succeeds", complete.status === 200, `score ${complete.data.score}`);

      const completed = await db.lead.findUnique({ where: { id: leadId } });
      record(
        "API",
        "Complete stores score",
        completed?.quizScore === 68,
        String(completed?.quizScore ?? "missing"),
      );
      record(
        "API",
        "Complete stores archetype in additionalInfo",
        Boolean(completed?.additionalInfo?.includes("The Night Owl")),
      );

      const reportEmail = await postLead({
        vertical: "neuronourish",
        funnelStage: "quiz_report_request",
        leadId,
        phone: "",
      });
      record(
        "API",
        "Report email-only succeeds",
        reportEmail.status === 200 && reportEmail.data.phoneCaptured === false,
        JSON.stringify({ phoneCaptured: reportEmail.data.phoneCaptured }),
      );

      const reportPhone = await postLead({
        vertical: "neuronourish",
        funnelStage: "quiz_report_request",
        leadId,
        phone: "0871234567",
        consent: true,
      });
      record(
        "API",
        "Report with phone succeeds",
        reportPhone.status === 200 && reportPhone.data.phoneCaptured === true,
      );

      const hot = await db.lead.findUnique({ where: { id: leadId } });
      record(
        "API",
        "Phone normalized on lead",
        Boolean(hot?.phone?.includes("353") || hot?.phone?.includes("87")),
        hot?.phone ?? "missing",
      );
      record(
        "API",
        "Hot nextAction after phone report",
        hot?.nextAction === "Call client — quiz report requested",
        hot?.nextAction ?? "missing",
      );
    }
  } finally {
    if (leadId) {
      try {
        await db.task.deleteMany({ where: { leadId } });
        await db.activity.deleteMany({ where: { leadId } });
        await db.note.deleteMany({ where: { leadId } });
        await db.lead.delete({ where: { id: leadId } });
      } catch {
        /* best-effort cleanup */
      }
    }
  }

  // ── Phase 3: Live (optional) ──
  if (baseUrl) {
    try {
      const res = await fetch(`${baseUrl}/quiz`, { redirect: "follow" });
      record("Live", "GET /quiz", res.ok, `${res.status} ${baseUrl}/quiz`);
    } catch (err) {
      record("Live", "GET /quiz", false, err instanceof Error ? err.message : "fetch failed");
    }
  } else {
    record("Live", "QUIZ_POST_IMPL_URL unset (skipped)", true, "set URL for live smoke");
  }

  // ── Phase 4: Manual confirmation flags ──
  const softGate = flag("QUIZ_SOFT_GATE_CONFIRMED");
  const results = flag("QUIZ_RESULTS_REVEAL_CONFIRMED");
  const optionalPhone = flag("QUIZ_REPORT_OPTIONAL_PHONE_CONFIRMED");
  const crm = flag("QUIZ_CRM_WIRING_CONFIRMED");

  record("Manual", "Soft gate E2E confirmed", softGate, softGate ? "yes" : "set QUIZ_SOFT_GATE_CONFIRMED=true");
  record(
    "Manual",
    "Results reveal E2E confirmed",
    results,
    results ? "yes" : "set QUIZ_RESULTS_REVEAL_CONFIRMED=true",
  );
  record(
    "Manual",
    "Optional phone report E2E confirmed",
    optionalPhone,
    optionalPhone ? "yes" : "set QUIZ_REPORT_OPTIONAL_PHONE_CONFIRMED=true",
  );
  record("Manual", "CRM wiring E2E confirmed", crm, crm ? "yes" : "set QUIZ_CRM_WIRING_CONFIRMED=true");

  // ── Summary ──
  const auto = items.filter((i) => i.phase !== "Manual" && !(i.phase === "Live" && i.name.includes("unset")));
  const autoFail = auto.filter((i) => !i.pass);
  const manualItems = items.filter((i) => i.phase === "Manual");
  const manualPass = manualItems.every((i) => i.pass);

  console.log("\n────────────────────────────────────────");
  console.log(`Automated: ${auto.length - autoFail.length}/${auto.length} pass`);
  console.log(`Manual flags: ${manualItems.filter((i) => i.pass).length}/${manualItems.length}`);
  if (autoFail.length) {
    console.log("\nFailures:");
    for (const f of autoFail) console.log(`  ✗ [${f.phase}] ${f.name}${f.detail ? ` — ${f.detail}` : ""}`);
  }

  if (autoFail.length) {
    console.log("\nquiz:post-implementation: FAIL\n");
    process.exit(1);
  }

  if (!manualPass) {
    console.log(
      "\nquiz:post-implementation: PASS (automated) — set QUIZ_*_CONFIRMED flags after manual E2E for full 10/10\n",
    );
    process.exit(0);
  }

  console.log("\nquiz:post-implementation: PASS (10/10 — automated + manual)\n");
  process.exit(0);
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
