# Scout Context — ROCKY-DS 001:2026(E) §8.2 Service/DB Arrears Remediation Map

**Task:** Map 4 RED domain services that import `@rocky/database` (Drizzle client/table
definitions) directly, in violation of Diamond Seal §8.2, so a planner can design the fix.
**Scope:** Read-only reconnaissance. No fixes written here.

---

## 0. The requirement being measured against

**Source:** `apps/docs/content/Standardization/diamond-seal-type-contracts.md`

- **§8.2 Service translator:** "The service (L4) ... shall access the database only through its
  own-domain repository; it shall **not** import `@rocky/database` (the Drizzle client or table
  definitions) directly."
- **§8.5 Module-wiring exception:** the ban applies to `*.service.ts` / `*.repository.ts`, NOT to
  `*.module.ts` (DI wiring may cross domains).
- **Annex C — Visa Matrix row `packages/domains/*/services`:**
  - **May import:** `@rocky/validators/api`, `@rocky/database/constants` (Dictionary **only**),
    `@rocky/domains-shared`, **own-domain `repositories/` (relative)**.
  - **Shall not import:** `@rocky/database` (client/tables), `@rocky/database/zod`,
    `@rocky/validators/events` (RESERVED), `@rocky/validators/integrations` (RESERVED).

**Conformance checklist (Annex A item i):** "... the service does not import `@rocky/database`
(DB client) or Dumb Zod and reaches the database only via its own repository ..."

**Conclusion for each service:**

- Importing a **Dictionary constant** from `@rocky/database/constants` (e.g. `NOTIFICATION_TYPE`)
  is **PERMITTED** (Annex C).
- Importing a **table** (`notifications`, `deviceTokens`, `iotDevices`, `farms`, `animals`,
  `inspections`, `riskAnalyses`, `riskAnalysisResults`, `eventSubscriptions`, `reminders`,
  `notificationDeliveries`, `users`) or the **`db` client** or a **`DatabaseProvider`** from
  `@rocky/database`, or `eq`/`and`/`sql` from `drizzle-orm` for direct query-building, is **RED**.

---

## 1. Service A — `packages/domains/notification/src/services/notification.service.ts`

### 1.1 `@rocky/database` / `@rocky/database/*` imports (RED)

| Line | Import | Verdict |
|------|--------|---------|
| 11 | `import type { notifications as notificationsTable } from "@rocky/database";` | **RED** (table type import) |
| 12 | `import { deviceTokens as deviceTokensTable } from "@rocky/database";` | **RED** (table value import) |
| 14 | `import { NOTIFICATION_TYPE } from "@rocky/database/constants";` | **OK** (Dictionary constant — §8.2 / Annex C allow) |

### 1.2 Where the imported objects are USED

This service **delegates all queries to `this.repo` already** (it does NOT call `db.` / `transaction`
directly). The table imports are used **only as `$inferInsert` type casts** (no query execution):

| Line | Usage | What it does |
|------|-------|--------------|
| 58 | `} as typeof notificationsTable.$inferInsert);` | cast inside `create()` before `this.repo.insert({...})` |
| 81 | `}) as typeof notificationsTable.$inferInsert,` | cast inside `createBatch()` before `this.repo.insertMany(rows)` |
| 107 | `} as typeof notificationsTable.$inferInsert);` | cast inside `send()` (channel disabled branch) → `this.repo.insert` |
| 122 | `} as typeof notificationsTable.$inferInsert);` | cast inside `send()` (quiet hours branch) → `this.repo.insert` |
| 135 | `} as typeof notificationsTable.$inferInsert);` | cast inside `send()` (normal branch) → `this.repo.insert` |
| 201 | `const updates: Partial<typeof notificationsTable.$inferInsert> = {};` | type annotation in `updateDeliveryStatus` |
| 232 | `} as typeof deviceTokensTable.$inferInsert);` | cast inside `registerDevice()` before `this.repo.upsertDeviceToken({...})` |

