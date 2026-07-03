# Druizle Adoption Plan — AIMCS

## Delta Analysis: Current vs Diamond Seal Patterns

| Aspect                    | Current (our build)                      | Diamond Seal (required)                                                                                                                 | Action                                  |
| ------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **Package structure**     | `@rocky/db` + `@rocky/validators`    | `@rocky/database` (schemas, constants, enums, zod) + `@rocky/validators` (api, events, integrations, internal, enums, vendor-enums) | Rename `db`→`database`, add sub-folders |
| **Enum SSOT**             | Inline `z.enum()` in validators/enums.ts | `constants/*.ts` (Dictionary + VALUES) → `schemas/enums/` (pgEnum) → `validators/enums/` (zEnum)                                        | Create 3-part chain                     |
| **Dumb Zod**              | Missing                                  | `database/zod/factory.ts` + `database/zod/*.ts` (raw `createSelectSchema/createInsertSchema` only)                                      | Add factory + domain files              |
| **Validator consumption** | Mixed in single folder                   | `validators/api/` → derive from Dumb Zod with `.strict().omit().extend()`                                                               | Restructure validators                  |
| **NoDrift guillotines**   | Missing                                  | Every schema gets `NoDrift<z.infer<>, Interface>`                                                                                       | Add to every schema                     |
| **Zod 4 primitives**      | Mixed (some old)                         | `z.int()`, `z.uuid()`, `z.coerce.date()`, `.prefault()`, `.nonnegative()`                                                               | Audit & fix all schemas                 |
| **Native RLS**            | Missing                                  | `pgPolicy()` on every tenant-scoped table                                                                                               | Add to each pgTable                     |
| **Vendor types**          | Not applicable yet                       | `text()` columns, never pgEnum; validated at API boundary                                                                               | Pattern ready for future                |
| **Import boundaries**     | Loosely defined                          | Strict zone-based import rules                                                                                                          | Enforce via tooling                     |

## Step 1: Restructure Package Layout

```
packages/
├── @rocky/database/           ← renamed from db
│   ├── src/
│   │   ├── constants/           ← NEW: Enum SSOT (Dictionary + VALUES)
│   │   │   ├── _brand.ts        ← createEnumValues(), ENUM_BRAND
│   │   │   ├── user-status.ts
│   │   │   ├── verification-status.ts
│   │   │   ├── farm-type.ts
│   │   │   ├── movement-type.ts
│   │   │   ├── ear-tag-status.ts
│   │   │   └── animal-status.ts
│   │   ├── schemas/
│   │   │   ├── enums/           ← pgEnum definitions only
│   │   │   │   ├── index.ts
│   │   │   │   ├── user-status.ts
│   │   │   │   └── ...
│   │   │   ├── sm/              ← existing
│   │   │   ├── hk/              ← existing
│   │   │   └── an/              ← existing
│   │   └── zod/                 ← NEW: Dumb Zod (factory + domain files)
│   │       ├── factory.ts       ← createSchemaFactory with coerce
│   │       ├── index.ts         ← barrel
│   │       ├── sm.ts
│   │       ├── hk.ts
│   │       └── an.ts
│   └── package.json
│
├── @rocky/validators/         ← restructured
│   ├── src/
│   │   ├── api/                 ← Category 3: Sovereign Internal (DB-backed)
│   │   │   ├── index.ts
│   │   │   ├── holdings.api.ts
│   │   │   ├── animals.api.ts
│   │   │   ├── movements.api.ts
│   │   │   └── eartags.api.ts
│   │   ├── events/              ← Category 3: 4-Part Canonical Blueprint
│   │   │   ├── index.ts
│   │   │   ├── event-meta.ts    ← shared envelope
│   │   │   ├── holdings.events.ts
│   │   │   ├── animals.events.ts
│   │   │   └── movements.events.ts
│   │   ├── integrations/        ← Category 1/2: External/simulated vendor types
│   │   │   └── (future: telegram, meta, etc.)
│   │   ├── internal/            ← Category 3: xbot-owned abstractions
│   │   │   └── (future: workflow state, etc.)
│   │   ├── enums/               ← zEnum schemas (auto-generated)
│   │   │   ├── _enum-helper.ts  ← zEnum() branded helper
│   │   │   ├── index.ts
│   │   │   ├── user-status.ts
│   │   │   ├── verification-status.ts
│   │   │   └── ...
│   │   ├── vendor-enums/        ← Pure re-export barrel (future)
│   │   │   └── ...
│   │   └── utils/
│   │       ├── check-digit.ts   ← existing
│   │       └── type-bridge.ts   ← NoDrift, AssertEqual, ExpectTrue
│   └── package.json
```

## Step 2: Implementation Order

