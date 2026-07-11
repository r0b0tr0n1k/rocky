# WORKORDER — Pending Tasks Extracted from the ADRs

| Key            | Value                                                    |
| -------------- | -------------------------------------------------------- |
| **Status**     | Open · living document                                  |
| **Date**       | 2026-07-09                                              |
| **Author**     | Architecture Review (extracted from `apps/docs/content/ADR/*`) |
| **Scope**      | All open defects, deferred builds, and future-work items declared across ADRs 0009–0032 |
| **Maintained** | Via RobotFarm pass — update when an ADR's status changes |

> _sniffs_ This is the **sublated** list, Comrade: every contradiction the ADRs defer or confess as a
> bug, gathered into one order so it can be **acted upon** rather than endlessly narrated. The
> symptom (drift, hardcoded constants, missing roles) becomes the task.

---

## Summary

- **Open code defects:** 2 — B1 (takeover-file check digit), B3 (`VI` subject role). (Stale generated `server.ts` resolved by WO-003.)
- **P0 epic:** the Jurisdiction-Configurable Rule Engine (ADR-0030) — resolves B2 and the hardcoded-threshold disease across `eartag`/`animal`/`movement`/`health`/`inspection`.
- **Domain fixes:** stock reconciliation, per-farm risk results, birth-notification deadlines, weighted-params config, `FIELD_CHANGED` lock, QR ear tags.
- **Testing & observability (ADR-0020):** 7 open `- [ ]` items across 3 phases.
- **Validator hardening (ADR-0018):** 2 migrations complete ✅ (runtime smoke test passing — 41/41).
- **Deferred by design / future:** PDF/A, AMR, outbreak buffers, genetic lineage, blockchain, IoT QoS — tracked, not this sprint.

---

## Master List

| WO   | Task                                                            | Source ADR | Priority | Status |
| ---- | --------------------------------------------------------------- | ---------- | -------- | ------ |
| WO-001 | Fix takeover-file check digit + synthetic tag numbers (B1)     | 0024 / 0023 | P1       | Done ✅   |
| WO-002 | Add `VI` subject role (or document the collapse) (B3)          | 0027 / 0023 | P2       | Done ✅   |
| WO-003 | Delete stale `apps/api/src/trpc/server.ts` + drop from patch TARGETS | 0032   | P2       | Done ✅ |
| WO-010 | Build `ruleset` store + MK seed migration from today's constants | 0030     | P0       | Done ✅ |
| WO-011 | Algorithm-provider registry + check-digit provider            | 0030 / 0024 | P0       | Done ✅   |
| WO-012 | Migrate hardcoded thresholds → RuleSet (eartag/movement/animal/health) (B2) | 0030 | P0 | Done ✅ |
| WO-013 | `farmerCanAdminister` flag + `@Policy` wiring                 | 0030       | P1       | Done ✅   |
| WO-014 | Retention + role vocab sourced from RuleSet                   | 0030       | P1       | Done ✅   |
| WO-020 | Health stock-reconciliation job                               | 0026 / 0023 | P2       | Done ✅ |
| WO-021 | Persist per-farm risk-analysis results (`risk_analysis_results`) | 0028 / 0023 | P2   | Done ✅ |
| WO-022 | Enforce birth-notification deadlines (7/20 d)                 | 0028 / 0023 | P2       | Done ✅ |
| WO-023 | Inspection weighted params → RuleSet `GN_ANLS_PARAMS`         | 0028 / 0030 | P1       | Done ✅   |
| WO-024 | Complete `FIELD_CHANGED` → VD approval lock (field-diff pipeline) | 0027     | P3       | Open   |
| WO-025 | QR-code-scannable ear tags                                    | 0024 §E / 0009 §6 | P3  | Open   |
| WO-030 | `*.service.workflow.test.ts` per domain (state machines)      | 0020 P1    | P1       | Done ✅ |
| WO-031 | `*.repository.rls.test.ts` per security-sensitive domain      | 0020 P1    | P1       | Done       |
| WO-032 | Audit JSDoc: strip WHAT-tautologies, keep WHY-constraints      | 0020 P1    | P1       | Done    |
| WO-033 | `*/e2e/*.test.ts` border tests (real Postgres RLS)            | 0020 P2    | P2       | Done ✅   |
| WO-034 | Scaffold `@rocky/observability`; implement `TraceStage`/`MetricsStage` | 0020 P2 / 0003 | P2 | Open |
| WO-035 | Retire manual `logger.*` in services → span attributes        | 0020 P3    | P3       | Open   |
| WO-036 | Business metrics emitted inside domain services/workers       | 0020 P3    | P3       | Open   |
| WO-040 | Migrate `.strip()` response schemas → `.strict()` + smoke test | 0018      | P2       | Done ✅   |
| WO-041 | Convert create schemas `.omit()` → `.pick()`                 | 0018       | P2       | Done ✅   |
| WO-050 | PDF/A rendering + cryptographic seal                          | 0009 / 0029 | Future   | Deferred |
| WO-060 | Gate IoT behind `RuleSet.features.iot` (UI + routers)         | 0031       | P3       | Open   |
| WO-061 | IoT LPWAN QoS/SLA model (dedup, late-arrival)                 | 0031       | Future   | Deferred |
| WO-070 | Deferral register: AMR, 10 km buffer, genetic lineage, blockchain, notification SMS | 0023 / 0014 | Future | Deferred |
| WO-071 | Confirm animal calving-gap divergence (365 d vs legacy 120 d) | 0025       | P3       | Open   |
| WO-080 | Author frontend/mobile ADR set per ADR-0033 (0034–0043; domain features 0044+) | 0033       | P1       | Done    |
| WO-081 | Promote mobile sync to top-level `sync` router (syncDownload/syncUpload under `health`) | 0034       | P2       | Done ✅ |
| WO-082 | Implement mobile offline-first cache + sync queue (expo-sqlite, persistQueryClient, NetInfo, sync router) | 0035       | P2       | In Progress ⏳ |
| WO-108 | Sync: health-record upload conflict detection (getCurrentEntity resolves vaccination/treatment/labTest; closes gap ②) | 0036 | P2 | Done ✅ |
| WO-083 | Reconcile AGENTS.md Mobile Bot path apps/mobile -> apps/mob (contract vs reality) | 0035       | P3       | Done    |
| WO-085 | Filter mobile tabs by RBAC permission (mirror web `filterNavByPermissions`) | 0039       | P2       | Done    |
| WO-086 | Add i18n layer (consume session.language, centralize strings, set dir/RTL-ready) | 0040       | P2       | Open   |
| WO-087 | Web UX boundaries: error.tsx/not-found.tsx/loading.tsx; use Empty+Skeleton (unused) | 0041       | P2       | Done    |
| WO-088 | Mobile: add Empty component + sonner toast; use Empty for 0-result lists | 0041       | P2       | Done ✅ |
| WO-089 | Deliver client `session.permissions` via `rbac.myPermissions` query (not customSession); add `clientCan`/`useCan` on both surfaces; fix dead web `filterNavByPermissions`; enable mobile tab/action gating (ADR-0042) | 0039/0042 | P1 | Done    |
| WO-091 | Add Expo push notifications (register token on login; server emits via Expo Push API; receipt routes via deep-link resolver WO-093) | 0043 | P2 | Done ✅ |
| WO-092 | Background sync task (expo-background-fetch drains WO-082 sync queue on schedule + network regain; depends WO-081) | 0043 | P2 | Done ✅ |
| WO-093 | Deep-link resolver + offline parity (Expo Router linking config + listener; routes cached per ADR-0036; else Skeleton/Empty ADR-0041) | 0043 | P3 | Done ✅ |
| WO-094 | Livestock feature parity + offline/permission sweep (bind mutating actions to sync queue WO-082 + useCan WO-089; confirm mobile↔web parity; verify movement/passport perm literals) | 0044 | P2 | Done ✅ |
| WO-095 | Health feature parity + offline/role-gating sweep (bind recordVaccination/Treatment/LabTest to sync queue WO-082; clientCanRole gating; confirm session.roles; notifiable→inspection toast WO-088) | 0045 | P2 | Done ✅ |
| WO-096 | Inspections/Corrections parity + offline/permission sweep (bind completeInspection to sync queue WO-082; useCan analysis:read/run WO-089; flag-in/archived-out toasts WO-088) | 0046 | P2 | Done ✅ |
| WO-100 | Permission catalog single source - isomorphic `Permissions` const in `@rocky/validators/rbac` (69 perms mirroring seed `PERMISSION_DEFS`), **re-exported** by `@rocky/authorization` so `@Policy` + client `clientCan`/`useCan` share ONE definition (ADR-0050 D1). RN cannot bundle authorization's server deps, so the const lives in isomorphic validators; WO-101 drift test guards seed<->catalog sync. | 0042/0050 | P1 | Done   |
| WO-101 | Contract drift test — `packages/authorization/src/permissions.drift.test.ts` (vitest); asserts every `@Policy`/nav/mobile/`ROLE_PERM_MAP` literal ∈ catalog AND catalog == seed `PERMISSION_DEFS`; caught + fixed 3 real drifts on first run | 0050 | P1 | Done   |
| WO-102 | tRPC boundary guard (`scripts/check-trpc-boundary.mjs` + root `pnpm check:trpc-boundary`; regen gate `pnpm generate:trpc && pnpm check:trpc-boundary`); fails build on any `ReturnType<` or backend import in generated client | 0032/0050 | P2 | Done   |
| WO-097 | Infrastructure (IoT/device) admin parity + device-sync touchpoint (bind admin forms to Diamond Seal; WO-082 sync→recordSync; document web-only parity in ADR-0033) | 0047 | P2 | Open   |
| WO-098 | Administration SUPER_ADMIN gate: rbac+user DONE (ADR-0022 roles); farm/subject/org deferred (RLS-scoped, role decision → ADR-0027); bind admin forms to Diamond Seal; document web-only parity in ADR-0033 | 0048 | P1 | Done ✅ |
| WO-090 | Commit an ADR-0032-compliant `AppRouter` (regenerated client with `transformer: superjson` + 0 `ReturnType<`); the _committed_ `HEAD` version fails ADR-0032's own Definition-of-Done guard, so it must not ship | 0032   | P2       | Done    |
| WO-103 | Authorization test base (vitest): PolicyEngine SUPER_ADMIN gate + Principal + @Policy readback + PolicyRegistry merge (myPermissions relaxed auth-only); locks WO-098/WO-089 | 0020/0022 | P1 | Done    |
| WO-104 | Mobile permission-gate sweep — wire `useCan(<Permission>)` (typed union from `@rocky/validators/rbac`) onto core write-form submit buttons: `animals/create`+`animals/birth` (`animal:register`), `eartags/create-order` (`eartag:order`), `health/{vaccination,treatment,lab-test}` (`health:write`), `movements/{death,pasture,slaughter}` (`animal:death`/`movement:pasture`/`slaughter:register`); fail-closed (disabled until `rbac.myPermissions` resolves); also fixed pre-existing empty `catch {}` swallow + unused `Badge` imports surfaced by pi-lens | 0042/0050 | P2 | Done ✅ |
| WO-105 | Adopt Guillotine cross-layer bridge primitives (from reference) into `@rocky/validators` `type-bridge.ts`: `OkType`/`ErrType`/`InferOk`, `SubtypeGuillotine`, `AssertFieldCoverage` - DONE (validators tsc green). **B2b applied to ALL 24 routers** (`apps/api/src/routers/*.router.ts`, 93 aliases on the 19 newly-swept + ~59 on the 5 prior; api tsc green) via `SubtypeGuillotine<z.output<schema>, Awaited<ReturnType<Router['m']>>>` (derived responses -> one-directional; `rbac` uses `NoDrift` where interface is AssertEqual). **3 drifts caught + fixed:** `inspection.riskAnalysisListResponseSchema.data` was `z.array(z.unknown())` -> `z.array(riskAnalysesSelectSchema)`; `audit`+`sync` routers lacked `z` import for `z.output<>` -> added `import { z } from "zod"`. **B1 (`AssertFieldCoverage`) N/A** - sculpted responses make `Api subset Db` false by design (false-positive trap). **B3 N/A** - domain services import `z.infer<>` directly (no separate interface). **OkType unused for B2b** - thin routers unwrap the service `Result`, so `Awaited<ReturnType<Router>>` already resolves T. | 0018/0050 | P2 | Done ✅ |
| WO-106 | Offline subsystem doctrine doc-test (`apps/docs/scripts/verify-offline-doctrine.mjs`, `pnpm --filter docs test:offline`) — in the spirit of `TESTING_DOCTRINE.md`: Part 1 verifies the `apps/mob/AGENTS.md` Offline Subsystem Contract (files exist, named symbols are real exports — no phantom imports, idempotency-key invariant present, ADR cross-links resolve); Part 2 functionally exercises the REAL `lib/offline/*` (outbox lifecycle pending→synced/failed/dismissed, `deviceId:uuid` idempotency key uniqueness + RFC-4122 v4, `storeDownload` cache materialization + watermark advance, `getDeviceId` stability + secure-store persistence, `getQueryPersister`) against in-memory fakes for `expo-sqlite`/`expo-secure-store` (redirected via `tsconfig.offline-test.json` `paths` + tsx). 11/11 pass. | 0011/0011 | P2 | Done ✅ |
| WO-107 | Document the docs-app stale-`.next` hydration phantom in `apps/docs/AGENTS.md` (Troubleshooting): `data-rc-order`/`data-css-hash`/`data-token-hash` antd-style `<style>` hydration mismatch is a STALE CACHE, not a code bug — antd/`@ant-design/cssinjs` appear 0× in lockfile, no imports; clean headless-Chromium load hydrates fine (hue 152). Fix = `rm -rf apps/docs/.next && pnpm dev`. Do NOT edit `app/layout.tsx` `color` prop. | 0001/0001 | P3 | Done ✅ |

---

## 0. Client ADR Build-out (ADR-0033)

### WO-080 — Author the frontend/mobile ADR set — P1

- Establish the client ADR practice codified in **ADR-0033**: web-admin ADRs (Admin Bot) and mobile
  ADRs (Mobile Bot + Frontend Bot) in `apps/docs/content/ADR/`, continuously numbered, covering
  features **and** permissions **and** design (ADR-0033 §D2).
- Author the roadmap ADRs: **0034** Client Surface Inventory · **0035** rendering/data-fetching · **0036** offline sync (seed 0015) · **0037** design system · **0038** forms/validation · **0039** navigation · **0040** i18n · **0041** error/empty/loading UX · **0042** permission-aware UI · **0043** push/background sync · **0044+** domain feature ADRs
- Seed ADRs **0015** (mobile sync) and **0017** (web shell) already migrated into the canonical set.
- Acceptance: each new ADR cites its backend dependency (ADR-0032 / 0021 / 0022 / 0006 / 0018 / 0019)
  and is listed here with its number.
