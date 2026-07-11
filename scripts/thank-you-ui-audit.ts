#!/usr/bin/env npx tsx
/**
 * Thank-you / final step UI regression checks.
 * Run: npm run thank-you:audit
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const file = readFileSync(
  join(root, "src/components/forms/qualified-thank-you.tsx"),
  "utf8",
);

type Check = { name: string; pass: boolean; detail?: string };
const checks: Check[] = [];

function assert(name: string, pass: boolean, detail?: string) {
  checks.push({ name, pass, detail });
}

assert("Uses container queries for layout", file.includes("@container"));
assert(
  "Booking stacks full width (no side-by-side lg grid)",
  !file.includes("@lg:grid @lg:grid-cols-5"),
);
assert("Slot picker uses responsive grid", file.includes("grid-cols-2"));
assert("Auto-selects soonest slot", file.includes("setSelectedSlotId(slots[0].id)"));
assert("Logs booking intent on slot change", file.includes("logBookingIntent"));
assert(
  "Headline distinguishes enquiry vs call confirmed",
  file.includes("You're all set") && file.includes("Call confirmed"),
);
assert(
  "No overlapping negative Next badge",
  !file.includes("absolute -top"),
);
assert(
  "Reserve CTA disabled without slot",
  file.includes("!selectedSlot") && file.includes("disabled="),
);
assert("Keyboard navigation on slots", file.includes("ArrowRight"));
assert("Teams link on confirmation when available", file.includes("teamsLink"));
assert("Process stepper uses consistent numbers", file.includes("step.num"));
assert("Summary values allow wrapping", file.includes("break-words"));
assert("Mobile vertical timeline present", file.includes("@md:hidden"));
assert("Trust grid stacks on small screens", file.includes("grid-cols-1"));

const passed = checks.filter((c) => c.pass).length;
const failed = checks.filter((c) => !c.pass);

console.log("\nThank-you UI audit\n");
for (const c of checks) {
  console.log(`${c.pass ? "✓" : "✗"} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
}
console.log(`\n${passed}/${checks.length} passed\n`);

if (failed.length > 0) process.exit(1);
