# Validation Bot — @rocky/validators

> **Source of Truth**: This document synthesizes patterns proven in the live code across `packages/validators/src/api/*.api.ts`, `packages/validators/src/events/*.events.ts`, and `packages/validators/src/events/base.ts`.

Owns the Diamond Seal validation layer. All Zod 4 schemas, NoDrift guillotines, and the enum chain.

---

## 1. The Two Validator Zones

All validators live under `packages/validators/src/` in two distinct zones:

| Zone | Path | Purpose | Envelope |
|---|---|---|---|
| **API** | `api/[domain].api.ts` | Request/response contracts between NestJS tRPC backend and Expo/Next.js frontends | Raw schema |
| **Events** | `events/[domain].events.ts` | Event payloads for the internal event bus (RabbitMQ/Redis) | `eventEnvelopeSchema(payload)` wraps in `{header, source, payload}` |

**Never mix these zones.** API schemas guard the HTTP boundary. Event schemas guard the message boundary. They have different shapes, different consumers, and different rules:

- API schemas may derive from Drizzle Dumb Zod (response/create) or be hand-built (query params, geo inputs)
- Event schemas are always hand-built — events are NOT database shapes
- API files must NOT import from `events/`; event files must NOT import from `api/`

---

## 2. API Schema Design (`api/[domain].api.ts`)

### 2.1 Response Schemas (SELECT shape)

```typescript
import { animalSelectSchema } from "@rocky/database/zod";

export const animalResponseSchema = animalSelectSchema
  .omit({ createdBy: true, validTo: true })
  .extend({
    birthDate: z.coerce.date(),
    taggingDate: z.coerce.date().nullable(),
    importDate: z.coerce.date().nullable(),
    status: animalStatusSchema,
    sex: sexSchema,
    birthType: birthTypeSchema.nullable(),
  })
  .strict() satisfies z.ZodType<AnimalResponse>;
```

**Rules:**

- Import `*SelectSchema` from `@rocky/database/zod` — this is the Dumb Zod
- Dumb Zod is **read-only** — never `.extend()`, `.omit()`, or `.strict()` inside `@rocky/database/zod`
- Always `.omit()` internal fields (`createdBy`, `validTo`, etc.) — the API never exposes audit fields
- Always `.extend()` with `zEnum` schemas for typed string columns — replace `z.string()` with the branded enum
- Always `.strict()` — no extra fields allowed in responses
- Always `satisfies z.ZodType<Interface>` — compile-time proof

### 2.2 Create Input Schemas (INSERT shape)

```typescript
// Preferred: .pick() for safety — opt-in to fields the client can set
export const createFarmRequestSchema = farmInsertSchema
  .pick({
    legacyId: true,
    addressId: true,
    name: true,
    parentFarmId: true,
    verificationNote: true,
    location: true,
    digitalSignature: true,
    signatureCapturedAt: true,
    photoUrl: true,
  })
  .extend({
    farmId: farmIdSchema.optional(),
    type: farmTypeSchema.optional(),
    dataSource: dataSourceSchema.optional(),
  })
  .strict() satisfies z.ZodType<CreateFarmRequest>;
```

**When to use `.pick()` over `.omit()`:**

- **`.pick()`** — SAFER. Explicitly select which DB fields the client can set. New DB columns are NOT auto-exposed.
- **`.omit()`** — RISKIER. Remove known auto-generated fields. New DB columns LEAK to the API if forgot to add them to the omit list.

Current Rocky codebase uses `.omit()` in some files. The long-term target is `.pick()` for all create schemas.

**Rules:**

- Import `*InsertSchema` from `@rocky/database/zod`
- Use `.pick()` to select only the fields the client can set
- Use `.extend()` to override validation (add `zEnum` schemas, check-digit schemas, range constraints)
- `createInsertSchema` auto-strips `id`, `createdAt`, `updatedAt` — but `.pick()` removes the doubt anyway
- Always `.strict()`

### 2.3 Update Input Schemas

