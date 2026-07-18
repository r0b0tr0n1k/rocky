// Side-effect module: load apps/api/.env into process.env BEFORE any module
// that opens a database connection at import time (e.g. `@rocky/database`,
// which constructs its Postgres client from DATABASE_URL at module load) is
// evaluated. Import this FIRST in e2e test files so the env is populated before
// `AppModule` — and thus `@rocky/database` — is imported.
import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(here, "../../.env") });
