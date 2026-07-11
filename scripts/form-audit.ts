#!/usr/bin/env npx tsx
/** Form validation unit checks — run: npm run form:audit */
import {
  formatUKPhoneDisplay,
  formatUKPhoneInput,
  isValidEmail,
  isValidUKPhone,
  normalizeUKPhone,
  ukPhoneValidationError,
  validateLoanAmount,
  parseMoneyInput,
  formatMoneyInput,
  parseFormUrlParams,
} from "../src/lib/form-validation";
import { isLongTimeframe } from "../src/lib/timeframes";
import { getTodayPrioritySlots } from "../src/lib/priority-slots";
import { MIN_LOAN } from "../src/lib/qualifications";

const checks: { name: string; pass: boolean; detail?: string }[] = [];

function assert(name: string, pass: boolean, detail?: string) {
  checks.push({ name, pass, detail });
}

assert("Min loan rejects £49k", validateLoanAmount(49000) !== null);
assert("Min loan accepts £50k", validateLoanAmount(MIN_LOAN) === null);
assert("Min loan accepts £250k", validateLoanAmount(250000) === null);
assert("UK mobile valid (07)", isValidUKPhone("07123 456 789"));
assert("UK mobile valid (+44 paste)", isValidUKPhone("+44 7123 456 789"));
assert("UK mobile stored as E.164", normalizeUKPhone("07123456789") === "+447123456789");
assert("+44 paste stored as E.164", normalizeUKPhone("+447123456789") === "+447123456789");
assert("Display from E.164", formatUKPhoneDisplay("+447123456789") === "07123 456 789");
assert("Phone format spacing", formatUKPhoneInput("07123456789").includes(" "));
assert("+44 paste formats as 07", formatUKPhoneInput("+447759180011").startsWith("077"));
assert("Rejects short +44 (Mohammed case)", !isValidUKPhone("+44774352718"));
assert("Rejects short +44 error message", ukPhoneValidationError("+44774352718")?.includes("11") === true);
assert("Rejects landline 01", !isValidUKPhone("01234567890"));
assert("Rejects landline prefix message", ukPhoneValidationError("01234567890")?.includes("07") === true);
assert("Partial shows digit count", ukPhoneValidationError("0774352718") === "Enter 11 digits (10/11)");
assert("Email valid", isValidEmail("test@example.com"));
assert("Email invalid", !isValidEmail("not-an-email"));
assert("Long timeframe (researching)", isLongTimeframe("researching"));
assert("Long timeframe (legacy)", isLongTimeframe("over_3_months"));
assert("Short timeframe", !isLongTimeframe("30_days"));
assert("Priority slots generated", getTodayPrioritySlots().length >= 1);
assert("Parse money", parseMoneyInput("250,000") === 250000);
assert("Format money", formatMoneyInput(250000) === "250,000");
assert("URL prefill amount", parseFormUrlParams("?loan=500000").loanAmount === 500000);
assert("URL prefill purpose", parseFormUrlParams("?purpose=auction").loanPurpose === "auction");

const passed = checks.filter((c) => c.pass).length;
console.log("\n📋 Form validation audit\n");
for (const c of checks) {
  console.log(`${c.pass ? "✅" : "❌"} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
}
console.log(`\n${passed}/${checks.length} passed\n`);
process.exit(passed === checks.length ? 0 : 1);
