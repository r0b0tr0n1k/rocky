# Context for: STATE VET capability (act-on-behalf, tour calendar, configurable PDFs)

**Recon date:** 2026-07-17
**Scope:** Read-only mapping of 4 pillars (RBAC, Subject↔Farm delegation, PDF framework, Calendar/tour) for a planned "state veterinarian" feature in the Rocky AIMCS monorepo.
**Repo root:** `/home/goce/appz/rocky`
**Verdict up front:** None of the four pillars yet supports the state-vet scenario. The closest existing pieces are *org-scoped veterinarian RLS* (Pillar 1/2) and the *inspection scheduledDate* (Pillar 4). The VS contract/assignment layer is **NOT** delegation-of-farmer-authority — it is a Veterinary-Station↔farm servicing contract. A real "act on behalf" + "tour" + "section-selectable PDF" build is required.

---

## Relevant Files (index)

| Pillar | File | What it is |
|---|---|---|
| 1 | `packages/database/src/constants/user-role.ts` | `USER_ROLE` enum (8 roles) — SSOT for roles |
| 1 | `packages/database/src/constants/role-hierarchy.ts` | `ROLE_HIERARCHY` privilege ordering |
| 1 | `packages/database/src/constants/rls-role-groups.ts` | `RLS_BYPASS_ROLES`, `ORG_SCOPED_ROLES` |
| 1 | `packages/database/src/seed.ts` | `PERMISSION_DEFS`, `ROLE_DEFS`, `ROLE_PERM_MAP` (line ~297+) — permission/role seed |
| 1 | `packages/validators/src/rbac/permissions.ts` | Isomorphic `Permissions` const — single source for `@Policy` |
| 1 | `packages/authorization/src/principal/principal.resolver.ts` | `AuthResult → Principal`, computes `accessLevel` |
| 1 | `packages/authorization/src/policies/engine.ts` | `PolicyEngine.evaluate()` — the actual gate |
| 1 | `packages/authorization/src/policies/policy.decorator.ts` | `@Policy({action,roles,admin,org,authenticated})`, `@OverridePolicy` |
| 1 | `packages/authorization/src/policies/policy.registry.ts` | `PolicyRegistry` `"alias.method" → PolicyMetadata` |
| 1 | `apps/api/src/trpc/middlewares/policy.resolver.ts` | Global tRPC middleware invoking the engine |
| 1 | `packages/domains/rbac/src/services/rbac.service.ts` | Role/permission mgmt service |
| 2 | `packages/database/src/schema/hk/vs-contracts.ts` | `vs_contracts` table (VS = Veterinary Station) |
| 2 | `packages/database/src/schema/hk/vs-assignments.ts` | `vs_assignments` table (VS→farm link) |
| 2 | `packages/database/src/schema/hk/farm-subjects.ts` | `farm_subjects` table (subject⇔farm role binding) |
| 2 | `packages/database/src/constants/subject-role.ts` | `SUBJECT_ROLE` enum (owner/keeper/veterinarian/vi/…) |
| 2 | `packages/database/src/constants/vs-contract-status.ts` | `VS_CONTRACT_STATUS` |
| 2 | `packages/domains/farm/src/services/vs-assignment.service.ts` | VS assignment service |
| 2 | `packages/domains/farm/src/services/vs-contract.service.ts` | VS contract service (+ state machine) |
| 2 | `packages/domains/subject/src/services/subject.service.ts` | `bindToFarm`, `getFarmBindings` |
| 2 | `packages/database/src/schema/rls-helpers.ts` | `farmInOrgArea`, `farmOwnedByUser`, `rlsForFarmColumn` (RLS fragments) |
| 3 | `packages/pdf/src/engine/document-registry.ts` | `DocumentRegistry` singleton (type→template) |
| 3 | `packages/pdf/src/engine/document-template.ts` | `DocumentTemplate` / `BaseDocumentTemplate` interface |
| 3 | `packages/pdf/src/services/document.service.ts` | `DocumentService.generate/verify/credential` orchestrator |
| 3 | `packages/pdf/src/engine/typst-document.template.ts` | `GENERIC_DOCUMENT_TYPST` visual + `buildDocumentModelInputs` |
| 3 | `packages/pdf/src/templates/*.template.ts` | 7 templates (passport, movement, inspection-form, ched, eudr, ear-tag) |
| 3 | `packages/pdf/src/pdf.module.ts` | NestJS module (providers only; templates registered elsewhere) |
| 3 | `apps/api/src/routers/document.router.ts` | `document.generate/verify/credential/listTypes/statusList` |
| 3 | `packages/validators/src/api/document.api.ts` | `documentGenerateRequestSchema` (`type,refId,format`) |
| 3 | `apps/api/src/app.module.ts` | `useFactory` template wiring + `registry.register(...)` (~line 435-606) |
| 4 | `packages/domains/inspection/src/services/inspection.service.ts` | `scheduledDate`, `schedule()` (closest scheduling concept) |
| 4 | `packages/database/src/schema/an/inspections.ts` | `inspections` table (`scheduled_date`, `inspector_id`) |
| 4 | `apps/api/src/routers/inspection.router.ts` | `inspection.create`, `schedule`, `list`, `printForm` |
| 4 | `apps/api/src/jobs/risk-analysis.job.ts` | `@Cron("0 0 1 1 *")` annual 10% farm selection |
| 4 | `apps/web/components/calendar-1.tsx` | Demo calendar UI, hardcoded events, no backend binding |
| 4 | `apps/mob/app/(tabs)/inspections/*` | Mobile list/detail only; no calendar/tour view |
| 1/2 | `packages/execution/src/rls/rls.stage.ts` | `SET LOCAL app.current_role/user_id/org_id` (no `current_farm`) |
| 1/2 | `apps/api/src/trpc/middlewares/rls.middleware.ts` | Per-request session var injection |