```typescript
export const updateAnimalRequestSchema = z
  .strictObject({
    breed: z.string().max(50).optional(),
    birthType: birthTypeSchema.optional(),
    birthWeight: z.number().int().positive().optional(),
    status: animalStatusSchema.optional(),
    currentFarmId: z.uuid().optional(),
    taggingDate: z.date().optional(),
    isFirstTagging: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "At least one field must be updated")
  ) satisfies z.ZodType<UpdateAnimalRequest>;
```

Update schemas are almost always **hand-built** (not Dumb Zod derived) because:

- All fields are optional (partial update)
- Typically need a `.refine()` to require at least one field
- The DB insert shape includes fields that cannot be updated (e.g., `earTagNumber`, `birthDate`)

**Rules:**

- Use `z.strictObject({...})` (Zod 4 idiom) or `z.object({...}).strict()` for compatibility
- All fields `.optional()` — the client sends only what they want to change
- Always include a "at least one field" refinement
- Add `satisfies z.ZodType<Interface>`

### 2.4 Manual / Hand-built Schemas

Some inputs are not DB shapes. These stay as hand-built schemas:

```typescript
// Query params — not a DB shape at all
export const animalListRequestSchema = z.strictObject({
  farmId: z.uuid().optional(),
  status: animalStatusSchema.optional(),
  sex: sexSchema.optional(),
  breed: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["birthDate", "createdAt", "earTagNumber"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
}) satisfies z.ZodType<AnimalListRequest>;

// Input combining fields from multiple tables
export const findAnimalByTagRequestSchema = z.strictObject({
  earTag: earTagSchema,
  stateCode: z.string().length(3).default("MK"),
}) satisfies z.ZodType<FindAnimalByTagRequest>;
```

**Use `z.strictObject()` when:**

- The input has no corresponding DB table (query params, search filters, pagination)
- The input combines fields from multiple tables
- The input uses check-digit schemas, branded types, or other abstractions not in the DB

### 2.5 Enums

**Never use inline unions.** Always import from the enum SSOT:

```typescript
// ✅ Correct
import { animalStatusSchema } from "../enums/domain.js";

// ❌ Crime
const statusSchema = z.enum(["alive", "dead", "slaughtered", "stolen", "lost", "exported", "imported", "birth"]);
```

The enum chain is: `database/constants/` → `validators/enums/domain.ts` → `zEnum()` → exported as `*Schema` + `*Type`.

### 2.6 Import Checklist

Every `api/[domain].api.ts` file must import from:

- `@rocky/database/zod` — for `*SelectSchema` and `*InsertSchema` (Dumb Zod)
- `../enums/domain.js` — for all zEnum schemas and types
- `zod` — for `z.strictObject()`, `z.uuid()`, `z.coerce.date()`, `.refine()`, etc.
- `../utils/type-bridge.js` — for `NoDrift`, `NoDriftSimple`, `ActivateGuillotines`

Every schema must end with:

- `satisfies z.ZodType<Interface>` — Tier 1 guillotine
- A `NoDrift` / `NoDriftSimple` type alias — Tier 2 guillotine

Every file must end with:

- `export type _DomainGuillotines = ActivateGuillotines<[ ... ]>` — Tier 3 guillotine

**Never import from:**

- `@rocky/database` or `@rocky/database/schema` directly — always use the `/zod` subpath
- `@rocky/validators/api` — no cross-domain API imports between domains
- `@rocky/validators/events` — no event imports in API files
- `@rocky/domains-*` — domain services consume schemas, NOT the other way around

---

## 3. Event Schema Design (`events/[domain].events.ts`)

### 3.1 The 4-Part Canonical Blueprint

Every single event MUST follow this exact 4-part structure:

