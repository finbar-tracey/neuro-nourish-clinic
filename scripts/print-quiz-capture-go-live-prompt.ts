#!/usr/bin/env npx tsx
/**
 * Print the NeuroNourish quiz capture go-live agent prompt.
 * Run: npm run quiz:go-live:prompt
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const docPath = join(process.cwd(), "docs", "QUIZ_CAPTURE_GO_LIVE.md");
const doc = readFileSync(docPath, "utf8");

const start = doc.indexOf("```\nNEURONOURISH — QUIZ CAPTURE GO-LIVE");
const end = doc.indexOf("```", start + 4);
if (start === -1 || end === -1) {
  console.error("Could not extract agent prompt from docs/QUIZ_CAPTURE_GO_LIVE.md");
  process.exit(1);
}

console.log(doc.slice(start + 4, end).trimEnd());