### 1.3 Existing repo method that could replace each usage

ALL underlying queries already exist in `NotificationRepository`:

- `repo.insert(values)` — line 38,107,122,135
- `repo.insertMany(rows)` — line 64
- `repo.upsertDeviceToken(values)` — line 230
- `repo.updateById` / `incrementAttempts` etc. (already used, not table-typed)

**No new repo method is required.** The only issue is the table-*type* casts pulling in the
`@rocky/database` import.

### 1.4 No-DOp / new repo method needed

N/A — all queries go through the repo. The fix is **type-only decoupling** (see §1.6 pattern).

### 1.5 Transaction mechanism

N/A — this service never opens a transaction; the repository's `BaseRepository.client` resolves the
transactional connection automatically when invoked inside `ExecutionPipeline.run()` (see §5).

### 1.6 Recommended decoupling pattern (convention)

Have `NotificationRepository` re-export the row-shape types so the service imports them from the
**own-domain repo** (relative import — permitted by Annex C), never from `@rocky/database`:

```ts
// notification.repository.ts (repo already imports the tables — allowed)
export type NotificationRow = typeof notifications.$inferInsert;
export type DeviceTokenRow = typeof deviceTokens.$inferInsert;
```

```ts
// notification.service.ts — delete lines 11 & 12; import from repo instead
import type { NotificationRepository, NotificationRow, DeviceTokenRow } from "../repositories/notification.repository.js";
```

Then replace `as typeof notificationsTable.$inferInsert` / `as typeof deviceTokensTable.$inferInsert`
with `as NotificationRow` / `as DeviceTokenRow`. (Repo can also cast internally to keep the service
fully table-agnostic.) `NOTIFICATION_TYPE` (line 14) stays.

---

## 2. Service B — `packages/domains/notification/src/services/subscription-resolver.service.ts`

### 2.1 `@rocky/database` / `@rocky/database/*` imports (RED)

| Line | Import | Verdict |
|------|--------|---------|
| 6 | `import { db } from "@rocky/database";` | **RED** (db client) |
| 8–11 | `import { eventSubscriptions, reminders, notificationDeliveries } from "@rocky/database";` | **RED** (notification-domain tables) |
| 12 | `import { users } from "@rocky/database/schema/sm";` | **RED** (cross-domain table — belongs to `@rocky/domains-user`) |
| 13 | `import { eq, and } from "drizzle-orm";` | **RED** (used only for the direct `db.` queries above) |

### 2.2 Where the imported objects are USED (direct `db.` queries)

| Line(s) | Query | Operation |
|---------|-------|-----------|
| 37–43 | `db.select().from(eventSubscriptions).where(and(eq(eventSubscriptions.eventType, input.eventType), eq(eventSubscriptions.isActive, true)))` | **SELECT** subscriptions by eventType + active |
| 52–58 | `db.select({id}).from(notificationDeliveries).where(eq(notificationDeliveries.deliveryKey, key)).limit(1)` | **SELECT** delivery dedup check |
| 61–72 | `db.insert(notificationDeliveries).values({...}).onConflictDoNothing({target: notificationDeliveries.deliveryKey}).returning()` | **INSERT** delivery record (idempotent) |
| 91–99 | `db.update(notificationDeliveries).set({notificationId, status, deliveredAt}).where(eq(notificationDeliveries.id, delivery.id))` | **UPDATE** delivery on success |
| 115–118 | `db.select({id: users.id}).from(users).where(eq(users.id, targetId))` | **SELECT** users by id (targetType "user") |
| 121–123 | `db.select({id: users.id}).from(users).where(eq(users.role, targetId))` | **SELECT** users by role (targetType "role") |
| 126–128 | `db.select({id: users.id}).from(users).where(eq(users.organizationId, targetId))` | **SELECT** users by org (targetType "org") |
| 199–209 | `db.insert(reminders).values({...})` | **INSERT** reminder |

### 2.3 Existing repo methods that could replace each usage

