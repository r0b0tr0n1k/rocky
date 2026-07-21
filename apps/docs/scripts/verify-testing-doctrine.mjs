// apps/docs/scripts/verify-testing-doctrine.mjs
//
// Doc-test for apps/docs/content/TESTING_DOCTRINE.md
//
// TESTING_DOCTRINE.md is the META-doc: it documents the result-monad doc-test
// (verify-result-doctrine.mjs). The Žižekian necessity — the doctrine ABOUT the
// test must itself be tested, lest the meta-doc become the very ideology it
// warns against. So this test proves the meta-doc "works as projected":
//
//   1. the meta-doc exists and has its expected sections;
//   2. every internal `./X.md` cross-link resolves to a real file;
//   3. every test script it names actually exists on disk;
//   4. every run-command it documents is wired in apps/docs/package.json;
//   5. the "What it checks" table is TRUE — verify-result-doctrine.mjs really
//      implements each check the meta-doc claims (no phantom claims).
//
// Run:  node --test apps/docs/scripts/verify-testing-doctrine.mjs
// (or:  pnpm --filter docs test:testing)

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");
const CONTENT_DIR = path.join(ROOT, "apps/docs/content");
const SCRIPT_DIR = path.join(ROOT, "apps/docs/scripts");
const DOC = path.join(CONTENT_DIR, "TESTING_DOCTRINE.md");
const RESULT_DOC = path.join(CONTENT_DIR, "result-monad-and-error-sovereignty.md");
const RESULT_TEST = path.join(SCRIPT_DIR, "verify-result-doctrine.mjs");
const OFFLINE_TEST = path.join(SCRIPT_DIR, "verify-offline-doctrine.mjs");
const PKG = path.join(ROOT, "apps/docs/package.json");

const doc = fs.readFileSync(DOC, "utf8");

// ── Tests ────────────────────────────────────────────────────────────
test("meta-doc exists and declares its expected sections", () => {
  assert.ok(fs.existsSync(DOC), "TESTING_DOCTRINE.md missing");
  for (const h of [
    "# Testing the Result Monad Doctrine",
    "## Why this exists",
    "## Run it",
    "## What it checks",
    "## Findings this test caught (and we fixed)",
    "## Related",
  ]) {
    assert.ok(doc.includes(h), `TESTING_DOCTRINE.md must contain section "${h}"`);
  }
});

test("meta-doc internal cross-links resolve to real files", () => {
  const linkRe = /\]\(\.\/([^)]+\.md)\)/g;
  const missing = [];
  let m;
  for (m = linkRe.exec(doc); m; m = linkRe.exec(doc)) {
    // external github blob links are not `./` relative — only relative md links match.
    // `X.md` is the meta-doc's own metasyntactic placeholder (the "What it checks"
    // table literally writes `](./X.md)`), so it is NOT a real link to verify.
    if (m[1] === "X.md") continue;
    if (!fs.existsSync(path.join(CONTENT_DIR, m[1]))) missing.push(m[1]);
  }
  assert.deepEqual(missing, [], `Broken meta-doc links: ${missing.join(", ")}`);
});

test("meta-doc names real test scripts", () => {
  assert.ok(fs.existsSync(RESULT_TEST), "verify-result-doctrine.mjs (named by the doc) missing");
  assert.ok(fs.existsSync(OFFLINE_TEST), "verify-offline-doctrine.mjs (linked by the doc) missing");
});

test("meta-doc run-commands are wired in apps/docs/package.json", () => {
  assert.ok(fs.existsSync(PKG), "apps/docs/package.json missing");
  const j = JSON.parse(fs.readFileSync(PKG, "utf8"));
  const scripts = j.scripts ?? {};
  assert.ok("test:doctrine" in scripts, "apps/docs must expose `test:doctrine` (doc Run-it claims it)");
  assert.ok("test:offline" in scripts, "apps/docs must expose `test:offline` (doc References it)");
  assert.match(
    scripts["test:doctrine"],
    /verify-result-doctrine\.mjs/,
    "test:doctrine must invoke verify-result-doctrine.mjs",
  );
  assert.match(
    scripts["test:offline"],
    /verify-offline-doctrine\.mjs/,
    "test:offline must invoke verify-offline-doctrine.mjs",
  );
});

test('meta-doc "What it checks" table is TRUE (the script implements every claim)', () => {
  assert.ok(fs.existsSync(RESULT_TEST), "cannot verify fidelity without the script");
  const src = fs.readFileSync(RESULT_TEST, "utf8");
  // Each substring the meta-doc's table implies must be present in the implementation.
  const mustContain = [
    "Result Monad Sovereignty", // doc-structure pillar check
    "Error Code Parsimony",
    "Church and State",
    "'ok'",
    "'err'",
    "'isError'",
    "'SHARED_ERRORS'",
    "'Result'", // domains-shared exports
    "CORRECT imports resolve", // no-phantom-symbols check
    "_TRPC_ERROR_MAP", // validators/errors owns the maps
    "'NotFoundError'",
    "'ForbiddenError'",
    "'DbError'", // shared error classes
    "doc cross-links resolve", // link check
    "createResultUnwrapper", // functional unwrapper
  ];
  const missing = mustContain.filter((s) => !src.includes(s));
  assert.deepEqual(
    missing,
    [],
    `TESTING_DOCTRINE.md "What it checks" table claims these are implemented, but verify-result-doctrine.mjs does not contain:\n- ${missing.join("\n- ")}`,
  );
});

test('meta-doc "Findings" fixes are real (no phantom unwrap import in the result doc)', () => {
  // The meta-doc claims fix #1 removed the top-level `unwrap` import from
  // @rocky/domains-shared. Verify the result doctrine doc does not import it
  // in a CORRECT block (❌ WRONG blocks are allowed to show the mistake).
  assert.ok(fs.existsSync(RESULT_DOC), "result doctrine doc missing");
  const rdoc = fs.readFileSync(RESULT_DOC, "utf8");
  const fenceRe = /```(?:typescript|ts|txt)?\n([\s\S]*?)```/g;
  let f;
  let offending = 0;
  for (f = fenceRe.exec(rdoc); f; f = fenceRe.exec(rdoc)) {
    const block = f[1];
    if (/❌\s*WRONG|WRONG\s*[—-]/.test(block)) continue; // deliberately-wrong example
    if (/import\s+(?:type\s+)?\{[^}]*\bunwrap\b[^}]*\}\s*from\s*["']@rocky\/domains-shared["']/.test(block)) {
      offending++;
    }
  }
  assert.equal(
    offending,
    0,
    "result doctrine doc still imports a phantom top-level `unwrap` from @rocky/domains-shared in a CORRECT block",
  );
});
