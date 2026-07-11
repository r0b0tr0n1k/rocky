#!/usr/bin/env node
// Enforces ADR-0033 (Frontend & Mobile Architecture-Decision Standard) uniformity
// across apps/docs/content/ADR/*.md. Exits non-zero on any violation so it can
// gate CI / pre-commit — the Big Other that keeps the Symbolic order consistent.
//
// Rules:
//   1. H1 must be "# ADR-<nnnn>: <title>" and the number must match the filename.
//   2. A header table must declare: Status, Date, Author, Supersedes, Superseded.
//   3. Status must be one of: Proposed | Accepted | Deprecated | Superseded.
//   4. Required sections present: ## Context, ## Decision, ## Consequences.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(import.meta.url), "../..");
const dir = process.argv[2] || path.join(root, "apps/docs/content/ADR");
const REQUIRED_SECTIONS = ["Context", "Decision", "Consequences"];
const VALID_STATUS = new Set(["Proposed", "Accepted", "Deprecated", "Superseded"]);
const REQUIRED_KEYS = ["Status", "Date", "Author", "Supersedes", "Superseded"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

let errors = 0;
const err = (f, msg) => { console.error(`✗ ${f}: ${msg}`); errors++; };
const files = fs.readdirSync(dir).filter((f) => /^(\d{4})-.*\.md$/.test(f)).sort();

for (const f of files) {
  const num = f.match(/^(\d{4})/)[1];
  const text = fs.readFileSync(path.join(dir, f), "utf8");
  const lines = text.split("\n");

  // Rule 1: H1
  const h1 = lines.find((l) => l.startsWith("# ")) || "";
  const m = h1.match(/^# ADR-(\d{4}):\s+(.+)$/);
  if (!m) { err(f, `H1 must be "# ADR-${num}: <title>" (found: ${JSON.stringify(h1.slice(0, 50))})`); continue; }
  if (m[1] !== num) err(f, `H1 number ${m[1]} != filename number ${num}`);

  // Rule 2 + 3: header table — scan ONLY the header region (H1 -> first section),
  // so body tables that happen to have a "Status"/"Date" column are ignored.
  const h1Idx = lines.findIndex((l) => l.startsWith("# "));
  const headerEnd = lines.findIndex((l, i) => i > h1Idx && /^##\s+/.test(l));
  const region = lines.slice(h1Idx + 1, headerEnd === -1 ? lines.length : headerEnd);
  const keys = {};
  for (const l of region) {
    const tm = l.match(/^\s*\|\s*\*{0,2}([A-Za-z]+)\*{0,2}\s*\|\s*(.*?)\s*\|\s*$/);
    if (tm) keys[tm[1].toLowerCase()] = tm[2].trim();
  }
  for (const k of REQUIRED_KEYS) {
    if (!(k.toLowerCase() in keys)) err(f, `missing header-table row "${k}"`);
  }
  if (keys.status && !VALID_STATUS.has(keys.status)) err(f, `Status "${keys.status}" not in {${[...VALID_STATUS].join(", ")}}`);
  if (keys.date && !DATE_RE.test(keys.date)) err(f, `Date "${keys.date}" not YYYY-MM-DD`);

  // Rule 4: required sections
  for (const s of REQUIRED_SECTIONS) {
    if (!new RegExp(`^##\\s+${s}\\b`, "m").test(text)) err(f, `missing required section "## ${s}"`);
  }
}

if (errors) { console.error(`\n${errors} ADR violation(s) found.`); process.exit(1); }
console.log(`✓ ${files.length} ADRs conform to ADR-0033.`);
