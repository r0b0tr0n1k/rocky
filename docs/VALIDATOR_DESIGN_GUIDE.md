# API & Event Validator Design Guide — Diamond Seal

> **Source of Truth:** This guide synthesizes the patterns proven in the live Rocky
> codebase: `packages/validators/src/api/*.api.ts`, `packages/validators/src/events/*.events.ts`,
> `packages/validators/src/events/base.ts`, `packages/validators/src/utils/type-bridge.ts`, and
> `packages/validators/AGENTS.md`. It is the companion reference to **ADR 0010 (Date Coercion)**,
> **ADR 0011 (Diamond Seal Layer Boundaries)**, and **ADR 0018 (API Validator Schema Design)**.
>
> This document describes **how** to build validators. ADR 0011 describes **where** each layer
> may import. ADR 0010 describes the **two-layer date coercion** pattern.
> The ownership/laws contract for this zone is `docs/API_VALIDATOR_ZONE.md` (the Canonical Gate).

---

## 1. The Two Validator Zones

All validators live under `packages/validators/src/` in two distinct zones:

| Zone       | Path                        | Purpose                                                                            | Envelope                                                              |
| ---------- | --------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **API**    | `api/[domain].api.ts`       | Request/response contracts between the NestJS tRPC backend and Expo/Next frontends | Raw schema (no envelope)                                              |
| **Events** | `events/[domain].events.ts` | Event payloads for the internal event bus (outbox → RabbitMQ/Redis)                | `eventEnvelopeSchema(payload)` wraps in `{ header, source, payload }` |

**Never mix these zones.** API schemas guard the HTTP/tRPC boundary. Event schemas guard the
message boundary. They have different shapes, different consumers, and different rules:

- API schemas may derive from Drizzle Dumb Zod (`*SelectSchema` / `*InsertSchema`) or be hand-built (query params, geo inputs).
- Event schemas are always hand-built — **events are NOT database shapes**.
- API files must NOT import from `events/`; event files must NOT import from `api/`.

---

## 2. API Validator Design (`api/[domain].api.ts`)

### 2.0 Derive-and-Sculpt Quick Reference

Sculpt the Dumb Zod — **never hand-write a DB field**. Each operation has one job:

| Op           | Use for                                                               |
| ------------ | --------------------------------------------------------------------- |
| `.pick({})`  | select the subset of columns valid as *input* (prefer over `.omit()`) |
| `.omit({})`  | strip audit columns from *responses* (`createdBy`, `validTo`)         |
| `.extend()`  | add coercion (`z.coerce.date<string>()`) or narrow/replace a type     |
| `.partial()` | make every field optional for *update* schemas                        |
| `.strict()`  | bolt on last — reject unknown keys (the border)                       |

> **Note on `tenantId`:** Rocky's tables do not carry a `tenantId` column — multi-tenancy is
> enforced by RLS / the execution context. The Rocky rule is: strip **audit** columns
> (`createdBy`, `validTo`) from responses.

**DO**
- Derive response: `*SelectSchema.omit({ createdBy: true, validTo: true }).extend({ enums }).strip()`.
- Derive create input: `*InsertSchema.pick({...}).extend({...}).strict()`.
- Pair each schema with a hand-written `interface` + a `NoDrift` guillotine alias.
- Re-alias enum schemas (`export const statusSchema = dbStatusSchema`) — never redefine the atoms (they live in `../enums/domain.js`).

**DO NOT**
- Hand-type a field that exists in the DB schema (duplication = drift risk).
- Export audit columns (`createdBy`, `validTo`) in responses.
- Ship a create/update schema without `.strict()` — unknown keys breach the border.
- Redefine enum atoms in `api/` — import from `../enums/domain.js`.
- Leave a schema without its `_drift_*` entry in the `ActivateGuillotines` array.
- Use `as z.ZodType<T>` where `satisfies` / `NoDrift` suffices — `as` is the last resort of the defeated.
- Import from `events/`, `domains-*`, or other `api/` domains.
- Declare the same name as both `interface X` and `type X` (duplicate identifier).
- Write `schema.satisfies(z.ZodType<T>)` — `satisfies` is the TypeScript **postfix** operator:
  `schema satisfies z.ZodType<T>` (or `.strict() satisfies z.ZodType<T>`).

### 2.1 The Golden Rule

**Every schema derives from Drizzle Dumb Zod when a DB table exists.** Never manually type
`id`, `createdAt`, `updatedAt`, `createdBy`, `validTo`, or any field that exists in the database.

```
DB pgTable → drizzle-kit generate → @rocky/database/zod → *SelectSchema / *InsertSchema → API schemas
```

Dumb Zod (in `@rocky/database/zod`) is **read-only** — it must never itself call `.extend()`,
`.omit()`, or `.strict()`. Those transforms happen in the API file.