```typescript
// ═══════════════════════════════════════════════════════════════
// PART 1: The Canonical Payload Interface
// ═══════════════════════════════════════════════════════════════
// Pure TypeScript contract. Domain services and handlers import THIS.
export interface AnimalRegisteredPayload {
  animalId: string;
  stateCode: string;
  earTagNumber: string;
  birthDate: Date;
  sex: sexType;
  breed: string | null;
  birthType: birthTypeType | null;
  birthWeight: number | null;
  motherId: string | null;
  fatherId: string | null;
  currentFarmId: string;
  isFirstTagging: boolean;
}

// ═══════════════════════════════════════════════════════════════
// PART 2: The Strict Payload Schema
// ═══════════════════════════════════════════════════════════════
// Standalone. Validates the payload independent of the event envelope.
// Uses `satisfies` — the strictest possible check.
export const animalRegisteredPayloadSchema = z.strictObject({
  animalId: z.uuid(),
  stateCode: z.string().length(3),
  earTagNumber: z.string().length(8),
  birthDate: z.date(),
  sex: sexSchema,
  breed: z.string().nullable(),
  birthType: birthTypeSchema.nullable(),
  birthWeight: z.int().nullable(),
  motherId: z.uuid().nullable(),
  fatherId: z.uuid().nullable(),
  currentFarmId: z.uuid(),
  isFirstTagging: z.boolean(),
}) satisfies z.ZodType<AnimalRegisteredPayload>;

// ═══════════════════════════════════════════════════════════════
// PART 3: The Full Event Schema
// ═══════════════════════════════════════════════════════════════
// Wraps the payload into the canonical event envelope (header + source + payload).
// Note: This uses PascalCase for the schema to distinguish it from the payload.
// If this file is empty, events for this domain haven't been modelled yet.
export const AnimalRegisteredEvent = eventEnvelopeSchema(animalRegisteredPayloadSchema);
export type AnimalRegisteredEvent = z.infer<typeof AnimalRegisteredEvent>;

// ═══════════════════════════════════════════════════════════════
// PART 4: The Guillotine
// ═══════════════════════════════════════════════════════════════
// Compile-time proof: Zod schema matches TypeScript interface.
type _drift_animalRegisteredPayload = NoDrift<
  z.infer<typeof animalRegisteredPayloadSchema>,
  AnimalRegisteredPayload
>;
```

### 3.2 Why 4 Parts?

| Part | Who uses it | Why separated |
|---|---|---|
| **Interface** (Part 1) | Domain services, handlers | Depend on types, not Zod. Can import without the Zod dependency. |
| **Payload Schema** (Part 2) | EventPublisher, integration tests | Standalone validation — can be used without the event envelope. |
| **Event Schema** (Part 3) | EventPublisher, queue consumers | Full envelope with header, source, and typed payload. |
| **Guillotine** (Part 4) | Compiler | If interface and schema diverge → fails at `npx tsc`. |

### 3.3 The Event Envelope (`events/base.ts`)

All events share a common structure defined in `packages/validators/src/events/base.ts`:

```typescript
// Nested envelope: { header, source, payload }
eventEnvelopeSchema(payloadSchema) → z.strictObject({
  header: eventHeaderSchema,   // eventId, eventType, version, timestamp, causationChain
  source: eventSourceSchema,   // userId, source, ipAddress, userAgent
  payload: payloadSchema,      // The domain-specific payload
})
```

This produces events like:

```json
{
  "header": {
    "eventId": "0190a3b2-c1d4-7e00-b000-000000000001",
    "eventType": "animal.registered",
    "version": 1,
    "timestamp": "2026-07-03T12:00:00.000Z"
  },
  "source": {
    "userId": "0190a3b2-c1d4-7e00-9000-000000000001",
    "source": "API"
  },
  "payload": {
    "animalId": "0190a3b2-c1d4-7e00-a000-000000000001",
    "earTagNumber": "MK123456",
    ...
  }
}
```

The `eventEnvelopeSchema()` factory function handles the wrapping — every domain event.ts only needs to define the payload and call the factory.

### 3.4 Event Type Naming Convention

```
{domain}.{entity}.{action}
```

Examples from the codebase:

- `animal.registered` · `animal.moved` · `animal.died`
- `animal.slaughtered` · `animal.status_changed`
- `birth.notified` · `pasture.declared`
- `ear-tag.allocated` · `ear-tag.applied` · `ear-tag.replaced`
- `farm.registered` · `subject.bound_to_farm`

