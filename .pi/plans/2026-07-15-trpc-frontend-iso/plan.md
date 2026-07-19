# Plan: Frontend tRPC Conformance Suite + Enterprise-grade ISO Dashboard

**Date:** 2026-07-15
**Status:** Draft (decision LOCKED)
**Directory:** `/home/goce/appz/rocky`
**Plan ID:** `2026-07-15-trpc-frontend-iso`
**Tag:** `trpc-frontend-iso`

> **Decision is locked.** This plan does not ask further questions. It operationalizes two
> verified facts from the scout report (`.pi/plans/2026-07-15-trpc-frontend-iso/scout-context.md`):
> (1) `appRouter.createCaller()` validates input but runs **placeholder** resolvers, so real
> resolver logic must be exercised by instantiating the **router class** with a stubbed service;
> (2) the dashboard is functionally rich but the ergonomics/localization/GDPR-operational/E2E
> layers are essentially greenfield. Both parts are delivered through the existing RobotFarm
> guardians (`check:adrs`, `check:md-links`, `check:standards`), so every step keeps `pnpm ci:checks`
> green.

---

## Intent

Make the frontend a first-class, **verified** conformance surface in two moves:

1. **Part 1 — Frontend tRPC conformance suite.** Exhaustively cover **all 181 tRPC procedures** (25
   routers, 366 validator schemas, 97 enums) with **ZERO hand-written literals/enums** by deriving
   every input from Zod schemas (schema-walker reading `.shape`/`.options`) and the **54 existing
   `@rocky/testing` factories**; prove input enforcement at the wire for all 181 (positive + negative
   per validator), **plus** router-class-with-stub behavioral tests on a ~12-15 router representative
   subset (all tiers, every error-map domain) to prove `createResultUnwrapper` + real output.
2. **Part 2 — Enterprise-grade dashboard ISO roadmap.** Extend **ADR-0105 Waves 0-4** into a concrete
   enterprise roadmap: app-wide skip-link / semantic `<main>`, i18n + MK-LPDP locale switching,
   DSR/data-subject UI (closes the earlier backend gap), Playwright E2E on the dashboard, and a
   WCAG/ISO 9241 program — and reconcile `frontend-conformity.md` (F-02 is IMPLEMENTED, doc says
   PLANNED). Reserve new ADR IDs **> 0105**.

---

## PDCA Structure

| Phase | Part 1 (test suite) | Part 2 (dashboard ISO) |
| --- | --- | --- |
| **Plan** | Build schema-walker + factory/schema input builder; enumerate all 181 procedures via `appRouter._def.procedures` | Reconcile F-02; extend ADR-0105 waves; reserve ADR-0106..0112 |
| **Do** | Wire/input-acceptance + negative tests for all 181; router-class-with-stub tests on ~12-15 | Implement skip-link, i18n, DSR UI, Playwright, a11y gate, KPIs, hardening; per-page checklist |
| **Check** | `pnpm test` (vitest) green; zero literals grep; `check:adrs`/`check:standards` green | Browser-harness a11y DoD; `check:standards` single-token SoA; new ADRs conform |
| **Act** | Fold suite into `ci:checks` regression gate; document derivation rule | RobotFarm pass: update ADR-0105 Related + `frontend-conformity.md` rows + AGENTS.md |

---

## PART 1 — Frontend tRPC Conformance Suite

### P1 Architecture

- **Home:** extend `packages/trpc/src/e2e/` (already owns `appRouter` + wire-boundary pattern). Add
  `@rocky/testing` (and `@faker-js/faker`) as **devDependencies** of `@rocky/trpc` so tests import
  `@rocky/testing/factory` + walk `@rocky/validators/api`. `@rocky/database`/`@rocky/validators` are
  already deps.
- **Universal driver:** iterate `Object.entries(appRouter._def.procedures)` to obtain every procedure's
  Zod input parser — this covers **all 181** procedures with no hand-maintained list.