### 2.2 Response Schemas (SELECT shape)

```typescript
import { animalSelectSchema } from "@rocky/database/zod";

export const animalResponseSchema = animalSelectSchema
  .omit({ createdBy: true, validTo: true })
  .extend({
    birthDate: z.coerce.date<string>(),          // L1 strict wire contract (see §2.10)
    taggingDate: z.coerce.date<string>().nullable(),
    status: animalStatusSchema,
    sex: sexSchema,
    birthType: birthTypeSchema.nullable(),
  })
  .strip(); // responses may use .strip() — extra future-DB-columns don't break API
```

**Rules:**

- Import `*SelectSchema` from `@rocky/database/zod`.
- Always `.omit()` internal/audit fields (`createdBy`, `validTo`) — the API never exposes audit columns.
- Always `.extend()` typed string columns with their branded enum schema (`animalStatusSchema`, not `z.string()`).
- Response schemas use `.strip()` (tolerates future DB columns) — see ADR 0010 §Response Schemas.
- Always `satisfies z.ZodType<Interface>` — compile-time proof.

### 2.3 Create Input Schemas (INSERT shape)

```typescript
import { farmInsertSchema } from "@rocky/database/zod";

export const createFarmRequestSchema = farmInsertSchema
  .pick({
    legacyId: true,
    addressId: true,
    name: true,
    parentFarmId: true,
    location: true,
  })
  .extend({
    farmId: farmIdSchema.optional(),
    type: farmTypeSchema.optional(),
    dataSource: dataSourceSchema.optional(),
  })
  .strict() satisfies z.ZodType<CreateFarmRequest>;
```

**Rules:**

- Import `*InsertSchema` from `@rocky/database/zod`.
- Prefer `.pick()` over `.omit()` — see §2.6 (new DB columns leak under `.omit()`).
- Use `.extend()` to override validation: add enum schemas, check-digit schemas, **and `z.coerce.date<string>()` for date fields**.
- `createInsertSchema` already strips `id` / `createdAt` / `updatedAt`; `.pick()` removes the doubt entirely.
- Always `.strict()` on create/update inputs.

### 2.4 Update Input Schemas

```typescript
export const updateAnimalRequestSchema = z
  .strictObject({
    breed: z.string().max(50).optional(),
    birthType: birthTypeSchema.optional(),
    birthWeight: z.int().positive().optional(),
    status: animalStatusSchema.optional(),
    currentFarmId: z.uuid().optional(),
    taggingDate: z.coerce.date<string>().optional(),  // L1 strict wire contract
    isFirstTagging: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "At least one field must be updated")
  satisfies z.ZodType<UpdateAnimalRequest>;
```

Update schemas are almost always **hand-built** (not Dumb Zod derived) because:

- Every field is optional (partial update).
- They typically need a `.refine()` requiring at least one field.
- The DB insert shape includes fields that cannot be updated (`earTagNumber`, `birthDate`).

**Rules:**

- Use `z.strictObject({...})` (Zod 4 idiom).
- All fields `.optional()` — the client sends only what it wants to change.
- Date fields use `z.coerce.date<string>().optional()` — strict wire contract.
- Include the "at least one field" refinement.
- **`satisfies` goes on the OUTERMOST call — after `.refine()`** (see Pitfall 7).

### 2.5 When to Stay Manual (Hand-built)

Some inputs have no corresponding DB table or combine multiple tables. These stay as hand-built schemas:

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
  limit: z.int().min(1).max(100).default(20),
  offset: z.int().min(0).default(0),
}) satisfies z.ZodType<AnimalListRequest>;

// Input combining fields from multiple tables / using check-digit schemas
export const findAnimalByTagRequestSchema = z.strictObject({
  earTag: earTagSchema,            // branded check-digit schema from utils/check-digit
  stateCode: z.string().length(3).default("MK"),
}) satisfies z.ZodType<FindAnimalByTagRequest>;
```

**Use `z.strictObject()` when:**

- The input has no corresponding DB table (query params, search filters, pagination).
- The input combines fields from multiple tables.
- The input uses check-digit schemas, branded types, or geo coordinates.

### 2.6 `.pick()` vs `.omit()` — The Leak Hazard

When a new column is added to the Drizzle schema:

- `.omit({ knownFields })` — the new column is NOT omitted, so it **leaks** into the API contract.
- `.pick({ knownFields })` — the new column is NOT picked, so it stays **hidden** until explicitly added.

**Recommendation:** Use `.pick()` for every create/update schema. Use `.omit()` only for response
schemas, where you know exactly which audit fields to strip.

### 2.7 Strictness: `.strict()` vs `.strip()` (current state)

| Context                         | Pattern                          | Rationale                                                                                                             |
| ------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Response schemas**            | `.strip()`                       | Tolerates future DB columns — extra fields don't break the API contract. Response must always be backward-compatible. |
| **Create/Update input schemas** | `.strict()`                      | Rejects unknown keys — the API must fail on unexpected input. Prevents silent data corruption.                        |
| **Query/Param schemas**         | `.strict()` / `z.strictObject()` | Rejects unknown query parameters.                                                                                     |

This is a deliberate divergence from some interpretations of "Diamond Seal strictness everywhere."
Responses must be resilient to DB schema evolution. Inputs must be strict.

### 2.8 Enums

**Never use inline unions.** Always import from the enum SSOT:

```typescript
// ✅ Correct
import { animalStatusSchema } from "../enums/domain.js";