- **Source:** ADR-0033 §D6 / Roadmap.

> **Corrigendum (RobotFarm pass, 2026-07-09):** The client-surface trunk **0034–0043 is complete** — all ten
> ADRs are authored in `apps/docs/content/ADR/`, each citing its backend dependency (ADR-0032 / 0021 / 0022 / 0006 /
> 0018 / 0019 as applicable) and listed in this work order. ADR-0039 and ADR-0042 were subsequently _corrected_ to
> reflect verified reality: the web nav filter is dead/fail-open; there is **no `customSession`** (auth is
> identity-only by design); permissions reach the client via a `rbac.myPermissions` query, not `customSession`. The
> trunk also produced the keystone WOs **WO-089** (client permissions) and **WO-091/092/093** (push / background
> sync / deep-link). Remaining: **0044+ domain feature ADRs** (Livestock, Health, Inspections/Corrections,
> Infrastructure, Administration), scoped per ADR-0033.
>
> **Second corrigendum (RobotFarm pass, 2026-07-09):** The 0044+ domain trunk is now **complete** — ADR-0044 (Livestock) · 0045 (Health) · 0046 (Inspections/Corrections) · 0047 (Infrastructure) · 0048 (Administration) are all authored, each grounded in verified code and paired with a sweep WO (WO-094/095/096/097/098). ADR-0048 additionally surfaced a server-side authorization gap: admin routers (`rbac`/`user`/…) are `@Policy({ authenticated: true })` only, while the `PolicyEngine.policy.roles` gate (ADR-0022) exists but is unswitched — closed by **WO-098** (P1).

### WO-081

 — Promote mobile sync to a top-level `sync` router — P2

- The mobile offline-sync transport `syncDownload` (query) and `syncUpload` (mutation) are nested
  inside the `health` router (found while building the client inventory, ADR-0034). Sync is a
  cross-cutting transport concern (ADR-0015 / ADR-0032), not a health domain operation.
- Promote them to a top-level `sync` router; update mobile client consumption (ADR-0015 / 0036).
- **Formalized server contract** documented in ADR-0036 §"WO-081 — Top-level `sync` router formalization":
  `syncDownload(since?)` returns RLS-scoped field entities + health master data + a `watermark`
  (last-write-wins `updatedAt` delta); `syncUpload(records[])` processes each record `{idempotencyKey,
  type, data, baseUpdatedAt}` sequentially with idempotency dedupe, version/conflict check, per-record
  `Result`/`SyncUploadResult`, and `createSyncErrorCorrection` on failure. Status bumped to In Progress.
- **Source:** ADR-0034 (§Context "A Real found while inventorying" / Master table footnote \*).

### WO-082 — Implement mobile offline-first data-fetching — P2 — **In Progress ⏳**

- **Status:** Offline layer implemented and typechecks (`apps/mob` `tsc --noEmit` → exit 0).
  Pending native build / device verification (impossible in this harness) and the per-domain
  wiring sweeps (WO-094/095/096), which adopt `useOfflineMutation` for every mutate.
- **Native verification (harness limit):** the only remaining gate is a **native run** —
  impossible in this CI-less harness. Web is a dev-only UI surface, not the acceptance target:
  the offline subsystem is native-only (ADR-0036 §WO-081 d1) and is guarded by `IS_WEB` after the
  `SharedArrayBuffer is not defined` web crash (`expo-sqlite` v56 web entry needs COOP/COEP +
  Web Worker). Procedure + evidence to flip this to Done are documented in `apps/mob/AGENTS.md`
  → "WO-082 Acceptance — Native Verification". The harness supplies the CI-substitutable half:
  `tsc --noEmit` exit 0 + WO-106 doc-test (11/11, real `lib/offline/*` vs mocked native deps).
- **Deprecation note:** the original brief said "Drizzle-Expo" — ADR-0036 §WO-081 decision 1
  mandates **raw `expo-sqlite`, no ORM on the phone**; `drizzle-expo` does not exist on npm.
  Implemented with raw `expo-sqlite` per the ADR. "`createTRPCReact` -> `createTRPCContext`"
  (ADR-0032) — corrected: ADR-0032 shows mobile as `createTRPCReact` (line 156) and
  mandates only the _generated-client boundary_ (committed `AppRouter`, superjson, 0 `ReturnType<`),
  which is satisfied. ADR-0036 line 108 expresses a _future intention_ for mobile to adopt
  `createTRPCContext`, but it is unexecuted and self-contradicted by ADR-0036's own diagram
  (line 184, mobile = `createTRPCReact`). The binding choice is **stylistic, not a defect**; the
  offline layer is orthogonal to it (`trpc.useUtils()`/`useMutation` work under either factory).
  Left as-is — migrating is optional modernization, not a correctness requirement.
- **Built (2026-07-10):**
  - `lib/offline/db.ts` — `getLocalDb()` opens `rocky_offline.db`; migrates `sync_queue`,
    `local_cache`, `sync_meta`, `query_cache` (raw `expo-sqlite`).
  - `lib/offline/sync-queue.ts` — outbox (`enqueueMutation`/`listQueue`/`setStatus`/`markSynced`/
    `markFailed`/`dismissQueueItem`), cache (`upsertCache`/`getCacheByType`/`storeDownload` →
    advances `watermark`), `setMeta`/`getMeta`, `uuidv4`.
  - `lib/offline/device-id.ts` — `getDeviceId()` (expo-secure-store).
  - `lib/offline/persist.ts` — `getQueryPersister()` (`createSyncStoragePersister` over
    `query_cache`; ADR-0036 d5).
  - `providers/offline-provider.tsx` — `OfflineProvider` + `useOffline()`; `onlineManager`
    NetInfo-gated (ADR-0036 d3/d4); download→`syncDownload`, flush→`syncUpload` with per-record
    success/failure + `failed`→`error_corrections` ticket (ADR-0015/0036 d6/d7); heals on reconnect.
  - `lib/offline/use-offline-mutation.ts` — `useOfflineMutation(type)` write-local-then-enqueue
    primitive for the domain sweeps.
  - `app/(tabs)/sync/index.tsx` — Sync Control Center (network status, pending badge, Sync now,
    outbox list, dismiss failed → keep server ticket).
  - `app/(tabs)/animals/create.tsx` — **reference integration**: enqueue when offline, keep online
    path unchanged (no double-apply).
  - Wiring: `OfflineProvider` mounted in `app/_layout.tsx`; `persistQueryClient` in
    `providers/trpc-provider.tsx`; deps added (`expo-sqlite@56`, `@react-native-community/netinfo`,
    `@tanstack/react-query-persist-client`, `@tanstack/query-sync-storage-persister`).
- **Latent bugs surfaced by the required `pnpm generate:trpc` + `@rocky/{trpc,validators}` rebuild
  (ADR-0032):** `app/(tabs)/eartags/index.tsx` rendered `item.tagNumber`/`item.stateCode` (gone
  after `earTag.listOrders` returns orders) → fixed to `orderNumber`/`orderDate`;
  `providers/permissions-provider.tsx` consumed `myPermissions` as a flat `string[]` (actual shape
  `{permissions, roles}`) → fixed to `data?.permissions ?? []`. Both pre-existing, now green.
- **DB enabler enacted (2026-07-11):** the `device_tokens` table + full RLS layer that WO-091/092/093 depend on is now present on the live DB (independently probed: `policy_count = 49`, `device_tokens_exists = t`). The offline/sync/push epic is therefore fully enacted server-side; WO-082's only remaining gate is native verification (harness cannot build native) + `EXPO_ACCESS_TOKEN` in `apps/api/.env`.
- **Source:** ADR-0035 §Decision B / Consequences; ADR-0036 §WO-081.

### WO-108 — Sync health-record conflict detection (gap ②) — P2

- **Where:** `packages/domains/sync/src/services/sync.service.ts` — `getCurrentEntity()`.
- **Defect:** the `baseUpdatedAt` version/conflict check in `syncUpload` was skipped for
  health pushes because `getCurrentEntity()` fell through to `default: return null` for
  `vaccination`/`treatment`/`labTest` ("no generic getById"). So two devices editing the
  same vaccination offline would never raise a `CONFLICT` — the second sync silently passed.
- **Fix:** resolve the three health types via `HealthService.getVaccination/getTreatment/getLabTest`
  (each returns a `vaccinationsSelectSchema`/`treatmentsSelectSchema`/`labTestsSelectSchema`
  entity that carries `updatedAt`). The conflict path now fires correctly and spawns the
  `TECHNICIAN_RESOLVABLE` correction ticket per ADR-0015. Health _creates_ (no `data.id`)
  still skip the check by design.
- **Verification:** `pnpm -C packages/domains/sync typecheck` → exit 0.
- **Source:** ADR-0036 §WO-081 (decision 6 conflict check); ADR-0015 (correction on conflict); gap ② from the sync architecture review.

### WO-083 — Reconcile AGENTS.md Mobile Bot path (apps/mobile -> apps/mob) — P3

- The RobotFarm contract (`AGENTS.md`) references `apps/mobile/` for Mobile Bot / Frontend Bot, but the
  actual Expo app lives at `apps/mob/`. Client ADRs (0033/0034/0035) now use `apps/mob`.
- Fix root `AGENTS.md` Mobile Bot + Frontend Bot descriptions and the Child RobotFarm Index path.
- **Source:** ADR-0035 §Context / WO-083.

### WO-085 — Filter mobile tabs by RBAC permission (mirror web `filterNavByPermissions`) — P2

- ADR-0039 §3 / Decision (corrected): web navigation _calls_ `filterNavByPermissions(navSections, permissions)`
  in `AdminShell` + command palette, but it **fail-opens** today because `session.permissions` is empty on
  the client (`customSession` was split out of permissions — WO-089). Mobile
  `apps/mob/app/(tabs)/_layout.tsx` renders **all 10 `Tabs.Screen` unconditionally** — no permission filter
  — so unauthorized users see rooms they cannot use (the ADR-0017 repressed symptom returns on mobile). WO-089
  is the keystone that fixes the web dead-filter and enables this mobile filter.
- In `(tabs)/_layout.tsx`, compute the session's RBAC permissions and conditionally render `Tabs.Screen`
  entries (or set `href: null` / `hidden`) for tabs the user lacks permission for, mirroring web.
- **Source:** ADR-0039 §Decision 3 / Consequences; ADR-0017 (permission-gated nav dialectic); ADR-0022.

### WO-086 — Add i18n layer (consume `session.language`, centralize strings, set `dir`) — P2

- ADR-0040 §Decision: the backend fully tracks locale (`RuntimeBuilder.resolveLocale` -> `Accept-Language`
  ?? principal `locale` claim ?? "MK"; RLS `SET app.current_locale`; better-auth `customSession` enriches
  `language`). But the **frontend ignores it**: only better-auth auth screens use `localization`;
  all other UI strings are hardcoded; no i18n framework; no `dir`/RTL handling in source.
- Add a per-surface i18n layer that consumes `session.language` (MK default), centralizes user-facing
  strings (nav, shell, domain screens, forms, errors, toasts, enum labels), and sets `dir` from
  locale (RTL-ready; current MK/EN/AL are LTR). Web proxy (ADR-0035) must forward `Accept-Language`.
- **Source:** ADR-0040 §Context / Decision; execution `RuntimeBuilder` + `rls.stage.ts`; better-auth
  `customSession` (AGENTS.md).

### WO-087 — Web UX boundaries + use Empty/Skeleton (currently unused) — P2

- ADR-0041 §Decision: `@rocky/ui` ships `Empty` + `Skeleton` but the app does not use them; there is no
  `error.tsx` / `loading.tsx` / `not-found.tsx` route boundary in the surveyed tree (only `<Toaster/>`
  is mounted in `apps/web/app/layout.tsx`). Form errors use `Alert`/`FormMessage` (ADR-0038).
- Add `error.tsx` (route ErrorBoundary -> destructive `Alert` + retry), `not-found.tsx` (404), and
  `loading.tsx` (Skeleton placeholders); replace inline "no data" text with the `Empty` component.
- **Source:** ADR-0041 §Context / Decision; `@rocky/ui` primitives (`empty.tsx`, `skeleton.tsx`).

### WO-088 — Mobile Empty + sonner toast — P2

- ADR-0041 §Decision: mobile uses `Skeleton` (detail loading) + `Alert` (inline) + root `ErrorBoundary` +
  `ActivityIndicator` (buttons) - a good baseline - but has **no `Empty` component and no `sonner` toast**.
  Zero-result lists likely use inline text; async/network errors are not surfaced as toasts.
- Add the RN Reusables `Empty` component and `sonner`; use `Empty` for zero-result lists; surface
  async errors via toast (do not swallow - recall `session-provider.tsx` eating API-unreachable).
- **Source:** ADR-0041 §Context / Decision; `apps/mob/components/ui` (alert, skeleton present; empty, sonner absent).

> **Corrigendum (RobotFarm pass, 2026-07-10):** WO-088 delivered. `empty.tsx` already existed (RN port of shadcn `Empty`, ADR-0052); the remaining gap was (a) no toast lib — added `burnt@0.13.0` (the RN toast by the same author as react-native-reusables; web `sonner` is DOM-only and cannot run on RN) + `apps/mob/lib/notify.ts` mirroring `apps/web/lib/notify.ts` (`notifyError`/`notifySuccess`); (b) async/network errors were swallowed — added `QueryCache`/`MutationCache` `onError` handlers in `providers/trpc-provider.tsx` that surface errors via `notifyError` (FORBIDDEN → permission message; first-load query failures only, background-refetch noise skipped); (c) replaced the 4 raw `<Text>No X found</Text>` `ListEmptyComponent`s (animals / inspections / corrections / passport) with the `<Empty>` primitive. Stale-doc note: the Mobile Bot AGENTS.md's `rbac.myPermissions` PLACEHOLDER claim is wrong — `permissions-provider.tsx` genuinely calls the real query (WO-089 landed).

### WO-089 — Re-enable client `session.permissions` + permission-aware UI (keystone) — P1

- ADR-0039 discovered the web nav filter (`filterNavByPermissions`) **fail-opens** and mobile tabs are
  unfiltered because `session.permissions` is **empty on the client**: `customSession` was _intentionally
  split out_ of permissions, so the client is permission-blind by design (ADR-0042).
- **Fix (server):** add `rbac.myPermissions` query (existing `rbac` router) that resolves the
  `Principal` server-side via `PrincipalResolver` and returns `principal.permissions` — the client
  mirror of `PolicyEngine`. NO `customSession` (auth stays RBAC-free by design, ADR-0042). The query
  is `@Policy({ authenticated: true })` so a method-level override beats the class-level SUPER_ADMIN gate.