- `eventSubscriptions` SELECT (L37) → **NO existing method** in `NotificationRepository`
  (repo today only covers `notifications`, `notificationPreferences`, `notificationTemplates`,
  `deviceTokens`). **New repo method required** (notification-domain table — repo-worthy).
- `notificationDeliveries` SELECT/INSERT/UPDATE (L52,61,91) → **NO existing method**. **New repo methods required** (notification-domain table).
- `reminders` INSERT (L199) → **NO existing method**. **New repo method required** (notification-domain table).
- `users` SELECTs (L115–128) → **EXISTS** in `UserRepository` (`packages/domains/user/src/repositories/user.repository.ts`):
  - `findById(id)` (L115, `targetType:"user"`)
  - `list({organizationId})` / `list({status})` — but there is **NO `findByRole`** method. `list({...})`
    returns `{data,total}` and supports `organizationId`, `status`, `search`, `sortBy`,
    `sortOrder`, `limit`, `offset`. `targetType:"role"` (L121) needs a **new `UserRepository.findByRole(role)`**
    method (cross-domain ownership: User Bot). `targetType:"org"` (L126) is coverable by
    `UserRepository.list({organizationId: targetId})` (map first id).

### 2.4 New repo methods needed

**Notification domain (`NotificationRepository`):**

- `findActiveSubscriptionsByEventType(eventType: string): Promise<(typeof eventSubscriptions.$inferSelect)[]>`
  — SELECT from `eventSubscriptions` where `eventType = ? AND isActive = true`.
- `findDeliveryByKey(key: string): Promise<(typeof notificationDeliveries.$inferSelect) | null>`
  — SELECT id where `deliveryKey = key` limit 1.
- `insertDelivery(values): Promise<(typeof notificationDeliveries.$inferSelect) | null>`
  — INSERT ... ON CONFLICT DO NOTHING (target `deliveryKey`) RETURNING.
- `markDeliverySent(id, notificationId): Promise<void>`
  — UPDATE set `notificationId`, `status:'sent'`, `deliveredAt` where id.
- `insertReminder(values): Promise<void>` — INSERT into `reminders`.

**User domain (`UserRepository`) — cross-domain, injected into SubscriptionResolver:**

- `findByRole(role: string): Promise<(typeof usersTable.$inferSelect)[]>` — **new** (currently missing).
  `findById` and `list({organizationId})` already cover the other two target types.

### 2.5 Injection / cross-domain wiring change

Current DI (`apps/api/src/app.module.ts:159-161`):

```ts
provide: SubscriptionResolver,
useFactory: (ns: NotificationService, repo: NotificationRepository) => new SubscriptionResolver(ns, repo),
inject: [NotificationService, NotificationRepository],
```

Fix: inject `UserRepository` and add the new notification repo methods:

```ts
useFactory: (ns, repo, userRepo) => new SubscriptionResolver(ns, repo, userRepo),
inject: [NotificationService, NotificationRepository, UserRepository],
```

`UserRepository` is already provided in `app.module.ts:164` (`useFactory: (dbp)=>new UserRepository(dbp)`).
`SubscriptionResolver` constructor must change from
`(notificationService, repo)` → `(notificationService, repo, userRepo)`.

### 2.6 Transaction mechanism

Same as §5 — currently uses raw `db` (global pool, no RLS scope). All new repo methods go through
`BaseRepository.client` and will inherit the pipeline transaction automatically once the service stops
touching `db` directly.

### 2.7 Secondary non-conformance (flag)

`resolveAndNotify(input): Promise<void>` returns `void`, not `Result<T,E>` — violates the Error
Sovereignty Doctrine (all compliant AMBER services return `Result<T,E>` via `fromAsyncThrowable`).
Worth aligning during the fix, but outside the §8.2 scope.

---

## 3. Service C — `packages/domains/inspection/src/services/risk-analysis.service.ts`

### 3.1 `@rocky/database` / `@rocky/database/*` imports (RED)

