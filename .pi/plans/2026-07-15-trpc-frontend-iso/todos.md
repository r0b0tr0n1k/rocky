# Todos — `trpc-frontend-iso`

> Worker-executable. Tag every commit/PR `trpc-frontend-iso`. Sequences work so the RobotFarm guardians
> (`check:adrs`, `check:md-links`, `check:standards`, `test`) stay green at every step. Plan:
> `.pi/plans/2026-07-15-trpc-frontend-iso/plan.md`. Decisions LOCKED.

## Sequencing principle

1. Docs/ADRs first where they gate code (F-02 fix before anything reads it; new ADRs Proposed so
   `check:adrs` is already green).
2. Part 1 dependency add (T-01) unblocks all tRPC tests; Part 1 tests (T-02..T-06) are self-contained
   in `packages/trpc/src/e2e/` and auto-covered by `pnpm ci:checks -> pnpm test`.
3. Part 2 pages are grouped; each lands its `frontend-conformity.md` SoA row (single token) before the
   next Wave.

---

## Part 1 — Frontend tRPC Conformance Suite

### TODO-001 — Add `@rocky/testing` + `@faker-js/faker` as `@rocky/trpc` devDeps

- **Commit:** `build(trpc): add @rocky/testing and @faker-js/faker devDeps for e2e suite`
- **Files:** `packages/trpc/package.json`
- **Refs:** `packages/trpc/package.json` (already depends on `@rocky/database`, `@rocky/validators`; lacks `@rocky/testing`) · `packages/trpc/vitest.config.ts` (`include: ["src/**/*.test.ts"]` already covers `src/e2e/`)
- **Action:** add `"@rocky/testing": "workspace:*"` and `"@faker-js/faker": "catalog:"` to `devDependencies`. Run `pnpm install`. Confirm `import { AnimalFactory } from "@rocky/testing/factory"` resolves inside `packages/trpc`.
- **Anti-pattern:** do NOT add `@rocky/trpc` to `@rocky/testing` instead — keep the suite home in `packages/trpc/src/e2e/` per locked decision.
- **Acceptance:** `pnpm --filter @rocky/trpc test` runs; `pnpm check:adrs`/`check:standards` still green; no other package changed. (ISC-1 enabler, R5)

### TODO-002 — Add the Zod schema-walker utility

- **Commit:** `test(trpc): add schema-walker deriving values from Zod .shape/.options`
- **Files:** `packages/trpc/src/e2e/schema-walker.ts` (NEW)
- **Refs:** `packages/validators/src/enums/domain.ts` (`zEnum` → `z.enum`, `.options` available) · `packages/trpc/src/e2e/trpc-wire-boundary.test.ts` (pattern) · plan Technique (a)
- **Action:** implement `derive(schema, omitKeys?)` + `negativeFor(schema)` exactly as plan Technique (a). Read enum values from `.options` (Zod 4) with fallback to `_zod.def.values`; unwrap `optional`/`nullable` via `_zod.def.type`; detect `z.uuid()`/`z.email()` via `_zod.def.checks`. Map `string`→faker word, `number`/`int`→int, `boolean`→bool, `date`→`new Date()`, objects→recurse `.shape`.
- **Anti-pattern:** do NOT hardcode any enum string or field value; derive everything. Do NOT rely on a single Zod-version internal path — keep the defensive fallbacks.
- **Acceptance:** a tiny inline check `derive(someEnumSchema)` returns a value present in `schema.options`; walker has no literal enum strings. (ISC-3, ISC-8)

### TODO-003 — Add the factory/schema-derived input builder

- **Commit:** `test(trpc): add input-builder preferring @rocky/testing factories, walker fallback`
- **Files:** `packages/trpc/src/e2e/input-builder.ts` (NEW) · `packages/testing/src/factory/index.ts` (barrel: `@rocky/testing/factory`)
- **Refs:** `packages/testing/src/factory/base.ts` (`SchemaDataFactory`) · scout A.6 coverage map (54 factories; 8 factory-less routers) · plan Technique (b)
- **Action:** implement `buildInput(routerAlias, inputSchema)` with `FACTORY_BY_ROUTER` for the 17 entity routers that have factories; for the 8 factory-less routers (`modules`, `system-parameters`, `ched`, `eudr`, `diseaseZone`, `holdings`, `params`, `registration`) return `derive(inputSchema)` directly. Overlap factory entity fields into the walked request DTO (`pickOverlap`).
- **Anti-pattern:** do NOT hand-write any value; do NOT feed a select schema where the input schema is needed (scout G.8).
- **Acceptance:** `buildInput("animal", createAnimalRequestSchema)` yields a schema-valid object (assert via `safeParse`); `buildInput("modules", modulesInputSchema)` works via walker alone. (ISC-3, ISC-8)