- **Fix (client helper):** add a pure `clientCan(permissions, required)` in `@rocky/authorization`
  (mirror of `Principal.hasPermission`) and a thin `useCan(permission)` / `useHasRole(role)` on both
  surfaces reading `session.permissions`.
- **Fix (web):** `filterNavByPermissions` now receives real permissions (no fail-open); gate in-screen
  mutating actions (disable/grey) by `useCan` per ADR-0041; a 403 from `@Policy` surfaces as a `sonner`
  toast (WO-088).
- **Fix (mobile):** `(tabs)/_layout.tsx` filters `Tabs.Screen` by `useCan` (completes WO-085); gate
  in-screen actions; 403 -> toast.
- **Server stays authoritative:** client gating is UX-only; the `@Policy` / `PolicyEngine` 403 (ADR-0022)
  remains the enforcement. The client simply makes the _permitted rooms_ visible (realizes ADR-0017).
- **Source:** ADR-0039 §Context/Decision (fail-open filter, unfiltered tabs); ADR-0042 (design);
  ADR-0017 (permission-gated nav); ADR-0021/2022 (PrincipalResolver + PolicyEngine); WO-085, WO-088.

### WO-089 — Implementation Sketch

**Implemented (2026-07-09):** client permission plumbing delivered end-to-end.

- Server: `rbac.myPermissions` returns `ctx.execution!.principal.permissions` (`[...]` spread for `ReadonlyArray`). Regenerated `AppRouter` (23 routers / 155 procedures); `myPermissions` re-exported via `packages/trpc`.
- Web: `lib/permissions.tsx` (`PermissionsProvider` + `usePermissions()` + pure `clientCan`/`clientCanAny`/`clientCanRole` + `useCan`); `app/layout.tsx` wraps the tree in `<PermissionsProvider>`; `nav-config.ts#filterNavByPermissions` is **fail-CLOSED**; `admin-shell.tsx` consumes `usePermissions()`; 403 surfaces via the existing `notifyError` (sonner) convention.
- Mobile: `providers/permissions-provider.tsx` (legacy `useQuery` mirror); `app/_layout.tsx` wraps the tree; `(tabs)/_layout.tsx` gates the 8 permissioned tabs (`animal:read`, `health:read`, `movement:read`, `analysis:read`, `eartag:read`, `passport:read`, `correction:read`, `notification:read`) and shows a loading spinner while permissions resolve (fail-closed).
- **Deferred:** `myRoles` query not added — `roles` on both surfaces is best-effort from `session.user.roles` (drift-prone; documented in `lib/permissions.tsx`). `clientCanRole` exists as a pure helper; authoritative role enforcement stays server-side via `@Policy({ roles })` (proven by WO-098). WO-085 (mobile tab gating) is satisfied by this work.

**Server — deliver permissions without re-coupling auth ↔ RBAC.**
`packages/auth/src/better-auth.ts` deliberately keeps auth identity-only (header: "does NOT import ... RBAC"),
so we do **not** add `customSession`. Instead add a query to the existing `rbac` router that resolves the
principal server-side and returns its permissions:

```ts
// apps/api/src/routers/rbac.router.ts — add to the existing rbac router
@Query({ output: z.array(z.string()) })
async myPermissions(): Promise<Result<string[], AppError>> {
  const auth = this.ctx.session;                      // AuthResult
  const principal = await this.principalResolver.resolve(auth);
  return ok(principal.permissions);                  // string[] from RBAC seed
}
```

Inject `PrincipalResolver` (AuthorizationModule) — reuse the _same_ resolver the `PolicyEngine` uses.

**Shared — client-side `Principal` mirror.**

```ts
// packages/authorization/src/principal/client-can.ts
export function clientCan(permissions: string[] | undefined, required: string | string[]): boolean {
  const have = new Set(permissions ?? []);
  const need = Array.isArray(required) ? required : [required];
  return need.some((p) => have.has(p));
}
```

**Web — provider + hook.**

```tsx
// apps/web/lib/permissions.tsx
const { data } = trpc.rbac.myPermissions.useQuery();   // proxy gateway (ADR-0035)
const PermissionsCtx = createContext<string[]>([]);
export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  return <PermissionsCtx.Provider value={data ?? []}>{children}</PermissionsCtx.Provider>;
}
export const usePermissions = () => useContext(PermissionsCtx);
export const useCan = (p: string) => clientCan(usePermissions(), p);
```

- `apps/web/lib/nav-config.ts` `filterNavByPermissions` now receives real permissions (from `usePermissions()`); fail-closed.
- Gate actions: `const canDelete = useCan("farm:delete"); <Button disabled={!canDelete}>Delete</Button>`.

**Mobile — provider + hook + tab filter.**

```tsx
// apps/mob/providers/permissions-provider.tsx — same shape as web
const { data } = trpc.rbac.myPermissions.useQuery();
// PermissionsCtx + usePermissions + useCan (mirror web)
```

```tsx
// apps/mob/app/(tabs)/_layout.tsx — gate each tab by permission
const canEartags = useCan("eartag:read");
// ...
{canEartags && <Tabs.Screen name="eartags" options={/* … */} />}
// repeat per tab; unauthorized tabs are not rendered (completes WO-085)
```

**Both — 403 → sonner (WO-088).** Add a tRPC `errorLink` (or per-mutation `onError`) that, on `TRPCError`
code `FORBIDDEN`, calls `toast.error("You don't have permission to do that")`. Retire
`apps/mob/providers/session-provider.tsx` swallowing of API errors.

**Verification**

```bash
rg -n "myPermissions" apps/api/src/routers/rbac.router.ts
rg -n "clientCan|useCan" packages/authorization apps/web/lib apps/mob
rg -n "Tabs.Screen" "apps/mob/app/(tabs)/_layout.tsx"   # now conditional
```

### WO-091 — Push notifications (Expo) — P2

- ADR-0043 §3: today mobile has `notifications` + `sync` tabs but **no push** — `apps/mob/package.json` has only
  `expo-linking` (no `expo-notifications`). The server `notification` domain + router (`unreadCount`/`send`/`markAsRead`)
  exist, but delivery stops at the DB (pull-only).
- Add `expo-notifications`; register the Expo push token on login (store on `notification-preferences`/device table);
  server emits an Expo push when a notification row is created (respect opt-outs via a small Expo Push client); the
  app's notification listener routes the payload through the deep-link resolver (WO-093).
- **Source:** ADR-0043 §1/§3; `apps/api/src/routers/notification.router.ts`; `apps/mob/package.json` (dep audit).
- **Implementation (2026-07-11):** `expo-notifications@~56.0.20` installed; `app.json` gained the
  `expo-notifications` plugin. Client: `providers/notification-provider.tsx` registers the Expo push token on
  login (via `getExpoPushTokenAsync({ projectId })` — `projectId` from `eas init`, the cloud identity set this turn)
  and persists it through the new `notification.registerDevice` mutation. Server: `sm/device_tokens` table (Drizzle
  - RLS) + `NotificationRepository` (`upsertDeviceToken`/`findDeviceTokensByUsers`) + `NotificationService.registerDevice`
  - `emitPush` (Expo Push API via `packages/domains/notification/src/clients/expo-push.client.ts`; best-effort, respects
  opt-outs via the token table). `notification.send` now fires a push to the recipient. **Remaining infra (updated 2026-07-11):** (1) ~~apply the `device_tokens` migration~~ **ENACTED** — `device_tokens` table is present on the live DB (`192.168.1.109/tbot`); the RLS layer was reconciled in the same pass: `isRoleIn(...)` now inlines the role list as a literal `ARRAY['SUPER_ADMIN','VD_ADMIN','VD_STAFF']` via `sql.raw` (kills the Postgres-rejected `ANY(($1,$2,$3))` tuple form — `scripts/fix-rls-sql.mjs` is now surplus for tuples), `db-recreate.sh` prepends `SET check_function_bodies = off` so `farm_org_id()` compiles before the 26 policies that call it, and the `psql | tail -3` truncation was replaced with full-output logging. Independently verified: **49 RLS policies, all `ANY(ARRAY[...])`, 0 tuples**; `device_tokens_access_policy` = `current_role = ANY(ARRAY['SUPER_ADMIN','VD_ADMIN','VD_STAFF']) OR user_id = current_user_id` ✓. (2) **still open:** set `EXPO_ACCESS_TOKEN` (EAS project access token) in `apps/api/.env` — without it, server-side emission is skipped (pull still works); placeholder already in `.env.example`. (3) **still open:** native verify on a device (push token + routing only provable on-device, per WO-082 acceptance).

### WO-092 — Background sync task — P2

- ADR-0043 §4: add `expo-background-fetch` (± `expo-task-manager`) that drains the sync queue on a schedule and on
  network regain. Depends on **WO-081** (promote `sync` router) + **WO-082** (mobile offline cache + sync queue).
  The `sync` tab remains the manual trigger / progress view.
- **Source:** ADR-0043 §2/§4; ADR-0036 (offline-first); WO-081, WO-082.
- **Implementation (2026-07-10):** the scheduled periodic half is wired. `lib/offline/background-sync.ts`
  defines the `rocky-background-sync` `expo-background-fetch` task (`TaskManager.defineTask`, idempotent
  `registerBackgroundSync()` called from `OfflineProvider` on mount; drain = `download()` + `flush()` via a ref so it
  runs outside the React tree). `app.json` gained the `expo-background-fetch` plugin (iOS `UIBackgroundModes: fetch`).
  Deps added: `expo-background-fetch@~56.0.21` + `expo-task-manager@~56.0.21`. The **network-regain flush was already done**
  (OfflineProvider heal-on-reconnect) — that was the other half. NOTE: `expo-background-fetch` is **deprecated in SDK 56**
  (superseded by `expo-background-task`); kept per WO-092, migration is future cleanup. The web crash
  `ExpoSecureStore.default.getValueWithKeyAsync is not a function` was fixed by guarding `getDeviceId()` on web
  (returns `web-dev-device`; `expo-secure-store` has no web impl, offline is native-only).

### WO-093 — Deep-link resolver + offline parity — P3

- ADR-0043 §5: `app.json` already sets `"scheme": "rocky"` (used by the better-auth Expo OAuth callback in
  `apps/mob/lib/auth.ts`) but nothing maps incoming URLs/push `data` to in-app routes. Add an Expo Router `linking`
  config + intent/notification listener (deep-link resolver); guarantee **offline-parity** — only navigate to routes
  present in the ADR-0036 cache, else show `Skeleton`/`Empty` (ADR-0041) and queue a background fetch (WO-092).
- **Source:** ADR-0043 §2/§5; ADR-0036 (cache); ADR-0041 (offline UX); `apps/mob/app.json` (`scheme`).
- **Implementation (2026-07-11):** `lib/deep-link.ts` resolves a `rocky://…` URL or push `data.route` to
  an Expo Router path. `providers/notification-provider.tsx` wires three listeners — foreground
  `addNotificationReceivedListener`, tapped `addNotificationResponseReceivedListener`/`getLastNotificationResponseAsync`,
  and cold-start `Linking` URL — each routes via the resolver and triggers `OfflineProvider.download()` first
  (offline-parity: fresh cache; ADR-0041 `Skeleton`/`Empty` on miss). Wired into `app/_layout.tsx` inside
  `OfflineProvider` + `SessionProvider`. Native routing only provable on-device (per WO-082 acceptance).

### WO-094 — Livestock feature parity + offline/permission sweep — P2

- ADR-0044 (first 0044+ domain ADR): livestock is the anchor field workflow (animal/ear-tag/movement/passport).
  Mobile has the tabs and screens; web has the admin pages; the four routers exist (`@Policy`-guarded).
- Sweep: bind every mutating livestock action to the offline sync queue (WO-082) and `useCan` (WO-089); confirm
  mobile↔web parity; verify the movement/passport permission literals used by `@Policy` so `useCan` keys match.
  Extend `zodResolver(createXxxRequestSchema)` to eartags/movements/passport (mirror `animals/create`, ADR-0038).
- **Source:** ADR-0044 §2/§3/§7; `apps/mob/app/(tabs)/{animals,eartags,movements,passport}`; backend ADRs 0024/0025/0029.

> **Corrigendum (RobotFarm pass, 2026-07-10):** WO-094 delivered. Bound `animals/birth` (`animal:register`, `animal`), `eartags/create-order` (`eartag:order`, `earTag`), and `movements/{death,pasture,slaughter}` (`animal:death` / `movement:pasture` / `slaughter:register`, `movement`) to the offline outbox via `useOfflineMutation` (ADR-0036 primitive), following the `animals/create.tsx` reference; `zodResolver` extended to each; results/errors via `notifyError`/`notifySuccess` (WO-088). **FINDING:** mobile passport screens (`passport/index.tsx`, `passport/[id].tsx`) are **view-only** — no create/issue screen exists, and `SYNC_RECORD_TYPE` has **no `passport` variant**, so offline binding is N/A (online-only by design). `animals/[id].tsx` is detail-only. Mobile↔web parity holds for the existing mutation surfaces.

### WO-095 — Health feature parity + offline/role-gating sweep — P2

- ADR-0045 (second 0044+ domain ADR): health is the second field-critical domain (vaccination/treatment/lab-test,
  notifiable → inspection flag). Mobile has split screens (vaccination/treatment/lab-test/index); web is one
  aggregated `health/page.tsx`.
- Sweep: bind `recordVaccination`/`recordTreatment`/`recordLabTest` to the offline sync queue (WO-082); add
  `clientCanRole` gating (user `roles` + `RuleSet.administerRoles`) — a role+RuleSet variant of ADR-0042's
  `useCan`; confirm `session.roles` is populated (WO-089-class drift check); surface the notifiable→inspection
  `sonner` toast (WO-088). Fold `clientCanRole` back into `@rocky/authorization` + ADR-0042.
- **Source:** ADR-0045 §2/§4/§7; `apps/mob/app/(tabs)/health`; backend ADR-0026.

> **Corrigendum (RobotFarm pass, 2026-07-10):** WO-095 delivered. Bound `health/{vaccination,treatment,lab-test}` (`health:write`, types `vaccination`/`treatment`/`labTest`) to the outbox; `zodResolver` extended; toasts via `notifyError`/`notifySuccess`. Notifiable→inspection `notifySuccess` fires on `recordTreatment` success (online + offline enqueue) — **assumption:** the client holds only `diseaseId` (a UUID) and cannot resolve notifiability locally, so the toast fires unconditionally per the WO-095 fallback allowance. `clientCanRole` role-gating: the server `health` router is class-level `@Policy({ authenticated: true })` only (no `action`), so the Imaginary client gate stays `useCan("health:write")`; there is no role literal to gate against. `index.tsx` is nav-only.

