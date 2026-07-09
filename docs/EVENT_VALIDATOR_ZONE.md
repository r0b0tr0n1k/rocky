# Event Validator Zone — The Internal Postal Service

> **Source of Truth:** This zone doc is the ownership/laws contract for `packages/validators/src/events/`.
> It is adapted from the canonical "Diamond Seal" event-zone writeup, corrected to Rocky's real
> conventions (verified against the live code and `tsc`). The step-by-step *how-to* lives in
> `docs/VALIDATOR_DESIGN_GUIDE.md`; the ratified decisions are **ADR 0011** (layer boundaries)
> and **ADR 0018** (validator schema design, ratified for the api zone and re-affirmed here for
> events). Enforcement is `tsc --noEmit`, not a Panopticon CLI (no `tribunal.sh` exists in this
> repository).

## Purpose

Event envelope schemas — the **4-Part Canonical Blueprint** for internal communication. Typed
envelopes carry typed payloads. Always `.strict()` on both the payload and the envelope. Always a
`NoDrift` guillotine per payload. The validators package is the **postal service** of the internal
economy: events travel between backend services over the internal bus (RabbitMQ/Redis), never across
the HTTP boundary.

## Ownership

**L1 — Diamond Seal, event protocol layer.** The Validation Bot owns this zone (`packages/validators/AGENTS.md`).

## The 4-Part Canonical Blueprint

Every event schema follows this exact pattern (see `packages/validators/src/events/base.ts` and any
`*.events.ts`):

```
PART 1: Interface (the Constitution)
  → export interface AnimalRegisteredPayload { animalId: string; ... }

PART 2: Payload Schema (the Law)
  → export const animalRegisteredPayloadSchema = z.strictObject({...})
      satisfies z.ZodType<AnimalRegisteredPayload>;

PART 3: Event Envelope (the Envelope)
  → export const AnimalRegisteredEvent = eventEnvelopeSchema(animalRegisteredPayloadSchema);
  → export type AnimalRegisteredEvent = z.infer<typeof AnimalRegisteredEvent>;

PART 4: Verification (the Guillotine)
  → type _drift_animalRegisteredPayload = NoDrift<
       z.infer<typeof animalRegisteredPayloadSchema>, AnimalRegisteredPayload>;
```

The envelope is produced by the `eventEnvelopeSchema(payloadSchema)` factory in `events/base.ts`,
which wraps the payload in `{ header, source, payload }`. The header carries the `eventType`
discriminator as a plain `z.string().min(1)` — set at publish time, named `<domain>.<action>` (e.g.
`animal.registered`). It is NOT a per-schema `z.literal()`; the discriminator lives in the header, not
in a duplicate field on the payload.

## Strict Laws

### LAW 1: The 4-Part Pattern Is Mandatory

No event schema is complete without all four parts. No exceptions. A bare
`eventEnvelopeSchema(z.strictObject({...}))` with no interface and no guillotine is a crime — the
drift check is never evaluated.

### LAW 2: `.strict()` on the Payload (the Envelope Is Already Strict)

- Payload: `z.strictObject({...})` — no undocumented fields in internal communication.
- Envelope: `eventEnvelopeSchema()` already returns a `z.strictObject`, so the envelope is sealed by
  construction. Do not `.passthrough()` or `.looseObject()` it.
- Event type naming: `eventType` in the header follows `<domain>.<action>` (lowercase, dot-separated).

### LAW 3: Import from `../enums/index.js` ONLY (The Barrel)

- Import enum schemas AND enum types from `../enums/index.js` — the public barrel.
- NEVER import from `../enums/domain.js`. `domain.ts` is the **private** auto-generated implementation
  (rebuilt by `scripts/regenerate-enums.mjs`). A deep import couples event files to generator internals
  and exposes the raw `*_VALUES` arrays, inviting hand-built `z.enum([...])` drift.

```typescript
// ✅ Correct — public barrel (schemas + types)
import { animalStatusSchema } from "../enums/index.js";
import type { animalStatusType } from "../enums/index.js";

// ❌ Crime — deep import into the generator artifact
import { animalStatusSchema } from "../enums/domain.js";
```

### LAW 4: No Enum Atoms

- Same as the api zone: USE enums, never DEFINE atoms.
- Atoms live in `database/src/constants/` (and are surfaced as branded `*Schema` via the barrel). Never
  hand-write `z.enum([...])` inside an event payload.
- For a runtime string union (a switch / options list), import the `CONSTANT` from
  `@rocky/database/constants` — never the raw `*_VALUES` from `domain.js`.