| Line | Import | Verdict |
|------|--------|---------|
| 9 | `import type { DatabaseProvider } from "@rocky/database";` | **RED** (injecting DB client into a service layer) |
| 11 | `import { farms as farmsTable, animals as animalsTable, inspections as inspectionsTable, riskAnalyses as riskAnalysesTable, riskAnalysisResults as riskAnalysisResultsTable } from "@rocky/database";` | **RED** (5 tables) |
| 12 | `import { eq, and, sql, desc } from "drizzle-orm";` | **RED** (used only for the direct `this.dbp.client` queries) |

### 3.2 Where the imported objects are USED

All via `this.dbp.client` (the injected `DatabaseProvider`):

| Line(s) | Query | Operation |
|---------|-------|-----------|
| 47–50 | `select({count}).from(farmsTable).where(eq(farmsTable.isActive, true))` | **SELECT** count of active farms |
| 59–71 | `select({id,type, animalCount: sql<...>COALESCE(count(DISTINCT animals.id)), pastInspections: sql<...>count(DISTINCT CASE WHEN inspections.status='completed'...)}).from(farmsTable).leftJoin(animalsTable, eq(animalsTable.currentFarmId, farmsTable.id)).leftJoin(inspectionsTable, eq(inspectionsTable.farmId, farmsTable.id)).where(eq(farmsTable.isActive,true)).groupBy(farmsTable.id).having(sql\`count(animals.id) > 0\`)` | **SELECT + 2 LEFT JOIN + GROUP BY + HAVING + SQL aggregates** (the core risk-factor fetch) |
| 112–118 | `insert(riskAnalysesTable).values({year, quarter, status, totalFarms, selectedFarms, algorithmVersion, selectionPercentage, paramsSnapshot, createdBy}).returning()` | **INSERT** risk_analysis record |
| 134–141 | `insert(riskAnalysisResultsTable).values(allCandidates.map(c => ({analysisId, farmId, score, selected, riskFactorsSnapshot})))` | **INSERT (bulk)** per-farm results |
| 175–187 | `list()`: `select().from(riskAnalysesTable).where(and(eq(year), eq(status))).orderBy(desc(createdAt)).limit/offset` + `select({count}).from(riskAnalysesTable).where(where)` | **SELECT + COUNT** list |
| 193–194 | `getById()`: `select().from(riskAnalysesTable).where(eq(id)).limit(1)` | **SELECT** single |

Note: `inspectionsTable` is used ONLY inside the farms-with-risk-factors join (L64,68) — purely as a
join target for the `pastInspections` count; no direct inspection CRUD here.

### 3.3 Existing repo methods that could replace each usage

- `InspectionRepository` (`packages/domains/inspection/src/repositories/inspection.repository.ts`)
  currently exposes `findById, findByFarm, list, hasActiveInspection, create, update, updateStatus,
  flagFarmForInspection` — **NONE** of which touch `riskAnalyses`/`riskAnalysisResults` or the
  farms+animals+inspections aggregate join. **No existing method covers any of the 6 usages.**
- `FarmRepository` (`packages/domains/farm/src/repositories/farm.repository.ts`) has `findById,
  findByFarmId, listFiltered, insert, update, findAddressById` — **NO** `countActive` and **NO**
  join-based risk-factor query.
- `AnimalRepository` (`packages/domains/animal/src/repositories/animal.repository.ts`) has no
  aggregate-count-by-farm helper.

### 3.4 New repo methods needed

