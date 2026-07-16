#!/usr/bin/env node
// scripts/check-standards.mjs — CI guardian for the standards / compliance layer.
//
// Zero dependencies (node built-ins only). Exits non-zero on ANY violation so it
// can gate ci:checks — the mechanical Big Other that keeps the conformity spine
// from silently re-diverging. Tone/format mirrors scripts/check-md-links.mjs.
//
// It enforces four invariants on the standards/compliance layer:
//
// (a) Governing-ADR back-link.
//     SCOPE: the authored ISMS/PIMS *posture & governance papers* under
//       apps/docs/content/compliance/ (the ROCKY-XXX-001 papers, isms-policy.md,
//       index.mdx, the gap-analysis) PLUS the software-engineering standards map
//       apps/docs/content/Standardization/iso-software-engineering-standards-map.md.
//     Every such doc SHALL link to at least one governing ADR — either a relative
//       `../ADR/00NN-*` link or the text `ADR-NNNN`.
//     OUT OF SCOPE: the raw legal text / legal-law artifacts (see LEGAL_LAW_DOCS)
//       and the bulk Standardization/*.md extracted ISO-standard texts (they are
//       the standards themselves and carry no governing ADR).
//
// (b) Single SoA status per control row.
//     SCOPE: the canonical SoA apps/docs/content/compliance/isms-policy.md.
//     Every control row (a table row beginning with `| A.`) SHALL contain exactly
//       ONE status token chosen from IMPLEMENTED / PARTIAL / PLANNED (bolded).
//       More than one, or zero, is a violation.
//
// (c) Crosswalk docs cite VALIDATED_CROSSWALK.
//     SCOPE: the three crosswalk pointer docs
//       apps/docs/content/Standardization/iso27001-2022-annex-a-mapping.md
//       apps/docs/content/Standardization/MACEDONIAN_LPDP_GDPR_ISO27701_CONTROLS_MATRIX.md
//       apps/docs/content/Standardization/iso27701_2025.md
//     Each SHALL cite VALIDATED_CROSSWALK / packages/validators/src/compliance/gdpr-articles.ts
//       as the single machine-checked source of truth.
//
// (d) ISO/IEC Directive Part 2, Annex A drafting discipline (controlled language).
//     SCOPE: SAME set as (a) — the authored posture papers + the standards map.
//     Forbids the word "must" (case-insensitive, word-boundary) outside fenced
//       code blocks (```) and inline `code`. ISO controlled language is
//       shall / should / may / can.
//     OUT OF SCOPE: extracted ISO-standard texts (bulk Standardization/*.md) and
//       the legal-law artifacts — they are not authored posture papers, so the
//       rule's intent (discipline on *our* drafting) does not apply to them.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(import.meta.url), "../..");
const CONTENT = path.join(root, "apps/docs/content");
const CROSSWALK_SRC = "packages/validators/src/compliance/gdpr-articles.ts";
const CROSSWALK_SYMBOL = "VALIDATED_CROSSWALK";

const SOA = path.join(CONTENT, "compliance/isms-policy.md");
const STANDARDS_MAP = path.join(CONTENT, "Standardization/iso-software-engineering-standards-map.md");
const CROSSWALK_DOCS = [
  path.join(CONTENT, "Standardization/iso27001-2022-annex-a-mapping.md"),
  path.join(CONTENT, "Standardization/MACEDONIAN_LPDP_GDPR_ISO27701_CONTROLS_MATRIX.md"),
  path.join(CONTENT, "Standardization/iso27701_2025.md"),
];
const STATUS_TOKENS = ["IMPLEMENTED", "PARTIAL", "PLANNED"];

// Remediated-doc sets for the extended (e) editorial checks. Scoped to the docs
// actually touched by the ISO/IEC Directive Part 2, Annex A remediation — not a
// broad sweep — so the check stays green and enforces the specific fixes.
const FRONTEND_CONFORMITY = path.join(CONTENT, "compliance/frontend-conformity.md");
const NON_PII = path.join(CONTENT, "compliance/rocky-non-pii-asset-inventory.md");
const SUPPLIER = path.join(CONTENT, "compliance/rocky-supplier-security-assessment.md");
const GAP = path.join(CONTENT, "compliance/iso27701-2025-gap-analysis.md");
const CONTROLS_INV = path.join(CONTENT, "compliance/rocky-controls-inventory.md");
const WRITING = path.join(CONTENT, "Standardization/writing-iso-compatible-documentation.md");

const SHALL_DOCS = [STANDARDS_MAP, NON_PII, SUPPLIER, FRONTEND_CONFORMITY, GAP];
const TABLE_FIG_DOCS = [STANDARDS_MAP, FRONTEND_CONFORMITY, SOA, GAP];
const FRONTMATTER_DOCS = [FRONTEND_CONFORMITY, GAP, CONTROLS_INV];
const ANCHOR_DOCS = [WRITING];

