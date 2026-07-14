# Root .env Validator + Compose Hygiene Fixes

**Scope:** `docker-compose.yml`, `apps/docs/content/runbooks/env-config.mdx`, `scripts/`, `.env.example`
**Out of scope:** Adding `cloudflared` service, changing Cloudflare tunnel infrastructure
**Trigger:** User confirmed "OK, but i dont need claudflared here"

---

## Current State

`docker-compose.yml` and `apps/api/src/config.ts` have a cluster of env-var problems:
1. **docs port mismatch** — `docker-compose.yml` maps `3041:3000` but `apps/docs/Dockerfile` exposes/runs on **3002**
2. **`AUTH_BASE_URL` dead in `web`** — compose injects it into the `web` service env, but `apps/web/lib/auth-client.ts` never reads it
3. **`AUTH_BASE_URL` dead in `api`** — `config.ts` zod schema declares it required, but the parse object hardcodes `baseUrl: baseServiceUrl` and never reads `process.env.AUTH_BASE_URL`
4. **`MAPTILER_API_KEY` fragile interpolation** — compose bridges `${NEXT_PUBLIC_MAPTILER_API_KEY}` from root `.env`, but the runbook says the key lives in `apps/web/.env`; compose auto-loads only root `.env`, so the api container gets an empty string if the key is only in `apps/web/.env`
5. **No root-`.env` validation** — a missing or malformed root `.env` only fails at compose interpolation time with a generic error; there is no Zod gate

---

## Task 1 — Fix `docker-compose.yml` port mapping

**File:** `docker-compose.yml`

Change line 124:
```
- "3041:3000"
```
to:
```
- "3041:3002"
```

**Rationale:** `apps/docs/Dockerfile` line 42-43 runs `next start --port 3002` and `EXPOSE 3002`. The current mapping sends traffic to port 3000 inside the container, where nothing is listening. `setup-tunnel.sh` already routes to `http://docs:3002`, so the tunnel side was correct; only the compose port binding was wrong.

---

## Task 2 — Remove dead `AUTH_BASE_URL` from `web` service

**File:** `docker-compose.yml`

Remove line 110-111 from the `web` service environment block:
```yaml
      # Public base URL of the auth server (Cloudflare admin domain)
      - AUTH_BASE_URL=${AUTH_BASE_URL:-https://admin.techno.party}
```

**Rationale:** `apps/web/lib/auth-client.ts` uses `process.env.NEXT_PUBLIC_API_URL` (a build arg, frozen at image-build time). The `web` container never reads `AUTH_BASE_URL`. Keeping it in compose is misleading and creates the false impression that it controls auth cookie behavior.

---

## Task 3 — Fix `config.ts` to honor `AUTH_BASE_URL` (or remove the zod requirement)

**File:** `apps/api/src/config.ts`

Replace lines 22-30 and 59-61:

```ts
  auth: z.object({
    baseUrl: z.string().min(1, "AUTH_BASE_URL is required"),
    google: z
      .object({
        clientId: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
        clientSecret: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
      })
      .optional(),
  }),
```

and:

```ts
  auth: {
    baseUrl: baseServiceUrl,
```

with:

```ts
  auth: z.object({
    baseUrl: z.string().min(1, "AUTH_BASE_URL or BETTER_AUTH_URL is required"),
    google: z
      .object({
        clientId: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
        clientSecret: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
      })
      .optional(),
  }),
```

and:

```ts
  auth: {
    baseUrl: process.env.AUTH_BASE_URL || process.env.BETTER_AUTH_URL || baseServiceUrl,
```

**Rationale:** The zod schema says `AUTH_BASE_URL is required`, but the code ignores it and falls back to `baseServiceUrl`. The env var `AUTH_BASE_URL` is set in compose and documented in `.env.example` and the runbook, so it should actually be wired. The fallback chain `AUTH_BASE_URL → BETTER_AUTH_URL → baseServiceUrl` preserves backward compatibility while making the documented env var functional. The error message is updated to reflect the fallback chain.

Also update the compose `api` service comment for `AUTH_BASE_URL` (line 75-76) to say it is now actually used, and remove the misleading comment on `web` (already removed in Task 2).

---

## Task 4 — Fix `MAPTILER_API_KEY` sourcing in compose + runbook

**File:** `docker-compose.yml` line 83-87

Change the comment to make the sourcing explicit:
```yaml
      # MapTiler key: api generates server-side maps/geocoding.
      # Must be set in root .env (compose auto-loads only root .env).
      # apps/web/.env NEXT_PUBLIC_MAPTILER_API_KEY is for the browser bundle;
      # duplicate the value here as MAPTILER_API_KEY for the api container.
      - MAPTILER_API_KEY=${NEXT_PUBLIC_MAPTILER_API_KEY}
```

**File:** `apps/docs/content/runbooks/env-config.mdx` lines 124-126