**Inspection domain — `riskAnalyses` / `riskAnalysisResults` are inspection-domain tables** (per
`inspection/AGENTS.md` Implementation Inventory: "Risk analyses schema"), so they belong in
`InspectionRepository` (or a new sibling `RiskAnalysisRepository` in the same package — planner's call):

- `countActiveFarms(): Promise<number>` — COUNT where `farms.isActive = true` (cross-repo: could live
  in `FarmRepository`; but the *call site* is inspection — either inject `FarmRepository` or add here).
- `getFarmsWithRiskFactors(): Promise<Array<{id; type; animalCount; pastInspections}>>` — the
  farms LEFT JOIN animals LEFT JOIN inspections aggregate query (the only genuinely complex one).
  **Recommendation:** place in `FarmRepository` (owns `farms` + can join `animals`/`inspections` which
  are read-only join sources) and inject `FarmRepository` into `RiskAnalysisService`; OR keep in a new
  `RiskAnalysisRepository`. Cross-domain join of `farms`+`animals`+`inspections` is acceptable because
  only inspection writes `riskAnalyses`/`riskAnalysisResults` while reading the other three.
- `createRiskAnalysis(values): Promise<(typeof riskAnalysesTable.$inferSelect) | null>` — INSERT RETURNING.
- `insertRiskAnalysisResults(rows): Promise<void>` — bulk INSERT into `riskAnalysisResults`.
- `listRiskAnalyses(opts): Promise<{data; total}>` — paginated list + count.
- `getRiskAnalysisById(id): Promise<(typeof riskAnalysesTable.$inferSelect) | null>`.

**Farm domain (optional, if aggregate placed in FarmRepository):** add `countActiveFarms()` and
`getFarmsWithRiskFactors()` to `FarmRepository`.

### 3.5 Injection / wiring change

Current DI (`apps/api/src/app.module.ts:366-368`):

```ts
provide: RiskAnalysisService,
useFactory: (dbp: DatabaseProvider, system: SystemService) => new RiskAnalysisService(dbp, system),
inject: [DatabaseProvider, SystemService],
```

Fix: replace `DatabaseProvider` with the repositories. `InspectionRouter` already injects
`AnimalRepository` + `RiskAnalysisService` (app.module.ts:354-358), so `AnimalRepository` is available
in-scope. Proposed:

```ts
useFactory: (inspRepo, farmRepo, animalRepo, system) => new RiskAnalysisService(inspRepo, farmRepo, animalRepo, system),
inject: [InspectionRepository, FarmRepository, AnimalRepository, SystemService],
```

`RiskAnalysisService` constructor changes from `(dbp, system)` →
`(inspRepo, farmRepo, animalRepo, system)`.

### 3.6 Transaction mechanism (IMPORTANT)

`RiskAnalysisService.runAnalysis()` is called from `apps/api/src/jobs/risk-analysis.job.ts`
(`@Cron("0 0 1 1 *")`) — **NOT currently wrapped in `ExecutionPipeline.run()`**. It injects
`DatabaseProvider` and runs `this.dbp.client` queries on the **global pool with no RLS transaction
scope**. After the fix (repos instead of `dbp`), the service must run inside a pipeline transaction so
`BaseRepository.client` picks up the transactional connection (see §5). The cron handler should become:

```ts
await this.pipeline.run(SYSTEM_PRINCIPAL, ctx, () => this.riskAnalysisService.runAnalysis({...}));
```

(the pipeline's `RLSStage` opens `db.transaction` and stores the tx in CLS under `TX_KEY`;
`BaseRepository.client` returns it). `ExecutionPipeline.makeSystemContext()` / `SYSTEM_PRINCIPAL` exist
for exactly this cron case.

---

## 4. Service D — `packages/domains/iot/src/services/iot.service.ts`

### 4.1 `@rocky/database` import (RED)

| Line | Import | Verdict |
|------|--------|---------|
| 2 | `import { iotDevices } from "@rocky/database";` | **RED** (table import) |

### 4.2 Where the imported object is USED

**NOWHERE.** `iotDevices` is imported but never referenced — every query in this file already goes
through `this.repo` (`findDeviceById`, `listDevices`, `findDeviceByEui`, `insertDevice`,
`insertReading`, `insertReadings`, `listReadings`). Confirmed by `grep "iotDevices"` → only the import
line matches.

### 4.3 / 4.4 / 4.5

- **No existing repo method needed** — all DB access is already delegated to `IotRepository`
  (`packages/domains/iot/src/repositories/iot.repository.ts`), which is fully compliant (imports
  `iotDevices`, `sensorReadings`, `farms`, `FENCE_TYPE` — repository-layer imports are permitted by
  §8.3).
- **No new method, no transaction change.**
- **Fix = delete line 2** (dead/vestigial RED import). Zero behavioral change.

---

## 5. Transaction mechanism — how compliant services obtain a transaction (reference)

**`packages/domains/shared/src/repository.ts` — `BaseRepository`:**

```ts
export class BaseRepository {
  constructor(protected readonly dbp: DatabaseProvider) {}
  protected get client() { return this.dbp.client; }   // tx connection inside pipeline, else global pool
}
```

**`packages/execution/src/rls/rls.stage.ts` — `RLSStage.run()`:** opens
`db.transaction(async (tx) => { this.cls.set(TX_KEY, tx); /* SET LOCAL app.current_* */ ... callback(tx); })`.
The tx is stored in nestjs-cls (`TX_KEY` re-exported from `@rocky/execution`). `DatabaseProvider.client`
returns this tx when inside `ExecutionPipeline.run()`, so **repositories never open transactions
themselves** — they just call `this.client`.

**`packages/execution/src/execution-pipeline.ts` — `ExecutionPipeline.run(principal, request, handler)`:**
builds runtime, emits lifecycle events, wraps handler in `rlsStage.run(...)`. `makeSystemContext()` +
`SYSTEM_PRINCIPAL` cover cron/CLI.

**Compliant example — `packages/domains/animal/src/services/animal.service.ts`:**

```ts
export class AnimalService {
  constructor(
    private readonly repo: AnimalRepository,
    private readonly system: SystemService,
    private readonly outboxPublisher?: OutboxEventPublisher,
  ) {}
  async getById(id: string): Promise<Result<AnimalResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const animal = await this.repo.findById(id);   // repo → dbp.client (tx auto)
      ...
    }, toAppError)();
  }
}
```

Services never import `db`, `DatabaseProvider`, or tables; they inject their repository and call
`this.repo.*`. The transaction/RLS scoping is provided entirely by the caller wrapping the call in
`ExecutionPipeline.run()`. The 3 RED services (B, C) that bypass this by importing `db`/`DatabaseProvider`
lose RLS scoping and break the boundary; D's import is dead; A's imports are type-only casts.

---

## 6. Conventions to match (for the planner)

- **Repository injection:** constructor `private readonly repo: XRepository` (single dependency, plus
  other services/repos as needed). AMBER services (animal/farm/movement/user/organization/device) all
  follow this. Repositories are provided in `apps/api/src/app.module.ts` via
  `useFactory: (dbp) => new XRepository(dbp)` with `inject: [DatabaseProvider]`.
- **Result<T,E>:** services return `Promise<Result<T, Error>>` (or a domain `Result<T, DomainError>`)
  built with `fromAsyncThrowable(async () => {...}, toAppError)()` from `@rocky/domains-shared`.
  Routers unwrap via `createResultUnwrapper(...)`. Services must NOT throw to callers.
- **Domain error classes:** live in `../errors/<domain>.errors.ts` per package
  (`notificationErr`/`NOTIFICATION_ERRORS`, `InspectionError`/`INSPECTION_ERRORS`,
  `IotError`/`IOT_ERRORS`, `userErr`/`USER_ERRORS`/`UserError`). New repo-layer errors, if any, follow
  this local file, not the service file.
- **Translator pattern (§6.3):** services map a repo row to the wire shape via the `@rocky/validators/api`
  response schema's `.parse()` (e.g. `iotDeviceResponseSchema.parse(device)` in `iot.service.ts` — already
  compliant). Repositories return `typeof table.$inferSelect` verbatim.