// ❌ Crime
const statusSchema = z.enum(["alive", "dead", "slaughtered", "stolen", "lost"]);
```

The enum chain is: `database/constants/` → `validators/enums/domain.ts` → `zEnum()` → exported as
`*Schema` + `*Type`. Inline unions drift from the DB constant and silently break on enum changes.

**Two distinct enum imports, two distinct purposes:**

| Import                      | What you get                                                    | Use it for                                                                                                     |
| --------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `../enums/domain.js`        | branded Zod enum schemas (`*Schema`) + inferred types (`*Type`) | validation inside a schema (`.extend({ status: statusSchema })`), and `z.infer<typeof statusSchema>` as a type |
| `@rocky/database/constants` | plain readonly dictionaries (`ANIMAL_STATUS`, etc.)             | runtime lookups, `switch` statements, passing the `VALUES` array into `z.enum()` only when no `*Schema` exists |

Rule of thumb: if you need it **inside a Zod schema or as a TypeScript type**, import the `*Schema`
from `../enums/domain.js`. If you need the raw string union **at runtime** (a switch, an options
array), import the `CONSTANT` from `@rocky/database/constants`. **Never write `z.enum([...])` by hand
in `api/`** — the values must be referenced from the SSOT constants so they can never diverge.

Enum schemas are **re-aliased**, never redefined:

```ts
import { animalStatusSchema } from "../enums/domain.js";
// Re-alias under a backward-compatible name (atoms stay in ../enums)
export const statusSchema = animalStatusSchema;
```

### 2.9 Import Checklist

Every `api/[domain].api.ts` file must import from:

- `@rocky/database/zod` — for `*SelectSchema` and `*InsertSchema` (Dumb Zod)
- `../enums/domain.js` — for all zEnum schemas and types
- `zod` — for `z.strictObject()`, `z.uuid()`, `z.coerce.date()`, `.refine()`, etc.
- `../utils/type-bridge.js` — for `NoDrift`, `NoDriftSimple`, `ActivateGuillotines`
- `../utils/check-digit.js` — for `earTagSchema`, `farmIdSchema`, etc.

Every schema must end with `satisfies z.ZodType<Interface>`.
Every file must end with `export type _DomainGuillotines = ActivateGuillotines<[...]>`.

**Never import from:**

- `@rocky/database` or `@rocky/database/schema` directly — always the `/zod` subpath.
- `@rocky/validators/api` — no cross-domain API imports.
- `@rocky/validators/events` — no event imports in API files.
- `@rocky/domains-*` — domain services consume schemas, never the reverse.

### 2.10 Date Management — The Two-Layer Truth

**This is the single most important validation pattern in the codebase.** See ADR 0010 for the full architectural reasoning.

#### L2 (Dumb Zod) — Tolerant

The Drizzle schema factory uses `coerce: { date: true }`, so all Dumb Zod schemas emit `z.coerce.date()` with input type `Date | string`. This tolerates whatever the DB/JSON layer gives — pure `z.date()` would reject serialized string values from tRPC, queues, and JSONB round-trips.

```typescript
// L2 — auto-generated from factory (you don't write this):
export const myTableSelectSchema = createSelectSchema(myTable);
// → startDate: z.coerce.date()  (input: Date | string)
```

#### L1 (API Validators) — Strict

When an L1 schema `.extend()`s a Dumb Zod date field, it MUST use `z.coerce.date<string>()` — the generic `<string>` locks the wire input type to `string`, preventing TS2345 errors in `.pipe()` chains.

| Context                         | Pattern                   | When                                                |
| ------------------------------- | ------------------------- | --------------------------------------------------- |
| Response schema date fields     | `z.coerce.date<string>()` | Override Dumb Zod to demand strict string from wire |
| Create/Update input date fields | `z.coerce.date<string>()` | Always — wire sends ISO strings                     |
| Query param date fields         | `z.coerce.date<string>()` | If the param is a date (rare)                       |
| Hand-built schema date fields   | `z.coerce.date<string>()` | Always — never use bare `z.date()` in L1            |

**Why response schemas also use `<string>`:** Even though SuperJSON handles serialization, the response schema's `.extend()` overrides the Dumb Zod field. If you extend a date field, you MUST specify the coercion — otherwise the field reverts to whatever type inference gives you. Always use `z.coerce.date<string>()` in `.extend()`.

```typescript
// ✅ Correct L1 patterns:
export const responseSchema = baseSelectSchema
  .extend({
    startDate: z.coerce.date<string>(),           // input: string, output: Date
    endDate: z.coerce.date<string>().nullable(),   // input: string | null, output: Date | null
  })
  .strip();

