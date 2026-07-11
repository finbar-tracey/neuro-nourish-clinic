#!/usr/bin/env npx tsx
/**
 * Print the NeuroNourish quiz capture 10/10 post-implementation agent prompt.
 * Run: npm run quiz:prompt
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const docPath = join(process.cwd(), "docs", "QUIZ_CAPTURE_POST_IMPLEMENTATION.md");
const doc = readFileSync(docPath, "utf8");

const start = doc.indexOf("```\nNEURONOURISH — QUIZ CAPTURE POST-IMPLEMENTATION");
const end = doc.indexOf("```", start + 4);
if (start === -1 || end === -1) {
  console.error("Could not extract agent prompt from docs/QUIZ_CAPTURE_POST_IMPLEMENTATION.md");
  process.exit(1);
}

const prompt = doc.slice(start + 4, end).trimEnd();
console.log(prompt);