---

## PILLAR 1 — RBAC / Permission & Role Model

### What exists

- **Roles enum:** `USER_ROLE` in `packages/database/src/constants/user-role.ts` — 8 roles: `SUPER_ADMIN, VD_ADMIN, VD_STAFF, VETERINARIAN, TECHNICIAN, SLAUGHTERHOUSE_OP, MARKET_OP, FARMER`.
- **Privilege ordering:** `ROLE_HIERARCHY` (`role-hierarchy.ts`): `SUPER_ADMIN=100 … FARMER=20`.
- **RLS scoping groups:** `rls-role-groups.ts`:
  - `RLS_BYPASS_ROLES = [SUPER_ADMIN]` (sees/writes everything).
  - `ORG_SCOPED_ROLES = [VD_ADMIN, VD_STAFF, VETERINARIAN, TECHNICIAN, SLAUGHTERHOUSE_OP, MARKET_OP]` → org-area scoped via `farmInOrgArea`.
  - FARMER is **neither** — gets `own` (farm-owner) access via `farmOwnedByUser`.
- **Permissions:** canonical catalog `Permissions` in `packages/validators/src/rbac/permissions.ts` (isomorphic, single source). Format `${resource}:${action}` (e.g. `animal:register`, `eartag:order`, `passport:admin`). Re-exported by `packages/authorization/src/permissions.ts`.
- **Seed (SSOT):** `packages/database/src/seed.ts` — `PERMISSION_DEFS` (~line 280+), `ROLE_DEFS` (~460+) and `ROLE_PERM_MAP` (~297+). `SUPER_ADMIN` & `VD_ADMIN` get `"*"` (all perms). `VETERINARIAN` already has `animal:register, animal:write, animal:death, movement:write, eartag:order, health:write, …` — i.e. **a vet already has broad data-write powers within its org area.**
- **@Policy gating (runtime):**
  - Routers declare *actions*: `@Policy({ action: "animal:create", roles:[...], admin:true, organization:true, authenticated:true })` (`policy.decorator.ts`).
  - `@RegisterPolicy("alias")` populates `PolicyRegistry` (`"alias.method" → PolicyMetadata`).
  - `PolicyEngine.evaluate(principal, policy)` (`engine.ts`) checks, in order: authenticated → `farmerCanAdminister` jurisdiction flag (denies `FARMER` if false, ADR-0030) → `admin` → `roles` → `organization` → `action` (principal.hasPermission).
  - Global `PolicyResolver` middleware (`apps/api/src/trpc/middlewares/policy.resolver.ts`) runs every request; RLS/pgPolicy still enforces row-level even when no `@Policy`.
- **Principal:** built by `PrincipalResolver` (`principal.resolver.ts`) from `AuthResult` → SM user → RBAC joins → `Principal` with `roles, permissions, organization, accessLevel` (`all|organization|own`). `accessLevel` computed exactly like the RLS groups (bypass / org / own). `RLSStage` injects these as `SET LOCAL app.current_role / app.current_user_id / app.current_org_id` (`packages/execution/src/rls/rls.stage.ts`).

### Where a STATE_VET plugs in

