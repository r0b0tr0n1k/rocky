// apps/docs/scripts/verify-result-doctrine.mjs
//
// Doc-test for apps/docs/content/result-monad-and-error-sovereignty.md
//
// Confirms the doctrine doc "works as projected" — i.e. every @rocky/* import it
// tells the reader to write actually resolves to a real export, and the Result
// monad + createResultUnwrapper behave as the doc describes.
//
// Run:  node --test apps/docs/scripts/verify-result-doctrine.mjs
// (or:  pnpm --filter docs test:doctrine)

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");
const DOC = path.join(ROOT, "apps/docs/content/result-monad-and-error-sovereignty.md");
const CONTENT_DIR = path.join(ROOT, "apps/docs/content");

// ── workspace package discovery ──────────────────────────────────────
function findPkgDirs() {
  const dirs = [];
  for (const r of ["packages", "apps"]) {
    const base = path.join(ROOT, r);
    if (!fs.existsSync(base)) continue;
    for (const ent of fs.readdirSync(base, { withFileTypes: true })) {
      const p = path.join(base, ent.name);
      if (!ent.isDirectory()) continue;
      if (fs.existsSync(path.join(p, "package.json"))) dirs.push(p);
      if (ent.name === "domains") {
        for (const sub of fs.readdirSync(p, { withFileTypes: true })) {
          const sp = path.join(p, sub.name);
          if (sub.isDirectory() && fs.existsSync(path.join(sp, "package.json"))) dirs.push(sp);
        }
      }
    }
  }
  return dirs;
}
const PKG_DIR = new Map();
for (const d of findPkgDirs()) {
  try {
    const j = JSON.parse(fs.readFileSync(path.join(d, "package.json"), "utf8"));
    if (j.name) PKG_DIR.set(j.name, d);
  } catch {}
}

// Collect every exported name (values + types) from a package's source/entry.
function collectExports(dir) {
  const names = new Set();
  const candidates = ["src/index.ts", "src/index.tsx", "index.ts", "dist/index.js", "dist/index.d.ts"];
  let src;
  for (const c of candidates) {
    const f = path.join(dir, c);
    if (fs.existsSync(f)) {
      src = fs.readFileSync(f, "utf8");
      break;
    }
  }
  if (!src) return names;
  const add = (block) => {
    for (const part of block.split(",")) {
      const nm = part
        .trim()
        .split(/\s+as\s+/)
        .pop()
        .trim();
      if (nm && /^[A-Za-z_$][\w$]*$/.test(nm)) names.add(nm);
    }
  };
  for (const m of src.matchAll(/export\s+(?:const|let|var|function|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/g))
    names.add(m[1]);
  for (const m of src.matchAll(/export\s*(?:type\s*)?\{([^}]*)\}/g)) add(m[1]);
  return names;
}

// Parse the doc's @rocky/* import statements from fenced code blocks.
// Deliberately-WRONG examples (marked ❌ WRONG) are skipped — they are meant to fail.
function extractRockyImports() {
  const out = [];
  const docText = fs.readFileSync(DOC, "utf8");
  const fenceRe = /```(?:typescript|ts|txt)?\n([\s\S]*?)```/g;
  let f;
  for (f = fenceRe.exec(docText); f; f = fenceRe.exec(docText)) {
    const block = f[1];
    const isWrong = /❌\s*WRONG|WRONG\s*[—-]/.test(block);
    const importRe = /import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*["'](@rocky\/[^"']+)["']/g;
    let m;
    for (m = importRe.exec(block); m; m = importRe.exec(block)) {
      const symbols = [];
      for (const part of m[1].split(",")) {
        const t = part.trim();
        if (!t) continue;
        const isType = /^type\s+/.test(t);
        const name = t
          .replace(/^type\s+/, "")
          .trim()
          .split(/\s+as\s+/)[0]
          .trim();
        if (name) symbols.push({ name, isType });
      }
      out.push({ pkg: m[2], symbols, wrong: isWrong });
    }
  }
  return out;
}

const doc = fs.readFileSync(DOC, "utf8");

