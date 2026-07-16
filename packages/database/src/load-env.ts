// Loads the database connection env from a single source.
//
// Preference order:
//   1. packages/database/.env   (package-local, used in dev / when present)
//   2. <repo-root>/.env          (fallback when the package-local file is absent)
//
// This guarantees `seed` / `stress-seed` resolve DATABASE_URL even if only the
// root .env exists. Runs at import time (side-effect) so it is applied before
// `./index.js` reads `process.env.DATABASE_URL!`.

import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url)); // packages/database/src
const pkgRoot = resolve(here, ".."); // packages/database
const repoRoot = resolve(here, "../.."); // repo root

const localEnv = resolve(pkgRoot, ".env");
const rootEnv = resolve(repoRoot, ".env");

if (existsSync(localEnv)) {
  loadEnv({ path: localEnv, override: true });
} else if (existsSync(rootEnv)) {
  loadEnv({ path: rootEnv, override: true });
}