- **Enum access:** services reference enum values through the branded **Dictionary** from
  `@rocky/database/constants` (e.g. `NOTIFICATION_TYPE` in `notification.service.ts` line 14 — already
  compliant; `STATE_CODE`, `ANIMAL_STATUS` in `animal.service.ts`), never magic strings.
- **Type decoupling pattern (recommended for A):** repos re-export row-shape types
  (`export type XRow = typeof table.$inferInsert`) so services import them relative from the repo
  instead of from `@rocky/database`.

---

## 7. RobotFarm — AGENTS.md updates required after the change

| File | Must update? | Why |
|------|--------------|-----|
| `packages/domains/notification/AGENTS.md` | **Yes — minor** | "Repository Methods" table (lines ~30+) must list the **new** `NotificationRepository` methods (`findActiveSubscriptionsByEventType`, `findDeliveryByKey`, `insertDelivery`, `markDeliverySent`, `insertReminder`). `SubscriptionResolver` is not currently documented in the service-methods table — add it (with its new `UserRepository` dependency). Purpose/scope/contract otherwise unchanged. |
| `packages/domains/inspection/AGENTS.md` | **Yes — minor** | "Implementation Inventory" table lists `RiskAnalysisService` with "Weighted random 10% farm selection, list, getById" and `InspectionRepository` methods. Must reflect: (a) `RiskAnalysisService` no longer injects `DatabaseProvider` — now uses `InspectionRepository`/`FarmRepository`/`AnimalRepository`; (b) new repo methods (`createRiskAnalysis`, `insertRiskAnalysisResults`, `listRiskAnalyses`, `getRiskAnalysisById`, plus farm aggregate helpers). Purpose/scope (risk analysis + on-spot inspection) unchanged. |
| `packages/domains/iot/AGENTS.md` | **No** | Change is a one-line deletion of a dead import in `iot.service.ts`. Purpose, scope, responsibilities, and the `IotRepository` contract are unaffected. No AGENTS.md edit needed (RobotFarm pass still required to confirm no contract change, but nothing to write). |
| `packages/domains/user/AGENTS.md` | **Yes — minor (cross-domain)** | `SubscriptionResolver` (notification) will now depend on `UserRepository.findByRole` (new method). The User Bot contract should record the new `findByRole` method and that it is consumed cross-domain by Notification's SubscriptionResolver (permitted by §8.5 module-wiring exception, but the User Bot owns the method). |