// ── Tests ────────────────────────────────────────────────────────────
test("doc exists and declares the three pillars", () => {
  assert.ok(fs.existsSync(DOC), "result-monad doc missing");
  assert.match(doc, /# The Law of the Result Monad & Error Sovereignty/);
  assert.match(doc, /Result Monad Sovereignty/);
  assert.match(doc, /Error Code Parsimony/);
  assert.match(doc, /Church and State/);
});

test("@rocky/domains-shared exports the canonical Result monad API", () => {
  const dir = PKG_DIR.get("@rocky/domains-shared");
  assert.ok(dir, "@rocky/domains-shared package must exist");
  const ex = collectExports(dir);
  for (const s of ["ok", "err", "isError", "SHARED_ERRORS", "Result"]) {
    assert.ok(ex.has(s), `@rocky/domains-shared must export "${s}" (doc claims it). Missing in source.`);
  }
});

test("doc CORRECT imports resolve to real exports (no phantom symbols)", () => {
  const imports = extractRockyImports().filter((i) => !i.wrong);
  const failures = [];
  for (const imp of imports) {
    const dir = PKG_DIR.get(imp.pkg);
    if (!dir) {
      failures.push(`[skip] package ${imp.pkg} not found in repo — likely an illustrative example, cannot verify`);
      continue;
    }
    const ex = collectExports(dir);
    for (const sym of imp.symbols) {
      if (!ex.has(sym.name)) {
        failures.push(`${imp.pkg} does not export "${sym.name}" but the doc imports it in a CORRECT block`);
      }
    }
  }
  assert.deepEqual(
    failures.filter((f) => !f.startsWith("[skip]")),
    [],
    `Doc imports symbols that are NOT exported by the real packages:\n- ${failures.join("\n- ")}`,
  );
});

test("@rocky/validators/errors owns TRPC error maps (*_TRPC_ERROR_MAP)", () => {
  const dir = PKG_DIR.get("@rocky/validators");
  assert.ok(dir, "@rocky/validators must exist");
  const errDir = path.join(dir, "src/errors");
  assert.ok(fs.existsSync(errDir), "validators/src/errors missing");
  let count = 0;
  for (const file of fs.readdirSync(errDir)) {
    if (!file.endsWith(".ts")) continue;
    const src = fs.readFileSync(path.join(errDir, file), "utf8");
    for (const _m of src.matchAll(/export\s+const\s+(\w*_TRPC_ERROR_MAP)\b/g)) count++;
  }
  assert.ok(count >= 1, "@rocky/validators/errors must export >=1 *_TRPC_ERROR_MAP (doc claims TRPC maps live here)");
});

test("@rocky/errors exports the shared error classes", () => {
  const dir = PKG_DIR.get("@rocky/errors");
  assert.ok(dir, "@rocky/errors must exist");
  const ex = collectExports(dir);
  for (const s of ["NotFoundError", "ForbiddenError", "DbError"]) {
    assert.ok(ex.has(s), `@rocky/errors must export "${s}"`);
  }
});

test("doc cross-links resolve to real files", () => {
  const linkRe = /\]\(\.\/([^)]+\.md)\)/g;
  const missing = [];
  let m;
  for (m = linkRe.exec(doc); m; m = linkRe.exec(doc)) {
    if (!fs.existsSync(path.join(CONTENT_DIR, m[1]))) missing.push(m[1]);
  }
  assert.deepEqual(missing, [], `Broken doc links: ${missing.join(", ")}`);
});

test("functional: Result monad from @rocky/domains-shared behaves as projected", async () => {
  const dir = PKG_DIR.get("@rocky/domains-shared");
  const mod = await import(path.join(dir, "dist/index.js"));
  assert.equal(typeof mod.ok, "function");
  assert.equal(typeof mod.err, "function");
  assert.equal(typeof mod.isError, "function");

  const okRes = mod.ok(42);
  assert.equal(okRes.isOk(), true);
  assert.equal(okRes.value, 42);

  const errRes = mod.err("NOT_FOUND"); // neverthrow err takes ONE argument
  assert.equal(mod.isError(errRes), true);
  assert.equal(errRes.error, "NOT_FOUND");

  // The doc's CORRECT import lists `unwrap` as a top-level export — it is NOT.
  assert.notEqual(
    typeof mod.unwrap,
    "function",
    "@rocky/domains-shared does NOT export a top-level `unwrap`; the doc must not import it.",
  );
});

test("functional: createResultUnwrapper maps a domain Result<E> to TRPCError", async () => {
  const dDir = PKG_DIR.get("@rocky/domains-shared");
  const tDir = PKG_DIR.get("@rocky/trpc");
  const { err } = await import(path.join(dDir, "dist/index.js"));
  const { createResultUnwrapper } = await import(path.join(tDir, "dist/index.js"));

  // Real domain errors carry `.code` (e.g. MovementError). Mirror that shape.
  const domainErr = Object.assign(new Error("movement not found"), { code: "MOVEMENT_NOT_FOUND" });
  const result = err(domainErr);
  const unwrap = createResultUnwrapper({ MOVEMENT_NOT_FOUND: { code: "NOT_FOUND", message: "not found" } });

  assert.throws(
    () => unwrap(result),
    (e) => e.name === "TRPCError" && e.code === "NOT_FOUND",
    "unwrapper must throw a TRPCError with the mapped code",
  );
});