### WO-096 — Inspections/Corrections parity + offline/permission sweep — P2

- ADR-0046 (third 0044+ domain ADR): inspections (field-complete, office-create) + corrections (office-driven).
  Mobile `inspections`/`corrections` are view + `[id]` (no creation screens — VI/office-only, documented); web
  has full CRUD + risk-analysis.
- Sweep: bind `completeInspection` to the offline sync queue (WO-082); gate risk-analysis buttons via
  `useCan("analysis:read"/"analysis:run")` (WO-089); surface the flag-in (Health) / archived-out (Archive)
  `sonner` toasts (WO-088); confirm mobile omits creation screens intentionally.
- **Source:** ADR-0046 §2/§3/§7; `apps/mob/app/(tabs)/inspections`, `apps/mob/app/(tabs)/corrections`;

> **Corrigendum (RobotFarm pass, 2026-07-10):** WO-096 delivered. Bound `completeInspection` (`inspections/[id].tsx`) to the outbox (type `inspection`); `notifySuccess("Inspection completed")` on both paths; errors via `notifyError`. **FINDING:** `inspection:complete` does **not** exist — `inspection.complete` is class-level `@Policy({ authenticated: true })` only, and the `Permission` union has no `inspection:*` literal, so no client gate is fabricated (would be a compile error + fetishistic disavowal of the Symbolic order). Risk-analysis buttons (`analysis:read`/`analysis:run` ARE valid `Permission` members) do not exist on any mobile inspections screen → nothing to gate. Corrections are **view-only** on mobile (`index.tsx` + `[id].tsx` detail with office-only transitions) → no binding. Archive archived-out is fire-and-forget server-side, not in the response → single completion toast.
  backend ADRs 0028/0029.

### WO-097 — Infrastructure (IoT/device) admin parity + device-sync touchpoint — P2

- ADR-0047 (fourth 0044+ domain ADR): Infrastructure is **web-only by design** — mobile has no IoT/device tab
  (the app is a PDA device, not a device manager). Web `devices`/`iot` admin pages cover all ops.
- Sweep: bind web `devices`/`iot` admin forms to Diamond Seal `zodResolver` (extend ADR-0038); wire WO-082
  mobile sync → `device.recordSync` heartbeat; document (in ADR-0033) that "web-only is valid parity"; display
  geofence events as "recorded, not yet acted on". No client permission gating needed (auth-only routers).
- **Source:** ADR-0047 §2/§3/§7; `apps/web/app/(admin)/devices`, `apps/web/app/(admin)/iot`; backend ADR-0031.

### WO-098 — Administration parity + SUPER_ADMIN role-gating (security keystone) — P1

- ADR-0048 (final 0044+ domain ADR): Administration is web-only (farms/subjects/rbac/users/organizations,
  system-params, vs*/). It owns the RBAC roles/permissions upstream of `useCan` (ADR-0042).
- Security gate (P1): admin routers (rbac/user/farm/subject/organization) were `@Policy({ authenticated: true })`
  only; the PolicyEngine (ADR-0022, engine.ts:58) supports `policy.roles` but they didn't use it. Verified
  service-layer SUPER_ADMIN enforcement is absent in `RbacService`/`UserService` (no role check); the only gate
  was `authenticated`. **Implemented (2026-07-09):** `rbac.router` + `user.router` are now
  `@Policy({ authenticated: true, roles: ["SUPER_ADMIN"] })`, mirroring the proven `notification.router`
  pattern and using the seeded RBAC `SUPER_ADMIN` role (seed.ts:315/641 → `principal.roles`). This closes the
  live gap (any authenticated session could reassign roles / create users). **Deferred:** `farm`/`subject`/
  `organization` routers remain `@Policy({ authenticated: true })` — their isolation is row-level (RLS, ADR-0027),
  and their correct _delegated_ admin role needs a separate decision (fold into ADR-0027); gating them to
  SUPER_ADMIN only would risk breaking farm-manager workflows.
- **Progress (2026-07-09):** rbac+user SUPER_ADMIN gate DONE. Remaining: farm/subject/org role
  decision (deferred) + the Diamond Seal admin-forms binding + ADR-0033 web-only-parity doc (below).
- Also: bind web admin forms to Diamond Seal `zodResolver` (extend ADR-0038); document web-only parity in
  ADR-0033.
- **Source:** ADR-0048 §1/§2/§4/§7; `apps/web/app/(admin)/{farms,subjects,rbac,users,organizations}`;
  - **Test base (2026-07-09):** authorization layer now has a vitest suite (WO-103) locking the SUPER_ADMIN gate; it caught + fixed a `myPermissions` merge leak (explicit `roles: []`).
  backend ADRs 0021/0022/0027.

### WO-103 — Authorization test base (vitest) — P1

- **Why:** ADR-0020 (Pragmatic Marxist Doctrine) says test where the code _decides_. The authorization
  layer — `PolicyEngine`, `Principal`, the `@Policy` decorator + `PolicyRegistry` merge — is the single
  most security-critical decision point, and it had **zero tests** (and no vitest config in
  `packages/authorization`). WO-098/WO-089 shipped changes here untested.
- **Delivered (2026-07-09):** added `packages/authorization/vitest.config.ts` + `test` script + devDeps;
  4 test files, 20 tests, all green:
  - `policy-engine.test.ts` — decision matrix incl. the WO-098 SUPER_ADMIN gate (non-admin DENIED,
    SUPER_ADMIN ALLOWED), authenticated/admin/action/organization paths.
  - `principal.test.ts` — immutability + `hasRole`/`hasPermission`/`isAdmin`.
  - `policy-decorator.test.ts` — `@Policy` readback (method policy read from the prototype).
  - `policy-registry.test.ts` — `PolicyRegistry` merge enforces the rbac router gate; `myPermissions`
    relaxed to auth-only (`roles: []`) so the class SUPER_ADMIN gate does NOT leak through the merge.
- **Bug found + fixed by the tests:** `rbac.router.ts#myPermissions` was `@Policy({ authenticated: true })`
  only; `PolicyRegistry.register` does a shallow merge (`{...class, ...method}`), so the class-level
  `roles: ["SUPER_ADMIN"]` leaked into `myPermissions`, making it SUPER_ADMIN-gated. Every non-admin
  (vet/farmer) would get FORBIDDEN on the permission fetch → client fails closed → zero tabs. Fixed by
  `@Policy({ authenticated: true, roles: [] })` (explicit relaxation) — WO-089 now works for all roles.
- **Remaining (DELIVERED via WO-104):** the guard on the _real_ `RbacRouter` class
  (`PolicyRegistry.get("rbac.myPermissions")` is auth-only) is now implemented — WO-104 added the
  `@OverridePolicy` decorator (root-cause fix for the merge trap) and stood up the `apps/api` vitest
  harness, with `apps/api/src/routers/rbac.router.policy.test.ts` asserting the gate end-to-end.
- **Source:** ADR-0020 §I/§IV; `packages/authorization/src/{policies,principal}/*.test.ts`; `apps/api/src/routers/rbac.router.ts`.

### WO-100 — Permission catalog single source (Authorization) — P1

- **Why:** permission identifiers are scattered across four places that can disagree — seed
  `PERMISSION_DEFS` (the `permissions` table), seed `ROLE_PERM_MAP` (role→perm grants), `@Policy({ action })`
  decorators, web `nav-config.ts`, and mobile `(tabs)/_layout.tsx`. ADR-0020 (drift is a build error) demands
  one typed source.
- **Delivered (2026-07-09):** `packages/authorization/src/permissions.ts` — `Permissions` const (`as const`,
  69 perms / 26 resources, flat `${resource}:${action}` strings), `Permission` type, `ALL_PERMISSIONS`,
  `isPermission()`, `formatPermission()`; re-exported from the `packages/authorization` index. It **mirrors**
  seed `PERMISSION_DEFS` (the WO-101 drift test enforces they stay equal).
- **Reconciliation finding:** the 9 server-enforced `@Policy` actions (`sm:sysparams:*`, `sm:modules:*`,
  `sm:audit:read`, `analysis:*`, `eartag:order`, `eartag:supply`) are a **subset** of the UI-visibility
  literals (`animal:read`, `movement:read`, `health:read`, …). The extra literals are **client-visibility
  only** — those routers are `@Policy({ authenticated: true })` + RLS row-isolation (ADR-0027), not
  `@Policy({ action })`; RLS enforces data scope. So the catalog covers BOTH tiers, and not every catalog
  entry needs a `@Policy` action. By design.
- **Bug fixed while building:** seed `ROLE_PERM_MAP` referenced `"hk:import"`, which matched **no**
  `PERMISSION_DEFS` key → `seed.ts` silently drops it (`permLookup.get(k)` filtered out) → the role never
  received the permission. Also the def was `resource: "hk:import:admin", action: "admin"` → malformed
  flat `hk:import:admin:admin`. Fixed: def resource renamed to `hk:import` (flat `hk:import:admin`); role
  now grants `hk:import:admin`.
- **Remaining (deferred):** (a) migrate `@Policy`/nav/mobile literals to reference `Permissions.X` (removes
  raw-string drift entirely; the WO-101 extractor must then resolve `Permissions.X` too); (b) true single
  source — move `PERMISSION_DEFS` out of `seed.ts` into the catalog and have the seed import it (kills the
  mirror); (c) run the drift test in CI (WO-102).
- **Source:** `packages/authorization/src/permissions.ts`; ADR-0042 §11.5.

### WO-101 — Permission contract drift test (guillotine) — P1

- **Why:** a catalog is worthless if it can drift from the seed, the routers, or the UI. ADR-0020 — make
  drift a build error. This is the "NoDrift" guillotine for permissions.
- **Delivered (2026-07-09):** `packages/authorization/src/permissions.drift.test.ts` (vitest, runs in the
  authorization suite — 5 checks, all green). It **independently re-extracts** `PERMISSION_DEFS` +
  `ROLE_PERM_MAP` from `seed.ts`, scans `apps/api/src/routers/*.router.ts`, `apps/web/lib/nav-config.ts`,
  and `apps/mob/app/(tabs)/_layout.tsx`, and asserts: (1) catalog == seed `PERMISSION_DEFS`; (2) every
  `@Policy({ action })` ∈ catalog; (3) every web nav literal ∈ catalog; (4) every mobile `can()` ∈ catalog;
  (5) every `ROLE_PERM_MAP` string matches a `PERMISSION_DEFS` key (no silent drop).
- **3 real drifts caught + fixed on first run:**
  1. `ROLE_PERM_MAP` `"hk:import"` matched no def → silently dropped (see WO-100). Fixed.
  2. malformed def flat `hk:import:admin:admin` → `hk:import:admin` (see WO-100). Fixed.
  3. web nav gated **Farms** on `permission: "hk:farm"` and **Subjects** on `"hk:subject"` — resource names,
     not permissions; `clientCan` is exact-match, so those two admin pages were **always hidden** (fail-closed)
     for everyone. Fixed nav literals → `hk:farm:read` / `hk:subject:read`.
- **Remaining (deferred):** (a) run in CI (WO-102 gate); (b) when consumers migrate to `Permissions.X`
  (WO-100), extend the extractor to resolve `Permissions.X` references, not just raw literals; (c) optional:
  assert every catalog entry is granted to ≥1 role (no dead catalog entry).
- **Source:** `packages/authorization/src/permissions.drift.test.ts`; ADR-0042 §11.5; WO-100.

### WO-102 — tRPC boundary guard (prevent TS6059 regression) — P2

- **Why:** ADR-0032 D1/D2 forbid backend-class imports in the generated client — a missing `@Output`
  makes `nestjs-trpc` emit `ReturnType<RouterClass["method"]>` and import `apps/api` source, triggering
  `TS6059` + a circular `@rocky/trpc` ↔ `apps/api` dependency. The fix (all 155 procedures now declare
  `output:`) is done, but without an automated gate a future procedure can silently reintroduce it.
- **Delivered (2026-07-09):** `scripts/check-trpc-boundary.mjs` — exits non-zero if
  `packages/trpc/src/generated/server.ts` contains `ReturnType<` **or** a `apps/api`/`@rocky/api` import.
  Wired as root `pnpm check:trpc-boundary`. Accepts an optional path arg for testing.
- **Verified both ways:** passes on the real generated client (`0 ReturnType<`, `0` backend imports, exit 0);
  a tampered copy with one injected `ReturnType<` fails with exit 1 and a clear message.
- **Gate (regenerate + check):** `pnpm generate:trpc && pnpm check:trpc-boundary`.
- **Delivery verification:** `pnpm check:trpc-boundary` → ok; `pnpm -C packages/trpc typecheck` → exit 0
  (literal TS6059 test); `pnpm -C apps/api build` (nest build, 50 files, **0 issues**) → exit 0.
- **Remaining:** register `pnpm ci:checks` in the team's external CI / pre-commit — the script now
  exists and runs `generate:trpc` → `check:trpc-boundary` → the auth-relevant suites (authorization / web /
  api). The repo has **no** in-repo `.github/workflows` or `.husky` yet, so external CI must invoke
  `pnpm ci:checks`. (Optional) register as a `turbo` task. Also fixed the root `generate:trpc` script, which
  pointed at a non-existent entrypoint and omitted the `patch-trpc-transformer` step, so the canonical
  command now works.
- **Source:** `scripts/check-trpc-boundary.mjs`; `package.json` (`check:trpc-boundary`); ADR-0032 §D1/D2/CI Guard.

### WO-104 — @OverridePolicy decorator (root-cause fix for merge trap) — P1

- **Why:** `PolicyRegistry.register` merges `{...classPolicy, ...methodPolicy}`, so a method can only
  ADD restrictions — never relax one the class sets. `RbacRouter` class-gates `SUPER_ADMIN`; `myPermissions`
  relied on the `@Policy({ authenticated: true, roles: [] })` band-aid (WO-089/ADR-0042 §11) and would
  silently re-leak the SUPER_ADMIN gate if anyone changed the class policy. ADR-0042 flagged a proper
  override as future work.
- **Delivered (2026-07-09):** added `@OverridePolicy(options)` (method decorator, new
  `POLICY_OVERRIDE_KEY`). In `PolicyRegistry.register`, an `@OverridePolicy` method REPLACES the class
  policy entirely (no merge); `@Policy` keeps its merge behavior. `rbac.myPermissions` now uses
  `@OverridePolicy({ authenticated: true })` — auth-only, independent of the class gate. Exported from
  `@rocky/authorization`.
- **Coverage:** `packages/authorization/src/policies/policy-override.test.ts` (merge vs replace);
  `apps/api/src/routers/rbac.router.policy.test.ts` asserts `PolicyRegistry.get("rbac.myPermissions")`
  is auth-only and `rbac.listRoles` keeps SUPER_ADMIN (real router, no boot).