export const createSchema = baseInsertSchema
  .pick({ startDate: true, endDate: true })
  .extend({
    startDate: z.coerce.date<string>(),           // strict wire contract
    endDate: z.coerce.date<string>().nullable(),
  })
  .strict();
```

### 2.11 Cross-Field Validation

Cross-field validation (e.g., "endDate must be after startDate", "at least one of X or Y must be set")
lives ONLY at L1 — it is an interaction semantic, meaningless inside Postgres.

Use `.superRefine()` with an explicit `path: ["fieldName"]` so React Hook Form displays the error
on the correct input:

```typescript
export const createContractRequestSchema = z.strictObject({
  startDate: z.coerce.date<string>(),
  endDate: z.coerce.date<string>(),
  // ...
}).superRefine((data, ctx) => {
  if (data.endDate && data.endDate <= data.startDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "End date must be after start date",
      path: ["endDate"],  // 🚨 Points error at the specific UI field
    });
  }
}) satisfies z.ZodType<CreateContractRequest>;
```

**Rules:**

- `.superRefine()` goes at the VERY END of the schema chain — after `.strict()`, after all `.extend()`/`.pick()`/`.omit()`
- Always specify `path: ["fieldName"]` — never leave it unset (defaults to root `""`)
- Use `.superRefine()` over `.refine()` when you need field-level error paths
- Cross-field validation NEVER goes in Dumb Zod (L2)
- Simple single-field refinements (like "birth date not in future") can use `.refine()` — but prefer `.superRefine()` with `path` for consistency

### 2.12 The Null vs Default Paradox

**The Law:** `.default()` triggers ONLY on `undefined`. If the frontend sends `null`, Zod treats it as a value and bypasses `.default()`.

```typescript
// The trap:
const schema = z.enum(['it', 'es']).nullish().transform(x => x ?? undefined).default('it');
schema.safeParse(null);  // → undefined (NOT 'it'!)
// Why? null is a value → .default() doesn't fire → transform turns null→undefined → done
```

**The Diamond Seal Solution:**

If you need "null and undefined both map to default", use one of:

```typescript
// Option A: .catch() — catches null/failed parse, falls back to default
const languageSchema = z.enum(['it', 'es', 'fr', 'uk'])
  .nullable()
  .optional()
  .catch('it');  // null or undefined → 'it'

// Option B: .transform() — explicit null coalescing
const languageSchema = z.enum(['it', 'es', 'fr', 'uk'])
  .nullable()
  .optional()
  .transform(x => x ?? 'it');  // null or undefined → 'it'
```

**Rule of thumb:** If the frontend might send `null` and you want a default, use `.catch()` or
`.transform(x => x ?? defaultValue)`. Never rely on `.default()` alone for nullable fields.

---

## 3. Event Validator Design (`events/[domain].events.ts`)

### 3.1 The 4-Part Canonical Blueprint

Every event MUST follow this exact 4-part structure:

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
  currentFarmId: string;
  isFirstTagging: boolean;
}

// ═══════════════════════════════════════════════════════════════
// PART 2: The Strict Payload Schema
// ═══════════════════════════════════════════════════════════════
export const animalRegisteredPayloadSchema = z.strictObject({
  animalId: z.uuid(),
  stateCode: z.string().length(3),
  earTagNumber: z.string().length(8),
  birthDate: z.date(),
  sex: sexSchema,
  breed: z.string().nullable(),
  birthType: birthTypeSchema.nullable(),
  currentFarmId: z.uuid(),
  isFirstTagging: z.boolean(),
}) satisfies z.ZodType<AnimalRegisteredPayload>;

// ═══════════════════════════════════════════════════════════════
// PART 3: The Full Event Schema
// ═══════════════════════════════════════════════════════════════
// Wraps the standalone payload into the event envelope (header + source + payload).
export const AnimalRegisteredEvent = eventEnvelopeSchema(animalRegisteredPayloadSchema);
export type AnimalRegisteredEvent = z.infer<typeof AnimalRegisteredEvent>;

// ═══════════════════════════════════════════════════════════════
// PART 4: The Guillotine
// ═══════════════════════════════════════════════════════════════
type _drift_animalRegisteredPayload = NoDrift<
  z.infer<typeof animalRegisteredPayloadSchema>,
  AnimalRegisteredPayload
>;
```