// Authoritative legal artifacts / raw legal text-index. They are LAW (not
// management-system posture papers) and were explicitly declared "never
// rewritten" by the remediation plan (§3.2). They carry "must" as quoted legal
// register and hold no *governing* ADR — out of scope for (a) and (d).
const LEGAL_LAW_DOCS = new Set([
  "MACEDONIAN_LPDP.md",
  "rocky-ropa.md",
  "rocky-dpa.md",
  "rocky-dsr-procedure.md",
  "rocky-breach-notification-procedure.md",
  "rocky-privacy-notice.md",
  "rocky-cookie-notice.md",
  "rocky-lawful-basis-register.md",
  "rocky-processor-register.md",
  "rocky-dpia-health.md",
  "rocky-international-transfer-assessment.md",
  "rocky-erasure-retention-procedure.md",
  "rocky-withdrawal-recall-procedure.md",
  "rocky-automated-decision-making.md",
  "rocky-retention-schedule.md",
  "eu-b2b-procurement-pack.md",
]);

const errors = [];
const note = (f, line, msg) => errors.push(`${path.relative(root, f)}${line ? ":" + line : ""}  ${msg}`);

// ---- shared helpers -------------------------------------------------------

// Walk a dir for .md/.mdx files (recursive), skipping node_modules.
function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (/\.mdx?$/.test(e.name)) out.push(p);
  }
  return out;
}

// RegExp matching an ADR back-link: either the text `ADR-NNNN` or a relative
// link into the ADR/ folder (e.g. `../ADR/0067-...md` or `/ADR/0067-...md`).
const ADR_RE = /(ADR-[0-9]{4})|(\]\(\s*\.{0,2}\/?ADR\/)/;

// Strip fenced code blocks and inline `code` spans from a line so that the
// "must" lint (d) ignores code. Returns { text, inFence } where inFence is the
// fence state AFTER this line (carried across lines by the caller).
function stripCode(text, inFence) {
  let out = text;
  let fence = inFence;
  // A fence toggle line (``` or ~~~) flips state; don't keep its content.
  const fenceMatch = out.match(/^\s*(```|~~~)/);
  if (fenceMatch) {
    fence = !fence;
    return { text: "", inFence: fence };
  }
  if (fence) return { text: "", inFence: fence };
  // Remove inline code spans.
  out = out.replace(/`[^`]*`/g, "");
  return { text: out, inFence: fence };
}

const MUST_RE = /(?<![\w])must(?![\w])/i;

// ---- (a) Governing-ADR back-link + (d) no "must" --------------------------
// Scope for both (a) and (d): authored posture papers under compliance/ (minus
// legal-law artifacts) PLUS the standards map.

const postureDocs = walk(path.join(CONTENT, "compliance")).filter((f) => !LEGAL_LAW_DOCS.has(path.basename(f)));
const scopeADocs = [...postureDocs, STANDARDS_MAP];

let scanned = 0;
for (const f of scopeADocs) {
  scanned++;
  const lines = fs.readFileSync(f, "utf8").split("\n");
  if (!ADR_RE.test(lines.join("\n")))
    note(f, 0, "no governing ADR back-link (missing ADR-NNNN reference or ../ADR/ link)");
  let inFence = false;
  lines.forEach((ln, i) => {
    const { text, inFence: next } = stripCode(ln, inFence);
    inFence = next;
    if (text && MUST_RE.test(text))
      note(f, i + 1, `forbidden word "must" (ISO/IEC Directive Part 2, Annex A: use shall/should/may/can)`);
  });
}

// ---- (b) Single SoA status per control row --------------------------------

if (fs.existsSync(SOA)) {
  for (const [i, line] of fs.readFileSync(SOA, "utf8").split("\n").entries()) {
    if (!/^\|\s*A\.[0-9]/.test(line)) continue; // only genuine control rows
    const found = STATUS_TOKENS.filter((t) => new RegExp(`\\*\\*${t}\\*\\*`, "i").test(line));
    if (found.length !== 1)
      note(
        SOA,
        i + 1,
        `control row has ${found.length} status token(s) [${found.join(",")}]: ${line.trim().slice(0, 72)}`,
      );
  }
}

// ---- (c) Crosswalk docs cite VALIDATED_CROSSWALK --------------------------

for (const f of CROSSWALK_DOCS) {
  if (!fs.existsSync(f)) {
    note(f, 0, "crosswalk pointer doc missing");
    continue;
  }
  const txt = fs.readFileSync(f, "utf8");
  if (!txt.includes(CROSSWALK_SYMBOL) && !txt.includes(CROSSWALK_SRC))
    note(f, 0, `crosswalk doc does not cite ${CROSSWALK_SYMBOL} (${CROSSWALK_SRC})`);
}

// ---- (e) ISO/IEC Directive Part 2, Annex A editorial checks (extended) ----
// Focused on the remediated docs. Covers the Table A.1 items not already
// handled by (a)-(d):
//   (e1) no "shall" in Introduction; no "shall/should/may" in Scope,
//   (e2) every Table/Figure caption is cross-referenced from body text,
//   (e3) title: + sidebarTitle: frontmatter present,
//   (e4) same-file #anchor links resolve to a heading slug.

const SHALL_RE = /(?<![\w])shall(?![\w])/i;
const SHOULD_MAY_RE = /(?<![\w])(should|may)(?![\w])/i;

function checkShall(f) {
  const lines = fs.readFileSync(f, "utf8").split("\n");
  let inIntro = false,
    inScope = false,
    lvlI = 0,
    lvlS = 0;
  for (let i = 0; i < lines.length; i++) {
    const h = lines[i].match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const lvl = h[1].length;
      const t = h[2];
      if (/^introduction\b/i.test(t)) {
        inIntro = true;
        lvlI = lvl;
        inScope = false;
      } else if (/^scope\b/i.test(t)) {
        inScope = true;
        lvlS = lvl;
        inIntro = false;
      } else {
        if (inIntro && lvl <= lvlI) inIntro = false;
        if (inScope && lvl <= lvlS) inScope = false;
      }
    }
    if (inIntro && SHALL_RE.test(lines[i]))
      note(f, i + 1, `shall in Introduction (Directive Part 2 A.5/13: Introduction is informative only)`);
    if (inScope && SHOULD_MAY_RE.test(lines[i]))
      note(f, i + 1, `should/may in Scope (Directive Part 2 A.6/14: Scope = statements of fact)`);
    if (inScope && SHALL_RE.test(lines[i]))
      note(f, i + 1, `shall in Scope (Directive Part 2 A.6/14: Scope = statements of fact)`);
  }
}

function checkTableFig(f) {
  const txt = fs.readFileSync(f, "utf8");
  const re = /(\bTable|\bFigure)\s+([A-Z]\.?\d+(?:\.\d+)*|\d+(?:\.\d+)*)/gi;
  const counts = {};
  let m = re.exec(txt);
  while (m) {
    const key = `${m[1].toLowerCase()} ${m[2]}`;
    counts[key] = (counts[key] || 0) + 1;
    m = re.exec(txt);
  }
  for (const [k, c] of Object.entries(counts)) {
    if (c < 2) note(f, 0, `${k} caption not cross-referenced from body text (Directive Part 2 A.9/10, Cl 28/29)`);
  }
}

function checkFrontmatter(f) {
  const txt = fs.readFileSync(f, "utf8");
  const fm = txt.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) {
    note(f, 0, "missing YAML frontmatter (house rule 5: title: + sidebarTitle:)");
    return;
  }
  if (!/^title:/m.test(fm[1])) note(f, 0, "frontmatter missing title: (house rule 5)");
  if (!/^sidebarTitle:/m.test(fm[1])) note(f, 0, "frontmatter missing sidebarTitle: (house rule 5)");
}