### LAW 5: No Vendor, API, or DB Imports

- Import from: `zod`, `../enums/index.js`, `./base.js`, `../utils/type-bridge.js`.
- NEVER import from `@rocky/database` or `@rocky/database/zod` — **events are NOT database shapes.**
  Payloads are hand-built from the domain contract, never derived from Drizzle Dumb Zod.
- NEVER import from `../api/` — different protocol layer (HTTP vs message bus).
- NEVER import from `integrations/` or `vendor-enums/` — **Rocky does not use vendor enums.** Events
  are vendor-independent by law; the event protocol carries only internal branded domain enums (or a
  plain `z.string()` where no internal equivalent exists). Translate any vendor wire format at the
  boundary that owns the vendor SDK, not inside the event protocol.

### LAW 6: `NoDrift` on Every Payload

- `type _drift = NoDrift<z.infer<typeof payloadSchema>, PayloadInterface>;`
- Inline at the bottom of the file, or collected into the file's `ActivateGuillotines` export (Tier 3).
- Zero tolerance for payload-interface drift.

## Allowed Enums — Internal Domain Enums Only

Events are the **internal postal service**; they carry state between backend services, never a
vendor's wire format. Therefore the enum whitelist is strict:

| Enum source                                         | Allowed in events? | Why                                                                 |
| --------------------------------------------------- | ------------------ | ------------------------------------------------------------------- |
| `../enums/index.js` (branded `zEnum` `*Schema`/`*Type`) | ✅ YES         | Internal domain enums — the canonical SSOT output                   |
| `@rocky/database/constants` (Dictionary / `_VALUES`)   | ⚠️ RARELY      | Only for a runtime switch; prefer the branded schema from the barrel |
| `@rocky/database/zod` (`*SelectSchema` enum fields)    | ❌ NO          | Events are NOT DB shapes — payloads are hand-built                  |
| `integrations/<vendor>/` (vendor enums)                | ❌ NO          | Vendor-specific; events are vendor-independent by law              |
| `vendor-enums/`                                       | ❌ NO          | Re-export storefront — same prohibition as `integrations/`         |

## Work Guidance

- File naming: `<domain>.events.ts` (animals.events.ts, farms.events.ts, eartags.events.ts).
- Import `eventEnvelopeSchema` from `./base.js` (shared envelope factory).
- Use branded `*Schema` / `*Type` from `../enums/index.js` for enum fields.
- Event type string: `<domain>.<action>` (lowercase, dot-separated) — assigned in the header at publish.
- When multiple events share a payload shape, extract a shared payload schema (with its own
  `satisfies` + `NoDrift` guillotine) and reuse it.
- Every file ends with `export type _<Domain>Guillotines = ActivateGuillotines<[...]>`. Without this
  export, the lazy type aliases are never evaluated and drift stays hidden.

## Consumer Topology — Who Consumes These Validators

The `events/[domain].events.ts` schemas are the **message-boundary contract** for the internal bus.
The validators package is a **vertical waterfall**, not a horizontal utility:

- **`apps/api` publishers / queue consumers** — the primary consumer. They import the payload schema
  and `eventEnvelopeSchema` from `@rocky/validators/events`. The event is the contract.
- **Domain services / handlers** — import the **payload interface** (Part 1), not the Zod schema.
  Depend on types, not on the validator dependency.
- **Frontends (`apps/web`, `apps/expo`) / `apps/worker`** — do **NOT** import event schemas directly.
  Events flow through the internal bus, never across the HTTP boundary; workers consume events from
  the bus, they do not import the schema source.

## Verification

```bash
# Real enforcement in this repo — the guillotine makes drift a tsc error.
npx tsc --noEmit -p packages/validators/tsconfig.json
```

> **No Panopticon / tribunal.sh.** Unlike the foreign Diamond Seal writeup, this repository has no
> `tribunal.sh` CLI. Import-boundary rules (ADR 0011) and guillotine drift (ADR 0018) are enforced
> entirely by `tsc`. CI lint covers the import allowlist.

### Success Criteria

- [ ] `npx tsc --noEmit -p packages/validators/tsconfig.json` — 0 errors
- [ ] Every event file exports `ActivateGuillotines<[...]>`
- [ ] No `../enums/domain.js` deep imports (barrel only)
- [ ] No `@rocky/database/zod` imports (events are not DB shapes)
- [ ] No `integrations/` or `vendor-enums/` imports (vendor enums are not used)
- [ ] Every payload: `z.strictObject({...})` + `satisfies z.ZodType<Interface>` + `NoDrift` alias