- **No "global superuser" / "act-on-behalf" concept exists.** Only `SUPER_ADMIN` bypasses RLS. There is **no `current_farm` session var**, no `actAs`/delegate/impersonation hook anywhere (`grep actAs|act_as|current_farm|delegate|onBehalf` finds nothing policy-level — `currentFarmId` is just an animal column).
- **New role path:** add `STATE_VET` to `USER_ROLE` (user-role.ts) + `USER_ROLE_VALUES`, give it a `ROLE_HIERARCHY` value (e.g. 70, above VETERINARIAN), decide RLS group:
  - *Preselected subset of farms* → reuse `ORG_SCOPED_ROLES` (gets org-area farms) **or** add a new assignment table (see Pillar 2) and a new RLS fragment.
  - *ALL farms (island)* → add to `RLS_BYPASS_ROLES` (same as SUPER_ADMIN) **or** add a new `ALL_FARMS_ROLES` group + RLS helper. Bypassing RLS is the simplest "all farms" route but is heavy-handed (writes everywhere).
- **Permissions:** add to `Permissions` (`validators/src/rbac/permissions.ts`) + `PERMISSION_DEFS` + `ROLE_PERM_MAP` in `seed.ts` (drift test WO-101 enforces parity). Likely reuse existing `animal:register/write/death`, `movement:write`, `eartag:order`, `health:write`, `passport:create/admin`, plus a new `report:generate`/tour perm.
- **Jurisdiction flag:** ADR-0030 `RuleSet.farmerCanAdminister` already exists and is checked in `PolicyEngine` — a state-vet delegation toggle fits naturally as a seeded `system_parameters` flag (e.g. `stateVetEnabled` / `stateVetActOnBehalf`) rather than a code fork.

### tRPC / governance

- Routers: `apps/api/src/routers/rbac.router.ts`, `document.router.ts`, `inspection.router.ts`, `farm.router.ts`. Generated types: `packages/trpc/src/generated/server.ts` (regenerated via `nestjs-trpc generate`).
- Governance: `packages/domains/rbac/AGENTS.md`, `packages/authorization/AGENTS.md`. New role/perm = new ADR (ADR-0033 house standard) + RobotFarm pass on owning AGENTS.md + `check:adrs`/`check:drift` guardians.

---

## PILLAR 2 — Subject ↔ Farm Assignment / "VS" Model

### What "VS" means here — CRITICAL FINDING

**"VS" = Veterinary Station**, NOT "state vet" and NOT "act on behalf of a farmer."

- `vs_contracts` (`schema/hk/vs-contracts.ts`): a service contract between CPC and a **Veterinary Station subject** (`subjectId`, `contractNumber`, `region`, `startDate/endDate`, `status` from `VS_CONTRACT_STATUS` = draft/active/suspended/terminated/expired). RLS: admin-only.
- `vs_assignments` (`schema/hk/vs-assignments.ts`): links a `contractId` to a `farmId` ("A farm has exactly one active VS at any time"). Columns: `contractId, farmId, isPrimary, startDate, endDate, isActive`. RLS: `rlsForFarmColumn(farmId)` (admin + org-area + farm-owner) with `withCheck: adminWrite`.
- Services: `vs-contract.service.ts` (create + state machine `VALID_TRANSITIONS`) and `vs-assignment.service.ts` (`assign` validates contract ACTIVE, deactivates existing primary per farm; `unassign` sets `isActive=false`).
- **It does NOT grant a veterinarian permission to act as the farmer**, and the `vs_assignment` table is **not referenced by any RLS policy** — it is informational/servicing metadata only. A vet's row access comes from `ORG_SCOPED_ROLES` + `farmInOrgArea`, independent of `vs_assignments`.

### Subject↔Farm binding (the real farmer link)

- `farm_subjects` (`schema/hk/farm-subjects.ts`): `farmId, subjectId, role` (`SUBJECT_ROLE` enum: owner, keeper, veterinarian, vi, trader, slaughterhouse_op, market_op, technician, guardian). `uniqueIndex(farmId, subjectId, role)`. RLS: admin OR (org-role AND `farmInOrgArea`) OR `subjectId = currentUserId`. **This is what makes a FARMER "own" a farm** (`farmOwnedByUser` uses `farm_subjects`).
- `SubjectService.bindToFarm` / `getFarmBindings` (`packages/domains/subject/src/services/subject.service.ts`) manage these bindings.
- Important nuance: `VETERINARIAN`/`TECHNICIAN` are `ORG_SCOPED_ROLES`, so a vet can **already read/write animals/farms across the whole org area** via RLS — but there is no record that the vet is "acting as" a specific farmer, and no per-farm delegation of the farmer's *identity/responsibility*.

