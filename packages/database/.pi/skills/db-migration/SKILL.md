---
name: db-migration
description: Database Bot migration workflow for @rocky/database — Drizzle generate, RLS placeholder fix, apply, seed. Use when asked to "add a migration", "change the schema", "generate drizzle", "fix RLS policy SQL", "run db-recreate".
---

# Database Migration Workflow (@rocky/database)

Use this whenever a schema change touches `packages/database`.

## Iterative migration (no DB drop)

```bash
cd packages/database
pnpm generate                       # emit SQL migration (drizzle-kit v1.0.0-rc.4)
node ../../scripts/fix-rls-sql.mjs  # post-process: replace $N placeholders with role strings, resolve ${...} templates
psql "$DATABASE_URL" -f drizzle/*/migration.fixed.sql   # apply the fixed SQL
pnpm seed                           # re-seed (idempotent)
```

## Full reset

```bash
./scripts/db-recreate.sh           # drop DB, regenerate, seed
```

## Rules (Database Bot contract)

- Every tenant-scoped `pgTable` gets a `pgPolicy()` for RLS. Auth tables have NO `tenant_id` (Global Identity Model).
- Enum chain: `constants/` → `schemas/enums/` (pgEnum) → `validators/enums/` (zEnum).
- Dumb Zod in `zod/` has NO `.strict()` / `.omit()` / `.extend()`.

## Known pitfall: drizzle-kit v1.0.0-rc.4

- `push` fails with "Interactive prompts require a TTY" in non-interactive shells → prefer `generate` + `psql`.
- `generate` emits `$1` / `$2` placeholders in RLS policies instead of literal role strings → `fix-rls-sql.mjs` resolves them.
- `${isRoleIn(...)}` / `${table.xxx}` template expressions may be left unresolved (e.g. `ear_tag_orders` policy) → `fix-rls-sql.mjs` post-processes the generated SQL.
- DB connection: host `192.168.1.109:5432`, DB `tbot`, `.env` at `packages/database/.env` with `DATABASE_URL`.