### 3.2 Why 4 Parts?

| Part                        | Who uses it                       | Why separated                                                |
| --------------------------- | --------------------------------- | ------------------------------------------------------------ |
| **Interface** (Part 1)      | Domain services, handlers         | Depend on types, not Zod. Import without the Zod dependency. |
| **Payload Schema** (Part 2) | EventPublisher, integration tests | Standalone validation — no envelope needed.                  |
| **Event Schema** (Part 3)   | EventPublisher, queue consumers   | Full envelope with `header`, `source`, typed `payload`.      |
| **Guillotine** (Part 4)     | Compiler                          | If interface and schema diverge → fails at `tsc`.            |

### 3.3 The Event Envelope (`events/base.ts`)

All events share a common structure defined in `packages/validators/src/events/base.ts`:

```typescript
eventEnvelopeSchema(payloadSchema) → z.strictObject({
  header: eventHeaderSchema,   // eventId, eventType, version, timestamp, causationId, correlationId, ...
  source: eventSourceSchema,   // userId, source ("API"|"MOBILE"|"SYNC"|"SYSTEM"|"IMPORT"|"WEBHOOK"), ipAddress, userAgent
  payload: payloadSchema,      // The domain-specific payload
})
```

The `eventEnvelopeSchema()` factory handles the wrapping — each domain `events.ts` only defines
the payload and calls the factory.

### 3.4 Event Type Naming Convention

```
{domain}.{entity}.{action}
```

Examples from the codebase:

- `animal.registered` · `animal.moved` · `animal.died` · `animal.slaughtered` · `animal.status_changed`
- `ear-tag.allocated` · `ear-tag.applied` · `ear-tag.replaced`
- `farm.registered` · `subject.bound_to_farm`

### 3.5 Shared Sub-Schemas

When multiple events share a payload shape, extract it with its own guillotine:

```typescript
export interface EntityChange {
  field: string;
  oldValue?: unknown;
  newValue: unknown;
}
export const entityChangeSchema = z.strictObject({
  field: z.string(),
  oldValue: z.unknown().optional(),
  newValue: z.unknown(),
}) satisfies z.ZodType<EntityChange>;
type _drift_entityChange = NoDrift<z.infer<typeof entityChangeSchema>, EntityChange>;
```

### 3.6 Import Checklist

Every `events/[domain].events.ts` file must import from:

- `zod` — for `z.strictObject()`, etc.
- `../enums/domain.js` — for enum schemas used in payloads
- `./base.js` — for `eventEnvelopeSchema()`
- `../utils/type-bridge.js` — for `NoDrift`, `ActivateGuillotines`

**Never import from:**

- `@rocky/database` or `@rocky/database/zod` — events are NOT DB shapes
- `@rocky/validators/api` — no API imports in event files
- Other event files — no cross-domain event imports

---

## 4. The Three-Tier Guillotine (Compile-Time Drift Enforcement)

Defined in `packages/validators/src/utils/type-bridge.ts`. The guillotine guarantees that a Zod
schema and its TypeScript interface never drift apart.

### Tier 1 — `satisfies z.ZodType<Interface>` on the schema declaration

```typescript
export const farmResponseSchema = farmSelectSchema
  .omit({ createdBy: true, validTo: true })
  .extend({ status: farmStatusSchema })
  .strict() satisfies z.ZodType<FarmResponse>;
```

**Checks:** schema `_output` is assignable to the interface. **Misses:** interface wider than
schema (extra optional fields, wider unions). **Rule:** use on schemas with a **hand-written
interface** (request schemas, hand-built payloads, event payloads).

> **Constraint — `satisfies z.ZodType<z.infer<typeof schema>>` is illegal.** A type alias
> `X = z.infer<typeof schema>` referenced inside `satisfies` on the same schema is a circular
> reference (TS2456). Therefore response schemas that derive their type via
> `export type X = z.infer<typeof XSchema>` do **not** carry `satisfies`; their guillotine alias is
> the tautological `NoDrift<z.infer<typeof XSchema>, X>` (= `true`). This is the dominant pattern
> (e.g. `farms.api.ts` response schemas).

> **Curated subset responses.** When an interface is intentionally narrower than the schema output
> (e.g. `CorrectionResponse`, `PassportResponse`), `NoDrift` (bidirectional `AssertEqual`) rejects
> it. Use the sanctioned last-resort from `utils/type-bridge.ts`: `type _drift_X = true;`
> (removes coverage). The one-directional `satisfies` on the schema still enforces the contract.

### Tier 2 — `NoDrift` / `NoDriftSimple` on a type alias