### 3.5 Shared Sub-Schemas

When multiple events share a payload shape, extract it:

```typescript
// Shared in events/base.ts
export const entitySnapshotSchema = z.object({
  entityType: z.string(),
  entityId: z.uuid(),
  state: z.record(z.string(), z.unknown()),
});

export const entityChangeSchema = z.object({
  field: z.string(),
  oldValue: z.unknown().optional(),
  newValue: z.unknown(),
});
```

When you need a domain-specific shared payload:

```typescript
// Shared interface
export interface DriverLocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  capturedAt: Date;
}

// Shared schema
export const driverLocationDataSchema = z.strictObject({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().nonnegative().nullable(),
  capturedAt: z.date(),
}) satisfies z.ZodType<DriverLocationData>;

// Used in multiple events
export const locationTrackedPayloadSchema = z.strictObject({
  driverId: z.uuid(),
  location: driverLocationDataSchema,
}) satisfies z.ZodType<LocationTrackedPayload>;
```

### 3.6 Import Checklist

Every `events/[domain].events.ts` file must import from:

- `zod` — for `z.strictObject()`, `z.literal()`, etc.
- `../enums/domain.js` — for enum schemas used in payloads
- `./base.js` — for `eventEnvelopeSchema()`
- `../utils/type-bridge.js` — for `NoDrift`, `ActivateGuillotines`

**Never import from:**

- `@rocky/database` or `@rocky/database/zod` — events are NOT DB shapes
- `@rocky/validators/api` — no API imports in event files
- Other event files — no cross-domain event imports

---

## 4. Guillotine Enforcement (Three-Tier)

The guillotine system in `utils/type-bridge.ts` enforces schema/interface
alignment at compile time. Every `*.api.ts` and `*.events.ts` file uses this pattern.

### Tier 1 — `satisfies z.ZodType<Interface>` on schema declaration

```typescript
export const farmResponseSchema = farmSelectSchema
  .omit({ ... })
  .extend({ ... })
  .strict() satisfies z.ZodType<FarmResponse>;

export const createAnimalRequestSchema = animalInsertSchema
  .omit({ ... })
  .extend({ ... })
  .refine(fn, { message })
  ) satisfies z.ZodType<CreateAnimalRequest>;

export const animalListRequestSchema = z.strictObject({ ... })
  }) satisfies z.ZodType<AnimalListRequest>;

export const animalRegisteredPayloadSchema = z.strictObject({ ... })
  }) satisfies z.ZodType<AnimalRegisteredPayload>;
```

**What it checks**: Schema's `_output` type is assignable to the interface.
**What it misses**: Interface can be WIDER than schema (extra optional fields, wider union types). Only checks A→B direction.
**When to use**: ALL schemas — response, request, event payload. Never remove it.

### Tier 2 — `NoDrift` / `NoDriftSimple` on a type alias

```typescript
// Use NoDrift for response schemas and hand-built schemas (no false positives)
type _drift_farmResponse = NoDrift<z.infer<typeof farmResponseSchema>, FarmResponse>;

// Use NoDriftSimple for request schemas derived from Dumb Zod (avoids false positives on union types)
type _drift_createAnimal = NoDriftSimple<z.infer<typeof createAnimalRequestSchema>, CreateAnimalRequest>;

// Use NoDrift for event payload schemas (hand-built, no union type issues)
type _drift_animalRegisteredPayload = NoDrift<z.infer<typeof animalRegisteredPayloadSchema>, AnimalRegisteredPayload>;
```

**`NoDrift`** — Full structural identity via higher-kinded type equality (`AssertEqual`). Catches BOTH directions (A→B AND B→A).

- Use on: response schemas, hand-built schemas (no drizzle Dumb Zod), event payloads

**`NoDriftSimple`** — Bidirectional `extends` check. Less precise but immune to false positives on complex union types crossing drizzle-zod boundaries.

- Use on: request schemas derived from Drizzle Dumb Zod

