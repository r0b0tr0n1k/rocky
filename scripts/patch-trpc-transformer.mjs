// Post-generate patch: inject `transformer: superjson` into the generated
// nestjs-trpc `server.ts` files.
//
// Why this exists:
//   nestjs-trpc@2.12.0's `generate` emits `initTRPC.create()` with NO transformer.
//   In @trpc/server v11 the `AppRouter` type then carries a phantom transformer
//   (`TypeError<"You must define a transformer...">`), so the v11 client links
//   (`httpBatchLink({ transformer: superjson })`) fail to type-check.
//   The server runtime is fine (TRPCModule.forRoot applies the transformer via
//   the driver), but the generated TYPE needs the transformer declared.
//
//   There is no nestjs-trpc config flag and no newer release that emits it, so we
//   inject it mechanically after every `nestjs-trpc generate`. This mirrors the
//   repo's other post-processing scripts (fix-rls-sql.mjs, dumb-zod-transform.mjs).
//
// Idempotent: safe to run repeatedly; only touches files still on the no-arg form.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const TARGETS = [
  "packages/trpc/src/generated/server.ts",
];

const IMPORT_RE = /import\s+\{\s*initTRPC\s*\}\s+from\s+["']@trpc\/server["'];?/;
const SUPERJSON_IMPORT = 'import superjson from "superjson";';
const NO_ARG_CREATE = /const\s+t\s*=\s*initTRPC\.create\(\)\s*;?/;
const PATCHED_CREATE = "const t = initTRPC.create({ transformer: superjson });";

let changed = 0;
let skipped = 0;

for (const rel of TARGETS) {
  const file = resolve(root, rel);
  let src;
  try {
    src = readFileSync(file, "utf8");
  } catch {
    console.warn(`[skip] not found: ${rel}`);
    skipped++;
    continue;
  }

  let out = src;
  let fileChanged = false;

  // --- superjson transformer injection (idempotent) ---
  if (!/initTRPC\.create\(\s*\{\s*transformer\s*:/.test(out)) {
    if (!NO_ARG_CREATE.test(out)) {
      console.warn(`[skip] unexpected initTRPC.create form in ${rel}`);
      skipped++;
      continue;
    }
    out = out.replace(NO_ARG_CREATE, PATCHED_CREATE);
    if (!/import\s+superjson\s+from\s+["']superjson["'];?/.test(out)) {
      out = out.replace(IMPORT_RE, (m) => `${m}\n${SUPERJSON_IMPORT}`);
    }
    fileChanged = true;
  }

  if (fileChanged) {
    writeFileSync(file, out);
    changed++;
    console.log(`[patched] ${rel}`);
  } else {
    skipped++;
  }
}

console.log(`\nnestjs-trpc transformer patch: ${changed} patched, ${skipped} skipped.`);