- **Two test tiers:**
  - **Tier A — wire/input acceptance + negative** (all 181): `appRouter.createCaller(ctx)` proves the
    Zod input schema rejects bad input and accepts derived-good input. (Placeholders mean output is
    meaningless — we assert *input enforcement only*.)
  - **Tier B — router-class behavioral** (~12-15 representative routers): `new XRouter(stub).method(input, ctx)`
    runs the **real** resolver (`createResultUnwrapper` + service). Decorators are erased at runtime, so
    plain args work.
- **Zero-literal rule (mandatory #1):** input data is produced either by a `@rocky/testing` factory
  (preferred for entity routers) or by the **schema-walker** reading Zod `.options`/`.shape` (for the
  8 factory-less routers: `modules`, `system-parameters`, `ched`, `eudr`, `diseaseZone`, `holdings`,
  `params`, `registration`, and as the universal primitive). Enum values come from `schema.options`
  (or the factory's `*_VALUES`), never from a string literal in a test file.

### Technique (a) — The Zod schema-walker *(runnable)*

`packages/trpc/src/e2e/schema-walker.ts` — derives a schema-valid example object for ANY Zod input
schema. No literals, no enums hardcoded; reads `.shape` (objects) and `.options` (enums).

```typescript
// packages/trpc/src/e2e/schema-walker.ts
import { faker } from "@faker-js/faker";

// biome-ignore lint/suspicious/noExplicitAny: test introspection utility
type Z = any;

const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)]!;

/** Unwrap ZodOptional / ZodNullable to the inner schema. */
function unwrapMeta(s: Z): Z {
  while (s?._zod?.def?.type === "optional" || s?._zod?.def?.type === "nullable") {
    s = s._zod?.def?.innerType ?? s.innerType ?? s;
    if (!s?._zod) break;
  }
  return s;
}

/** Read an enum's values from Zod 4 (.options) or internal def. */
function enumValues(s: Z): string[] | null {
  const inner = unwrapMeta(s);
  if (Array.isArray(inner?.options)) return inner.options as string[];
  const vals = inner?._zod?.def?.values;
  if (Array.isArray(vals)) return Array.from(vals) as string[];
  return null;
}

/** Read a uuid-format check if present (z.uuid()). */
function isUuid(s: Z): boolean {
  const inner = unwrapMeta(s);
  const checks = inner?._zod?.def?.checks ?? [];
  return checks.some((c: Z) => c?.kind === "uuid");
}

/** Read an email-format check if present (z.email()). */
function isEmail(s: Z): boolean {
  const inner = unwrapMeta(s);
  const checks = inner?._zod?.def?.checks ?? [];
  return checks.some((c: Z) => c?.kind === "email");
}

/**
 * Derive a schema-VALID value for any Zod schema, recursively.
 * @param schema   the Zod schema (input parser)
 * @param omitKeys optional keys to OMIT (used to build negative cases)
 */
export function derive(schema: Z, omitKeys: string[] = []): unknown {
  const s = unwrapMeta(schema);
  if (!s || typeof s.safeParse !== "function") return null;

  const enums = enumValues(s);
  if (enums) return pick(enums);                       // ZERO literal enums

  if (s.shape) {                                       // ZodObject
    const out: Record<string, unknown> = {};
    for (const [key, field] of Object.entries(s.shape)) {
      if (omitKeys.includes(key)) continue;            // build negative variant
      out[key] = derive(field);
    }
    return out;
  }

  const type = s._zod?.def?.type;
  switch (type) {
    case "string": return isUuid(s) ? crypto.randomUUID()
                    : isEmail(s) ? faker.internet.email()
                    : faker.string.alpha({ length: 10 });
    case "number":
    case "int":    return faker.number.int({ min: 1, max: 10_000 });
    case "boolean": return faker.datatype.boolean();
    case "date":    return new Date();
    case "array":   return [derive(s._zod?.def?.element ?? s.element)];
    default:        return faker.string.alpha({ length: 10 });
  }
}

// Negative builder: corrupt exactly ONE required field (enum -> bad value, uuid -> "x").
export function negativeFor(schema: Z): { input: any; badKey: string } {
  const good = derive(schema) as Record<string, unknown>;
  const shape = (schema as Z).shape ?? {};
  const keys = Object.keys(good ?? {});
  const key = keys[0] ?? "id";
  const field = shape[key];
  const enums = enumValues(field);
  good[key] = enums ? "___NOT_A_VALID_ENUM___" : "not-a-uuid";
  return { input: good, badKey: key };
}
```

### Technique (b) — Factory / schema-derived input builder *(runnable)*

`packages/trpc/src/e2e/input-builder.ts` — prefers a `@rocky/testing` factory for entity routers;
falls back to the walker. For the 8 factory-less routers the walker is the sole source. The result is
always a schema-valid input for the **procedure's input schema** (not the select schema).

```typescript
// packages/trpc/src/e2e/input-builder.ts
import { faker } from "@faker-js/faker";
import { derive } from "./schema-walker.js";
// Entity factories (only the ones that exist) — imported lazily per router.
import {
  AnimalFactory, FarmFactory, MovementFactory, InspectionFactory,
  CattlePassportFactory, UserFactory, RoleFactory, VaccinationFactory,
  EarTagFactory, ArchiveDocumentFactory, NotificationFactory,
  OrganizationFactory, SubjectFactory, AuditLogFactory, IotDeviceFactory,
  VsAssignmentFactory, VsContractFactory, PdaDeviceFactory,
} from "@rocky/testing/factory";

// Map a router alias to a factory that can produce a realistic entity.
const FACTORY_BY_ROUTER: Record<string, () => { create: (o?: any) => any }> = {
  animal: () => new AnimalFactory(faker.string.uuid()),
  farm: () => new FarmFactory(faker.string.uuid()),
  movement: () => new MovementFactory(),
  inspection: () => new InspectionFactory(),
  passport: () => new CattlePassportFactory(faker.string.uuid()),
  user: () => new UserFactory(),
  rbac: () => new RoleFactory(),
  health: () => new VaccinationFactory(),
  eartag: () => new EarTagFactory(),
  archive: () => new ArchiveDocumentFactory(faker.string.uuid()),
  notification: () => new NotificationFactory(),
  organization: () => new OrganizationFactory(),
  subject: () => new SubjectFactory(faker.string.uuid()),
  audit: () => new AuditLogFactory(),
  iot: () => new IotDeviceFactory(),
  "vs-assignment": () => new VsAssignmentFactory(),
  "vs-contract": () => new VsContractFactory(),
  device: () => new PdaDeviceFactory(),
  // NOTE: modules, system-parameters, ched, eudr, diseaseZone, holdings,
  //       params, registration have NO factory -> walker only.
};

/**
 * Build a schema-valid input for a procedure input schema.
 * Prefers the factory (realistic FK ids); otherwise derives from schema.
 */
export function buildInput(routerAlias: string, inputSchema: any): any {
  const factory = FACTORY_BY_ROUTER[routerAlias];
  if (factory) {
    // Use the factory's created entity where its shape overlaps the request DTO;
    // fill the rest (and non-overlapping fields) from the schema walker.
    const entity = factory().create();
    const fromWalker = derive(inputSchema) as Record<string, unknown>;
    return { ...fromWalker, ...pickOverlap(entity, fromWalker) };
  }
  return derive(inputSchema);   // factory-less routers -> pure schema derivation
}

// Only copy keys that the request schema actually declares (no select-only fields).
function pickOverlap(entity: any, requestShape: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(requestShape)) if (k in entity) out[k] = entity[k];
  return out;
}
```

### Technique (c) — createCaller wire / input-acceptance + negative test *(runnable)*

`packages/trpc/src/e2e/wire-acceptance.test.ts` — iterates **all 181** procedures. Assertion is
input-enforcement only (placeholders make output a no-op). Positive = accepts derived-good input;
negative = rejects corrupted input with `TRPCError`.

```typescript
// packages/trpc/src/e2e/wire-acceptance.test.ts
import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { appRouter } from "../index.js";
import { derive, negativeFor } from "./schema-walker.js";
import { buildInput } from "./input-builder.js";

describe("tRPC wire boundary — every procedure (input enforcement)", () => {
  const caller = appRouter.createCaller({ headers: new Headers() });

  // Object.entries(appRouter._def.procedures) -> "animal.getById", "movement.recordDeath", ...
  for (const [path, def] of Object.entries(appRouter._def.procedures as Record<string, any>)) {
    const [routerAlias, method] = path.split(".");
    const inputParser = def._def.inputs?.[0] ?? def._def.inputParser; // Zod input schema
    if (!inputParser) continue; // procedures with no input

    it(`accepts derived-good input: ${path}`, async () => {
      const input = buildInput(routerAlias, inputParser);
      // Placeholder resolver returns a string; we only prove the wire accepted it.
      await expect(caller[routerAlias as any][method as any](input)).resolves.toBeDefined();
    });

    it(`rejects corrupted input: ${path}`, async () => {
      const { input } = negativeFor(inputParser);
      await expect(
        caller[routerAlias as any][method as any](input),
      ).rejects.toThrow(TRPCError);
    });
  }
});
```

### Technique (d) — Router-class-with-stub behavioral test *(runnable)*

`packages/trpc/src/e2e/router-behavioral.test.ts` — instantiates the **real router class** with a stub
service (decorators erased at runtime), proving `createResultUnwrapper` maps domain `Result` errors to
`TRPCError` and that the resolver returns the real output. Covers ~12-15 routers spanning all tiers and
every error-map domain (animal, movement, inspection, passport, rbac, eartag, health, farm, user,
organization, archive, notification, geo, correction, subject).

```typescript
// packages/trpc/src/e2e/router-behavioral.test.ts
import { describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { ok, err } from "@rocky/domains-shared";
import { createResultUnwrapper } from "../index.js";
import { buildInput } from "./input-builder.js";
import { derive } from "./schema-walker.js";
import { createAnimalRequestSchema } from "@rocky/validators/api";

// import real router classes (decorators are erased at runtime)
import { AnimalRouter } from "../../../../apps/api/src/routers/animal.router.js";
import { MovementRouter } from "../../../../apps/api/src/routers/movement.router.js";
import { AnimalNotFoundError } from "@rocky/domains-animal";
import { ANIMAL_TRPC_ERROR_MAP } from "@rocky/validators/errors/index.js";

const ctx = { headers: new Headers(), execution: { principal: { id: "00000000-0000-0000-0000-000000000000" } } } as any;

describe("Router-class behavioral — createResultUnwrapper + real output", () => {
  it("AnimalRouter.create returns real output via unwrapper (stub ok)", async () => {
    const stub = { create: vi.fn().mockResolvedValue(ok({ id: "abc", status: "alive" })) } as any;
    const router = new AnimalRouter(stub);                 // @Inject erased at runtime
    const out = await router.create(buildInput("animal", createAnimalRequestSchema) as any, ctx);
    expect(out).toMatchObject({ id: "abc" });
    expect(stub.create).toHaveBeenCalledOnce();
  });

  it("AnimalRouter.getById maps NotFoundError -> TRPCError NOT_FOUND", async () => {
    const stub = { getById: vi.fn().mockResolvedValue(err(new AnimalNotFoundError("animal", "x"))) } as any;
    const router = new AnimalRouter(stub);
    await expect(router.getById({ id: "x" }, ctx)).rejects.toThrow(TRPCError);
    await expect(router.getById({ id: "x" }, ctx)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("MovementRouter stub exercises unmapped error -> INTERNAL_SERVER_ERROR", async () => {
    const stub = { recordDeath: vi.fn().mockResolvedValue(err(new Error("boom"))) } as any;
    const router = new MovementRouter(stub);
    await expect(router.recordDeath({ animalId: "x", cause: "DISEASE" } as any, ctx))
      .rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
  });
});
```

### P1 Coverage guarantee

- **181/181 procedures** driven by `appRouter._def.procedures` iteration (Tier A).
- **366 schemas / 97 enums** exercised because the walker reads every field's `.shape` + `.options`.
- **8 factory-less routers** covered by the walker alone (verified against the coverage map in the
  scout report A.6).
- **Zero literals**: a CI guard regex lint forbids bare enum strings in `packages/trpc/src/e2e/**`
  (e.g. `rg -n '"[A-Z_]{3,}"' src/e2e` must be empty).

---

## PART 2 — Dashboard ISO Conformance + Enterprise Roadmap

### P2 Strategy

Extend **ADR-0105 Waves 0-4** (do not rewrite them). Reconcile `frontend-conformity.md`, then land the
enterprise-grade waves. Every landed Wave updates the SoA row (single status token) + adds evidence to
`isms-policy.md`; RobotFarm pass updates ADR-0105 Related + `AGENTS.md` Bot descriptions.

### Technique (e) — Per-page dashboard ISO checklist *(runnable as a CI assertion)*

Applied to **all 50 `(admin)` pages + the auth sign-in page**. The browser-harness DoD in ADR-0105 is
the gate. Encode it as an executable checklist (Playwright + `browser_execute_js`):

```typescript
// apps/web/e2e/iso-checklist.ts — run per (admin) route
export interface PageIsoCheck {
  route: string;
  expectations: {
    singleMain: boolean;     // exactly one <main>
    singleNav: boolean;      // exactly one <nav>
    skipLinkFirst: boolean;  // first focusable element is the skip-link
    inputsNoLabel: number;   // 0
    btnsNoName: number;      // 0
    headingStartsAtH1: boolean;
    contrastMin: number;     // >= 4.5
    fullKeyboardPath: boolean;
    rbacViaUseCan: boolean;  // no presentation-only security
    noPiiInError: boolean;   // error boundary/toast never leaks PII/stack
    typedTrpcOnly: boolean;  // pages use AppRouter types, no hand-built fetch
    i18nFromDict: boolean;   // no inline language literals
  };
}

// Evaluated in the browser harness:
// document.querySelectorAll('main').length === 1
// document.querySelectorAll('nav').length === 1
// document.activeElement?.textContent?.includes('Skip') === true
// [...document.querySelectorAll('input,select,textarea')].filter(el => !el.labels?.length && !el.getAttribute('aria-label')).length === 0
// [...document.querySelectorAll('button, [role=button]')].filter(el => !el.textContent?.trim() && !el.getAttribute('aria-label')).length === 0
```

The full per-page checklist table (route -> F-xx mapped) is enumerated in `todos.md` (one todo per
page-group) and lives as the acceptance record in `frontend-conformity.md`.

### Technique (f) — `frontend-conformity.md` F-02 fix *(runnable diff)*

F-02 is **IMPLEMENTED** (CSP in `apps/web/next.config.ts`) but the doc says PLANNED. `check:standards`
enforces a single status token + controlled language, so the edit must keep exactly one token and
"shall/should/may/can" wording.

```diff
- | F-02 | Security headers / CSP | A.8.23 / .26 / .28; ISO 27034; GDPR 32 | PLANNED | none in `next.config.ts` | 0 |
+ | F-02 | Security headers / CSP | A.8.23 / .26 / .28; ISO 27034; GDPR 32 | IMPLEMENTED | `next.config.ts` `headers()` (CSP + X-Frame-Options/HSTS/X-Content-Type-Options/Referrer-Policy/Permissions-Policy); nonce hardening tracked in Wave 0.5 | - (maintain) |
```

Also update the **Current state** bullet that lists `Absent: CSP / security headers;` -> remove CSP from
the absent list (keep the genuinely absent items: DSR UI, i18n, WCAG program, E2E, etc.). The governing
ADR link (ADR-0105) is already present, so `(a)` passes; `(b)` single-token preserved; `(d)` no new
"must" introduced.

### P2 — Enterprise waves (extend ADR-0105)

- **Wave 0.5 (CSP hardening):** per-request nonce (replace `'unsafe-eval'`/static CSP), security.txt +
  compliance footer, CSP violation-reporting endpoint.
- **Wave 1+ (GDPR operational UI):** actually **wire DSR/erasure/access UI** (F-04) to
  `rocky-dsr-procedure.md` (ROCKY-DSR-001) + `rocky-erasure-retention-procedure.md` (ROCKY-ERP-001); add
  a "My Data" data-subject portal (access export + erasure request) — the biggest legal gap.
- **Wave 2+ (ergonomics & localization):** skip-link (F-06) app-wide + auth pages; full a11y pass via the
  browser harness; **i18n MK<->EN** (F-08) with MK as the LPDP default locale (GDPR 12(1), MK LPDP).
- **Wave 3+ (quality & assurance):** **Playwright E2E** covering every `(admin)` page as a regression
  gate (treat the 181-procedure wire suite as the contract gate); SQuaRE 25010 KPI dashboard + 25023
  measurement; PII-free telemetry + UI audit-action logging (A.5.28, A.8.15/.16).
- **Wave 4+ (hardening):** step-up re-auth for `sm:sysparams:write` / user/rbac mutations; `pnpm` SCA in
  CI; PII-safe error boundary + centralized error reporting.

### New ADR IDs reserved (> 0105; current highest = 0105)

| ADR | Title | Governs |
| --- | --- | --- |
| **ADR-0106** | DSR / Data-Subject Request UI | F-04 — wire `rocky-dsr-procedure.md` (ROCKY-DSR-001) + `rocky-erasure-retention-procedure.md` (ROCKY-ERP-001) to UI; "My Data" portal |
| **ADR-0107** | Frontend i18n + MK-LPDP Locale Switching | F-08 — locale provider, `lang` attr, MK as default, dictionary from `@rocky/validators/enums` |
| **ADR-0108** | WCAG 2.1 AA / ISO 9241 Ergonomics Program | F-06/F-07 — skip-link, landmarks, focus order, contrast, keyboard; browser-harness gate |
| **ADR-0109** | Playwright E2E + Component Testing for Dashboard | F-09 — `apps/web/e2e/`, per-page smoke, 181-procedure contract gate |
| **ADR-0110** | SQuaRE 25010/25023 KPIs + PII-free Telemetry + UI Audit Logging | F-10/F-11/F-12 |
| **ADR-0111** | Frontend Hardening: Step-up Re-auth + SCA + PII-safe Error Boundaries | F-13/F-14/F-15 |
| **ADR-0112** | Frontend tRPC Conformance Test-Suite Architecture | Part 1 — hybrid wire/input + router-class-with-stub; schema-walker; factory/schema-derived inputs |

Each new ADR is authored as **Proposed** (conforming to ADR-0033 / `ADR-TEMPLATE.md`) so `check:adrs`
stays green. ADR-0105's Related list is extended to reference 0106-0112.

---

## MANDATORY NON-NEGOTIABLES — mapping

1. **Zero hand-written literals/enums** -> schema-walker (`.options`/`.shape`) + `@rocky/testing`
   factories + `SchemaDataFactory` derivation; CI regex guard. Covers 366 schemas / 97 enums.
2. **Reconcile F-02** -> Technique (f); single token + controlled language for `check:standards`.
3. **Extend ADR-0105 Waves 0-4** -> P2 enterprise waves + new ADRs 0106-0112 (DSR UI, i18n, a11y,
   Playwright, KPIs, hardening) + per-page checklist (e).
4. **Reserve new ADR IDs > 0105** -> 0106-0112 (Table above).
5. **Every dashboard page follows ISO standards** -> per-page checklist (e) maps each `(admin)` page +
   sign-in to F-xx + ISO anchors; browser-harness DoD is the gate.

---

## Ideal State Criteria

### Core Functionality

- [ ] ISC-1: All 181 tRPC procedures are driven by an automated iterator (no hand-maintained list).
- [ ] ISC-2: Every procedure has a positive (accepts derived-good input) and negative (rejects corrupted input) wire test.
- [ ] ISC-3: The 8 factory-less routers (modules, system-parameters, ched, eudr, diseaseZone, holdings, params, registration) are covered by the schema-walker.
- [ ] ISC-4: A representative ~12-15 router subset has router-class-with-stub tests proving `createResultUnwrapper` maps domain errors to `TRPCError`.
- [ ] ISC-5: `frontend-conformity.md` F-02 row reads `IMPLEMENTED` with exactly one status token.
- [ ] ISC-6: Every `(admin)` page + sign-in satisfies the per-page ISO checklist (single `<main>`, skip-link first-focusable, `inputsNoLabel===0`, `btnsNoName===0`).

### Edge Cases

- [ ] ISC-7: Optional/nullable fields are exercised both present and omitted by the walker.
- [ ] ISC-8: Enum fields always receive a value read from `schema.options` (never a literal).
- [ ] ISC-9: Unmapped domain errors fall back to `INTERNAL_SERVER_ERROR` in router-class tests.

### Anti-Criteria

- [ ] ISC-A-1: No hand-written enum string literal appears in any `packages/trpc/src/e2e/**` test file.
- [ ] ISC-A-2: No test edits or relies on the generated `PLACEHOLDER_DO_NOT_REMOVE` resolver output as if it were real.
- [ ] ISC-A-3: `frontend-conformity.md` contains no SoA row with more than one status token (else `check:standards` fails).

---

## Risks & Open Questions

- **R1 (from scout G.1):** `appRouter.createCaller` proves input only — mitigated by Tier B router-class
  tests with stubs; real-DB resolver coverage stays in `apps/api` Nest harness (out of scope here).
- **R2 (G.2):** no schema-walker existed — built here; risk is Zod 4 internal-shape drift -> walker reads
  both `.options` and `_zod.def.values` defensively.
- **R3 (G.4):** `check-standards` polices doc edits — every F-status flip keeps one token + controlled
  language; CI runs `pnpm check:standards`.
- **R4 (G.6):** `apps/web` vitest include is `lib/**` only — page/E2E tests go to `apps/web/e2e/`
  (Playwright), not the vitest `app/**` path; tRPC contract tests stay in `packages/trpc/src/e2e/`.
- **R5 (G.7):** `@rocky/trpc` lacks `@rocky/testing` devDep — added in the first Part-1 todo; this is
  the only dependency change needed.
- **Open:** whether DSR UI needs a new backend endpoint or reuses `rocky-dsr-procedure.md` — ADR-0106 to
  decide; parked as a Wave 1+ work item, not a blocker.

---

## Guardians (keep green)

`pnpm ci:checks` runs: `generate:trpc -> check:trpc-boundary -> check:adrs -> check:md-links -> check:standards -> check:agents -> check:pdfa -> check:web-parity -> test`.

- `check:adrs` — 7 new ADRs (0106-0112) conform to `ADR-TEMPLATE.md`.
- `check:md-links` — every new ADR <-> `frontend-conformity.md` link resolves; no `../` escapes.
- `check:standards` — F-02 single token; no "must"; governing-ADR link present.
- `test` — vitest runs the new `packages/trpc/src/e2e/**` suite; `apps/web` Playwright/`lib` tests pass.

Sequencing in `todos.md` orders work so these stay green at every commit (docs/ADR first where they
gate, then code).