**Guardians:** after edits, `pnpm check:agents` requires every bot in the Child RobotFarm Index to own
an `AGENTS.md` and the index to stay consistent; `pnpm check:adrs` is unaffected (no new ADR needed
unless the planner chooses to record the boundary fix as an ADR — optional). Remember the root
AGENTS.md warning: `ci:checks` ≠ `pnpm build`; run `pnpm build` before declaring done.

---

## 8. Summary table

| Service | RED import | Actual DB use | Fix |
|---------|-----------|---------------|-----|
| A `notification.service.ts` | `notifications` (type, L11), `deviceTokens` (val, L12) | None direct — only `$inferInsert` casts; all queries via `this.repo` | Delete L11/L12; import row-types from repo; `NOTIFICATION_TYPE` (L14) stays |
| B `subscription-resolver.service.ts` | `db` (L6), `eventSubscriptions/reminders/notificationDeliveries` (L8–11), `users` (L12), `eq,and` (L13) | 8 direct `db.` queries | New `NotificationRepository` methods (subscriptions/deliveries/reminders) + `UserRepository.findByRole`; inject `UserRepository`; remove `db`/`drizzle-orm` |
| C `risk-analysis.service.ts` | `DatabaseProvider` (L9), `farms/animals/inspections/riskAnalyses/riskAnalysisResults` (L11), `eq,and,sql,desc` (L12) | 6 `this.dbp.client` queries incl. cross-table join | New `InspectionRepository` (riskAnalyses/results) + `FarmRepository` aggregate methods; inject repos; wrap cron call in `ExecutionPipeline.run()` |
| D `iot.service.ts` | `iotDevices` (L2) | NONE (dead import) | Delete line 2 |