```typescript
// NoDrift: full structural identity via AssertEqual — use on responses, hand-built, events
type _drift_farmResponse = NoDrift<z.infer<typeof farmResponseSchema>, FarmResponse>;

// NoDriftSimple: bidirectional extends — use on Drizzle-derived request schemas (avoids union false-positives)
type _drift_createAnimal = NoDriftSimple<z.infer<typeof createAnimalRequestSchema>, CreateAnimalRequest>;

// NoDrift: hand-built event payloads
type _drift_animalRegisteredPayload = NoDrift<z.infer<typeof animalRegisteredPayloadSchema>, AnimalRegisteredPayload>;
```

- **`NoDrift`** — catches BOTH directions. Use on response, hand-built, and event schemas.
- **`NoDriftSimple`** — immune to false positives on complex union types crossing Drizzle-Zod boundaries. Use on request schemas derived from Dumb Zod.

**Escalation when `NoDrift` false-positives:** (1) switch to `NoDriftSimple`; (2) fix the
interface to match the schema (schema is SSOT); (3) last resort `type _drift_x = true` removes coverage.

### Tier 3 — `ActivateGuillotines<[...]>` at file end

```typescript
export type _AnimalGuillotines = ActivateGuillotines<
  [_drift_animalResponse, _drift_animalSummary, _drift_createAnimalRequest,
   _drift_updateAnimalRequest, _drift_animalListRequest, _drift_findAnimalByTagRequest]
>;
```

TypeScript type aliases are lazy — unreferenced aliases are never evaluated. `ActivateGuillotines`
forces evaluation; if any alias resolved to a drift tuple instead of `true`, the `true[]`
constraint fails and compilation errors.

**Rule:** Every `*.api.ts` and every `*.events.ts` MUST export a `*Guillotines` type alias.

### Drift fixes

| Error                   | Direction   | Cause                                                                   | Fix                         |
| ----------------------- | ----------- | ----------------------------------------------------------------------- | --------------------------- |
| `"DRIFT (B narrower)"`  | B ← A fails | Interface narrower than schema (e.g. `string` vs `string \| undefined`) | Widen interface / add `?`   |
| `"DRIFT (A narrower)"`  | A ← B fails | Schema narrower than interface (e.g. `.extend()` drops `null`)          | Remove `\| null` from iface |
| `"TYPE DRIFT DETECTED"` | AssertEqual | Higher-kinded equality failed (often union false positive)              | Switch to `NoDriftSimple`   |

---

## 5. The `satisfies` vs `as` Dialectic

**For Sovereign Internal schemas (the entire current Rocky codebase):** Always
`satisfies z.ZodType<T>`. We control both the schema and the interface. If `satisfies` fails,
either the schema or the interface is wrong — never paper over it with `as`.

**For future Vendor/External integrations (Telegram, Discord, Viber, etc.):** Use `as z.ZodType<T>`
only when necessary:

| Category                                                   | Pattern                    | Why                                                    |
| ---------------------------------------------------------- | -------------------------- | ------------------------------------------------------ |
| **Small stable union** (e.g. sticker type)                 | `z.enum()` + `satisfies`   | Vendor union is small, changes rarely                  |
| **Large open union** (e.g. 100+ currency codes)            | `z.string()` + `as`        | Vendor adds values; runtime must not crash the webhook |
| **Zod 4 branded internals** (`z.int()`, `z.coerce.date()`) | Schema + `as` + guillotine | `satisfies` conflicts with Zod 4's `$ZodTypeInternals` |

**Rule of thumb:** Inside our domain → `satisfies`. At the vendor boundary → `as` only when
necessary. The `NoDrift` guillotine catches shape drift in both cases.

---

## 6. Zod 4 Idiom Reference

The codebase targets Zod 4. A mix of `z.object({...}).strict()` and `z.strictObject({...})`
currently exists; the long-term target is `z.strictObject()` for API and event schemas.

| Zod 3                           | Zod 4 (Rocky)                                         |
| ------------------------------- | ----------------------------------------------------- |
| `z.object({...}).strict()`      | `z.strictObject({...})` or `z.object({...}).strict()` |
| `z.object({...}).passthrough()` | `z.looseObject({...})`                                |
| `z.string().uuid()`             | `z.uuid()`                                            |
| `z.number().int()`              | `z.int()`                                             |
| `.default()` with transforms    | `.prefault()` if the default needs parsing            |
| `err.format()`                  | `z.treeifyError(err)`                                 |
| `z.record(valueSchema)`         | `z.record(z.string(), valueSchema)`                   |

---

## 7. Common Pitfalls

### Pitfall 1: Manual DB field reconstruction
```typescript
// ❌ Crime — breaks when the DB schema changes
export const schema = z.strictObject({ id: z.uuid(), earTagNumber: z.string().length(8), birthDate: z.date() });
// ✅ Correct — auto-inherits from Dumb Zod
export const schema = animalSelectSchema.omit({ createdBy: true, validTo: true }).extend({ status: animalStatusSchema });
```

