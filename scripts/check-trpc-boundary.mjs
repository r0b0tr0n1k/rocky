// ADR-0032 guard — the generated tRPC client must NEVER import backend router
// classes. A missing `@Output` schema on any @Query/@Mutation makes nestjs-trpc
// emit `Awaited<ReturnType<RouterClass["method"]>>` and import the backend class
// from apps/api, which breaks `packages/trpc`'s rootDir (TS6059) and creates a
// circular @rocky/trpc <-> apps/api dependency.
//
// This script fails the build if that pattern (or a backend import) is present in
// the generated client. Run it after `pnpm generate:trpc` as a CI gate.
//
// Usage:
//   node scripts/check-trpc-boundary.mjs [path-to-generated-server.ts]
// Gate (regenerate then check):
//   pnpm generate:trpc && pnpm check:trpc-boundary

import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const file = resolve(root, process.argv[2] || "packages/trpc/src/generated/server.ts");

if (!existsSync(file)) {
  console.error(`[fail] generated client not found: ${file}`);
  console.error("       run \`pnpm generate:trpc\` first.");
  process.exit(1);
}

const src = readFileSync(file, "utf8");

// (1) backend-class inference — the TS6059 signature
const returnTypeCount = (src.match(/ReturnType</g) || []).length;

// (2) direct backend-package imports into the transport package
const backendImportRe = /from\s+["']([^"']*(?:apps\/api|@rocky\/api)[^"']*)["']/g;
const backendImports = [...src.matchAll(backendImportRe)].map((m) => m[1]);

let ok = true;
if (returnTypeCount > 0) {
  ok = false;
  console.error(`[fail] ${returnTypeCount} ReturnType< in generated client — a @Query/@Mutation is missing @Output.`);
  console.error("       Each hit = one procedure whose output is inferred from the backend router class,");
  console.error("       forcing packages/trpc to import apps/api source (TS6059 + circular dep).");
  console.error("       Fix: add \`output: <schema>\` to the procedure (see ADR-0032 D1).");
}
if (backendImports.length > 0) {
  ok = false;
  console.error("[fail] backend import(s) detected in generated client:");
  for (const imp of backendImports) console.error(`         from "${imp}"`);
  console.error("       @rocky/trpc must never depend on apps/api (ADR-0032 D2). Fix the missing @Output.");
}

if (!ok) {
  console.error("\nBoundary check FAILED. Regenerate with `pnpm generate:trpc` and re-check.");
  process.exit(1);
}

console.log(`[ok] tRPC boundary clean: 0 ReturnType<, 0 backend imports in ${file}`);
process.exit(0);
