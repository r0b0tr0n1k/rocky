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
//                                SHALL NOT  @rocky/database (client/tables, ANY import), @rocky/database/zod
//   packages/geo/*/services       MAY  @rocky/database/constants (Dictionary),
//                                     type-only @rocky/database TYPE imports (carve-out, see NOTE GEO)
//                                SHALL NOT  @rocky/database VALUE imports (client/tables/functions), @rocky/database/zod
//   packages/domains/*/repositories  MAY  @rocky/database, @rocky/database/zod, @rocky/domains-shared
//                                    SHALL NOT  @rocky/validators/api, @rocky/validators/events (RESERVED)
//   apps/api/src/routers          MAY  @rocky/validators/api, /enums, /errors, @rocky/trpc, domain services
//                                SHALL NOT  @rocky/database (ANY subpath), @rocky/database/zod,
//                                           @rocky/validators/events (RESERVED), @rocky/validators/integrations (RESERVED)
//
// NOTE GEO: geo services may type-import @rocky/database types (e.g. `Coordinate`,
// `PolygonGeometry`) because the foundational `geofences` schema owns `GeofenceGeometry`,
// which depends on the shared coordinate type, and `@rocky/database` CANNOT depend on
// `@rocky/geo` (that would invert the dependency arrow into a cycle). Value imports of
// @rocky/database from geo services are still forbidden — the WKT helpers were relocated
// to @rocky/geo (WO-161).
//
// Cross-cutting packages not in the matrix (execution, validators, database, trpc) are
// out of scope here — their imports are observations for a future matrix extension.
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
const SERVICE_RE = /\/packages\/(domains|geo)\/[^/]+\/src\/services\/.*\.ts$/;
const REPO_RE = /\/packages\/domains\/[^/]+\/src\/repositories\/.*\.ts$/;
const ROUTER_RE = /\/apps\/api\/src\/routers\/.*\.ts$/;
const TEST_RE = /\.test\.ts$|\.spec\.ts$|\.workflow\.test\.ts$/;
// static import (captures `type` keyword + spec); dynamic import() is treated as value
const LINE_IMPORT_RE =
  /^\s*import\s+(type\s+)?(?:[\s\S]*?)\s+from\s+["']([^"']+)["']\s*;?\s*$/;
const DYN_IMPORT_RE = /import\s*\(\s*["']([^"']+)["']\s*\)/g;

const isAllowedDb = (spec) =>
  spec === "@rocky/database/constants" ||
  spec.startsWith("@rocky/database/constants/");

function walk(dir, out) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".git" || entry === "dist")
      continue;
    const p = resolve(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith(".ts") && !TEST_RE.test(p)) out.push(p);
  }
}

let files;
if (override) {
  const op = resolve(root, override);
  if (!existsSync(op)) {
    console.error(`[fail] path not found: ${op}`);
    process.exit(1);
  }
  files = [];
  if (statSync(op).isDirectory()) walk(op, files);
  else files = [op];
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
  const isGeoService = isService && rel.includes("/packages/geo/");
  const lines = readFileSync(f, "utf8").split("\n");
  for (const line of lines) {
    const m = LINE_IMPORT_RE.exec(line);
    if (m) {
      const isTypeOnly = !!m[1];
      const spec = m[2];
      if (!spec.startsWith("@rocky/")) continue;
      if (isService) {
        // row 360 / geo carve-out: SHALL NOT import @rocky/database except /constants.
        // geo services MAY type-import @rocky/database types (carve-out, NOTE GEO).
        if (spec.startsWith("@rocky/database") && !isAllowedDb(spec)) {
          if (isTypeOnly && isGeoService) continue; // allowed carve-out
          violations.push({
            rel,
            spec,
            rule: isGeoService
              ? "Annex C geo row: geo service must not value-import @rocky/database (type-only is the carve-out)"
              : "Annex C row 360: domain service must not import @rocky/database (except /constants)",
          });
        }
      }
      if (isRepo) {
        if (
          spec === "@rocky/validators/api" ||
          spec.startsWith("@rocky/validators/api/") ||
          spec === "@rocky/validators/events" ||
          spec.startsWith("@rocky/validators/events/")
        ) {
          violations.push({
            rel,
            spec,
            rule: "Annex C row 359: domain repository must not import @rocky/validators/api or /events",
          });
        }
      }
      if (isRouter) {
        if (spec.startsWith("@rocky/database")) {
          violations.push({
            rel,
            spec,
            rule: "Annex C router row: router must not import @rocky/database (any subpath)",
          });
        }
      }
      continue;
    }
    // dynamic import() — treated as value import
    let dm;
    DYN_IMPORT_RE.lastIndex = 0;
    while ((dm = DYN_IMPORT_RE.exec(line))) {
      const spec = dm[1];
      if (!spec.startsWith("@rocky/")) continue;
      if (
        isService &&
        spec.startsWith("@rocky/database") &&
        !isAllowedDb(spec)
      ) {
        violations.push({
          rel,
          spec,
          rule: isGeoService
            ? "Annex C geo row: geo service must not value-import @rocky/database"
            : "Annex C row 360: domain service must not import @rocky/database (except /constants)",
        });
      }
      if (isRouter && spec.startsWith("@rocky/database")) {
        violations.push({
          rel,
          spec,
          rule: "Annex C router row: router must not import @rocky/database (any subpath)",
        });
      }
    }
  }
}

if (violations.length) {
  console.error(
    `[fail] Visa Matrix (Annex C) violated — ${violations.length} import(s):`,
  );
  for (const v of violations)
    console.error(`  ${v.rel}\n    imports ${v.spec}  —  ${v.rule}`);
  process.exit(1);
}
console.log(
  `[ok] Visa Matrix clean: 0 layer-boundary violations across ${files.length} scanned source files (scope: packages/{domains,geo}/*/services + packages/domains/*/repositories + apps/api/src/routers)`,
);
