# Database Bot — @rocky/database

Owns all Drizzle ORM schemas, migrations, RLS policies, and enum constants.

## Structure

```
src/
├── constants/         ← Enum SSOT: dictionary + VALUES (createEnumValues)
├── schema/
│   ├── auth/          ← better-auth tables (Global Identity Model)
│   ├── sm/            ← System Management (users, roles, orgs, audit, notifications)
│   ├── hk/            ← Holder Keeper (farms, addresses, subjects)
│   └── an/            ← Animals (animals, ear-tags, movements, births, slaughter)
├── schemas/enums/     ← pgEnum definitions from constants
├── zod/               ← Dumb Zod (raw createSelectSchema/InsertSchema)
```

## Rules

- Enum chain: `constants/` → `schemas/enums/` (pgEnum) → `validators/enums/` (zEnum)
- Dumb Zod (`zod/`) has NO `.strict()`, `.omit()`, `.extend()`
- Every tenant-scoped pgTable gets a `pgPolicy()` for RLS
- Auth tables have NO `tenant_id` (Global Identity Model)
- Users table includes `mobilePhone` + `mobileVerified` for future 2FA and `deviceId` for device-change detection
- After schema changes: `pnpm generate` then `pnpm push`

## Exports

```json
"./schema/auth": "./src/schema/auth/index.ts"
"./constants/*": "./src/constants/*.ts"
"./zod": "./src/zod/index.ts"
```
