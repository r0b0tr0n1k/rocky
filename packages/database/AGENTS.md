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

## Rules

- Enum chain: `constants/` → `schemas/enums/` (pgEnum) → `validators/enums/` (zEnum)
- Dumb Zod (`zod/`) has NO `.strict()`, `.omit()`, `.extend()`
- Every tenant-scoped pgTable gets a `pgPolicy()` for RLS
- Auth tables have NO `tenant_id` (Global Identity Model)
- Users table includes `mobilePhone` + `mobileVerified` for future 2FA and `deviceId` for device-change detection
- After schema changes: `pnpm generate` then `pnpm push`

## Seed Data Scope

`seed.ts` covers:
- **Permissions**: SM, HK, Animal, Movement, EarTag, Slaughter, Birth Notification, Pasture, Analysis/Report, PDA, Notification, **Health**, **Archive**, **Correction**, **Passport**
- **Role→Permission mappings**: SUPER_ADMIN, VD_ADMIN, VD_STAFF, VETERINARIAN, TECHNICIAN, SUPPLIER, SLAUGHTERHOUSE_OP, MARKET_OP, FARMER
- **Health master data**: 16 diseases (12 notifiable), 8 vaccines, 8 vaccine→disease mappings

## Exports

```json
"./schema/auth": "./src/schema/auth/index.ts"
"./constants/*": "./src/constants/*.ts"
"./zod": "./src/zod/index.ts"
```