### TODO-004 — Wire/input-acceptance + negative tests for ALL 181 procedures

- **Commit:** `test(trpc): enforce input on all 181 procedures via appRouter._def.procedures`
- **Files:** `packages/trpc/src/e2e/wire-acceptance.test.ts` (NEW)
- **Refs:** `packages/trpc/src/index.ts` (`appRouter`, `createResultUnwrapper`) · `packages/trpc/src/generated/server.ts` (PLACEHOLDER resolvers — input only) · plan Technique (c)
- **Action:** iterate `Object.entries(appRouter._def.procedures)`; for each with an input parser, one `it` asserting `caller[router][method](buildInput(...))` resolves, and one asserting `negativeFor(inputParser)` input `rejects.toThrow(TRPCError)`. Read input parser from `def._def.inputs?.[0] ?? def._def.inputParser`.
- **Anti-pattern:** do NOT assert on the placeholder return value as if it were business output (scout B.2, ISC-A-2). Do NOT maintain a hand-written procedure list.
- **Acceptance:** all 181 procedures covered (assert the generated test count ≥ 181×2); zero literal enums in file. (ISC-1, ISC-2, ISC-A-1)

### TODO-005 — Router-class-with-stub behavioral tests (~12-15 routers)

- **Commit:** `test(trpc): add router-class behavioral tests proving createResultUnwrapper + real output`
- **Files:** `packages/trpc/src/e2e/router-behavioral.test.ts` (NEW)
- **Refs:** `packages/trpc/src/unwrap.ts` (`createResultUnwrapper` maps `Error.code`→`TRPCError`) · `apps/api/src/routers/animal.router.ts` (class form, `@Inject` erased at runtime) · `packages/validators/src/errors/*` (`*_TRPC_ERROR_MAP`) · plan Technique (d)
- **Action:** instantiate `new XRouter(stubService)` for a representative subset spanning all tiers + every error-map domain (animal, movement, inspection, passport, rbac, eartag, health, farm, user, organization, archive, notification, geo, correction, subject). Stub returns `ok(...)` → assert returned object; stub returns `err(new XError())` with `.code` → assert `rejects.toMatchObject({ code: expectedTrpcCode })`; stub returns `err(new Error("boom"))` → assert `INTERNAL_SERVER_ERROR`.
- **Anti-pattern:** do NOT import from the generated `server.ts` for these — import the real `*.router.ts` class. Do NOT assume decorators inject at runtime.
- **Acceptance:** each covered router proves unwrapper mapping for ≥1 success + ≥1 mapped-error + ≥1 fallback-error path. (ISC-4, ISC-9)

### TODO-006 — CI zero-literal guard for the e2e suite

- **Commit:** `test(trpc): add zero-literal lint guard on e2e test files`
- **Files:** `packages/trpc/package.json` (add `lint:e2e-literals` script) or `.pi-lens`/biome config
- **Refs:** mandatory #1 · ISC-A-1
- **Action:** add a guard that fails if `packages/trpc/src/e2e/**` contains a bare enum-style literal (e.g. `rg -n '"[A-Z_]{3,}"' packages/trpc/src/e2e` returns nothing). Wire into `pnpm test` or a pretest. Document the rule in the suite README/header.
- **Anti-pattern:** do NOT use the guard to flag the walker's `crypto.randomUUID()` or faker calls.
- **Acceptance:** guard passes on the new suite; intentionally introducing a literal fails it. (ISC-A-1)

---

## Part 2 — Dashboard ISO Conformance + Enterprise Roadmap

### TODO-007 — Reconcile `frontend-conformity.md` F-02 (PLANNED → IMPLEMENTED)

- **Commit:** `docs(conformity): mark F-02 CSP as IMPLEMENTED in frontend-conformity.md`
- **Files:** `apps/docs/content/compliance/frontend-conformity.md`
- **Refs:** scout D.3/F.2 (CSP implemented in `apps/web/next.config.ts` `headers()`) · `scripts/check-standards.mjs` (single-token + no "must" rules) · plan Technique (f)
- **Action:** change the F-02 Table-2 row `PLANNED | none in next.config.ts | 0` → `IMPLEMENTED | next.config.ts headers() (CSP + X-Frame-Options/HSTS/X-Content-Type-Options/Referrer-Policy/Permissions-Policy); nonce hardening tracked in Wave 0.5 | — (maintain)`. Remove "CSP / security headers" from the "Absent:" bulleted list. Keep exactly ONE status token; use "shall/should/may/can" only; the ADR-0105 governing link already exists.
- **Anti-pattern:** do NOT introduce a second status token on any row (fails `check:standards`); do NOT add the word "must" outside code.
- **Acceptance:** `pnpm check:standards` green; `pnpm check:md-links` green. (ISC-5, ISC-A-3)

