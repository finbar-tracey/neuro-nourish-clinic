#!/usr/bin/env npx tsx
/**
 * UK mobile phone validation — post-implementation gate.
 *
 * Pre-deploy (static + API + SMS):
 *   npm run phone:post-impl
 *
 * After deploy (live LP HTML):
 *   PHONE_POST_IMPL_URL=https://loans.bridgingloansbroker.co.uk npm run phone:post-impl
 *
 * Live API bypass test (production/staging):
 *   PHONE_POST_AUDIT_LIVE=true PHONE_POST_IMPL_URL=https://loans.bridgingloansbroker.co.uk npm run phone:post-impl
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";

config();
process.env.NOTIFICATIONS_DRY_RUN = "true";
process.env.META_CAPI_DRY_RUN = "true";

import { POST } from "@/app/api/leads/route";
import { db } from "@/lib/db";
import { telLink, smsLink, whatsappLink } from "@/lib/contact-actions";
import {
  formatUKPhoneDisplay,
  formatUKPhoneInput,
  isValidUKPhone,
  normalizeUKPhone,
  ukPhoneValidationError,
} from "@/lib/form-validation";
import { toVonageNumber } from "@/lib/sms-encoding";
import { contactCaptureSchema, leadFormSchema } from "@/lib/validations";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

type Item = { phase: string; name: string; pass: boolean; detail?: string };

const items: Item[] = [];
const TEST_EMAIL = "phone-post-impl@test.local";

function record(phase: string, name: string, pass: boolean, detail?: string) {
  items.push({ phase, name, pass, detail });
  console.log(`${pass ? "✓" : "✗"} [${phase}] ${name}${detail ? ` — ${detail}` : ""}`);
}

function runNpm(script: string): { ok: boolean; out: string } {
  try {
    const out = execSync(`npm run ${script}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { ok: true, out };
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string };
    return { ok: false, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}

const baseCapture = {
  stage: "capture" as const,
  firstName: "Phone",
  lastName: "PostImpl",
  email: TEST_EMAIL,
  loanPurpose: "purchase",
  loanAmount: 150_000,
  timeframe: "30_days",
  consent: true as const,
  source: "phone_post_impl_audit",
};

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
    process.env.PHONE_POST_IMPL_URL ??
    process.env.META_LP_POST_IMPL_URL ??
    process.env.CRM_GO_LIVE_BASE_URL ??
    ""
  ).replace(/\/$/, "");

  console.log("\nUK phone post-implementation audit\n");

  // ── Phase 1: Static ──
  const formAudit = runNpm("form:audit");
  record(
    "Static",
    "form:audit",
    formAudit.ok && formAudit.out.includes("25/25"),
    formAudit.ok ? "25/25 PASS" : "see output above",
  );

  const formValidation = read("src/lib/form-validation.ts");
  record("Static", "E.164 normalizeUKPhone", formValidation.includes('return `+44${domestic.slice(1)}`'));
  record("Static", "ukPhoneValidationError digit count", formValidation.includes("Enter 11 digits"));
  record("Static", "No weak length-only fallback", !formValidation.includes("check.length >= 10"));

  const validations = read("src/lib/validations.ts");
  record("Static", "Shared ukMobilePhoneSchema", validations.includes("ukMobilePhoneSchema"));
  record(
    "Static",
    "Capture + complete use strict phone schema",
    validations.includes("phone: ukMobilePhoneSchema") &&
      (validations.match(/phone: ukMobilePhoneSchema/g)?.length ?? 0) >= 2,
  );

  const fbForm = read("src/components/forms/facebook-lead-form.tsx");
  record("Static", "Form placeholder 07XXX", fbForm.includes('placeholder="07XXX XXX XXX"'));
  record("Static", "Form digit counter hint", fbForm.includes("ukPhoneDigitCount"));
  record("Static", "Form uses ukPhoneValidationError", fbForm.includes("ukPhoneValidationError"));

  const caseDetail = read("src/components/workspace/case-detail.tsx");
  record("Static", "Workspace formatUKPhoneDisplay", caseDetail.includes("formatUKPhoneDisplay"));

  const contactActions = read("src/lib/contact-actions.ts");
  record("Static", "Contact links use normalizeUKPhone", contactActions.includes("normalizeUKPhone"));

  record(
    "Static",
    "phone:post-impl script registered",
    read("package.json").includes('"phone:post-impl"'),
  );

  // ── Phase 2: Validation matrix ──
  record("Validation", "Ali-style 07 valid", isValidUKPhone("07759180011"));
  record(
    "Validation",
    "Ali stored as E.164",
    normalizeUKPhone("07759180011") === "+447759180011",
  );
  record(
    "Validation",
    "+44 paste valid",
    isValidUKPhone("+447759180011") && normalizeUKPhone("+447759180011") === "+447759180011",
  );
  record(
    "Validation",
    "+44 paste formats as 07",
    formatUKPhoneInput("+447759180011").startsWith("077"),
  );
  record("Validation", "Mohammed regression rejected", !isValidUKPhone("+44774352718"));
  record(
    "Validation",
    "Mohammed error mentions 11 digits",
    ukPhoneValidationError("+44774352718")?.includes("11") === true,
  );
  record("Validation", "10-digit 07 rejected", !isValidUKPhone("0774352718"));
  record("Validation", "Landline 01 rejected", !isValidUKPhone("01234567890"));
  record(
    "Validation",
    "Landline error mentions 07",
    ukPhoneValidationError("01234567890")?.includes("07") === true,
  );
  record(
    "Validation",
    "Display E.164 as 07 spaced",
    formatUKPhoneDisplay("+447759180011") === "07759 180 011",
  );

  // ── Phase 3: Zod schemas ──
  const validCapture = contactCaptureSchema.safeParse({
    ...baseCapture,
    phone: "07759180011",
  });
  record(
    "API schema",
    "Capture accepts valid 07",
    validCapture.success && validCapture.data.phone === "+447759180011",
  );

  const invalidCapture = contactCaptureSchema.safeParse({
    ...baseCapture,
    phone: "+44774352718",
  });
  record("API schema", "Capture rejects Mohammed phone", !invalidCapture.success);

  const validComplete = leadFormSchema.safeParse({
    ...baseCapture,
    stage: "complete",
    phone: "07900123456",
    termMonths: 12,
    propertyType: "residential",
    propertyValue: 350_000,
    propertyLocation: "Birmingham",
    hasExistingMortgage: false,
    willOccupy: false,
    hasEverOccupied: false,
  });
  record(
    "API schema",
    "Complete accepts valid 07 → E.164",
    validComplete.success && validComplete.data.phone === "+447900123456",
  );

  // ── Phase 4: Local API route ──
  let leadId: string | undefined;
  try {
    const invalidRes = await postLead({ ...baseCapture, phone: "+44774352718" });
    record("API route", "POST rejects invalid phone (400)", invalidRes.status === 400);

    const validRes = await postLead({ ...baseCapture, phone: "07900123456" });
    record(
      "API route",
      "POST accepts valid phone (201)",
      validRes.status === 201 && validRes.data.captured === true,
      `status ${validRes.status}`,
    );
    leadId = validRes.data.id as string | undefined;

    if (leadId) {
      const stored = await db.lead.findUnique({ where: { id: leadId } });
      record(
        "API route",
        "Lead stored as E.164",
        stored?.phone === "+447900123456",
        stored?.phone,
      );
    } else {
      record("API route", "Lead stored as E.164", false, "no lead id returned");
    }
  } catch (err) {
    record("API route", "Local POST tests", false, String(err));
  } finally {
    if (leadId) {
      await db.lead.delete({ where: { id: leadId } }).catch(() => {});
    }
    const orphans = (await db.lead.findMany()).filter((l) => l.email === TEST_EMAIL);
    for (const lead of orphans) {
      await db.lead.delete({ where: { id: lead.id } }).catch(() => {});
    }
  }

  // ── Phase 5: SMS + contact links ──
  const vonage = toVonageNumber("+447900123456");
  record("SMS", "toVonageNumber from E.164", vonage === "447900123456");
  record("SMS", "toVonageNumber from 07", toVonageNumber("07900123456") === "447900123456");
  record(
    "SMS",
    "Invalid Mohammed Vonage digits",
    toVonageNumber("+44774352718") === "44774352718",
    "44774352718 is 11 digits — Vonage rejects; form blocks before send",
  );
  record(
    "SMS",
    "Mohammed would fail validation before SMS",
    !isValidUKPhone("+44774352718"),
  );

  record("Contact", "telLink uses +44", telLink("+447900123456") === "tel:+447900123456");
  record("Contact", "smsLink uses +44", smsLink("+447900123456").startsWith("sms:+447900123456"));
  record(
    "Contact",
    "whatsappLink uses E.164 digits",
    whatsappLink("+447900123456").startsWith("https://wa.me/447900123456"),
  );
  record(
    "Contact",
    "Legacy 07 telLink still works",
    telLink("07759180011") === "tel:+447759180011",
  );

  // ── Phase 6: Live LP (client-rendered form — scan JS bundles) ──
  if (!baseUrl) {
    record(
      "Live LP",
      "Production URL check",
      true,
      "skipped — set PHONE_POST_IMPL_URL after deploy",
    );
  } else {
    const lpUrl = `${baseUrl}/lp?utm_source=facebook&utm_medium=paid&utm_campaign=LONDON_BLB`;
    console.log(`\nFetching ${lpUrl}\n`);
    try {
      const res = await fetch(lpUrl);
      const html = await res.text();
      record("Live LP", "HTTP 200", res.ok, String(res.status));

      const chunkPaths = [
        ...new Set(
          [...html.matchAll(/\/_next\/static\/chunks\/[a-z0-9._-]+\.js/g)].map((m) => m[0]),
        ),
      ];
      let bundleText = html;
      for (const chunk of chunkPaths.slice(0, 40)) {
        try {
          bundleText += await fetch(`${baseUrl}${chunk}`).then((r) => r.text());
        } catch {
          /* skip missing chunk */
        }
      }

      record(
        "Live LP",
        "Mobile number label in form bundle",
        bundleText.includes("Mobile number") || bundleText.includes("fb-phone"),
      );
      record("Live LP", "07 placeholder deployed", bundleText.includes("07XXX XXX XXX"));
      record(
        "Live LP",
        "UK mobile hint deployed",
        bundleText.includes("UK mobile") && bundleText.includes("11 digits"),
      );
    } catch (err) {
      record("Live LP", "Fetch failed", false, String(err));
    }
  }

  // ── Phase 7: Live API bypass (optional) ──
  if (process.env.PHONE_POST_AUDIT_LIVE === "true" && baseUrl) {
    try {
      const res = await fetch(`${baseUrl}/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...baseCapture, phone: "+44774352718" }),
      });
      record(
        "Live API",
        "Production rejects invalid phone",
        res.status === 400,
        `status ${res.status}`,
      );
    } catch (err) {
      record("Live API", "Production bypass test", false, String(err));
    }
  } else {
    record(
      "Live API",
      "Production bypass test",
      true,
      "skipped — PHONE_POST_AUDIT_LIVE=true to run",
    );
  }

  // ── Phase 8: Manual ops (advisory) ──
  const manual = [
    "Fix Mohammed case phone manually if still +44774352718",
    "Resend SMS after phone correction on legacy bad leads",
    "Ali case: confirm Call/SMS/WhatsApp from workspace",
  ];
  for (const line of manual) {
    record("Ops (manual)", line, true, "confirm in workspace");
  }

  // ── Verdict ──
  const automated = items.filter((i) => !i.phase.endsWith("(manual)"));
  const liveSkipped = automated.filter(
    (i) =>
      (i.phase === "Live LP" && i.detail?.startsWith("skipped")) ||
      (i.phase === "Live API" && i.detail?.startsWith("skipped")),
  );
  const required = automated.filter((i) => !liveSkipped.includes(i));
  const preDeploy = required.filter((i) => !i.phase.startsWith("Live"));
  const live = required.filter((i) => i.phase.startsWith("Live"));
  const preDeployFailed = preDeploy.filter((i) => !i.pass);
  const liveFailed = live.filter((i) => !i.pass);
  const liveRan = baseUrl.length > 0;

  console.log("\n── Summary ──\n");
  console.log(
    `Static + validation + API + SMS: ${preDeployFailed.length === 0 ? "PASS" : "FAIL"}`,
  );
  console.log(
    `Live LP: ${!liveRan ? "not run — set PHONE_POST_IMPL_URL" : liveFailed.length === 0 ? "PASS" : "FAIL"}`,
  );
  console.log(
    `Live API bypass: ${process.env.PHONE_POST_AUDIT_LIVE === "true" && liveRan ? (liveFailed.some((f) => f.phase === "Live API") ? "FAIL" : "PASS") : "skipped"}`,
  );

  if (preDeployFailed.length > 0) {
    console.log(`\nVerdict: BLOCKED — ${preDeployFailed.length} pre-deploy check(s) failed:\n`);
    for (const f of preDeployFailed) {
      console.log(`  • [${f.phase}] ${f.name}${f.detail ? `: ${f.detail}` : ""}`);
    }
    console.log("");
    process.exit(1);
  }

  if (!liveRan) {
    console.log(
      "\nVerdict: READY — pre-deploy checks passed. Deploy then re-run:\n  PHONE_POST_IMPL_URL=https://loans.bridgingloansbroker.co.uk npm run phone:post-impl\n",
    );
    process.exit(0);
  }

  if (liveFailed.length > 0) {
    console.log(`\nVerdict: BLOCKED — ${liveFailed.length} live check(s) failed (deploy phone validation changes):\n`);
    for (const f of liveFailed) {
      console.log(`  • [${f.phase}] ${f.name}${f.detail ? `: ${f.detail}` : ""}`);
    }
    console.log("");
    process.exit(1);
  }

  console.log(
    `\nVerdict: SHIP — ${required.length}/${required.length} automated checks passed. Complete Ops (manual) for legacy Mohammed case.\n`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