### Can a vet be assigned to multiple farms / all farms today?

- Multiple farms: yes, via many `vs_assignments` rows (one active primary per farm). But again this is servicing metadata, not access control.
- All farms: only via the org-area scoping of their role. There is **no "assign vet to every farm" or "assign vet to a subset" delegation primitive** that drives authorization. A true state-vet "act on behalf of farmer X on farms A,B,C" would need a **new delegation table** (e.g. `state_vet_delegations`: `vetUserId, farmId, scope, validFrom/To`) + a new RLS fragment + session var, OR reuse `farm_subjects` (bind the vet subject as `keeper`/a new `state_vet` SUBJECT_ROLE to each delegated farm — cheap, reuses existing RLS).

### tRPC / governance

- Routers: `farm.router.ts` (farm_subjects/VS), `subject.router.ts`. Validators: `packages/validators/src/api/farms.api.ts` (`vsAssignmentsSelectSchema`, `vsContractsSelectSchema`), `packages/validators/src/enums/domain.ts`.
- Governance: `packages/domains/farm/AGENTS.md`, `packages/domains/subject/AGENTS.md`. Note `farm_subjects` is the spatial/responsibility anchor — any delegation change touches RLS in `rls-helpers.ts` and `farm_subjects` policy.

---

## PILLAR 3 — PDF Framework & Templating

### Architecture (proven, ADR-0082 / ADR-0009)

- **Template interface** `DocumentTemplate` / `BaseDocumentTemplate` (`engine/document-template.ts`):
  - `type` (e.g. `"inspection-form"`), `modelPath`, `name`, `modelVersion`, `availableFormats`.
  - `fetchData(refId)` → domain data (each template injects its own domain service in ctor).
  - `mapToModel(data)` → YAML-conformant model object (pure, no side effects).
  - optional `mapToCredential?(refId)` → `CredentialSeed` for offline signed-QR (ADR-0084).
- **Registry:** `DocumentRegistry` singleton (`engine/document-registry.ts`). Templates registered at bootstrap: `apps/api/src/app.module.ts` ~L435-606 via `useFactory(...)` + `registry.register(...)`.
- **Render pipeline** `DocumentService.generate` (`services/document.service.ts`):
  1. `registry.get(type)`; 2. `template.fetchData(refId)`; 3. `mapToModel`; 4. `serializeToYaml`; 5a. `yaml|xml` → return text; 5b. `pdf` → `renderTypst(GENERIC_DOCUMENT_TYPST, inputs)` → embed credential QR + logo → `wrapPdfA3` (source YAML embedded as associated file, `pdfaid:part=3`, sRGB OutputIntent) → `signer.sign` (PAdES; default `NoOpSigner`, production `HsmSigner`/`Pkcs12Signer`).
  - `verify({type,refId})` regenerates + reads PAdES facts; `credential`/`credentialBatch`/`verifyCredential` drive ADR-0084 offline QR.
- **Visual template** `GENERIC_DOCUMENT_TYPST` (`engine/typst-document.template.ts`): single data-driven `.typ` reading `sys.inputs.model` (JSON `{title, subtitle, fields[]}`); per-type `.typ` layouts noted as "future refinement." So **all PDFs currently render the same generic key/value layout** — there is no per-section layout engine.

### Existing templates (7 registered)

`passport`, `movement`, `inspection-form`, `ched`, `eudr`, `ear-tag` (named in task) — plus the inspection-form is the inspection printout. All in `packages/pdf/src/templates/*.template.ts`. None has a "section selection" parameter.

### Section selection / configurable fields — DOES NOT EXIST

- The `document.generate` endpoint input is **only `{type, refId, format}`** (`documentGenerateRequestSchema` in `packages/validators/src/api/document.api.ts`; `DocumentGenerateInput` in `packages/pdf/src/services/document.service.ts`). There is **no `sections` array, no `fields` filter, no per-template options**.
- Each template's `fetchData` pulls the full entity and `mapToModel` emits **every** field unconditionally. User-chosen content sections are entirely unbuilt.

### How to add a "vet visit report" / "farm tour sheet" template + section choice