### TODO-008 — Author new ADRs 0106–0112 (Proposed, ADR-0033 conformant)

- **Commit:** `docs(adrs): propose ADR-0106..0112 extending ADR-0105 enterprise waves`
- **Files:** `apps/docs/content/ADR/0106-dsr-data-subject-ui.md`, `0107-frontend-i18n-mk-lpdp.md`, `0108-wcag-ergonomics-program.md`, `0109-playwright-e2e-dashboard.md`, `0110-squares-kpi-telemetry-audit.md`, `0111-frontend-hardening.md`, `0112-trpc-conformance-suite-architecture.md` (all NEW)
- **Refs:** `apps/docs/content/ADR/ADR-TEMPLATE.md` (required sections) · `apps/docs/content/ADR/0105-frontend-conformity-and-ux-controls.md` (umbrella) · plan "New ADR IDs reserved" table
- **Action:** each ADR follows the template (status Proposed, Date 2026-07-15, Context/Decision/Consequences/Implementation/Verification/Anti-Patterns/Related). 0106→F-04 DSR UI; 0107→F-08 i18n MK↔EN; 0108→F-06/F-07 ergonomics; 0109→F-09 Playwright E2E; 0110→F-10/11/12 KPIs/telemetry/audit; 0111→F-13/14/15 hardening; 0112→Part 1 test-suite architecture (cite ADR-0032 tRPC, ADR-0018/0019 validators). Each cites ≥1 backend ADR per ADR-0033 §D4.
- **Anti-pattern:** do NOT use Status other than Proposed; do NOT skip the mermaid/Verification sections the template requires.
- **Acceptance:** `pnpm check:adrs` green; each file matches `00NN-*.md`. (guardian gate)

### TODO-009 — Extend ADR-0105 Related list to 0106–0112

- **Commit:** `docs(adr): link ADR-0105 to new enterprise-wave ADRs 0106-0112`
- **Files:** `apps/docs/content/ADR/0105-frontend-conformity-and-ux-controls.md`
- **Refs:** ADR-0105 "Related ADRs" section (currently lists 0067/0052/0033/0042/0022/0084/0104)
- **Action:** add a bullet per new ADR under Related ADRs, noting which Wave it governs. Keep template sections intact.
- **Anti-pattern:** do NOT rewrite the Waves — only link; keep ADR-0105 as the umbrella.
- **Acceptance:** `pnpm check:adrs` + `pnpm check:md-links` green; ADR-0105 links resolve.

### TODO-010 — App-wide skip-link + semantic `<main>`/`<nav>` (F-06)

- **Commit:** `feat(web): add app-wide skip-link and guarantee semantic landmarks`
- **Files:** `apps/web/components/admin-shell.tsx`, `apps/web/app/layout.tsx`, `apps/web/app/(admin)/layout.tsx`, `apps/web/app/auth/[...path]/page.tsx`, `apps/web/app/globals.css`
- **Refs:** ADR-0105 Wave 2 / ADR-0108 · scout D.3 F-06 (`AdminShell` renders `<main>` but no skip-link) · plan Technique (e)
- **Action:** add a visually-hidden skip-link as the first focusable element (`<a href="#main" class="skip-link">Skip to main content</a>`) in the root layout and the auth page; ensure exactly one `<main id="main">` and one `<nav>`. Add `.skip-link:focus { position: static; }` CSS. Apply to sign-in page too.
- **Anti-pattern:** do NOT add more than one `<main>`; do NOT make the skip-link non-first in tab order.
- **Acceptance:** per-page checklist (e) passes: `singleMain`, `singleNav`, `skipLinkFirst` true for dashboard + sign-in. (ISC-6)

### TODO-011 — i18n MK↔EN locale switching, MK as default (F-08, ADR-0107)

