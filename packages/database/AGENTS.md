# Database Bot — @rocky/database

Owns all Drizzle ORM schemas, migrations, RLS policies, enum constants, and seed data.

## Structure

```
src/
├── constants/         ← Enum SSOT: dictionary + VALUES (createEnumValues)
├── schema/
│   ├── auth/          ← better-auth tables (Global Identity Model)
│   ├── sm/            ← System Management (users, roles, orgs, audit, notifications)
│   ├── hk/            ← Holder Keeper (farms, addresses, subjects)
│   ├── an/            ← Animals (animals, ear-tags, movements, births, slaughter)
│   └── hd/            ← Health (diseases, vaccines, treatments, lab tests)
├── schemas/enums/     ← pgEnum definitions from constants
├── zod/               ← Dumb Zod (raw createSelectSchema/InsertSchema)
├── seed.ts            ← Permissions, role→permission mappings & health master data
├── stress-seed.ts     ← drizzle-seed stress/load generator (Sovereign hybrid)
├── load-env.ts        ← env loader: ./env with repo-root .env fallback

## Rules

- Enum chain: `constants/` → `schemas/enums/` (pgEnum) → `validators/enums/` (zEnum)
- Dumb Zod (`zod/`) has NO `.strict()`, `.omit()`, `.extend()`
- Every tenant-scoped pgTable gets a `pgPolicy()` for RLS
- `disease_species_applicability` carries a `uniqueIndex` on `(disease_id, species_group_id, role)` — the base `seed.ts` `ahl-reference` relies on it for idempotent `ON CONFLICT`. Keep the seed's conflict target and this index in sync (a drift here breaks `db-recreate.sh` + `pnpm seed`).
- Auth tables have NO `tenant_id` (Global Identity Model)
- Users table includes `mobilePhone` + `mobileVerified` for future 2FA and `deviceId` for device-change detection
- After schema changes: `pnpm generate` then `pnpm push`

## Seed Data Scope

`seed.ts` covers:
- **Permissions**: SM, HK, Animal, Movement, EarTag, Slaughter, Birth Notification, Pasture, Analysis/Report, PDA, Notification, **Health**, **Archive**, **Correction**, **Passport**
- **Role→Permission mappings**: SUPER_ADMIN, VD_ADMIN, VD_STAFF, VETERINARIAN, TECHNICIAN, SUPPLIER, SLAUGHTERHOUSE_OP, MARKET_OP, FARMER
- **Health master data**: 16 diseases (12 notifiable), 8 vaccines, 8 vaccine→disease mappings

### `stress-seed.ts` — stress / load data

Run with `pnpm -C packages/database stress-seed` (defaults **5000 animals / 50000 movements**, override via `STRESS_ANIMALS` / `STRESS_MOVEMENTS`).

**Why**: `seed.ts` is idempotent reference/master data only (no bulk rows). For load & stress testing we need thousands of coherent rows without hand-writing factories.

**Pattern — "Sovereign" hybrid** (drizzle-seed as *The Zero-Config Automated Data Generator*, collared):
1. **Manually create the tenant borders first** with fixed UUIDs (idempotent: `onConflictDoNothing` + FK-safe cleanup): `states`, `zip_codes`, `addresses`, `organizations` (VD), `subjects` (keeper + 2 VS), `farms`, `farm_subjects`, and the org→farm tenancy chain `vs_contracts` + `vs_assignments`.
2. **Collar drizzle-seed** with `valuesFromArray` so generated rows reference only those known farms/animals — no FK chaos, no unrelated-table generator errors.
3. **Coherent dependent data** (`seedCoherentDependentData`): per-animal `cattle_passports`, `ear_tags`, plus `ear_tag_orders`/`ear_tag_allocations`, `vaccinations`/`treatments` (clamped after the animal's birth date & before vaccine-batch expiry), `birth_notifications`, `inspections` → `archive_documents`, and `farm_books`. All dates are derived from `animals.birth_date` so no Diamond-Seal violations occur.

**Invariants**:
- Single `DATABASE_URL` (via `load-env.ts`, with repo-root `.env` fallback for server runs).
- RLS bypass: dedicated single-connection `postgres-js` client with `SET app.current_role='SUPER_ADMIN'` (the shared pool in `index.ts` is not used).
- Re-runnable: cleanup runs **before** the bulk `animals`/`movements` delete (FK-safe order) so re-runs produce exactly `STRESS_ANIMALS`/`STRESS_MOVEMENTS` rows with no unique-index collisions.
- `packages/testing/src/factory` (`SchemaDataFactory`) remains the source for clean unit-test/dev data — drizzle-seed is load-testing only.
- **`STRESS` fixed UUIDs MUST be RFC-4122 v4** (version nibble in `[1-8]`, variant nibble in `[89abAB]`). The `@rocky/validators` Diamond Seal uses `z.uuid()` on the read path, which **rejects** RFC-4122-invalid UUIDs (the old `f3f3…` fake forms) even though Postgres accepts any dashed-32-hex as a `uuid` column value — a bad UUID in seeded rows makes the tRPC read path 400. `NEW_FARM_IDS` carries the canonical valid UUIDs used for inserts/links; the dynamic `farmIds` (queried by business code `900000001/900000002`) is used only for FK-safe cleanup so re-runs clear prior Sovereign data regardless of which UUID form was used.
- Blank-state load-test setup: `./scripts/db-recreate.sh` (drops + regenerates schema + base seed) then `pnpm -C packages/database stress-seed`.

## Exports

```json
"./schema/auth": "./src/schema/auth/index.ts"
"./constants/*": "./src/constants/*.ts"
"./zod": "./src/zod/index.ts"
```