1. **New template class** extending `BaseDocumentTemplate` (e.g. `VetVisitReportTemplate`), inject needed repos/services in ctor, register via `useFactory` + `registry.register` in `app.module.ts`.
2. **Carry section choice through the pipeline** (required change):
   - Extend `DocumentGenerateInput` / `documentGenerateRequestSchema` with `sections?: string[]` (or `includeSections`).
   - Thread it into `template.fetchData(refId, {sections})` and/or `mapToModel`, conditionally omitting blocks. `DocumentTemplate.fetchData` signature currently takes only `refId` — must widen or pass an options bag.
   - The `GENERIC_DOCUMENT_TYPST` already handles arbitrary `fields[]`, so chosen sections naturally render; if richer layout is wanted, a dedicated `.typ` + Typst inputs variant is needed (not yet built).
3. **Credential:** implement `mapToCredential` if the report should carry an offline-verifiable QR (reuse ADR-0084 `CredentialService`).

### tRPC / governance

- Router: `apps/api/src/routers/document.router.ts` (`generate`, `verify`, `credential`, `credentialBatch`, `verifyCredential`, `listTypes`, `statusList`). All `@Policy({authenticated:true})`.
- Governance: `packages/pdf/AGENTS.md` (Phase 1+2+PDF/A-3+LTV done). New template type = new ADR (ADR-0033) + RobotFarm pass; YAML model file should live alongside (ref `models/*.yaml`). `check:pdfa` is the conformance gate (`verapdf`).

---

## PILLAR 4 — Calendar / Scheduling / Tour Model

### What exists

- **No dedicated calendar/scheduling/tour domain.** The nearest concepts:
  - **Inspection scheduling:** `inspections` table (`schema/an/inspections.ts`) has `scheduled_date` (date), `inspection_date`, `inspector_id`, `status` (SCHEDULED/IN_PROGRESS/COMPLETED/CANCELLED). `InspectionService.create` accepts `scheduledDate`; `InspectionService.schedule(id, date)` transitions SCHEDULED. `inspection.router.ts` exposes `create`, `schedule`, `list` (filter by `status, farmId, inspectorId`), `printForm`, plus risk-analysis endpoints.
  - **Risk-analysis cron:** `apps/api/src/jobs/risk-analysis.job.ts` `@Cron("0 0 1 1 *")` → `RiskAnalysisService.runAnalysis({year, selectionPercentage:10})` selects 10% of farms. Also other crons in `apps/api/src/jobs/` (retention, vaccine-reconciliation, etc.).
  - **Notifications:** `packages/domains/notification` has scheduling-adjacent notification events (e.g. `ANALYSIS_DUE`/`ANALYSIS_OVERDUE`) — could remind about tours but is not a calendar.
- **UI:**
  - Web: `apps/web/components/calendar-1.tsx` is a **self-contained demo** with hardcoded `CalEvent` map (dates → label/time/location) — **not wired to any backend, no tRPC binding**. `apps/web/app/(admin)/inspections/risk-board/page.tsx` shows inspection risk board (list-style), not a tour calendar.
  - Mobile: `apps/mob/app/(tabs)/inspections/index.tsx` + `[id].tsx` are list/detail only. **No calendar/tour view** on mobile either.

### Gap for "plan my tour"

- A state-vet tour = a **new scheduling entity**: a planned visit (date/time, farmId, vetId, purpose, status) that a vet can lay out on a calendar and later execute. This does **not** exist. Options:
  - **Reuse `inspections`** if a "tour stop" == an inspection (already has `scheduled_date`, `inspector_id`, `farm_id`, `status`). A tour could be a *view* over inspections grouped by date — small lift, but inspection is a specific workflow, not a generic "visit."
  - **New `vet_visits` / `farm_tours` table + service + router** (recommended for a general "field-visit tour"): columns `vetUserId, farmId, scheduledStart, scheduledEnd, purpose, status, notes, checklistRef`. Reuse RLS patterns (`rlsForFarmColumn`/`farmInOrgArea`), `createdBy` audit.
  - **Calendar UI:** build a real calendar bound to the new/inspection endpoint (replace demo `calendar-1.tsx` with a data-driven component on web; add a tab/screen on mobile). Consider date-range `list` query param.

### tRPC / governance

- Router: `apps/api/src/routers/inspection.router.ts`. Domain: `packages/domains/inspection` (`AGENTS.md` — Phases A/C/D/F done; B/E pending). For a generic tour, likely a **new domain package** (e.g. `packages/domains/tour` or extend `inspection`) → new ADR (ADR-0033) + RobotFarm index update + new AGENTS.md child (per Žižekian decision method — only if it owns distinct contracts).

---

## Cross-cutting Conventions (for the worker)