### Pitfall 2: Missing `.strict()` (target) on input schemas
```typescript
// ❌ Weaker — silently drops unknown keys
export const schema = animalSelectSchema.omit({ createdBy: true });
// ✅ Correct — rejects unknown keys
export const schema = animalSelectSchema.omit({ createdBy: true }).strict();
```

### Pitfall 3: Inline enum unions instead of SSOT
```typescript
// ❌ Crime — duplicates the literal, drifts from the DB constant
const statusSchema = z.enum(["alive", "dead", "slaughtered", "stolen"]);
// ✅ Correct
import { animalStatusSchema } from "../enums/domain.js";
```

### Pitfall 4: Event without all 4 parts
```typescript
// ❌ Crime — no interface, no standalone payload, no guillotine
export const AnimalDiedEvent = eventEnvelopeSchema(z.strictObject({ animalId: z.uuid(), farmId: z.uuid() }));
// ✅ Correct — all 4 parts (see §3.1)
```

### Pitfall 5: Optional key mismatch (the #1 `satisfies` catch)
```typescript
// ❌ Interface: key REQUIRED (must exist, even if undefined)
reason: string | null | undefined;
// ✅ Zod: key OPTIONAL (can be absent)
reason: z.string().nullable().optional();
// With `as`: compiles, bug hidden. With `satisfies`: compiler error.
// ✅ Fix: add `?` to interface, drop `| undefined`
reason?: string | null;
```

### Pitfall 6: `.pick()` vs `.omit()` — new columns leak (see §2.6)

### Pitfall 7: `satisfies` + `.refine()` ordering
`satisfies` must go on the OUTERMOST call — after `.refine()`:
```typescript
// ✅ Correct
z.object({...}).extend({...}).refine(fn, { message }) satisfies z.ZodType<Interface>;
// ❌ Wrong — satisfies on inner ZodObject, refine returns a different type
z.object({...}).extend({...}) satisfies z.ZodType<Interface> .refine(fn, { message });
```

### Pitfall 8: `Partial<T>` for recursive schemas
```typescript
// ❌ Circular type reference
const schema = z.strictObject({ child: schema.optional() });
// ✅ Use z.lazy()
const schema: z.ZodType<TreeNode> = z.lazy(() =>
  z.strictObject({ value: z.string(), children: z.array(schema).optional() }));
```

### Pitfall 9: Bare `z.date()` in L1 API schemas
```typescript
// ❌ Crime — rejects string input from the wire
startDate: z.date(),
// ✅ Correct — coerce from string
startDate: z.coerce.date<string>(),
```

### Pitfall 10: `z.coerce.date()` without `<string>` generic
```typescript
// ❌ Input type is `Date | string` — breaks pipe chains (TS2345)
startDate: z.coerce.date(),
// ✅ Input type is `string` — strict wire contract
startDate: z.coerce.date<string>(),
```

### Pitfall 11: `.default()` on nullable fields (expecting null → default)
```typescript
// ❌ .default() only triggers on undefined, NOT null
field: z.string().nullable().default('fallback'),
// ✅ Use .catch() or .transform() to handle null
field: z.string().nullable().catch('fallback'),
```

---

## 8. Step-by-Step: Adding a New Domain

### Step 1: Verify Drizzle-Zod exports exist
```bash
ls packages/database/src/zod/<domain>.ts
```
If missing, create it with `createSelectSchema` / `createInsertSchema` from the Dumb Zod factory.

### Step 2: Create API schemas — `packages/validators/src/api/<domain>.api.ts`
- [ ] Import `*SelectSchema`, `*InsertSchema` from `@rocky/database/zod`
- [ ] Response: `*SelectSchema.omit({auditFields}).extend({enums, dates: z.coerce.date<string>()}).strip()`
- [ ] Create: `*InsertSchema.pick({userFields}).extend({overrides, dates: z.coerce.date<string>()}).strict()`
- [ ] Update: hand-built `z.strictObject({...})`, all fields `.optional()` + "at least one" refine
- [ ] Dates ALWAYS use `z.coerce.date<string>()` — never bare `z.date()` in L1
- [ ] Cross-field validation: `.superRefine()` with `path: ["fieldName"]` at end of chain
- [ ] Query/special: `z.strictObject({...})`
- [ ] Enums: from `../enums/domain.js`, never inline
- [ ] Every schema: `satisfies z.ZodType<Interface>`
- [ ] Every drift: `NoDrift` / `NoDriftSimple` type alias
- [ ] File end: `export type _DomainGuillotines = ActivateGuillotines<[...]>`
- [ ] `npx tsc --noEmit -p packages/validators/tsconfig.json` → 0 errors

