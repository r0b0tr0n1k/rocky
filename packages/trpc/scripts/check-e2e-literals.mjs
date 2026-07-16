#!/usr/bin/env node
// ── Zero hand-written literal / enum guard for the tRPC conformance suite ──
//
// The frontend tRPC conformance tests MUST derive all data from schemas and
// factories — no hand-written enum option strings or constants. This guard
// fails if any e2e test file contains an uppercase/underscore string literal
// of 3+ characters (the shape of an enum option or constant), except the
// single whitelisted negative-test sentinel.
//
// Run: node packages/trpc/scripts/check-e2e-literals.mjs

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const E2E_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "e2e");
// Pre-existing e2e tests that deliberately assert literal error codes
// (e.g. ANIMAL_NOT_FOUND) — out of the conformance-suite scope.
const WHITELIST_FILES = new Set(["error-map.test.ts", "trpc-wire-boundary.test.ts"]);
const WHITELIST = new Set(["___NOT_A_VALID_ENUM___"]);
const RE = /"([A-Z_]{3,})"/g;

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (p.endsWith(".ts")) out.push(p);
  }
  return out;
}

const bad = [];
for (const file of walk(E2E_DIR)) {
  if (WHITELIST_FILES.has(basename(file))) continue;
  const txt = readFileSync(file, "utf8");
  RE.lastIndex = 0;
  let m = RE.exec(txt);
  while (m !== null) {
    const lit = m[1];
    if (!WHITELIST.has(lit)) bad.push(`${file}: "${lit}"`);
    m = RE.exec(txt);
  }
}

if (bad.length) {
  console.error(
    "✖ E2E conformance tests contain hand-written uppercase/underscore literals\n" +
      "  (likely enum options or constants). All test data must be derived from\n" +
      "  Zod schemas (schema-walker) or @rocky/testing factories — no literals.\n",
  );
  for (const b of bad) console.error(`    ${b}`);
  process.exit(1);
}

console.log("✓ e2e literal check: clean (no hand-written enum/constant literals)");