- **Commit:** `feat(web): add i18n MK<->EN locale switching with MK LPDP default`
- **Files:** `apps/web/lib/i18n.ts(x)`, `apps/web/components/locale-switcher.tsx`, `apps/web/app/layout.tsx` (`lang`), `apps/web/package.json` (add i18n dep if needed)
- **Refs:** ADR-0107 · scout D.3 F-08 (`<html lang="en">` hardcoded) · `@rocky/validators/enums` (dictionary source, per `enums/index.ts` "LAW XI: frontend imports dictionaries from here")
- **Action:** add a locale provider + switcher; set `lang` from active locale (default `mk` per MK LPDP); source UI strings/dictionaries from `@rocky/validators/enums`/i18n resources; no inline language literals in pages.
- **Anti-pattern:** do NOT hardcode `lang="en"`; do NOT inline user-facing strings as literals (use dictionary).
- **Acceptance:** toggling locale flips `lang` + visible strings; checklist `i18nFromDict` true. (ISC-6)

### TODO-012 — DSR / data-subject "My Data" portal (F-04, ADR-0106)

- **Commit:** `feat(web): add DSR/data-subject portal wired to rocky-dsr/erasure procedures`
- **Files:** `apps/web/app/(admin)/data-subject/page.tsx` (NEW), `apps/web/components/data-subject/*` (NEW), `apps/web/lib/nav-config.ts`
- **Refs:** ADR-0106 · `rocky-dsr-procedure.md` (ROCKY-DSR-001) · `rocky-erasure-retention-procedure.md` (ROCKY-ERP-001) · `apps/web/lib/trpc.ts` (AppRouter client)
- **Action:** build a "My Data" page with access-request export + erasure-request forms that call the relevant tRPC procedures (typed `AppRouter`), with consent/audit trail. Gate via `useCan` for the data-subject's own scope. Do NOT claim certification.
- **Anti-pattern:** do NOT ship DSR UI without wiring it to the `rocky-*` procedure papers (ADR-0105 Anti-Pattern 1); do NOT put PII in toasts/telemetry.
- **Acceptance:** page satisfies checklist (e); `typedTrpcOnly` true; F-04 row updated to PARTIAL→IMPLEMENTED with single token. (ISC-6)

### TODO-013 — Playwright E2E scaffold for the dashboard (F-09, ADR-0109)

- **Commit:** `test(web): add Playwright E2E covering all (admin) pages + 181-procedure contract gate`
- **Files:** `apps/web/e2e/` (NEW), `apps/web/playwright.config.ts` (NEW), `apps/web/package.json` (`test:e2e` script)
- **Refs:** ADR-0109 · scout E.1 (`apps/web/vitest.config.ts` includes `lib/**` only — E2E goes to `e2e/`, not vitest `app/**`) · plan Technique (e)
- **Action:** add a Playwright config + per-`(admin)`-route smoke spec asserting the per-page ISO checklist (single `<main>`, skip-link first, `inputsNoLabel===0`, `btnsNoName===0`, heading order). Add a spec that loads the tRPC wire-acceptance summary as a contract regression gate.
- **Anti-pattern:** do NOT put E2E under the vitest `lib/**` include; do NOT rely on the placeholder resolver output for assertions.
- **Acceptance:** `pnpm --filter @rocky/web test:e2e` green; checklist `fullKeyboardPath` sampled per route. (ISC-6)

### TODO-014 — WCAG/ISO 9241 ergonomics program + browser-harness gate (F-07, ADR-0108)

- **Commit:** `feat(web): add a11y primitives and browser-harness ergonomics gate`
- **Files:** `apps/web/components/a11y/*` (skip-link already T-010; focus-trap, aria-live), `apps/web/e2e/iso-checklist.ts` (from plan Technique (e)), CI step running the browser harness
- **Refs:** ADR-0108 · ADR-0105 Verification (browser-harness DoD) · scout D.3 F-07
- **Action:** implement the executable `PageIsoCheck` from plan Technique (e); wire a CI job (or `pnpm` script) that runs the browser harness over every `(admin)` route and fails on any `inputsNoLabel>0`, `btnsNoName>0`, missing `<main>`/`<nav>`, contrast <4.5:1, or broken keyboard path.
- **Anti-pattern:** do NOT gate on lint alone (ADR-0105 Decision 7); do NOT claim WCAG certification in copy.
- **Acceptance:** `check:standards` green; harness passes all 50 pages + sign-in. (ISC-6)

### TODO-015 — SQuaRE KPIs + PII-free telemetry + UI audit logging (F-10/11/12, ADR-0110)

