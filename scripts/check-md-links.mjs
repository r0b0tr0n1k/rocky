#!/usr/bin/env node
// Validate that every internal Markdown link in apps/docs/content resolves to a
// real file (Nextra converts relative MD links to <Link>; a missing target 404s).
// Also checks _meta.ts nav keys resolve to a page. Warns on links that escape
// the content root (Nextra won't serve them) and on missing #anchors.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(import.meta.url), "../..");
const CONTENT = path.join(root, "apps/docs/content");
const MD_EXT = new Set([".md", ".mdx", ".markdown"]);
const SKIP_SCHEME = /^(https?:|mailto:|tel:|data:|#|\/\/)/i;

const allFiles = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (MD_EXT.has(path.extname(e.name).toLowerCase())) allFiles.push(p);
  }
})(CONTENT);

function exists(p) { try { fs.accessSync(p); return true; } catch { return false; } }

// Resolve a target string to candidate absolute file paths within CONTENT.
function candidates(baseDir, target) {
  const hashIdx = target.search(/[?#]/);
  const pathPart = (hashIdx === -1 ? target : target.slice(0, hashIdx)).replace(/\/+$/, "") || ".";
  let abs;
  if (pathPart.startsWith("/")) abs = path.join(CONTENT, pathPart);
  else abs = path.resolve(baseDir, pathPart);
  const ext = path.extname(abs).toLowerCase();
  const c = [abs];
  if (!MD_EXT.has(ext)) {
    c.push(abs + ".mdx", abs + ".md", path.join(abs, "index.mdx"), path.join(abs, "index.md"));
  } else if (ext === ".md") c.push(abs.slice(0, -3) + ".mdx");
  else if (ext === ".mdx") c.push(abs.slice(0, -4) + ".md");
  return c;
}

function slugify(h) { return h.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-"); }

const broken = [];
const warns = [];
const inlineRe = /(?<!!)\]\((\/[^)\s]*|[^)\s]*)\)/g;        // [text](url)
const refDefRe = /^\s{0,3}\[([^\]\s]+)\]:\s*(\S+)/;          // [ref]: url
const refUseRe = /\[[^\]]+\]\[([^\]]+)\]/g;                   // [text][ref]

for (const f of allFiles) {
  const text = fs.readFileSync(f, "utf8");
  const dir = path.dirname(f);
  const lines = text.split("\n");
  const refDefs = {};
  // headings for anchor checks
  const headingSlugs = new Set();
  for (const ln of lines) {
    const h = ln.match(/^#{1,6}\s+(.*?)\s*#*\s*$/);
    if (h) headingSlugs.add(slugify(h[1]));
  }
  // Skip fenced code blocks (``` ... ```): they hold code, not MD links.
  const skip = new Array(lines.length).fill(false);
  { let inFence = false;
    for (let i = 0; i < lines.length; i++) {
      if (/^\s*```/.test(lines[i])) { inFence = !inFence; skip[i] = true; continue; }
      if (inFence) skip[i] = true; } }
  lines.forEach((ln, i) => {
    if (skip[i]) return;
    const rd = ln.match(refDefRe);
    if (rd) refDefs[rd[1].toLowerCase()] = rd[2];
    let m;
    inlineRe.lastIndex = 0;
    while ((m = inlineRe.exec(ln))) {
      const raw = m[1];
      const pre = ln.slice(0, m.index);
      if ((pre.match(/`/g) || []).length % 2 === 1) continue; // inside inline-code span -> not a real link
      if (SKIP_SCHEME.test(raw)) continue;
      const anchor = raw.includes("#") ? raw.slice(raw.indexOf("#") + 1) : "";
      const cands = candidates(dir, raw);
      const hit = cands.find(exists);
      const within = cands.some((c) => c.startsWith(CONTENT));
      if (!hit) broken.push({ f, line: i + 1, raw });
      else {
        if (!within) warns.push({ f, line: i + 1, raw, kind: "escapes-content-root" });
        if (anchor && !headingSlugs.has(slugify(anchor)))
          warns.push({ f, line: i + 1, raw, kind: `missing-anchor #${anchor}` });
      }
    }
  });
  // reference-style uses
  let r;
  refUseRe.lastIndex = 0;
  lines.forEach((ln, i) => {
    if (skip[i]) return;
    let m;
    refUseRe.lastIndex = 0;
    while ((m = refUseRe.exec(ln))) {
      const preR = ln.slice(0, m.index);
      if ((preR.match(/\`/g) || []).length % 2 === 1) continue; // inside inline-code span -> not a real link
      const def = refDefs[m[1].toLowerCase()];
      if (!def) { warns.push({ f, line: i + 1, raw: m[0], kind: "undefined-ref" }); continue; }
      if (SKIP_SCHEME.test(def)) continue;
      const cands = candidates(dir, def);
      if (!cands.find(exists)) broken.push({ f, line: i + 1, raw: def });
    }
  });
}

// _meta.ts nav-key -> page existence
const metaWarns = [];
for (const f of walkMeta(CONTENT)) {
  const dir = path.dirname(f);
  const txt = fs.readFileSync(f, "utf8");
  const keyRe = /['"]([^'"]+)['"]\s*:/g;
  let m;
  while ((m = keyRe.exec(txt))) {
    const k = m[1];
    if (k === "..." || k === "index" || k.startsWith("-") || k.includes("/") || k.startsWith("*") || /separator/.test(txt.slice(m.index, m.index + 140))) continue;
    const ok = exists(path.join(dir, k + ".mdx")) || exists(path.join(dir, k + ".md")) ||
      exists(path.join(dir, k, "index.mdx")) || exists(path.join(dir, k, "index.md")) ||
      fs.existsSync(path.join(dir, k)) && fs.statSync(path.join(dir, k)).isDirectory();
    if (!ok) metaWarns.push({ f, key: k });
  }
}
function* walkMeta(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) yield* walkMeta(p);
    else if (e.name === "_meta.ts") yield p;
  }
}

const rel = (p) => path.relative(root, p);
console.log(`\nScanned ${allFiles.length} MD/MDX files under apps/docs/content\n`);
if (broken.length) {
  console.log(`✗ ${broken.length} BROKEN internal link(s):`);
  for (const b of broken) console.log(`  ${rel(b.f)}:${b.line}  ->  ${b.raw}`);
} else console.log("✓ No broken internal links.");
if (warns.length) {
  console.log(`\n⚠ ${warns.length} warning(s):`);
  const seen = new Set();
  for (const w of warns) { const k = `${rel(w.f)}:${w.line}:${w.kind}`; if (seen.has(k)) continue; seen.add(k);
    console.log(`  ${rel(w.f)}:${w.line}  [${w.kind}]  ${w.raw}`); }
}
if (metaWarns.length) {
  console.log(`\n⚠ ${metaWarns.length} _meta.ts key(s) with no matching page:`);
  for (const m of metaWarns) console.log(`  ${rel(m.f)}  key="${m.key}"`);
}
console.log("");
process.exit(broken.length ? 1 : 0);