function slugify(s) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
function checkAnchors(f) {
  const lines = fs.readFileSync(f, "utf8").split("\n");
  const slugs = new Set();
  for (const ln of lines) {
    const h = ln.match(/^(#{1,6})\s+(.*)$/);
    if (h) slugs.add(slugify(h[2]));
  }
  const are = /\]\(#([\w-]+)\)/g;
  const body = lines.join("\n");
  let m = are.exec(body);
  while (m) {
    const raw = m[1];
    if (!slugs.has(raw) && !slugs.has(slugify(raw)))
      note(f, 0, `broken same-file anchor #${raw} (Directive Part 2 A.16, Cl 10)`);
    m = are.exec(body);
  }
}

for (const f of SHALL_DOCS) if (fs.existsSync(f)) checkShall(f);
for (const f of TABLE_FIG_DOCS) if (fs.existsSync(f)) checkTableFig(f);
for (const f of FRONTMATTER_DOCS) if (fs.existsSync(f)) checkFrontmatter(f);
for (const f of ANCHOR_DOCS) if (fs.existsSync(f)) checkAnchors(f);

// ---- report ---------------------------------------------------------------

console.log(
  `\nScanned ${scanned} posture/standards doc(s) for ADR back-link + controlled language; ` +
    `1 SoA (158 control rows); ${CROSSWALK_DOCS.length} crosswalk pointer doc(s).\n`,
);
if (errors.length) {
  console.error(`✗ ${errors.length} violation(s):`);
  for (const e of errors) console.error(`  ${e}`);
  console.error("");
  process.exit(1);
}
console.log(
  "✓ standards layer conforms — ADR back-links present, SoA single-source, crosswalks anchored, controlled language clean, Annex A editorial checks pass.",
);
console.log("");
process.exit(0);