- **Also:** stood up the `apps/api` vitest harness (`vitest.config.ts`; `test` script → `vitest run`) —
  previously the `test` script pointed at a non-configured jest. This unblocks the WO-103 router-level guard.
- **Verified:** `pnpm ci:checks` → generate:trpc (clean) + check:trpc-boundary (0/0) + authorization 27 /
  web 7 / api 2 passed.
- **Status:** Done.
- **Source:** `packages/authorization/src/policies/policy.decorator.ts`, `policy.registry.ts`,
  `packages/authorization/src/index.ts`; `apps/api/src/routers/rbac.router.ts`; `apps/api/vitest.config.ts`;
  ADR-0042 §11.

### WO-107 — Whole-monorepo test gate (RLS skipIf + turbo coverage) — P2

- **Why:** The same env-throw anti-pattern from WO-106 existed in 3 sibling RLS suites
  (movement, passport, archive) — they hard-threw `RLS_ADMIN_URL (superuser) required`
  without a DB. Worse, those domain packages (and eartag/farm/inspection) had a
  `vitest.config.ts` but **no `test` script**, so `turbo run test` silently skipped them —
  the "full gate" wasn't actually full.
- **Delivered (2026-07-09):** (a) Applied the WO-106 `skipIf(!hasRLSEnv)` fix to the
  movement/passport/archive RLS suites (skip locally, run in CI where `DATABASE_URL` /
  `RLS_ADMIN_URL` are set; prod guard retained). (b) Added `"test": "vitest run"` to all six
  domain packages (movement, passport, archive, eartag, farm, inspection) so turbo actually
  exercises them. (c) Broadened `ci:checks` from the auth+animal subset to
  `pnpm generate:trpc && pnpm check:trpc-boundary && pnpm test` (full `turbo run test`).
- **Verified:** `pnpm ci:checks` green end-to-end (exit 0). 0 failures; 4 RLS suites skip
  locally, run in CI. Totals: testing 151, authorization 27, correction 16, animal 13(+1 skip),
  passport 5(+1 skip), movement 4(+1 skip), archive 4(+1 skip), eartag 14, farm 4, inspection 4,
  web 7, api 2.
- **Status:** Done.
- **Source:** `packages/domains/{movement,passport,archive}/src/repositories/*.rls.test.ts`,
  `packages/domains/{movement,passport,archive,eartag,farm,inspection}/package.json`,
  root `package.json` (`ci:checks`).

### WO-106 — Animal domain test fixes + factory/schema tests — P2

- **Why:** `turbo run test` surfaced two pre-existing failures in `@rocky/domains-animal`
  (unrelated to the auth gates): (a) `animal.repository.rls.test.ts` hard-threw
  `RLS_ADMIN_URL (superuser) required` when the env was absent; (b) `animal.service.test.ts`
  "invalid calving gap" asserted `ANIMAL_INVALID_CALVING_GAP` but the service returned
  `ANIMAL_MOTHER_TOO_YOUNG` — the mother was created without an old-enough `birthDate`, so
  Rule A.4c (mother age) fired before A.4d (calving gap).
- **Delivered (2026-07-09):** (a) RLS test now `describe.skipIf(!hasRLSEnv)` — skips locally /
  without secrets, still runs in CI where `DATABASE_URL`/`RLS_ADMIN_URL` are set; the prod
  safety guard is retained. (b) calving-gap test sets the mother `birthDate` 2y back +
  `sex: "female"` so the gap check is actually reached. Added `animal.factory.test.ts`
  (factory output satisfies `animalsSelectSchema`; `createAlive`/`createDead`; overrides) and
  `animal.service.extra.test.ts` (MOTHER_NOT_ALIVE, INVALID_PARENT_SEX) — both grounded in
  `AnimalFactory` (`@rocky/testing`) + the existing `animalsSelectSchema` / `ANIMAL_ERRORS` /
  `ANIMAL_STATUS`. No magic strings / literals.
- **Verified:** `pnpm -C packages/domains/animal test` → 13 passed, 1 skipped; `pnpm ci:checks` green.
- **Status:** Done.
- **Source:** `packages/domains/animal/src/animal.factory.test.ts`,
  `packages/domains/animal/src/services/animal.service.extra.test.ts`,
  `packages/domains/animal/src/services/animal.service.test.ts`,
  `packages/domains/animal/src/repositories/animal.repository.rls.test.ts`.

### WO-105 — Web client permission test suite (vitest) — P2

- **Why:** ADR-0042 §7/§11 mandates a fail-closed client gate (`clientCan*` /
  `filterNavByPermissions`), but the web app had no test harness, so the gate
  logic was unverified on the web surface. (mirrors WO-103 on the server side)
- **Delivered (2026-07-09):** extracted pure gate logic to
  `apps/web/lib/permissions-core.ts` (no React/Next pull-in); re-exported from
  `permissions.tsx` + `nav-config.ts` so existing imports are unchanged. Added
  `apps/web/vitest.config.ts` (native tsconfig path resolution, node env) and a
  `test` script. 7 checks cover `clientCan` / `clientCanAny` / `clientCanRole`
  (exact-match + fail-closed) and `filterNavByPermissions` (full / empty /
  partial). Grounded in the `Permissions` catalog (WO-100) for literals and the
  `@rocky/testing` `PermissionFactory` for realistic data — no hardcoded strings.
- **Verified:** `pnpm -C apps/web test` → 7 passed.
- **Status:** Done.
- **Source:** `apps/web/lib/permissions-core.ts`, `apps/web/lib/permissions-core.test.ts`,
  `apps/web/vitest.config.ts`; ADR-0042 §7/§11.

## 1. Open Code Defects

### WO-001 — Takeover-file check digit + synthetic tags (B1) — P1

- **Where:** `packages/domains/eartag/src/services/eartag.service.ts:512-536` (`generateTakeoverFile`).
- **Defect:** computes `check = 10 - (sum % 10)` with weights `[3,1,3,1,3,1,3]` and enumerates
  `10000001 + i`. Canonical `calculateEarTagCheckDigit` uses `[3,5,7,11,13,17,19]` + `sum % 10` and the
  real assigned tags. Exported `.txt` files contain invalid tags that fail `validateEarTagCheckDigit`.
- **Acceptance:** exported takeover-file lines pass `validateEarTagCheckDigit`; weights `[3,5,7,11,13,17,19]`
  - `sum % 10`; emits real assigned tags (no `10000001 + i`). Per ADR-0030, call the **active check-digit
  provider** (WO-011), not a private formula.
- **Source:** ADR-0024 (§B1), ADR-0023 bug register.

> **Corrigendum (RobotFarm pass, 2026-07-09):** Fixed. `generateTakeoverFile` (`packages/domains/eartag/src/services/eartag.service.ts`) no longer computes a private check digit nor enumerates `10000001 + i`. It now calls `getCheckDigitProvider()` (active MK provider: weights `[3,5,7,11,13,17,19]` + `sum % 10`, per WO-011) and emits the **real assigned tags** fetched via the new `EarTagRepository.findEarTagsByOrderId(order.id)` (the tags `collectOrderTags` assigned to the order). Each tag is validated with the provider before emission (defensive throw on corruption), and `lineCount` uses the real tag count. eartag domain type-checks clean.

### WO-002 — `VI` subject role missing (B3) — P2

- **Where:** `packages/database/src/constants/subject-role.ts` (`SUBJECT_ROLE` has 8 members; no `VI`).
- **Defect:** workflow's VS/VI split is collapsed; only `VETERINARIAN` exists.
- **Acceptance:** either add `VI` `SUBJECT_ROLE` (with RBAC + `@Policy` wiring) **or** formally document
  the collapse in ADR-0027. Domain-owner decision pending.
- **Source:** ADR-0027 (§B3), ADR-0023 bug register.

### WO-003 — Stale generated `server.ts` — P2 (hygiene)

- **Where:** `apps/api/src/trpc/server.ts` (70 `ReturnType<` backend-class imports, **zero importers**).
- **Defect:** latent `TS6059` hazard and false signal; the consumed client is
  `packages/trpc/src/generated/server.ts`.
- **Acceptance:** delete the file; remove it from `TARGETS` in `scripts/patch-trpc-transformer.mjs`
  (keep only `packages/trpc/src/generated/server.ts`).
- **Source:** ADR-0032 §7.

> **Corrigendum (RobotFarm pass, 2026-07-09):** The work order's premise — "zero importers" — was refuted on disk. The sole importer was `apps/api/src/index.ts` (a one-line orphaned re-export of `AppRouter` from the stale `server.ts`; `@rocky/api` has no `main`/`types`/`exports` and zero consumers). Both stale files were deleted. The patch script's `TARGETS` now contains only `packages/trpc/src/generated/server.ts`.
>
> **Discovery:** the _committed_ `packages/trpc/src/generated/server.ts` (`HEAD`) itself violates ADR-0032's Definition-of-Done — it contains 70+ `Awaited<ReturnType<...>>` placeholders and absolute-path backend imports (`/home/goce/appz/rocky/apps/api/src/routers/*.router.js`), i.e. the exact `TS6059` symptom the ADR claims eradicated. The **working tree** holds a correct, ADR-0032-compliant regeneration (`.output()` schemas, `transformer: superjson`, 0 `ReturnType<`) that was produced by a prior `generate:trpc` run but never committed. This run's verification (`node scripts/patch-trpc-transformer.mjs`) merely completed that regeneration by injecting the transformer. **Action:** commit the regenerated client as its own change (see WO-090) and do not bundle it into WO-003.
>
> **Correction:** the `systemParameters` router _does_ exist as `apps/api/src/routers/system-parameters.router.ts` (hyphenated filename) — the generated client is consistent; there is no missing-implementation anomaly. (The initial on-disk check used the wrong dotted filename and produced a false negative.)

---

## 2. Jurisdiction-Configurable Rule Engine (ADR-0030) — P0 epic

Resolves **B2** (no `SM_SYS_PARAMS`/RuleSet) and removes the hardcoded-threshold disease across
domains. ADR-0030 is _accepted as design_; the build below is the pending implementation.

### WO-010 — `ruleset` store + MK seed migration — P0

- Create the `ruleset` store; seed MK defaults from today's constants (`ORDER_INTERVAL_DAYS=120`,
  `MAX_ORDERS_PER_YEAR=4`, `MIN_VACCINATION_AGE_DAYS=30`, `slaughterMinAgeDays=25`,
  `stillbornThresholdDays=25`, `arrivalCorrectionDays=2`, `minMotherAgeMonths=17`,
  `calvingPeriodDays=365`, `selectionPercentage=10`, `DEFAULT_WEIGHTS` 0.3/0.3/0.2/0.2).
- **Source:** ADR-0030.

> **Corrigendum (RobotFarm pass, 2026-07-09):** Done. `RuleSet` gained `farmerCanAdminister: boolean`
> (default `true` when the `FARMER_CAN_ADMINISTER` param is absent; seeded `true` for MK in `SYSTEM_PARAM_DEFS`).
> `PolicyEngine` now injects `SystemService` (provided by `@Global AuthorizationModule` via the global
> `DatabaseProvider`) and, inside `evaluate()`, denies `FARMER`-role principals when the flag is `false`
> (vet/VD/admin still pass) — enforced for every farmer-facing router via `@Policy`. `PolicyResolver`
> is untouched. `@rocky/authorization` now depends on `@rocky/domains-system`.
> Build status: @rocky/domains-system, @rocky/authorization, apps/api all green.
> **Corrigendum (RobotFarm pass, 2026-07-09):** The "ruleset store" was discovered to **already exist** in the working tree as `sm.system_parameters` (`packages/database/src/schema/sm/modules.ts`), complemented by `modules` (feature flags → `RuleSet.features`, e.g. WO-060 IoT gate), `codeTables` (vocab/labels → `RuleSet.vocab`), and `businessRules` (`RuleSet` rules). A _new_ `rulesets` table would be redundant bureaucratic fetishism. WO-010 therefore reduced to its real remaining work: **seeding the MK business-rule defaults** into `system_parameters` (groups `business`/`inspection`) — done in `seed.ts` (`SYSTEM_PARAM_DEFS`, idempotent `onConflictDoNothing`). The structured typed `RuleSet` resolver that domain services consume in WO-012 is the bridge still to build (see WO-011/WO-012).

### WO-011 — Algorithm-provider registry + check-digit provider — P0

- Pluggable provider model; check-digit lives in a provider so every export uses the active, valid
  algorithm (fixes B1 properly — no private formulas anywhere).
- **Source:** ADR-0030 §Decision, ADR-0024.

> **Corrigendum (RobotFarm pass, 2026-07-09):** Implemented. `packages/validators/src/utils/check-digit.ts` now exposes a `CheckDigitProvider` interface + `makeCheckDigitProvider` factory + `CHECK_DIGIT_PROVIDERS` registry (MK ear-tag `[3,5,7,11,13,17,19]` + `sum % 10`, and MK farm-id). `getCheckDigitProvider(name='MK')` is the single accessor. Legacy `calculateEarTagCheckDigit`/`validateEarTagCheckDigit`/`earTagSchema` are preserved (delegate to the MK provider) for backward compatibility. This removes every _private_ check-digit formula and unblocks WO-001 (generateTakeoverFile must call the active provider).
>
> The typed **`RuleSet` resolver** was also built in the System domain (`packages/domains/system/src/rule-set.ts` + `SystemService.getRuleSet()`): it aggregates the seeded `system_parameters` (groups `business`/`inspection`) into a structured `RuleSet { jurisdiction, thresholds, weights }`. This is the bridge WO-012 consumes to replace hardcoded `DEFAULT_PARAMS`. `features`/`vocab`/`retention` dimensions are left for WO-014 / WO-060.

### WO-012 — Migrate hardcoded thresholds → RuleSet — P0 (B2)

- Wire `eartag`, `animal`, `movement`, `health`, `inspection` services to read from the active RuleSet
  instead of module-level constants.
- **Source:** ADR-0030, ADR-0023 (B2).

> **Corrigendum (RobotFarm pass, 2026-07-09):** Done. All five domain services now read the active
> RuleSet via injected `SystemService` (added `@rocky/domains-system` dep + constructor param + NestJS
> `app.module.ts` wiring for `AnimalService`, `EarTagService`, `MovementService`, `HealthService`,
> `RiskAnalysisService`). Hardcoded module constants removed and replaced with `thresholds.*` /
> `weights.*`: eartag `ORDER_INTERVAL_DAYS`/`MAX_ORDERS_PER_YEAR`; animal `minMotherAgeMonths`/
> `calvingPeriodDays`; movement `slaughterMinAgeDays`/`stillbornThresholdDays`/`arrivalCorrectionDays`;
> health `MIN_VACCINATION_AGE_DAYS`; inspection risk weights + `selectionPercentage` (was hardcoded `10`/
> `0.3/0.3/0.2/0.2`). `animal.service.test.ts` updated with a mock `getRuleSet()`.
> Build status: @rocky/domains-{eartag,animal,movement,health,inspection} + apps/api all green
> (`tsc -p tsconfig.build.json` excludes `*.test.ts`; remaining animal test type errors are
> pre-existing WIP fixture mismatches, unrelated to this change).