- **Commit:** `feat(web): add SQuaRE KPI dashboard, PII-free telemetry, UI audit-action logging`
- **Files:** `apps/web/app/(admin)/quality/page.tsx` (NEW), `apps/web/lib/telemetry.ts`, `apps/web/lib/ui-audit.ts`
- **Refs:** ADR-0110 · scout D.3 F-10/11/12 (none today) · A.5.28 / A.8.15/.16
- **Action:** define 25010 quality KPIs (functional suitability, performance, compatibility, usability, reliability, security, maintainability, portability) with 25023 measurement; emit PII-free telemetry (no names/ids/stack); log UI audit actions to the audit log via tRPC. No PII in client telemetry.
- **Anti-pattern:** do NOT send PII or stack traces to telemetry (ADR-0105 Anti-Pattern 4).
- **Acceptance:** quality page renders KPIs; telemetry contains no PII; audit actions logged. F-10/11/12 rows updated (single token). (ISC-6)

### TODO-016 — Frontend hardening: step-up re-auth + SCA + PII-safe error boundary (F-13/14/15, ADR-0111)

- **Commit:** `feat(web): add step-up re-auth, CI SCA, and PII-safe error boundaries`
- **Files:** `apps/web/components/step-up/*` (NEW), `apps/web/app/error.tsx` (harden), `.github/workflows` or `turbo` SCA step, `apps/web/package.json`
- **Refs:** ADR-0111 · scout D.3 F-13/14/15 · A.5.16/.18 (step-up), A.8.28 (SCA), A.8.10 (error boundary)
- **Action:** require step-up re-auth for `sm:sysparams:write` / user / rbac mutations; add frontend SCA/dep-scan to CI; harden `error.tsx` so it never renders PII/stack traces (generic message + correlation id).
- **Anti-pattern:** do NOT leak PII/stack in the error boundary; do NOT treat UI gating as security (ADR-0105 Anti-Pattern 2).
- **Acceptance:** step-up prompts on sensitive mutations; SCA runs in CI; error boundary scrubbed. F-13/14/15 rows updated (single token). (ISC-6)

### TODO-017 — Apply per-page ISO checklist across all 50 (admin) pages + sign-in

- **Commit:** `chore(web): apply ISO checklist across all dashboard pages and update SoA rows`
- **Files:** `apps/web/app/(admin)/**`, `apps/web/app/auth/[...path]/page.tsx`, `apps/docs/content/compliance/frontend-conformity.md` (append per-page acceptance table)
- **Refs:** plan Technique (e) · ADR-0105 Verification DoD · scout D.1 (50 admin pages)
- **Action:** for each `(admin)` route + sign-in, verify the `PageIsoCheck` expectations; fix any landmark/label/contrast/keyboard gaps; record the route→F-xx mapping table in `frontend-conformity.md` as acceptance evidence (single status token per row).
- **Anti-pattern:** do NOT leave any page with `inputsNoLabel>0` or missing `<main>`; do NOT introduce multi-token SoA rows.
- **Acceptance:** all 51 routes pass the checklist; `check:standards` + `check:md-links` green. (ISC-6, ISC-A-3)

### TODO-018 — RobotFarm pass: update AGENTS.md Bot descriptions + WORKORDER

- **Commit:** `chore(robotfarm): update AGENTS.md for dashboard ISO + tRPC suite ownership`
- **Files:** `AGENTS.md` (root, Child RobotFarm Index — Admin Bot / Docs Bot rows), possibly `apps/web/AGENTS.md`
- **Refs:** project AGENTS.md "Update After Editing" + "RobotFarm pass" · `packages/trpc` Bot (tRPC Bot) for the new e2e suite ownership
- **Action:** update the Admin Bot / Docs Bot / tRPC Bot descriptions to note ownership of the enterprise-ISO waves + the `packages/trpc/src/e2e/` conformance suite; record the WORKORDER entry. Keep parent/child contract hierarchy intact (closer doc controls).
- **Anti-pattern:** do NOT weaken RobotFarm rules in a child doc; do NOT leave the new suite unowned.
- **Acceptance:** `pnpm check:agents` green; every new artifact has an owning bot. (guardian gate)

---

## Dependency / ordering summary

- T-001 (deps) → T-002..T-006 (Part 1 suite; T-004 depends on T-002/T-003; T-005 independent).
- T-007 (F-02 fix) → T-008 (ADRs) → T-009 (link 0105). Docs gate first.
- T-010..T-016 (Part 2 waves) can proceed after T-008/T-009; each updates its SoA row.
- T-017 (per-page checklist) integrates T-010/T-011/T-014 outcomes; T-018 closes the RobotFarm pass.
- All commits tagged `trpc-frontend-iso`; guardians (`check:adrs`, `check:md-links`, `check:standards`, `test`) stay green throughout.
