#!/usr/bin/env node
// scripts/check-shadcn-primitives.mjs
//
// Shadcn primitive-hygiene guardian (Wave D of the 2026-07-19 audit).
//
// Fails if a hand-rolled component under apps/web/components/** duplicates a
// primitive that already ships in @rocky/ui (packages/ui/src/components/**).
// Reuse the package primitives via the #components/shared/* passthroughs
// (shared/button.tsx, shared/tabs.tsx, ...) instead of re-implementing
// them in the app shell — that is the A-1 finding this guard locks in.
//
// Intentional re-export passthroughs are allowlisted so the guardian stays
// green on the sanctioned design-system files.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

const uiCompsDir = path.join(root, "packages/ui/src/components");
const webCompsDir = path.join(root, "apps/web/components");

function primitiveNames(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() || /\.(ts|tsx)$/.test(d.name))
    .map((d) => d.name.replace(/\.(ts|tsx)$/, ""));
}

const uiPrimitives = new Set(primitiveNames(uiCompsDir));

// Intentional passthroughs that re-export a @rocky/ui primitive for the
// #components alias — these legitimately share a basename with the package.
const ALLOW = new Set([path.join(webCompsDir, "shared/button.tsx"), path.join(webCompsDir, "shared/tabs.tsx")]);

const violations = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      walk(full);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(e.name)) continue;
    const base = e.name.replace(/\.(ts|tsx)$/, "");
    if (uiPrimitives.has(base) && !ALLOW.has(path.resolve(full))) {
      violations.push(path.relative(root, full));
    }
  }
}
walk(webCompsDir);

if (violations.length) {
  console.error("[fail] hand-rolled components duplicate @rocky/ui primitives:");
  for (const v of violations) console.error("  - " + v);
  console.error("\nReuse @rocky/ui primitives via #components/shared/* passthroughs instead of re-implementing them.");
  process.exit(1);
}

console.log(
  `[ok] shadcn hygiene clean: 0 hand-rolled duplicates of ${uiPrimitives.size} @rocky/ui primitives under apps/web/components`,
);
process.exit(0);