1. Create `database/src/constants/_brand.ts` + enum SSOT constants
2. Create `database/src/schemas/enums/` with pgEnum definitions
3. Create `database/src/zod/factory.ts` + domain Dumb Zod files
4. Create `validators/src/utils/type-bridge.ts` with NoDrift
5. Create `validators/src/enums/_enum-helper.ts` + zEnum schemas
6. Move existing schemas to `validators/src/api/`, add .strict()/.omit()/.extend()
7. Add NoDrift guillotines to every API schema
8. Add native RLS policies to pgTables
9. Update tRPC router imports to point to validators/api
10. Add Zod 4 primitive audit

## Key Pattern Implementations

### Enum SSOT (3-part chain)

```typescript
// database/src/constants/verification-status.ts
import { createEnumValues } from "./_brand";
export const VERIFICATION_STATUS = {
  DRAFT: "draft",
  PENDING_VD_APPROVAL: "pending_vd_approval",
  APPROVED: "approved",
  REJECTED: "rejected",
  ARCHIVED: "archived",
} as const;
export const VERIFICATION_STATUS_VALUES = createEnumValues([
  VERIFICATION_STATUS.DRAFT,
  VERIFICATION_STATUS.PENDING_VD_APPROVAL,
  VERIFICATION_STATUS.APPROVED,
  VERIFICATION_STATUS.REJECTED,
  VERIFICATION_STATUS.ARCHIVED,
] as const);

// database/src/schemas/enums/verification-status.ts
import { pgEnum } from "drizzle-orm/pg-core";
import { toPgEnumValues } from "../../constants/_brand";
import { VERIFICATION_STATUS_VALUES } from "../../constants/verification-status";
export const verificationStatusEnum = pgEnum(
  "verification_status",
  toPgEnumValues(VERIFICATION_STATUS_VALUES)
);

// validators/src/enums/verification-status.ts
import { zEnum } from "./_enum-helper";
import { VERIFICATION_STATUS_VALUES } from "@rocky/database/constants/verification-status";
export const verificationStatusSchema = zEnum(VERIFICATION_STATUS_VALUES);
export type VerificationStatus = z.infer<typeof verificationStatusSchema>;
```

### Dumb Zod (database/zod/)

```typescript
// database/src/zod/factory.ts
import { createSchemaFactory } from "drizzle-orm/zod";
const factory = createSchemaFactory({
  coerce: { date: true },
});
export const createSelectSchema = factory.createSelectSchema;
export const createInsertSchema = factory.createInsertSchema;

// database/src/zod/hk.ts
import { farms, addresses, subjects, farmSubjects } from "../schemas/hk";
import { createSelectSchema, createInsertSchema } from "./factory";
export const farmSelectSchema = createSelectSchema(farms);
export const farmInsertSchema = createInsertSchema(farms);
export const addressSelectSchema = createSelectSchema(addresses);
// NO .strict(), .omit(), .extend() here!
```

### Validator Consumption (validators/api/)

```typescript
// validators/src/api/holdings.api.ts
import { farmSelectSchema, farmInsertSchema } from "@rocky/database/zod";
import { verificationStatusSchema } from "../enums/verification-status";
import type { NoDrift } from "../utils/type-bridge";

// — Interface —
export interface FarmResponse {
  id: string;
  farmId: string;
  name: string | null;
  type: string;
  status: VerificationStatus;
  location: string | null;
  createdAt: Date;
}

// — Response Schema —
export const farmResponseSchema = farmSelectSchema
  .omit({ tenantId: true, addressId: true, parentFarmId: true, createdBy: true, updatedBy: true, validTo: true })
  .extend({ status: verificationStatusSchema })
  .strict();

// — Create Input —
export const createFarmInputSchema = farmInsertSchema
  .pick({ farmId: true, name: true, type: true, location: true, dataSource: true })
  .extend({ digitalSignature: z.string().optional() })
  .strict();

// — NoDrift Guillotine —
type _drift_FarmResponse = NoDrift<
  z.infer<typeof farmResponseSchema>,
  FarmResponse
>;
```

### NoDrift Type Bridge

```typescript
// validators/src/utils/type-bridge.ts
export type NoDrift<A, B> =
  AssertEqual<A, B> extends true
    ? true
    : ["TYPE DRIFT DETECTED ──", { expected: A; actual: B }];
```

### Native RLS

```typescript
// In every pgTable with tenantId:
import { pgPolicy, sql } from "drizzle-orm/pg-core";

(table) => [
  index("idx_farms_tenant").on(table.tenantId),
  pgPolicy("tenant_isolation", {
    as: "permissive",
    to: "public",
    for: "all",
    using: sql`tenant_id = current_setting('app.current_tenant_id', true)::text`,
    withCheck: sql`tenant_id = current_setting('app.current_tenant_id', true)::text`,
  }),
],
```