Change the secrets hygiene table row:
```markdown
| `NEXT_PUBLIC_MAPTILER_API_KEY` | `apps/web/.env` (browser) + **root `.env`** (compose → api container) | MapTiler dashboard |
| `MAPTILER_API_KEY` | root `.env` (aliased from `NEXT_PUBLIC_MAPTILER_API_KEY` in compose) | same MapTiler key as above |
```

**Rationale:** Compose only auto-loads the root `.env`. If `NEXT_PUBLIC_MAPTILER_API_KEY` is set only in `apps/web/.env`, the api container receives an empty string for `MAPTILER_API_KEY` and crashes at boot with `GEO_MAP_PROVIDER_UNCONFIGURED`. The runbook must tell operators to set the key in both places (or at minimum in root `.env`).

---

## Task 5 — Create root `.env` Zod schema

**File:** `scripts/root-env.schema.ts` (new)

```ts
import { z } from "zod";

export const rootEnvSchema = z.object({
  ROCKY_DOMAIN: z.string().min(1, "ROCKY_DOMAIN is required (e.g. techno.party)"),
  POSTGRES_PASSWORD: z.string().min(1, "POSTGRES_PASSWORD is required"),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  TUNNEL_TOKEN: z.string().optional(),
  DRIZZLE_MASTER_PASS: z.string().min(1, "DRIZZLE_MASTER_PASS is required for Drizzle Studio"),
  DB_HOST: z.string().default("db"),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_USER: z.string().default("tbot"),
  NEXT_PUBLIC_MAPTILER_API_KEY: z.string().optional(),
  WEB_PUBLIC_API_URL: z.string().url().optional().default("https://api.techno.party"),
  AUTH_BASE_URL: z.string().url().optional().default("https://admin.techno.party"),
  CORS_ORIGINS: z.string().optional().default("https://admin.techno.party"),
  TRUSTED_ORIGINS: z.string().optional().default("https://admin.techno.party,mobile://"),
  BETTER_AUTH_URL: z.string().url().optional().default("https://api.techno.party"),
  AUTH_COOKIE_DOMAIN: z.string().optional(),
  VERSION: z.string().default("production"),
  ENVIRONMENT: z.string().default("production"),
  NODE_ENV: z.string().default("production"),
});

export type RootEnv = z.infer<typeof rootEnvSchema>;
```

**Rationale:** This schema captures every var that `docker-compose.yml` interpolates. Required vars have `.min(1)` guards. `DB_HOST`, `DB_PORT`, `DB_USER` have defaults matching the compose fallbacks. URL fields use `.url()` to catch typos. `TUNNEL_TOKEN` is optional because the stack can run without a tunnel (local dev with published ports). The schema is a plain Zod object — no `satisfies` ceremony, just a clean parse target.

---

## Task 6 — Implement the validator script

**File:** `scripts/check-root-env.mjs` (new)

```js
#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { createEnv } from "dotenv";
import { rootEnvSchema } from "./root-env.schema.ts";

function loadRootEnv() {
  if (!existsSync(".env")) {
    console.error("ERROR: .env not found at repo root. Copy .env.example to .env and fill secrets.");
    process.exit(1);
  }
  createEnv({ path: ".env" });
  const raw = {};
  const lines = readFileSync(".env", "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    value = value.replace(/^["']|["']$/g, "");
    raw[key] = value;
  }
  return raw;
}

function main() {
  const raw = loadRootEnv();
  const result = rootEnvSchema.safeParse(raw);
  if (!result.success) {
    console.error("ERROR: Root .env validation failed:\n");
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      console.error(`  ${path}: ${issue.message}`);
    }
    process.exit(1);
  }
  const env = result.data;
  const warnings = [];
  if (env.TUNNEL_TOKEN && env.TUNNEL_TOKEN.startsWith("change_me")) {
    warnings.push("TUNNEL_TOKEN looks like a placeholder — run scripts/setup-tunnel.sh to generate a real token.");
  }
  if (warnings.length) {
    console.warn("WARNINGS:");
    for (const w of warnings) console.warn(`  - ${w}`);
  }
  console.log(`OK: root .env validates (${Object.keys(env).filter(k => env[k] !== undefined && env[k] !== "").length} vars set).`);
}

main();
```

**Rationale:** 
- Uses `dotenv` to load `.env` so `${VAR}` references resolve (compose also interpolates these).
- Then re-reads the raw file to get the literal strings (so `MAPTILER_API_KEY=${NEXT_PUBLIC_MAPTILER_API_KEY}` is validated as the literal interpolation expression, which Zod will flag as a non-url if the field is a URL field — this is intentional: the schema documents that `MAPTILER_API_KEY` should be set explicitly, not interpolated).
- `safeParse` gives field-level errors, not a stack trace.
- Placeholder detection (`change_me_*`) gives soft warnings for `.env.example` copy-paste errors.