- **Result monad sovereignty:** services return `Result<T,E>` from `@rocky/domains-shared` (`ok/err`, `fromAsyncThrowable`, `toAppError`). Routers map `E→TRPCError` via `createResultUnwrapper(<X>_TRPC_ERROR_MAP)` from `@rocky/trpc` — **never** manual `unwrap()`/`result.data`. tRPC error maps live in `packages/validators/errors`.
- **Zod schemas in `@rocky/validators`:** Dumb Zod in `packages/database/zod`, API/Diamond-Seal schemas in `packages/validators/src/api`. Every export uses `satisfies z.ZodType<...>` + `NoDrift`/`SubtypeGuillotine` guards (e.g. `documentGenerateRequestSchema satisfies z.ZodType<DocumentGenerateRequest>`). **`as` is forbidden** except as last resort.
- **Enum flow:** constants (e.g. `USER_ROLE`, `SUBJECT_ROLE`, `VS_CONTRACT_STATUS`) → `pgEnum` → Zod `z.enum` (3-part enum flow, Database/Validation/API bots). Use `as const` on enum objects, **never TS `enum`**.
- **File types:** `.mjs` for JS (`.js` is gitignored); `import ... from "..."` as ESM with `.js` extensions in TS sources.
- **No `console.log` / no TODO/FIXME/XXX** in committed code.
- **tRPC generation:** routers use `@Router/@Query/@Mutation/@Input/@Ctx` (nestjs-trpc). After router changes, regenerate `packages/trpc/src/generated/server.ts` (`nestjs-trpc generate`) — frontends (web+mob) consume `AppRouter` for type safety.
- **RLS is the row-level enforcer:** every domain table carries `pgPolicy` built from `rls-helpers.ts` fragments. New access scopes must add a helper + possibly a session var in `RLSStage`/`rls.middleware.ts`.
- **Governance gate:** `pnpm ci:checks` (generate:trpc → check:trpc-boundary → check:adrs → check:md-links → check:agents → check:pdfa → test). Note: `ci:checks` does **not** run the production `pnpm build` (turbo) — run a full build before declaring done. New role/perm/template/tour = new ADR (ADR-0033 header table + sections), doc under ADR-0052 taxonomy, and a RobotFarm pass on the owning `AGENTS.md`.

---

## Gap Analysis Summary (what exists vs what must be built)

| Pillar | Exists | Must build for STATE VET |
|---|---|---|
| 1 RBAC | 8 roles; vet already org-scoped with broad write perms; `@Policy` + `PolicyEngine` + drift-tested catalog; ADR-0030 jurisdiction flag | New `STATE_VET` role (user-role.ts + hierarchy + RLS group), new perms in `Permissions`+`seed.ts`, optional jurisdiction flag for delegation; decide "all farms" (RLS bypass) vs "subset" (new delegation/RLS) |
| 2 Subject⇔Farm | `farm_subjects` (owner/keeper/…), `vs_contracts`/`vs_assignments` (Veterinary **Station** servicing, NOT delegation) | A delegation primitive: either bind vet subject as a new `SUBJECT_ROLE` (`state_vet`) to delegated farms (reuses RLS) **or** new `state_vet_delegations` table + RLS fragment + session var. Clarify VS≠state-vet in docs. |
| 3 PDF | 7 templates, registry, Typst→PDF/A-3+PAdES, credential QR; `document.generate(type,refId,format)` | New `vet-visit-report`/`farm-tour-sheet` template; **add `sections` option** to `documentGenerateRequestSchema` + `DocumentTemplate.fetchData/mapToModel` (currently every field always emitted); optional dedicated Typst layout |
| 4 Calendar/Tour | `inspections.scheduled_date`+`schedule()`; annual risk cron; demo `calendar-1.tsx` (no backend); mobile list/detail only | New tour/visit scheduling entity (or reuse inspections as tour stops) + router + list-by-date; real data-bound calendar UI on web (replace demo) and mobile; notifications for reminders |

### Highest-leverage insight

A state vet's *data access* is largely already covered by the **org-scoped VETERINARIAN RLS** (`farmInOrgArea`) — the missing pieces are (a) an explicit *delegation-of-responsibility* record (so the vet is legally "the farmer" for selected farms, not just a reader/writer), and (b) a *tour calendar* + *section-selectable PDF*. The `vs_contracts`/`vs_assignments` layer is a tempting but **wrong** reuse target: it models which Veterinary *Station* services which farm, and feeds no RLS or farmer-authority delegation.