**Escalation path when `NoDrift` false-positives:**

1. First try `NoDriftSimple` — the `extends` check handles union aliases
2. If still failing, fix the INTERFACE to match — the schema is SSOT
3. Last resort: `type _drift_createX = true` — removes coverage

### Tier 3 — `ActivateGuillotines<[...]>` at file end

```typescript
export type _AnimalGuillotines = ActivateGuillotines<
  [_drift_animalResponse, _drift_animalSummary, _drift_animalParentResponse,
   _drift_animalListResponse, _drift_createAnimalRequest, _drift_updateAnimalRequest,
   _drift_animalListRequest, _drift_findAnimalByTagRequest]
>;
```

**Why this exists**: TypeScript type aliases are lazy — if no code references them, they are NEVER evaluated. `ActivateGuillotines<[T1, T2, ...]>` forces TypeScript to check each type alias. If any resolved to a drift tuple instead of `true`, the `true[]` constraint fails and compilation errors.

**Rule**: Every `*.api.ts` and every event file MUST export a `*Guillotines` type alias.

### Common Interface Drifts and Fixes

| Error | Direction | Cause | Fix |
|---|---|---|---|
| `"DRIFT (B narrower)"` | B ← A fails | Interface has narrower type than schema (e.g. `string` vs `string \| undefined`, or interface field optional where schema has required) | Widen interface or add `?` |
| `"DRIFT (A narrower)"` | A ← B fails | Schema output narrower than interface (e.g. `.extend()` removes `null` but interface still has `\| null`) | Remove `\| null` from interface |
| `"TYPE DRIFT DETECTED"` | AssertEqual | Higher-kinded equality failed — may be false positive on union types | Switch to `NoDriftSimple` |

---

## 5. The `satisfies` vs `as` Dialectic

**For Sovereign Internal schemas (our entire current codebase):**
Always `satisfies z.ZodType<T>`. We control both the schema and the interface. If `satisfies` fails, either the schema is wrong or the interface is wrong — never paper over it with `as`.

**For future Vendor/External integrations (Telegram, Discord, etc.):**
Use `as z.ZodType<T>` only when:

| Category | Pattern | Why |
|---|---|---|
| **Small stable union** (e.g. sticker type: `"regular" \| "mask"`) | `z.enum()` + `satisfies` | Vendor union is small, changes rarely |
| **Large open union** (e.g. 100+ currency codes) | `z.string()` + `as` | Vendor adds new values; runtime must not crash |
| **Zod 4 branded internals** (`z.int()`, `z.coerce.date()`) | Schema + `as` + NoDrift guillotine | `satisfies` conflicts with Zod 4's `$ZodTypeInternals` |

**Rule of thumb:** Inside your own domain → `satisfies`. At the vendor boundary → `as` only when necessary. The `NoDrift` guillotine catches shape drift in both cases.

---

## 6. Zod 4 Idiom Reference

| Zod 3 | Zod 4 (our codebase) |
|---|---|
| `z.object({...}).strict()` | `z.strictObject({...})` or `z.object({...}).strict()` |
| `z.object({...}).passthrough()` | `z.looseObject({...})` |
| `z.string().uuid()` | `z.uuid()` |
| `.default()` with transforms | `.prefault()` if the default needs parsing |
| `z.date()` | `z.date()` (same) |
| `z.coerce.date()` | `z.coerce.date()` (same) |
| `z.number().int()` | `z.int()` |
| `.refine()` with object message | `.refine(fn, { message: "..." })` (same, but `error` key preferred) |

Current Rocky codebase uses a mix of `z.object({...}).strict()` and `z.strictObject({...})`. Both are acceptable. The long-term target is `z.strictObject()` for API and event schemas.

---

## 7. Common Pitfalls

### Pitfall 1: Manual DB field reconstruction

```typescript
// ❌ Crime — breaks when the DB schema changes
export const schema = z.strictObject({
  id: z.uuid(),
  earTagNumber: z.string().length(8),
  birthDate: z.date(),
  // ...
});

// ✅ Correct — auto-inherits from DB via Dumb Zod
export const schema = animalSelectSchema.omit({ createdBy: true }).extend({
  status: animalStatusSchema,
}).strict();
```