**Adjustment for interpolation fields:** `MAPTILER_API_KEY` is not in the root schema — it is derived in compose. The validator should check that if `NEXT_PUBLIC_MAPTILER_API_KEY` is set in root `.env`, it is non-empty. The current schema already covers `NEXT_PUBLIC_MAPTILER_API_KEY` as optional but non-empty if present.

---

## Task 7 — Wire into `package.json` scripts

**File:** root `package.json`

Add to `scripts`:
```json
"check:root-env": "node --import tsx scripts/check-root-env.mjs"
```

**Rationale:** Follows the existing pattern (`check:adrs`, `check:md-links`, `check:agents` all run plain `.mjs` with `--import tsx`). This makes the validator composable with `pnpm ci:checks` if desired later.

---

## Task 8 — Update `.env.example` to match schema

**File:** `.env.example`

Ensure every key in `rootEnvSchema` is documented in `.env.example` with a comment. The current `.env.example` already covers most vars. Additions needed:
- Document `DB_USER=tbot` explicitly (it exists in the file but the schema defaults it)
- Add a comment that `NEXT_PUBLIC_MAPTILER_API_KEY` must also appear in root `.env` for compose (Task 4 already covers this in the runbook; add a cross-reference comment in `.env.example` near the key)

No keys should be removed from `.env.example` — only comments added where the schema’s default/requirement differs from the current documentation.

---

## Task 9 — Update `env-config.mdx`

**File:** `apps/docs/content/runbooks/env-config.mdx`

Changes:
1. **Line 42** — Add a sentence: "Root `.env` can be validated before `docker compose up`: `pnpm check:root-env`."
2. **Line 124-126** — Fix the secrets hygiene table (Task 4).
3. **Line 166-173** — Add a new troubleshooting row:
   ```
   | API exits: `GEO_MAP_PROVIDER_UNCONFIGURED` | `MAPTILER_API_KEY` empty in api container | Set `NEXT_PUBLIC_MAPTILER_API_KEY` in **root** `.env` (compose auto-loads only root `.env`) |
   ```
4. **Line 171** — The `AUTH_COOKIE_DOMAIN` row is correct; no change needed. The derivation from `ROCKY_DOMAIN` is already documented correctly in the code comments.

---

## Task 10 — Verify port bindings are conflict-free

The current compose publishes:
- `5432` (db)
- `8080` (api)
- `3050` (web)
- `3041` (docs)
- `4983` (drizzle-studio, dev profile only)

None of these collide. The **internal** ports are:
- `db`: 5432
- `api`: 8080
- `web`: 3000 (correct, matches Dockerfile EXPOSE)
- `docs`: **will be 3002 after Task 1** (matches Dockerfile EXPOSE)
- `drizzle-studio`: 4983

No service binds to 3001. If the user’s concern about “ports 3001 could be taken” refers to a host-level conflict, that is outside the compose file’s control — the fix is to use `docker compose --project-directory` or change host-side ports. No code change needed unless the user specifies a collision.

---

## Validation

1. `pnpm check:root-env` passes against a valid `.env`
2. `pnpm check:root-env` fails with clear field-level errors against a `.env` missing `ROCKY_DOMAIN`, `POSTGRES_PASSWORD`, or `BETTER_AUTH_SECRET`
3. `pnpm check:root-env` warns when `TUNNEL_TOKEN` is a placeholder
4. `docker compose config` succeeds after Task 1 (port fix)
5. `pnpm ci:checks` remains green (no new lint/typecheck failures from `scripts/check-root-env.mjs`)

---

## Rollout Order

1. Task 1 (docs port fix) — 1 line, zero risk
2. Task 2 (remove dead `AUTH_BASE_URL` from web) — dead code removal
3. Task 3 (wire `AUTH_BASE_URL` in `config.ts`) — behavior change, must verify `auth.ts` fallback chain
4. Task 4 (MAPTILER_API_KEY docs)
5. Tasks 5-7 (schema + script + package.json) — new files, no existing behavior touched
6. Task 8 (`.env.example` comments)
7. Task 9 (runbook update)

---

## Risks

- **Task 3 changes `config.ts` baseUrl resolution**: if any code reads `appConfig.auth.baseUrl` expecting it to equal `baseServiceUrl`, the new fallback to `AUTH_BASE_URL` or `BETTER_AUTH_URL` could change behavior. Mitigation: grep for `appConfig.auth.baseUrl` before editing.
- **Task 5 schema is strict about URLs**: if any existing `.env` has `AUTH_BASE_URL=http://...` (http, not https) for local dev, the `.url()` validator will reject it. Mitigation: use `.url()` or make it `.string()` for local-dev flexibility; recommend `.url()` with a note that local dev should use `http://localhost:...` which passes `.url()`.
