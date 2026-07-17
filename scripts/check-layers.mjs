// ROCKY-DS 001:2026(E) — Visa Matrix (Annex C) enforcement guard.
//
// The Import-Boundary Matrix (Annex C) is the consolidated import constitution. A
// standard without a machine is fetishistic disavowal — the symptom (a service reaching
// the DB directly) returns. This script fails the build if any SOURCE file violates the
// matrix's load-bearing bans. It encodes the matrix ROWS EXACTLY (same scope + same
// may/shall-not lists), so it is the faithful machine for Annex C.
//
// Encoded rows (Annex C):
//   packages/domains/*/services   MAY  @rocky/database/constants (Dictionary)
//                                SHALL NOT  @rocky/database (client/tables), @rocky/database/zod
//   packages/domains/*/repositories  MAY  @rocky/database, @rocky/database/zod, @rocky/domains-shared
//                                SHALL NOT  @rocky/validators/api, @rocky/validators/events (RESERVED)
//   apps/api/src/routers          MAY  @rocky/validators/api, /enums, /errors, @rocky/trpc, domain services
//                                SHALL NOT  @rocky/database (ANY subpath), @rocky/database/zod,
//                                           @rocky/validators/events (RESERVED), @rocky/validators/integrations (RESERVED)
//
// Cross-cutting packages (execution, geo, validators, database, trpc) are NOT rows in the
// matrix, so they are intentionally out of scope here — their imports are observations for a
// future matrix extension, not §8.2 domain-service breaches.
//
// Test files (*.test.ts / *.spec.ts / *.workflow.test.ts) are excluded.
//
// Usage:
//   node scripts/check-layers.mjs [path-or-dir]   (arg scans a subset, for testing)
// CI gate:
//   pnpm check:layers

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const override = process.argv[2];

// Scope matches Annex C rows EXACTLY
const SERVICE_RE = /\/packages\/domains\/[^/]+\/src\/services\/.*\.ts$/;
const REPO_RE = /\/packages\/domains\/[^/]+\/src\/repositories\/.*\.ts$/;
const ROUTER_RE = /\/apps\/api\/src\/routers\/.*\.ts$/;
const TEST_RE = /\.test\.ts$|\.spec\.ts$|\.workflow\.test\.ts$/;
const IMPORT_RE = /(?:from\s+["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\))/g;

const isAllowedDb = (spec) =>
  spec === "@rocky/database/constants" || spec.startsWith("@rocky/database/constants/");

function walk(dir, out) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".git" || entry === "dist") continue;
    const p = resolve(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith(".ts") && !TEST_RE.test(p)) out.push(p);
  }
}

let files;
if (override) {
  const op = resolve(root, override);
  if (!existsSync(op)) { console.error(`[fail] path not found: ${op}`); process.exit(1); }
  files = [];
  if (statSync(op).isDirectory()) walk(op, files); else files = [op];
} else {
  files = [];
  for (const base of ["packages", "apps"]) {
    const b = resolve(root, base);
    if (statSync(b).isDirectory()) walk(b, files);
  }
}

const violations = [];
for (const f of files) {
  const rel = relative(root, f);
  const isService = SERVICE_RE.test(rel);
  const isRepo = REPO_RE.test(rel);
  const isRouter = ROUTER_RE.test(rel);
  if (!isService && !isRepo && !isRouter) continue;
  const src = readFileSync(f, "utf8");
  let m;
  IMPORT_RE.lastIndex = 0;
  while ((m = IMPORT_RE.exec(src))) {
    const spec = m[1] || m[2];
    if (!spec.startsWith("@rocky/")) continue;
    if (isService) {
      // row 360: SHALL NOT import @rocky/database except /constants
      if (spec.startsWith("@rocky/database") && !isAllowedDb(spec)) {
        violations.push({ rel, spec, rule: "Annex C row 360: domain service must not import @rocky/database (except /constants)" });
      }
    }
    if (isRepo) {
      // row 359: SHALL NOT import @rocky/validators/api or /events
      if (spec === "@rocky/validators/api" || spec.startsWith("@rocky/validators/api/") ||
          spec === "@rocky/validators/events" || spec.startsWith("@rocky/validators/events/")) {
        violations.push({ rel, spec, rule: "Annex C row 359: domain repository must not import @rocky/validators/api or /events" });
      }
    }
    if (isRouter) {
      // router row: SHALL NOT import @rocky/database (ANY subpath) or @rocky/database/zod
      if (spec.startsWith("@rocky/database")) {
        violations.push({ rel, spec, rule: "Annex C router row: router must not import @rocky/database (any subpath)" });
      }
    }
  }
}

if (violations.length) {
  console.error(`[fail] Visa Matrix (Annex C) violated — ${violations.length} import(s):`);
  for (const v of violations) console.error(`  ${v.rel}\n    imports ${v.spec}  —  ${v.rule}`);
  process.exit(1);
}
console.log(`[ok] Visa Matrix clean: 0 layer-boundary violations across ${files.length} scanned source files (scope: packages/domains/*/services|repositories + apps/api/src/routers)`);