### Pitfall 2: Missing `.strict()` on API schemas

```typescript
// ❌ Crime — allows extra fields in responses
export const schema = animalSelectSchema.omit({ createdBy: true });

// ✅ Correct
export const schema = animalSelectSchema.omit({ createdBy: true }).strict();
```

### Pitfall 3: Inline enum unions instead of SSOT

```typescript
// ❌ Crime — duplicated string literal, drifts from DB constant
const statusSchema = z.enum(["alive", "dead", "slaughtered", "stolen"]);

// ✅ Correct — comes from the database constant via zEnum()
import { animalStatusSchema } from "../enums/domain.js";
```

### Pitfall 4: Event without all 4 parts

```typescript
// ❌ Crime — no interface, no guillotine, no standalone payload schema
export const AnimalDiedEvent = eventEnvelopeSchema(z.strictObject({
  animalId: z.uuid(),
  farmId: z.uuid(),
}));

// ✅ Correct — all 4 parts (see Section 3.1)
export interface AnimalDiedPayload { ... }
export const animalDiedPayloadSchema = z.strictObject({...}) satisfies z.ZodType<AnimalDiedPayload>;
export const AnimalDiedEvent = eventEnvelopeSchema(animalDiedPayloadSchema);
type _drift = NoDrift<z.infer<typeof animalDiedPayloadSchema>, AnimalDiedPayload>;
```

### Pitfall 5: Optional key mismatch (the #1 `satisfies` catch)

```typescript
// ❌ Interface: key is REQUIRED (must exist, even if value is undefined)
reason: string | null | undefined;

// ✅ Zod: key is OPTIONAL (can be completely absent)
reason: z.string().nullable().optional();

// With `as`: compiles fine, bug hidden
// With `satisfies`: compiler error!
//   "Property 'reason' is optional in Zod type but required in interface"

// ✅ Fix: add `?` to the interface, drop `| undefined` (implied by `?`)
reason?: string | null;
```

### Pitfall 6: `.pick()` vs `.omit()` — new columns leak

When a new column is added to the Drizzle schema:

- `.omit({ oldFields })` — new column is NOT omitted, it **leaks** into the API
- `.pick({ knownFields })` — new column is NOT picked, it stays **hidden**

**Recommendation:** Always use `.pick()` for create/update schemas. Use `.omit()` only for response schemas where you know exactly which audit fields to strip.

### Pitfall 7: `satisfies` + `.refine()` chain ordering

`satisfies` must go on the outermost call — after `.refine()`, not before:

```typescript
// ✅ Correct — satisfies on the ZodEffects (after .refine())
z.object({...})
  .extend({...})
  .refine(fn, { message })
  satisfies z.ZodType<Interface>;

// ❌ Wrong — satisfies on the inner ZodObject, not the final ZodEffects
z.object({...})
  .extend({...})
  satisfies z.ZodType<Interface>
  .refine(fn, { message }); // ← refine returns a different type
```

---

## 8. Step-by-Step: Adding a New Domain

### Step 1: Verify Drizzle-Zod Exports Exist

```bash
ls packages/database/src/zod/<domain>.ts
```

If missing, create it:

```typescript
// packages/database/src/zod/<domain>.ts
import { myTable } from "../schema/somewhere";
import { createInsertSchema, createSelectSchema } from "./factory";

export const myTableSelectSchema = createSelectSchema(myTable);
export const myTableInsertSchema = createInsertSchema(myTable);
```

### Step 2: Create API Schemas

File: `packages/validators/src/api/<domain>.api.ts`

Checklist:

- [ ] Import `*SelectSchema`, `*InsertSchema` from `@rocky/database/zod`
- [ ] Response schemas: `*SelectSchema.omit({auditFields}).extend({enums}).strict()`
- [ ] Create inputs: `*InsertSchema.pick({userFields}).extend({overrides}).strict()` (prefer `.pick()`)
- [ ] Update inputs: hand-built `z.strictObject({...})` with all fields `.optional()` + "at least one" refinement
- [ ] Query params / special inputs: `z.strictObject({...})`
- [ ] Enums: from `../enums/domain.js`, never inline
- [ ] Every schema: `satisfies z.ZodType<Interface>`
- [ ] Every interface drift: `NoDrift` or `NoDriftSimple` type alias
- [ ] File end: `export type _DomainGuillotines = ActivateGuillotines<[...]>`
- [ ] `npx tsc --noEmit -p packages/validators/tsconfig.json` → 0 errors (VALIDATORS ✓)

### Step 3: Create Event Schemas (if domain has events)

File: `packages/validators/src/events/<domain>.events.ts`

For each event:

- [ ] Part 1: Payload interface (pure TypeScript)
- [ ] Part 2: Payload schema with `satisfies`
- [ ] Part 3: Full event schema via `eventEnvelopeSchema(payloadSchema)`
- [ ] Part 4: Guillotine `type _drift_* = NoDrift<...>`
- [ ] Extract shared sub-schemas with their own Guillotine
- [ ] Barrel export in `events/index.ts`
- [ ] `npx tsc --noEmit -p packages/validators/tsconfig.json` → 0 errors

### Step 4: Build Domain Service Package

See `packages/domains/` for the repository pattern:

- `packages/domains/<domain>/src/errors/<domain>.errors.ts` — ≤8 error codes
- `packages/domains/<domain>/src/repositories/<domain>.repository.ts` — extends `BaseRepository`
- `packages/domains/<domain>/src/services/<domain>.service.ts` — imports types FROM validators
- `packages/domains/<domain>/src/index.ts` — barrel

### Step 5: Build tRPC Router

File: `apps/api/src/routers/<domain>.router.ts`

- Import schemas from `@rocky/validators/api`
- Import service from `@rocky/domains-<domain>`
- Use `@Router()`, `@Query()`, `@Mutation()` decorators
- Use `createResultUnwrapper()` from `@rocky/trpc`
- Wire in `apps/api/src/app.module.ts`

### Step 6: Verify Full Compilation

```bash
npx tsc --noEmit -p packages/validators/tsconfig.json → ✓
npx tsc --noEmit -p apps/api/tsconfig.json → ✓
```

---

## 9. File Structure Summary

```
packages/validators/src/
├── api/                       ← Sovereign API schemas
│   ├── animals.api.ts         ← Animal CRUD response + request
│   ├── eartags.api.ts         ← Ear tag lifecycle + orders
│   ├── farms.api.ts           ← Farm response + registration
│   ├── movements.api.ts       ← Movement response + request
│   ├── subjects.api.ts        ← Subject response + binding
│   ├── users.api.ts           ← User response + request
│   ├── rbac.api.ts            ← Role/permission response + assignment
│   ├── organizations.api.ts   ← Organization response + request
│   ├── notifications.api.ts   ← Notification response + request
│   ├── holdings.api.ts        ← Legacy: HK registration wizard
│   └── registration.api.ts    ← Legacy: Animal registration
├── events/                    ← 4-Part Canonical Event Blueprint
│   ├── base.ts                ← Event envelope factory, header, source schemas
│   ├── animals.events.ts      ← Animal lifecycle events
│   ├── eartags.events.ts      ← Ear tag lifecycle events
│   ├── farms.events.ts        ← Farm lifecycle events
│   └── index.ts               ← Barrel
├── enums/                     ← zEnum schemas from database constants
│   ├── domain.ts              ← Auto-generated zEnum schemas + NoDrift guillotines
│   └── index.ts               ← Re-exports dictionaries + schemas + types
├── vendor-enums/              ← Future: pure re-exports for pgEnum integration
└── utils/
    ├── check-digit.ts          ← Ear tag + Farm ID check digit algorithms
    └── type-bridge.ts          ← NoDrift, AssertEqual, NoDriftSimple, ActivateGuillotines
```