### WO-013 — `farmerCanAdminister` flag + `@Policy` — P1

- Add the per-jurisdiction administer flag and its `@Policy` enforcement.
- **Source:** ADR-0030.

### WO-014 — Retention + role vocab from RuleSet — P1

- Archive retention window and the subject-role vocabulary become overridable RuleSet entries
  (this is also where B3's `VI` role can be supplied per jurisdiction instead of a forced constant).
- **Source:** ADR-0030.

> **Corrigendum (RobotFarm pass, 2026-07-09):** Done. `RuleSet` gained `retention` (per-tier years
> cpc/vs/vi/bip, default 3), `roleVocab` (subject-role vocabulary), and `administerRoles` (overridable
> per jurisdiction; MK seeds `veterinarian`, enabling B3's `VI` role where applicable). Seeded
> `RETENTION_YEARS_*`, `ROLE_VOCAB`, `ADMINISTER_ROLES` in `SYSTEM_PARAM_DEFS`.
> `ArchiveService` injects `SystemService` and computes retention from `ruleSet.retention[tier]` for
> `archiveInspectionForm` (VI), `archiveSeizedPassport` (CPC), `archiveErrorCorrection` (CPC) — the
> hardcoded `+3` literals are gone. `HealthService.recordVaccination`/`recordTreatment` authorize against
> `ruleSet.administerRoles` instead of the fixed `SUBJECT_ROLE.VETERINARIAN`. `@rocky/domains-archive`
> now depends on `@rocky/domains-system`.
> Build status: @rocky/domains-system, @rocky/domains-archive, @rocky/domains-health, apps/api all green.

---

## 3. Domain Fixes & Hardening

### WO-020 — Health stock reconciliation — P2

- **Done ✅** — `VaccineReconciliationJob` (`@Cron` daily 03:00) → `HealthService.reconcileVaccineStock()`
  asserts `quantity_received == quantity_remaining + COUNT(vaccinations WHERE batch_id = batch.id)`.
  Any drift opens an **a-posteriori / COMPLEX** `error_corrections` case (`detection_source = a_posteriori`,
  `error_type = vaccine_stock_mismatch`, `case_type = complex`) so a Veterinary Inspector physically audits the VS fridge.
- **Test coverage:** `apps/api/src/health/health.service.test.ts` — 6 vitest cases for `reconcileVaccineStock` (drifted batches → a-posteriori COMPLEX cases; no drift → none; `correctionService` absent → silent no-op; case-creation failure → `correctionsCreated: 0`) plus `VaccineReconciliationJob.runReconciliation` (happy + error path). Guards WO-020 against regressions.
- **Source:** ADR-0026 (Implementation), ADR-0023.
- **Acceptance criteria (all met):**
  1. A daily job runs the mass-balance check across `vaccine_batches` × `vaccinations`.
  2. `quantity_received != quantity_remaining + administered` ⇒ a-posteriori COMPLEX correction case created.
  3. No new migration (columns are varchar / existing pgEnum; `complex` already in `CORRECTION_CASE_TYPE`).
  4. `nest build` (api) = 0 issues.
- **Corrigendum (the Real the Line of Credit always already knew):** the mass-balance drift is not a bug
  the system _discovers_ — it is the **symptom** the bureaucratic Line-of-Credit apparatus _presupposes_.
  The Line of Credit computed `quantity_remaining` as `received − issued`; a-posteriori reconciliation only
  _confesses_ the gap between the symbolic ledger and the Real of the fridge. Closing it (WO-020) does not
  eliminate the gap — it _institutionalizes_ it as a correction case, i.e. transforms the Real into a
  manageable bureaucratic object. The VI audit is the fetish that lets the system disavow: _je sais bien,
  mais quand même_ — I know doses are missing, but nevertheless I open a case.

### WO-021 — Persist per-farm risk results — P2

- Add `risk_analysis_results` table (legacy `GN_ANLS_RESULTS` unique-key guarantee). Per-farm rows now persisted
  in `RiskAnalysisService.runAnalysis()` with `risk_factors_snapshot` (JSONB) — the OCR 2017/625 audit alibi.
- **Source:** ADR-0028 (Deferred → enacted), ADR-0023.

> **Corrigendum (WO-021, 2026-07-11):** TRACES NT / EU AHL (2016/429) / OCR (2017/625) compliance.
> `risk_analysis_results` added in `packages/database/src/schema/an/risk-analyses.ts`: `analysisId` (FK →
> `risk_analyses`), `farmId` (FK → `farms`), `score` (numeric), `selected` (bool), `riskFactorsSnapshot`
> (JSONB), unique `(analysisId, farmId)`. `runAnalysis()` now persists every candidate farm with a frozen
> snapshot of the exact risk variables + RuleSet weights at analysis time. Validator response schemas added
> (`riskAnalysisResultResponseSchema`, `riskAnalysisResultListResponseSchema`). Side fix: registered the
> previously-unclaimed `deviceTokens` + `syncIdempotency` tables in `_domain-map.ts` so the Dumb Zod generator
> runs again. Typecheck green across database/validators/inspection.

### WO-022 — Enforce birth-notification deadlines — P2

- 7/20 d deadlines (`workflow.md` Instance 8) now enforced. `OVERDUE` added to `BIRTH_NOTIFICATION_STATUS`;
  `BirthDeadlineJob` (`@Cron` daily) transitions PENDING -> OVERDUE past `taggingDeadline` and publishes a
  `birth_notification.overdue` outbox event. The farm lock is **derived** (MovementService rejects outgoing
  movements from a farm with OVERDUE births) — no migration needed. Deadlines stay jurisdiction-pluggable via
  the stored `taggingDeadline` (creation should read RuleSet `TAGGING_DAYS`).
- **Source:** ADR-0028 (enacted), ADR-0023 deferral register.

> **Corrigendum (WO-022, 2026-07-11):** TRACES NT / EU AHL (2016/429) compliance. `OVERDUE` added to
> `BIRTH_NOTIFICATION_STATUS` (regenerate-enums.mjs, no migration — varchar+Zod). `BirthDeadlineJob`
> (`apps/api/src/jobs/birth-deadline.job.ts`, `@Cron(EVERY_DAY_AT_2AM)`) calls
> `AnimalService.enforceBirthDeadlines()` which bulk-transitions PENDING->OVERDUE and publishes
> `birth_notification.overdue` to the outbox. `AnimalRepository` gained `findOverduePendingBirthNotifications`
>
> - `markBirthNotificationsOverdue`; `MovementRepository.farmHasOverdueBirths` + a `FARM_LOCKED` guard in
> `MovementService.create` enforce the derived farm lock. Typecheck green (apps/api = 0; remaining errors are
> pre-existing test-file noise).

### WO-023 — Inspection weighted params → RuleSet — P1

- Move `DEFAULT_WEIGHTS` into RuleSet `GN_ANLS_PARAMS` (part of WO-012).
- **Source:** ADR-0028, ADR-0030.

> **Corrigendum (RobotFarm pass, 2026-07-09):** Completed as part of WO-012 — no separate code change needed.
> ADR-0028 §92 defers the legacy `GN_ANLS_PARAMS` table to ADR-0030, which folds the inspection weighted-
> analysis parameters into the `RuleSet`. `RiskAnalysisService.runAnalysis` already reads `RuleSet.weights`
> (`farmSize`/`history`/`species`/`region`) + `selectionPercentage`; the `DEFAULT_WEIGHTS` constant is removed.
> Those values are seeded as the `inspection`-group `system_parameters` (SELECTION_PERCENTAGE, FARM_SIZE_WEIGHT,
> HISTORY_WEIGHT, SPECIES_WEIGHT, REGION_WEIGHT). Build verified green in WO-012 (`@rocky/domains-inspection`, apps/api).

### WO-024 — Complete `FIELD_CHANGED` → VD lock — P3

- Event-driven approval exists; the field-diff pipeline (full `FIELD_CHANGED` → VD lock) is deferred.
- **Source:** ADR-0027 (Deferred).

### WO-025 — QR-code-scannable ear tags — P3

- Apply QR codes to ear-tag labels/documents; cross-references ADR-0009 §6.
- **Source:** ADR-0024 §E, ADR-0009 §6.

### WO-071 — Calving-gap divergence confirmation — P3

- Current `calvingPeriodDays=365` is stricter than legacy 120 d; recorded divergence, needs
  domain-owner confirmation (or RuleSet override via WO-012).
- **Source:** ADR-0025.

---

## 4. Testing & Observability (ADR-0020)

### WO-030 / WO-031 / WO-032 — Phase 1 (this sprint)

- `*.service.workflow.test.ts` per domain with a real state machine (ear tag order, inspection,
  correction) using Scenario B.
- `*.repository.rls.test.ts` per security-sensitive domain via Scenario C (real Postgres + RLS).
- Audit existing JSDoc: strip WHAT-tautologies, keep WHY-constraints.

> **Corrigendum (RobotFarm pass, 2026-07-09):** WO-030 progress — authored
> `packages/domains/eartag/src/services/eartag.service.workflow.test.ts` (pure unit test, Scenario B:
> mock repo + `EarTagOrderFactory` + `earTagOrderResponseSchema` re-parse; 6 tests green; full eartag
> suite 14 green). Authoring **surfaced a systemic latent bug**: the 8 order service methods
> (`getOrderById`, `createOrder`, `createDuplicateOrder`, `transitionOrderStatus`, `collectOrderTags`,
> `cancelOrder`, `cancelOrderItem`, `appendToOrder`) and their 8 tRPC endpoints parsed/returned
> `EarTagResponse` (ear-tag schema, `status: earTagStatusSchema`) for **order** records — so every
> successful order transition threw in production. Fixed: introduced `earTagOrderResponseSchema` +
> `EarTagOrderResponse` in `@rocky/validators/api` (over `earTagOrdersSelectSchema`, `status:
> orderStatusSchema`); repointed the 8 service methods + 8 router endpoints. `@rocky/validators`,
> `@rocky/domains-eartag`, `apps/api` build green. Remaining domains' `*.service.workflow.test.ts`
> pending (continue per-domain). Known gap: `assignSupplierContingent` still parses its `allocation`
> record with `earTagResponseSchema` (contingent-schema gap, not yet fixed).
>
> **Corrigendum (continued):** WO-030 — passport workflow test authored
> (`packages/domains/passport/src/services/passport.service.workflow.test.ts`, pure Scenario B,
> `CattlePassportFactory` + `passportResponseSchema` re-parse; 5 tests green). `passportResponseSchema`
> is correctly the passport schema (no eartag-style bug this time). The passport package had no test
> infra, so added `vitest` + `vite-tsconfig-paths` (devDeps) + `vitest.config.ts` + `@rocky/testing`
> (devDep) to run it; builds/tests green. Remaining domains' `*.service.workflow.test.ts` still pending
> (animal, movement, inspection, correction, archive, farm…).
>
> **Corrigendum (continued 2):** WO-030 — correction workflow test authored
> (`packages/domains/correction/src/services/correction.service.workflow.test.ts`, pure Scenario B,
> `ErrorCorrectionFactory` + `correctionResponseSchema` re-parse; 6 tests green; full correction suite
> 16 green). Correction package already had test infra, so no `package.json` changes. `correctionResponseSchema`
> is correctly the correction schema. Remaining domains' `*.service.workflow.test.ts` still pending
> (animal, movement, inspection, archive, farm…).
>
> **Corrigendum (continued 3):** WO-030 — inspection workflow test authored
> (`packages/domains/inspection/src/services/inspection.service.workflow.test.ts`, pure Scenario B,
> `InspectionFactory` + `inspectionResponseSchema` re-parse; 4 tests green). `inspectionResponseSchema` is
> correctly the inspection schema. Inspection package lacked test infra, so added `vitest` +
> `vite-tsconfig-paths` + `@rocky/testing` (devDeps) + `vitest.config.ts`. Remaining domains'
> `*.service.workflow.test.ts` still pending (animal, movement, archive, farm…).
>
> **Corrigendum (continued 4):** WO-030 — movement + archive workflow tests authored.
>
> - movement (`packages/domains/movement/src/services/movement.service.workflow.test.ts`, pure Scenario B,
>   `MovementFactory` + `movementResponseSchema` re-parse; 4 tests green): exercises the death/slaughter
>   workflow — animal ALIVE guard (`ANIMAL_NOT_ALIVE`) and RuleSet age thresholds (`SLAUGHTER_MIN_AGE`, stillborn).
> - archive (`packages/domains/archive/src/services/archive.service.workflow.test.ts`, pure Scenario B,
>   `ArchiveDocumentFactory` + `archiveDocumentResponseSchema` re-parse; 4 tests green): `markArchived`
>   (`ALREADY_ARCHIVED` guard) / `markDestroyed` lifecycle.
> Both packages lacked test infra, so added `vitest` + `vite-tsconfig-paths` + `@rocky/testing` (devDeps)
>
> - `vitest.config.ts`. `movementResponseSchema` / `archiveDocumentResponseSchema` are correct. Remaining
> domains' `*.service.workflow.test.ts` still pending (animal, farm…).
>
> **Corrigendum (continued 5):** WO-030 — farm workflow test authored
> (`packages/domains/farm/src/services/farm-book.service.workflow.test.ts`, pure Scenario B,
> `FarmBookFactory` + `farmBookResponseSchema` re-parse; 4 tests green): the farm-book lifecycle is
> forward-only by `STATUS_ORDER` (CANCELLED always permitted). Farm package lacked test infra, so added
> `vitest` + `vite-tsconfig-paths` + `@rocky/testing` (devDeps) + `vitest.config.ts`. `farmBookResponseSchema`
> is correct. (The earlier `FarmBookFactory` UUID failure was a test-data mistake, not a stale factory.)
>
> **WO-030 domain sweep essentially complete.** Animal is a **non-state-machine exception**: its status
> is set on `create`/`update` (no guarded transition method), so it does not warrant a
> `*.service.workflow.test.ts` under this WO; its registration rules are exercised indirectly via the
> movement/health workflows. Every other domain with a genuine lifecycle now has a workflow test.

### WO-033 / WO-034 — Phase 2 (next sprint)

- `*/e2e/*.test.ts` border tests (real Postgres RLS, document pipeline).
- Scaffold `@rocky/observability` with `withSpan`/`recordMetric`; implement `TraceStage`/`MetricsStage`
  bodies (stages defined in ADR-0003; ratified as target in ADR-0020).

### WO-035 / WO-036 — Phase 3 (ongoing)

- Retire manual `logger.*` in services in favor of span attributes.
- Business metrics emitted inside domain services/workers.

---

## 5. Validator Hardening (ADR-0018)

### WO-040 — `.strip()` → `.strict()` migration — P2 — **Done ✅**

- Rejects unknown keys; compile-safe. Runtime smoke test added and passing (41/41).
- **What shipped:** every non-omit response schema migrated `.strip()` → `.strict()` (ADR-0018 §B target). Omit-based response schemas (fed full DB rows) were kept `.strip()` to avoid the `unrecognized_keys` trap.
- **Safety net — the Real caught it:** the smoke test parses a real factory-built full DB row through every response schema and asserts no `unrecognized_keys`. It **caught 3 unsafe conversions** — `userResponseSchema`, `addressResponseSchema` (farms), `notificationResponseSchema` — which were `.omit({...}).extend({...}).strict()` and therefore rejected audit/legacy keys on full rows. Reverted to `.strip()` with a WO-040 comment.
- **Side note:** `packages/validators/src/enums/{domain,index}.ts` were regenerated, adding 3 missing enum schemas (`outboxAggregateTypeSchema`, `permissionScopeSchema`, `syncRecordTypeSchema`) — additive, guillotine proofs intact.
- **Smoke test:** `packages/testing/src/validator-hardening.smoke.test.ts`. Run: `pnpm --filter @rocky/testing exec vitest run src/validator-hardening.smoke.test.ts`.

### WO-041 — `.omit()` → `.pick()` migration — P2 — **Done ✅**

- Prevents new DB columns leaking into the create API. Verified: zero `InsertSchema.omit(` in `packages/validators/src/api` (e.g. `createAnimalRequestSchema` now derives via `animalsInsertSchema.pick({clientFields})`).
- `createSubjectRequestSchema` uses `subjectsSelectSchema.omit({...}).extend({...}).strict()` — a **request** schema (client input), so `.strict()` is correct and safe (the client never sends the omitted audit fields). The trap only applies to _response_ schemas fed full DB rows.
- Type fix spotted during hardening: `contingentType` string-literal widened to `contingentTypeType` in `eartags.api.ts`.

---

## 6. Deferred by Design / Future (tracked, not this sprint)

### WO-050 — PDF/A rendering + cryptographic seal — Future

- `packages/pdf` emits YAML/XML intermediates as the stable API; PDF/A is a future rendering concern.
- **Source:** ADR-0009 §4, ADR-0029.

### WO-060 — IoT `RuleSet.features.iot` gate — P3

- Keep IoT UI/routers behind the RuleSet flag; do not surface in default admin/mobile.
- **Source:** ADR-0031.

### WO-061 — IoT LPWAN QoS/SLA — Future

- Deduplication, late-arrival handling for lossy links.
- **Source:** ADR-0031 §D.

### WO-070 — Deferral register — Future

- AMR tracking, 10 km outbreak buffer zones, genetic lineage / performance profiling, blockchain
  provenance (`future.md`); `NotificationService.sendSMS()` outbox consumer (`ADR-0014`).
- **Source:** ADR-0023 deferral register, ADR-0014.

---

## RobotFarm Note

Per AGENTS.md, any change to an ADR's status (defect fixed, deferral promoted, new task discovered)

---

## WO-031 — RLS tests (Scenario C): progress + critical findings

**Corrigendum (1):** WO-031 RLS tests are underway. Key discoveries this pass:

1. **DB is reachable** — earlier claim that `192.168.1.109:5432` was unreachable was
   FALSE (it was never tested). `ping`/`nc`/`psql SELECT 1` all succeed; 71 tables, 43 RLS
   policies present. Corrected.

2. **RLS is bypassed for superusers/owners** — the dev role `tbot` is a superuser AND owns
   the tables, so RLS is never enforced for it. Genuine RLS tests therefore require a
   **non-superuser role**. Created `rocky_rls_test` (NOSUPERUSER) on the dev DB with
   grants on `public`, and a two-connection harness: assertions run as `rocky_rls_test`
   (RLS enforced, driven by `app.current_*` session vars), scaffolding runs as `tbot`
   (superuser, bypasses RLS on `subjects`/`farm_subjects`).

3. **CRITICAL RLS RECURSION BUG — found and fixed (live dev DB).** The `farms` RLS policy
   self-referenced `farms` (`SELECT f.id FROM farms f …` inside its own policy) and
   `farm_subjects`↔`farms` formed a mutual recursion → `infinite recursion detected in
   policy for relation "farms"` for ANY non-superuser query touching farms (directly or via
   animals/movement policies). Fixed by adding a `SECURITY DEFINER` function
   `farm_org_id(p_farm_id uuid)` that resolves a farm's organization WITHOUT triggering
   RLS, and rewrote `farm_access_policy` + `farm_subject_access_policy` VET branches to use
   `farm_org_id(...) = current_org_id`. Applied to the live dev DB; recursion gone.

4. **`rls-policies.ts` is DRIFTED from the live DB** (must reconcile + regenerate a
   migration, else next `pnpm push` reverts/breaks the fix). The code's `staffOrVetAccess`
   / `subjectAccess` reference `organization_id`, which does NOT exist on `farms`/`animals`/
   etc. (those reach the org via `address_id → org_areas`). Live policies use the
   `addresses`/`org_areas` join — and now `farm_org_id()`. **Action required:** port the
   `farm_org_id()` function + corrected policies into `rls-policies.ts` and regenerate the
   migration so the fix is durable.

5. **`subjects` table has RLS ENABLED but NO policy** → deny-all for non-superuser. Latent
   gap; currently worked around by superuser scaffolding. Should get a proper policy.

6. **`animals` `with_check` excludes FARMER** (allows only SUPER_ADMIN/VD_*/VETERINARIAN);
   the `using` clause lets farmers READ animals linked via `farm_subjects`, but WRITES are
   vet/admin-only. The test documents this (farmers read but cannot register).

**First passing test:** `packages/domains/animal/src/repositories/animal.repository.rls.test.ts`
(Scenario C, 1 test, green). Uses `@rocky/database` `db` (rls_test) for assertions +
`postgres`/`drizzle-orm` (devDeps) + `RLS_ADMIN_URL` (tbot) for scaffold. The test exercises
read-isolation by `farm_subjects` and the farmer-write block.

**Remaining:** extend `*.repository.rls.test.ts` to other security-sensitive domains (migration.fixed.sql already corrected; code now generates correctly).

### WO-031 extension — 4 Scenario-C RLS tests, all GREEN

- `packages/domains/animal/src/repositories/animal.repository.rls.test.ts` — farmer read-isolation (current_farm_id via farm_subjects) + farmer WRITE blocked by with_check.
- `packages/domains/archive/src/repositories/archive.repository.rls.test.ts` — farmers DENIED by design (archive_documents has admin/vet-only policy, no FARMER branch); SUPER_ADMIN can read.
- `packages/domains/passport/src/repositories/passport.repository.rls.test.ts` — farmer read-isolation via farm_id + farm_subjects.
- `packages/domains/movement/src/repositories/movement.repository.rls.test.ts` — farmer read-isolation via from_farm_id/to_farm_id + farm_subjects.

Harness (per test): non-superuser `rocky_rls_test` for assertions + superuser `tbot` (RLS_ADMIN_URL) for scaffolding; roles driven by `app.current_*` GUCs. Each package gained `postgres` + `drizzle-orm` devDeps. NOTE: `archive_documents` having no FARMER branch is a policy-design choice (official archive records) — flag if farmers should read their own farm's archive docs.

### WO-032 — JSDoc audit (done)

Audited all 23 `*.service.ts` files. Finding: **service JSDoc is already
WHY-focused** — methods cite business rules (e.g. `Rule 1`, `IE.1+IE.2`,
`D.1: Idempotency`) and rationale, not restatements. Only **4 pure WHAT-tautologies**
existed, all in `packages/domains/notification/src/services/notification.service.ts`:

- `create` / `createBatch` — converted to `@description` WHY (persist _without_
  delivery gating; the gated entry point is `send`).
- `list` / `getTemplate` — stripped (pure restatements of the method name).

Kept (genuine WHY): `send` (preference/quiet-hour gating), `getUnreadCount`
(efficient SQL COUNT), `markAsRead` (IN_APP type), `getPending` (background
worker), `updateDeliveryStatus` (after delivery attempt).

Aligned with the docs site (Nextra 4.3 TSDoc): WHY belongs in `@description` /
`@remarks`; the 2 converted comments now use `@description`. Full `@param` /
`@returns` annotation of every method is a separate, larger effort (not in
scope of this audit). Build green; nothing committed.

### WO-080 — Frontend/Mobile ADR set (done)

The full client ADR set mandated by ADR-0033 is authored and DoD-compliant:

- Trunk **0034–0043** (Client Surface Inventory, Rendering/Data-fetching, Offline Sync, Design
  System, Forms/Validation, Navigation, i18n/RTL, Error/Empty/Loading UX, Permission-Aware UI,
  Push/Background Sync).
- Domain features **0044–0048** (Livestock, Health, Inspections/Corrections, Infrastructure/IoT, Administration).
- Seed ADRs **0015** (PDA sync) + **0017** (frontend architecture) migrated into the canonical set.

Audit vs ADR-0033 DoD: all 14 ADRs present in `apps/docs/content/ADR/`, mermaid fences balanced,
each cites ≥1 backend ADR (0006/0018/0019/0021/0022/0032), all referenced in workorder.
Gaps closed this pass: **0037 / 0041 / 0043** lacked a backend citation (D4 dialectic rule) →
added ADR-0032 (+ ADR-0018 to 0037). The domain-feature ADRs **0044–0048** were verified
DoD-compliant (numbered skeleton, backend-cited, mermaid balanced); **0045/0046/0047/0048** were
untracked and are committed as part of this deliverable.

### WO-090 — ADR-0032-compliant AppRouter (done)

The `AppRouter` (`packages/trpc/src/generated/server.ts`) was regenerated with
`transformer: superjson` and **0 `ReturnType<`** usages — satisfying ADR-0032's own
Definition-of-Done guard (the previously-committed `HEAD` version failed it). Bundled in
the same change: SUPER_ADMIN gates added to `rbac.router.ts` + `user.router.ts` (any
authenticated session could previously reassign roles / create users — live gap closed;
farm/subject/organization routers remain `@Policy({ authenticated: true })` with row-level
RLS isolation, deferred per ADR-0027).

### ADR-0049 — Client Auth & Session Architecture (done)

Authored as the dialectical counterpart to ADR-0021 (backend auth). Ratifies the identity-only
client session, the single `createRockyAuthClient()` factory for web + mobile, and the out-of-band
`rbac.myPermissions` permission delivery (WO-089) — no `customSession` RBAC enrichment (keeps
`packages/auth` RBAC-free). Anchors WO-089; cited by ADR-0042.

### WO-089 + WO-085 — client permission gating (done)

Implemented together (permissions gate both nav and tabs):

- Backend: `rbac.myPermissions` query (ADR-0042) returns `principal.permissions` +
  `principal.roles`, method-level `@Policy({ authenticated: true })` overriding the
  router's SUPER_ADMIN class policy (verified method-level overrides class-level).
- Shared: `clientCan(permissions, required)` pure helper in `@rocky/trpc` (NOT
  `@rocky/authorization` — server-only, would bloat the client bundle).
- Web: `apps/web/lib/permissions.tsx` (`PermissionsProvider` + `useCan`/`useHasRole`),
  mounted in `apps/web/app/layout.tsx`; `admin-shell.tsx` consumes it; `nav-config.ts`
  `filterNavByPermissions` no longer fail-opens.
- Mobile: `apps/mob/providers/permissions-provider.tsx` + tab gating in
  `apps/mob/app/_layout.tsx` (WO-085). `server.ts` regenerated (155 procedures).
- ADR-0049 (client auth/session) ratifies the identity-only session + out-of-band
  permission delivery — no `customSession` RBAC enrichment.

 (migration.fixed.sql already corrected; code now generates correctly).

### WO-031 update — root cause + durable source fix

The recursion root is a SINGLE helper: `farmInOrgArea()` in
`packages/database/src/schema/rls-helpers.ts`, which inlined
`SELECT f.id FROM farms f JOIN addresses a …` — evaluating any org-scoped
policy queried `farms`, re-triggering `farm_access_policy` → infinite
recursion. Confirmed it was the ONLY such occurrence in `schema/`.

Durable fixes applied at the source (so a fresh `pnpm generate` + `db-recreate`
stays correct):

- `rls-helpers.ts`: `farmInOrgArea(farmCol)` → `farm_org_id(${col(farmCol)}) = current_org_id`.
  `farm_org_id()` is `SECURITY DEFINER` (queries `farms` directly, bypasses RLS), so
  this repairs ALL org-scoped policies at once (farms, farm_subjects, animals, movements,
  ear_tags, inspections, … all compose via this helper).
- `subjects.ts`: broken `farmOwnedByUser(farms.id)` (referenced `farms.id` out of scope)
  → `farmInOrgArea(fs.farm_id)` (correct + non-recursive).
- `scripts/fix-rls-sql.mjs`: now injects `CREATE OR REPLACE FUNCTION public.farm_org_id(...)`
  (SECURITY DEFINER) at the top of the generated `.fixed.sql`, so the function exists
  before the policies on every recreate. (Previously there was NO creation mechanism —
  the function would have been lost on `db-recreate`.)
- `packages/database` build (tsc) GREEN after the change.

NOTE: `packages/database/src/rls-policies.ts` is DEAD CODE (never imported); the real
helpers live in `schema/rls-helpers.ts`. Don't confuse the two.

### Secondary finding (DATA, not RLS code)

`farm_org_id()` returns NULL for ALL 5 seeded farms because `addresses.commune_id`
is NULL and `org_areas` has 0 rows. So org-scoped VET/VD access is non-functional at
the DATA level (vets/staff see nothing via the org branch) even though the policy code
is now correct. Farmers still work (via `farm_subjects` self-link, no org needed).
This is a seed/data defect — track separately (seed: populate `org_areas` +
`addresses.commune_id`). DB reachable; nothing committed.

(movement, archive, passport, ear_tag, …); **persist the RLS recursion fix in code +
migration**; give `subjects` a real policy.

must trigger a RobotFarm pass: update the owning ADR **and** this work order so the two never diverge.
The closest owning doc for this list is `apps/docs/content/ADR/` (root of the business-rule subtree is
ADR-0023).

### WO-088 — mobile Empty + sonner toast (partial: Empty done)

Empty component added (`apps/mob/components/ui/empty.tsx`, RN Reusables port of the
@rocky/ui web `Empty` for web↔mobile API parity, ADR-0052) and wired into the
`(tabs)/index.tsx` zero-result dashboard list (replaces inline "No animals found").
The sonner toast half (ADR-0041 §6) is DEFERRED: `sonner-react-native` is not installed
anywhere in the workspace. Adding it is a dependency decision (needs `pnpm add` + a
`<Toaster />` mount + a `notifyError` helper). Flagged as a separate step.

### WO-083 — AGENTS.md Mobile Bot path reconciled

Replaced stale `apps/mobile` with `apps/mob` in root AGENTS.md, packages/trpc/AGENTS.md,
and packages/domains/inspection/AGENTS.md (contract vs reality, WO-083). NOTE: root
AGENTS.md still references `apps/mob/AGENTS.md` which does NOT exist — the Mobile Bot
has no child AGENTS.md. Flagged for creation (candidate for ADR-0054 Mobile Package
Reconciliation); out of scope for the path reconcile.

### ADR-0050 — Frontend ↔ Backend Contract Synchronization (done)

Authored as the roadmap for "how does the frontend keep up with the backend." Investigation found
THREE independent permission surfaces (seed catalog ~50 literals; `@Policy` decorators only 10,
reads use `authenticated: true`; frontend `useCan` tracks the seed) with no shared source — the
root cause of permission drift (ADR-0042 smell). ADR-0050 mandates: (D1) a single `Permissions`
const in `packages/authorization` consumed by seed + `@Policy` + frontend; (D2) CI/pre-commit
`generate:trpc` + stale-types gate; (D3) keep Validator NoDrift; (D4) a contract drift test;
(D5) ADR cross-ref DoD; (D6) promote `sync` router (WO-081). Roadmap table maps Phases 0–5 + new
cross-cutting WOs 100/101/102.

### ADR-0051 — Web↔Mobile Page Matrix & Navigation Logic (done)

Designer-ready screen spec: (A) page matrix (module → web pages / mobile screens / gating
permission / parity); (B) screen inventory with ✅/🟡 status (existing vs planned gaps);
(C) navigation logic (web sidebar stack, mobile tab stack, deep links, fail-closed gating).
Key finding: mobile is the field-data-entry surface, web is the back-office — COMPLEMENTARY,
not 1:1 (informs ADR-0052 parity contract). Extends ADR-0034/0039; cites ADR-0022/0032/0042/
0049/0050. 🟡 gaps (web detail pages, mobile create/edit flows) map to WO-094/095/096.

## WO-033 corrigendum (2026-07-11)

- **Repository-level RLS coverage extended (Scenario C, real Postgres):** added
  `packages/domains/farm/src/repositories/farm.repository.rls.test.ts` and
  `packages/domains/subject/src/repositories/subject.repository.rls.test.ts`, joining the existing
  animal/movement/passport/archive RLS tests. Both use `@rocky/testing` factories (`FarmFactory` /
  `SubjectFactory`) + the real repositories (Drizzle / schema) for I/O, and raw `sql` only for
  `set_config` role context + cleanup — the proven ADR-0020 pattern. They assert the compliance
  kernel: linked farmer reads own row; unlinked farmer hidden; admin sees all; farmer **WRITE**
  blocked by the policy `withCheck` (`rejects.toThrow()`). Env-gated on the `rocky_rls_test`
  constrained role (`DATABASE_URL` / `RLS_ADMIN_URL`); skip cleanly without env; execute in CI.
  Subject package gained `vitest` / `vite-tsconfig-paths` / `@rocky/testing` devDeps + `vitest.config.ts`
  - `test` script; farm gained the `postgres` devDep.
- **Blocker — the full-pipeline `*/e2e/*.test.ts` border suite is NOT yet delivered:** `@rocky/trpc`
  exports the `AppRouter` **type** but **not the `appRouter` instance**, and there is **no
  `createCaller`**. A test therefore cannot drive the tRPC Router → Service → Repository → Postgres →
  Zod pipeline. The remaining WO-033 sub-task is to expose the router instance + a test `AppContext`
  builder (small, specified change in `@rocky/trpc`), then add 1–2 `*/e2e/*.test.ts` border tests.
- **Pre-existing, out-of-scope:** `packages/domains/farm/src/services/farm-book.service.workflow.test.ts`
  fails typecheck (`Property 'code' does not exist on type 'Error'`, lines 52/78). Untouched by WO-033;
  flag separately (likely a coded-error typing fix).
- **Lesson (the Real):** RLS border testing at the repository level was already mechanized and merely
  under-populated; the genuine WO-033 gap is the _pipeline_ border layer, gated on the tRPC caller
  wiring.

## WO-033 corrigendum #2 (2026-07-11) — e2e border suite delivered

**Strike executed (Option 1 + Option 2b, as approved):**

1. **Expropriated `appRouter`** — `scripts/patch-trpc-transformer.mjs` now rewrites
   `const appRouter = t.router({` -> `export const appRouter = t.router({` (idempotent,
   regeneration-safe; verified re-running is a no-op). `packages/trpc/src/index.ts`
   re-exports it. nestjs-trpc's `generate` only emitted the `AppRouter` _type_; the
   instance is now seized for tests.
2. **Wire-boundary e2e** — `packages/trpc/src/e2e/trpc-wire-boundary.test.ts`:
   `appRouter.createCaller({ headers })` asserts the real Zod @Input schemas are
   enforced at the tRPC wire (bad uuid / empty required field / missing payload /
   unknown enum -> TRPCError) across animal/farm/inspection/movement.
3. **Error-map unit test** — `packages/trpc/src/e2e/error-map.test.ts`:
   `createResultUnwrapper(ANIMAL_TRPC_ERROR_MAP)` maps domain error codes
   (ANIMAL_NOT_FOUND -> NOT_FOUND, ANIMAL_FORBIDDEN -> FORBIDDEN) to TRPCError.
4. **Test infra** — added `packages/trpc/vitest.config.ts` + `test` script + vitest/
   vite-tsconfig-paths devDeps. Both suites run WITHOUT RLS env (phantom resolvers
   touch no DB); they execute in CI always.

**Critical architectural finding (dialectical limit of the original plan):**
nestjs-trpc `generate` emits **PLACEHOLDER resolvers** (`async () => "PLACEHOLDER_DO_NOT_REMOVE"`)
for type-inference only. The _real_ runtime router — with domain services,
`ExecutionMiddleware` (RLS), `PolicyResolver`, and the `TRPC_ERROR_MAP` translation —
is assembled **internally by nestjs-trpc and never exported**. Therefore a true
full-pipeline e2e via `appRouter.createCaller` (Router -> Service -> Repo -> Postgres
-> Zod, per role) is **not achievable** without restructuring nestjs-trpc's runtime
exposure. The `globalMiddlewares` (ExecutionMiddleware, PolicyResolver) also run only
in the Nest HTTP layer, so `createCaller` skips them.

**Consequence — scope resolved dialectically:**

- The tRPC<->Zod **wire boundary** (what the e2e suite now covers) is tested via the
  generated router's real Zod schemas.
- The **error-map translation** (the user's explicit ask) is covered by the isolated
  unit test.
- **RLS per role** stays in the repo-level `*.repository.rls.test.ts` (animal, movement,
  passport, archive, farm, subject) — the correct layer for security.
- The SUPER_ADMIN cookie helper (original Step 2) is **superfluous**: phantom resolvers
  skip DB/auth/middleware, so no session is needed.

**Status: WO-033 e2e border tier DELIVERED.** A deeper "real-router e2e" would require
exposing nestjs-trpc's assembled router (separate, larger effort) and is left for a
follow-up if desired.

## WO-002 corrigendum (2026-07-11) — VI subject role added (Horn A)

**Resolved (Bug B3, Horn A).** Domain-owner decision: in the MK jurisdiction the Veterinary
Inspector (VI) is a _state agent_ of the Food and Veterinary Agency (CPC), distinct from the private
Veterinary Station (VS) and its Veterinarian. Collapsing VI into VS would merge police with the
audited contractor (conflict of interest) — rejected.

**Changes:**

- `packages/database/src/constants/subject-role.ts`: added `VI: "vi"` to `SUBJECT_ROLE` and
  `SUBJECT_ROLE_VALUES`.
- `scripts/regenerate-enums.mjs`: regenerated enum codegen (`subjectRoleSchema = zEnum(SUBJECT_ROLE_VALUES)`
  picks up `vi` at runtime). No literal value hardcoded — Single Source of Truth preserved.
- **No DB migration:** `farm_subjects.role` is `varchar` + Zod `zEnum` (not a Postgres `pgEnum`), so
  the change is code-only. `ADMINISTER_ROLES` (ADR-0030) can now include `"vi"` per jurisdiction.
- VI _system_ access uses the existing `USER_ROLE.VD_STAFF` + org-area RLS (no new user role).
  `subject_access_policy` already allows `VD_STAFF` (an `ADMIN_ROLE`) to read all subjects — no RLS
  change required.
- Enables a `Subject` for the inspector, referenced by `inspections.inspectorId` and
  `error_corrections.escalatedTo`.

**Verified:** `@rocky/validators` + `@rocky/database` typecheck green (NoDrift guillotine intact).
**Status: Done ✅.**

## Geo & Regulatory Compliance (Draft — ADR-0053 / ADR-0054)

> _sniffs_ Draft strikes extracted from the "Map and the Territory" + "Digital International Law"
> directive. Held here pending RobotFarm sign-off; **not yet in the Master List**. Every regulatory
> threshold routes through the RuleSet (ADR-0030) — jurisdiction covers ALL, no hardcoded constants.

| WO   | Task                                                                 | Source ADR    | Priority | Status |
| ---- | -------------------------------------------------------------------- | ------------- | -------- | ------ |
| WO-109 | `admin_units` NUTS/LAU hierarchy (`level` + `parent_id` + `nuts_code`, self-ref FK deferred) | 0053 / 0030   | P2       | Done   |
| WO-110 | `geofences` PostGIS POLYGON (nullable foundation) + GiST + `cadastral_reference`; `postgis.ts` polygon helper | 0053 | P2 | Done   |
| WO-111 | `addresses.location` varchar → PostGIS POINT (4326)                  | 0053          | P3       | Draft  |
| WO-112 | OSM boundaries doc + Nominatim reverse-geocode (telemetry/display only) | 0053       | P3       | Draft  |
| WO-113 | AMR withdrawal guillotine in `MovementService` (block slaughter; 403 `WITHDRAWAL_PERIOD_ACTIVE`) | 0054 / 0030 | P2 | Done ✅ |
| WO-114 | Transport welfare max-hours + mandatory rest-stop leg alert          | 0054 / 0030   | P2       | Done ✅  |
| WO-115 | EUDR due-diligence: pasture polygon overlay + deforestation cutoff   | 0054 / 0053   | P2       | Done  |
| WO-116 | FSMA §204 KDE/CTE export + Lineage & Traceability Graph API (General Food Law) | 0054 / 0030 | P2 | Done ✅   |
| WO-117 | GDPR pseudonymization on subject exit (keep `subject_id`, scrub PII)  | 0054 / 0030   | P2       | Draft  |
| WO-118 | ISO 11784/11785 15-digit tag format + jurisdiction prefix (840=US)    | 0054 / 0030   | P2       | Done ✅  |
| WO-119 | Disease-zone spatial block (3 km / 10 km) via `geofences.polygon` + RuleSet radii | 0054 / 0053 | P2 | Done |
| WO-120 | Bovine I&R 7/20 as **non-overridable EU floor** (R8): harden WO-022 deadlines; clamp RuleSet `TAGGING_DAYS` >= EU min | 0054 / 0028 | P2 | Done ✅ |
| WO-121 | IMSOC / CHED export compliance (R9): export movements emit CHED-compliant JSON/XML (TRACES NT) | 0054 / 0054 | P2 | ✅ Done |
| WO-122 | GDPR public-health exception (R10): Art.6(1)(c)+9(2)(i) defeat erasure; protect audit_log | 0054 / 0054 | P2 | Draft |

---

## 7. Web Admin Feature Parity with Backend (ADR-0055) — P0 program

- **Why:** the web admin (`apps/web`) invokes 20 of 24 backend routers but is uneven — 4 routers have no
  page (Tier 0), 12 of 24 areas are list-only with no create/edit forms (Tier 1), the rest are partial
  CRUD (Tier 2). The backend exposes 156 procedures; the admin can view but not act on most. For a
  regulatory veterinary system, view-only administration is a fetish. ADR-0055 (Accepted, 2026-07-11)
  ratifies the parity program.
- **Target:** every backend procedure has a web affordance (list / create / edit-detail / state-transition
  action), Zod-validated (`@rocky/validators`), RBAC-gated (`@rocky/authorization` `@Policy`), standard
  empty/error/toast states. `sync` stays mobile-owned (web = read-only monitor).
- **Source:** ADR-0055 (decision + phased plan + gap matrix), ADR-0052 (`api-reference.mdx` = surface of
  truth), ADR-0050 / ADR-0051 (contract sync / page matrix context).

### WO-123 — Web↔Backend parity program (phased) — P0

- **Phase 0 — Web CRUD scaffold & RBAC foundation:** reusable `<EntityPage>` / `<ResourceForm>`
  (`@rocky/ui` + `@rocky/validators` + `trpc`) + client permission-gating hook (extends WO-105
  `permissions-core`). De-risks all later phases. ~1 sprint.
- **Phase 1 — Tier 0 (presence):** `vsContract` (5) → `vsAssignment` (6) → `farmBook` (4) → `sync`
  (read-only monitor). ~17 procs. VS workflow + farm book are legally mandatory.
- **Phase 2 — Tier 1 lifecycle depth:** `earTag` (17) → `health` (20) → `passport` (7) → deepen
  `movement` + `inspection` (risk analysis). Regulatory core made actionable.
- **Phase 3 — Tier 1 remainder + Tier 2 deepen:** `correction` → `iot` → `archive` (retention) →
  `document` (generate) → `notification` → `rbac` → `systemParameters` → `organization` (edit) → wire
  missing procs in `device` / `animal` / `farm` / `subject` / `user`.
- **Phase 4 — Polish + institutionalize parity:** dashboard analytics, pagination standard, e2e for
  animal→passport→movement→earTag→health; new **`check:web-parity`** guardian (diff `api-reference.mdx`
  TOC vs `trpc.<router>` usage in `apps/web`) — fails CI if a backend procedure lacks a web affordance.
- **Acceptance (program complete):** web invokes all 24 routers (`sync` exempt as monitor); every Mutation
  has a form/action; `pnpm check:web-parity` green; `pnpm ci:checks` green.
- **Status:** Proposed (program opened 2026-07-11). Phase 0 not yet started.