### Step 3: Create event schemas (if the domain emits events) — `packages/validators/src/events/<domain>.events.ts`
- [ ] Part 1: payload interface
- [ ] Part 2: payload schema with `satisfies`
- [ ] Part 3: `eventEnvelopeSchema(payloadSchema)`
- [ ] Part 4: `type _drift_* = NoDrift<...>`
- [ ] Barrel export in `events/index.ts`

### Step 4: Build the domain service + tRPC router
- Service imports types FROM validators (never the reverse).
- Router imports schemas from `@rocky/validators/api`, delegates to the service, unwraps `Result<T,E>`.

### Step 5: Verify full compilation
```bash
npx tsc --noEmit -p packages/validators/tsconfig.json   # ✓
npx tsc --noEmit -p apps/api/tsconfig.json             # ✓
```

---

## 8b. Who consumes these validators

`api/[domain].api.ts` schemas are the **single contract** for every external caller:

- **`apps/api` tRPC routers** — the primary consumer. Each router imports the `*Schema` from
  `@rocky/validators/api` and uses it as the input/response type. The schema *is* the tRPC procedure
  contract.
- **Frontends (`apps/web`, `apps/mobile`)** — do **not** import api schemas directly. They consume the
  **generated tRPC client** (`@rocky/trpc` → `packages/trpc/src/generated/server.ts`), whose types
  are derived from these schemas. The border stays server-side.
- **Event consumers / workers** — do **not** consume api schemas. They consume `events/` schemas (the
  event protocol), not the API gate. Keep this boundary strict.
- **Domain services (`packages/domains`)** — receive already-validated, tenant-scoped data from the
  router; they do not re-import api schemas.

Author the shape once in `api/`, and it propagates to every router and every frontend client through
the tRPC codegen — no manual re-typing downstream.

---

## 9. File Structure Summary

```
packages/validators/src/
├── api/
│   ├── animals.api.ts          ← Animal CRUD response + request (Diamond Seal)
│   ├── eartags.api.ts          ← Ear tag lifecycle + orders
│   ├── farms.api.ts            ← Farm response + registration
│   ├── movements.api.ts        ← Movement response + request
│   ├── subjects.api.ts         ← Subject response + binding
│   ├── users.api.ts            ← User response + request
│   ├── rbac.api.ts             ← Role/permission response + assignment
│   ├── organizations.api.ts    ← Organization response + request
│   ├── notifications.api.ts    ← Notification response + request
│   ├── archive.api.ts health.api.ts inspection.api.ts iot.api.ts passport.api.ts
│   ├── correction.api.ts registration.api.ts holdings.api.ts pda-devices.api.ts document.api.ts
│   └── index.ts                ← Barrel
├── events/
│   ├── base.ts                 ← Event envelope factory, header, source schemas
│   ├── animals.events.ts       ← Animal lifecycle events
│   ├── eartags.events.ts       ← Ear tag lifecycle events
│   ├── farms.events.ts         ← Farm lifecycle events
│   └── index.ts                ← Barrel
├── enums/
│   ├── domain.ts               ← zEnum schemas + types (SSOT, generated from DB constants)
│   └── index.ts
├── errors/                     ← Per-domain error classes (mapped to tRPC by @rocky/errors/trpc)
├── utils/
│   ├── check-digit.ts          ← Ear tag + Farm ID check-digit algorithms
│   └── type-bridge.ts          ← NoDrift, AssertEqual, NoDrillSimple, ActivateGuillotines
└── index.ts
```

---

## 10. Enforcement

There is no `panopticon` CLI in this repository. Drift is enforced by:

1. **`tsc --noEmit`** on `packages/validators` — the three-tier guillotine makes drift a compile error.
2. **CI lint** — import-boundary rules from ADR 0011 (api.ts → no `events/`, `domains/`, `integrations/`).
3. **Code review checklist** — every schema `satisfies`; every file exports `*Guillotines`; date fields use `z.coerce.date<string>()`.

### Review Checklist (updated 2026-07-07)

- [ ] Does `api.ts` use `.strip()` on responses and `.strict()` on inputs?
- [ ] Do all date fields use `z.coerce.date<string>()` — never bare `z.date()`?
- [ ] Are cross-field validations in `.superRefine()` with explicit `path: []`?
- [ ] Is `.default()` only used where null is impossible (no `.nullable()` before it)?
- [ ] Does `api.ts` have `NoDrift` guillotines and `ActivateGuillotines` export?
- [ ] Does `router.ts` contain business logic? (Never)
- [ ] Does `service.ts` return `Result<T,E>`?
- [ ] Does `repository.ts` extend `BaseRepository` and avoid forbidden imports?

**Target: 0 drift crimes, 0 boundary violations, 0 date coercion bugs.**

---

*This document is the definitive reference for the Diamond Seal API & event validator design in Rocky.*
*Grounds ADR 0010 (date coercion), ADR 0011 (layer boundaries), and ADR 0018 (API validator schema design).*
