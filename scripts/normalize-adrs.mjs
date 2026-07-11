#!/usr/bin/env node
// Normalizes every ADR in apps/docs/content/ADR to the ADR-0033 canonical form:
//   # ADR-<nnnn>: <title>
//   | Key | Value |  (Status / Date / Author / Supersedes / Superseded)
//   ## Context -> Decision -> Consequences -> Implementation -> Verification -> Anti-Patterns -> Related ADRs
// Idempotent: a conforming ADR is rewritten identically. Preserves intro
// blockquotes/paragraphs that sit between the metadata block and the first section.
//
// Usage: node scripts/normalize-adrs.mjs [--dry-run] [--apply]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = path.resolve(fileURLToPath(import.meta.url), "../..");
const dir = path.join(root, "apps/docs/content/ADR");
const DRY = process.argv.includes("--dry-run");
const META_KEYS = ["Status", "Date", "Author", "Supersedes", "Superseded"];
const CORE_HEADINGS = ["Context", "Decision", "Consequences", "Implementation",
  "Verification", "Anti-Patterns", "Related ADRs", "References", "Alternatives Considered"];

function gitFirstDate(file) {
  try {
    const out = execFileSync("git", ["log", "--follow", "--diff-filter=A",
      "--format=%ad", "--date=short", "--", file], { cwd: root }).toString().trim();
    return out.split("\n")[0] || "";
  } catch { return ""; }
}

function extractMeta(text) {
  const meta = {};
  const lines = text.split("\n");
  // 1) YAML frontmatter
  if (lines[0]?.trim() === "---") {
    for (let i = 1; i < lines.length; i++) {
      const l = lines[i].trim();
      if (l === "---") break;
      const mm = l.match(/^([A-Za-z]+):\s*(.*)$/);
      if (mm) {
        const k = mm[1].toLowerCase();
        const v = mm[2].replace(/^\[(.*)\]$/, "$1").replace(/^["']|["']$/g, "").trim();
        if (k === "status") meta.Status = v;
        else if (k === "date") meta.Date = v;
        else if (k === "deciders") meta.Author = v;
        else if (k === "title") meta.title = v;
      }
    }
  }
  // 2) markdown header table
  for (const l of lines) {
    const tm = l.match(/^\s*\|\s*\*{0,2}(Status|Date|Author|Supersedes|Superseded)\*{0,2}\s*\|\s*(.*?)\s*\|\s*$/i);
    if (tm) { const k = tm[1][0].toUpperCase() + tm[1].slice(1).toLowerCase(); if (!meta[k]) meta[k] = tm[2].trim(); }
  }
  // 3) bold inline metadata
  for (const l of lines) {
    const bm = l.match(/^\s*\*\*(Status|Date|Author|Supersedes|Superseded)(?::\*\*\s*|\*\*\s*:\s*)(.*)$/i);
    if (bm) { const k = bm[1][0].toUpperCase() + bm[1].slice(1).toLowerCase(); if (!meta[k]) meta[k] = bm[2].trim(); }
  }
  return meta;
}

function normalizeFile(file) {
  const full = path.join(dir, file);
  const text = fs.readFileSync(full, "utf8");
  const lines = text.split("\n");

  // H1
  let h1Idx = lines.findIndex((l) => l.startsWith("# "));
  const num = file.match(/^(\d{4})/)[1];
  let h1 = lines[h1Idx];
  h1 = h1.replace(/^#\s+ADR\s+(\d{4})\s*[:—]\s*/, `# ADR-$1: `)
          .replace(/^#\s+ADR-(\d{4})\s*[—-]\s*/, `# ADR-$1: `);
  if (!/# ADR-\d{4}: /.test(h1)) h1 = `# ADR-${num}: ${h1.replace(/^#\s+/, "")}`;

  const meta = extractMeta(text);
  const STATUS_MAP = { proposed: "Proposed", accepted: "Accepted", deprecated: "Deprecated", superseded: "Superseded" };
  const na = (v) => { const t = (v || "").trim().toLowerCase(); return (t === "n/a" || t === "none" || t === "na" || t === "") ? "None" : v.trim(); };
  const date = meta.Date || gitFirstDate(full) || "2026-07-09";
  const statusRaw = (meta.Status || "Accepted").split(/\s|[\(]/)[0];
  const status = STATUS_MAP[statusRaw.toLowerCase()] || statusRaw || "Accepted";
  const author = meta.Author || "Architecture Review";
  const supersedes = na(meta.Supersedes);
  const superseded = na(meta.Superseded);

  // Find first section (## ) index
  const secIdx = lines.findIndex((l, i) => i > h1Idx && /^##\s+/.test(l));
  const topEnd = secIdx === -1 ? lines.length : secIdx;
  // Clean the top region: drop metadata table rows, bold metadata, stray --- separators
  const top = [];
  for (let i = h1Idx + 1; i < topEnd; i++) {
    const l = lines[i];
    if (/^\s*\|/.test(l)) continue;                       // any table row
    if (/^\s*---\s*$/.test(l)) continue;                  // separator
    if (/^\s*\*\*(Status|Date|Author|Supersedes|Superseded)(?::\*\*\s*|\*\*\s*:\s*)/i.test(l)) continue;
    top.push(l);
  }
  // collapse leading/trailing blank lines in top
  while (top.length && top[0].trim() === "") top.shift();
  while (top.length && top[top.length - 1].trim() === "") top.pop();

  const rest = secIdx === -1 ? [] : lines.slice(secIdx);

  let out = [h1, "",
    "| Key | Value |", "| --- | --- |",
    `| **Status** | ${status} |`, `| **Date** | ${date} |`,
    `| **Author** | ${author} |`, `| **Supersedes** | ${supersedes} |`,
    `| **Superseded** | ${superseded} |`,
    "", "---", ""];
  if (top.length) out = out.concat(top, "");
  out = out.concat(rest);

  let rebuilt = out.join("\n");
  // Strip numbered prefixes from core headings; normalize "Implementation Notes" -> "Implementation"
  rebuilt = rebuilt.replace(/^##\s+\d+\.\s+(Context|Decision|Consequences|Implementation(?:\s+Notes)?|Verification|Anti-Patterns|Related ADRs|References|Alternatives Considered)\b/gm,
    (_, name) => "## " + (name === "Implementation Notes" ? "Implementation" : name));
  // ensure trailing newline
  if (!rebuilt.endsWith("\n")) rebuilt += "\n";
  return rebuilt;
}

const files = fs.readdirSync(dir).filter((f) => /^(\d{4})-.*\.md$/.test(f)).sort();
let changed = 0;
for (const f of files) {
  const rebuilt = normalizeFile(f);
  const cur = fs.readFileSync(path.join(dir, f), "utf8");
  if (rebuilt === cur) continue;
  if (DRY) {
    console.log(`\n========== DRY-RUN CHANGES: ${f} ==========`);
    console.log(rebuilt);
    changed++;
  } else {
    fs.writeFileSync(path.join(dir, f), rebuilt);
    changed++;
  }
}
console.log(`\n${DRY ? "DRY-RUN" : "NORMALIZED"}: ${changed}/${files.length} ADRs would be / were modified.`);
