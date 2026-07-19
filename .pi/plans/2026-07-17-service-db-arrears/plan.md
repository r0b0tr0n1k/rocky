# Plan — Remediate 4 RED Diamond Seal §8.2 Service/DB Arrears + RobotFarm Tracking Issue

**Date:** 2026-07-17
**Status:** Draft (ready for execution)
**Directory:** /home/goce/appz/rocky
**Standard:** ROCKY-DS 001:2026(E) §8.2 (services reach the DB only via their own-domain repository; they shall not import `@rocky/database` client/tables).

---

## Intent

Four domain services still import `@rocky/database` (Drizzle client / table definitions) directly,
violating Diamond Seal §8.2 and breaking the repository-as-DB-gatekeeper boundary (and, for B/C,
losing RLS transaction scoping). We remediate the **4 RED** services now (user decision: "do both" =
track + remediate), open a **RobotFarm tracking issue** covering the full **10-service arrears** (4 RED

+ 6 AMBER), and **defer the 6 AMBER** (type-only table access) to a later plan. Each fix removes the
forbidden import and routes all DB access through the appropriate repository; no behavioral change is
intended for A, B, D. C additionally gains correct RLS scoping via the execution pipeline.

## User Decision (confirmed)

+ **"do both"** = (A) **track** the arrears via a RobotFarm issue + (B) **remediate** the 4 RED services now.
+ **AMBER (6 services, type-only table access) is deferred** to a follow-up plan/tracking sub-task.
+ Planner call: the `RiskAnalysisService` complex join + `riskAnalyses`/`riskAnalysisResults` CRUD
  goes into a **new `RiskAnalysisRepository` (sibling of `InspectionRepository`)**; the farm aggregate
  (`countActiveFarms`, `getFarmsWithRiskFactors`) lives in **`FarmRepository`** (it owns `farms` and may
  read-join `animals`/`inspections`). **`AnimalRepository` is NOT injected into `RiskAnalysisService`** —
  the 3-table join is encapsulated inside `FarmRepository`.

---

## Approach Per Service

### Service A — `packages/domains/notification/src/services/notification.service.ts` (trivial)
+ Delete `L11` (`import type { notifications as notificationsTable }`) and `L12`
  (`import { deviceTokens as deviceTokensTable }`). `L14` `NOTIFICATION_TYPE` from
  `@rocky/database/constants` **stays** (Dictionary constant — permitted by Annex C).
+ Have `NotificationRepository` re-export row-shape types so the service imports them **relative** from
  the repo (Annex C allows own-domain `repositories/`):

  ```ts
  // notification.repository.ts (repo already imports tables — allowed)
  export type NotificationRow = typeof notifications.$inferInsert;
  export type DeviceTokenRow = typeof deviceTokens.$inferInsert;
  ```

  ```ts
  // notification.service.ts — replace casts
  import type { NotificationRepository, NotificationRow, DeviceTokenRow } from "../repositories/notification.repository.js";
  // ... `} as NotificationRow);` / `} as DeviceTokenRow);` at L58,81,107,122,135,201,232
  ```
+ No new repo method, no transaction change — all queries already go through `this.repo`.

### Service B — `packages/domains/notification/src/services/subscription-resolver.service.ts` (worst: cross-domain + raw db)
+ Remove `L6` (`db`), `L8-11` (`eventSubscriptions/reminders/notificationDeliveries`), `L12` (`users` from
  `@rocky/database/schema/sm`), `L13` (`eq,and` from `drizzle-orm`).
+ Add to `NotificationRepository` (notification-domain tables — repo-worthy):
  + `findActiveSubscriptionsByEventType(eventType)` -> SELECT `eventSubscriptions` WHERE `eventType = ? AND isActive = true`
  + `findDeliveryByKey(key)` -> SELECT id WHERE `deliveryKey = key` LIMIT 1
  + `insertDelivery(values)` -> INSERT ... ON CONFLICT DO NOTHING (target `deliveryKey`) RETURNING
  + `markDeliverySent(id, notificationId)` -> UPDATE set `notificationId`, `status:'sent'`, `deliveredAt`
  + `insertReminder(values)` -> INSERT `reminders`
+ Add to `UserRepository` (cross-domain ownership: User Bot): `findByRole(role)` (covers `targetType:"role"`;
  `findById` + `list({organizationId})` already cover `"user"`/`"org"`).
+ Rewrite `SubscriptionResolver.resolveTargetUsers` / `resolveAndNotify` to call
  `this.repo.*` and `this.userRepo.findByRole(...)`. Inject `UserRepository`:

  ```ts
  constructor(
    private readonly notificationService: NotificationService,
    private readonly repo: NotificationRepository,
    private readonly userRepo: UserRepository,
  ) {}
  ```
+ Update DI at `apps/api/src/app.module.ts:159-161`:

  ```ts
  useFactory: (ns, repo, userRepo) => new SubscriptionResolver(ns, repo, userRepo),
  inject: [NotificationService, NotificationRepository, UserRepository],
  ```

  (`UserRepository` is already provided at `:164-166`.)
+ **Secondary flag (outside strict §8.2 scope, align during fix):** `resolveAndNotify(): Promise<void>`
  should return `Result<T,E>` via `fromAsyncThrowable(async()=>{...}, toAppError)()`.

### Service C — `packages/domains/inspection/src/services/risk-analysis.service.ts` (complex join + no RLS scope today)
+ Remove `L9` (`DatabaseProvider` type), `L11` (5 tables), `L12` (`eq,and,sql,desc`).
+ New file `packages/domains/inspection/src/repositories/risk-analysis.repository.ts` exporting
  `RiskAnalysisRepository extends BaseRepository` (sibling of `InspectionRepository`) with:
  + `countActiveFarms()` -> COUNT `farms` WHERE `isActive = true`  *(alternative: keep in FarmRepository — see below)*
  + `createRiskAnalysis(values)` -> INSERT `riskAnalyses` RETURNING
  + `insertRiskAnalysisResults(rows)` -> bulk INSERT `riskAnalysisResults`
  + `listRiskAnalyses(opts)` -> paginated SELECT + COUNT
  + `getRiskAnalysisById(id)` -> SELECT single
+ New `FarmRepository` methods (`packages/domains/farm/src/repositories/farm.repository.ts`):
  + `countActiveFarms(): Promise<number>`
  + `getFarmsWithRiskFactors(): Promise<Array<{ id; type; animalCount; pastInspections }>>` — the farms
    LEFT JOIN animals LEFT JOIN inspections aggregate (L59-71 of the original service), GROUP BY
    `farms.id` HAVING `count(animals.id) > 0`. *(Encapsulates the join so `RiskAnalysisService` needs no `AnimalRepository`.)*
  > Decision note: place `countActiveFarms` + `getFarmsWithRiskFactors` in `FarmRepository` (owns `farms`).
  > `RiskAnalysisRepository` then calls `this.farmRepo.getFarmsWithRiskFactors()` / `countActiveFarms()`,
  > or `RiskAnalysisService` injects both repos. Keep the join inside `FarmRepository`.
+ Rewrite `RiskAnalysisService` to inject repos instead of `dbp`:

  ```ts
  constructor(
    private readonly riskRepo: RiskAnalysisRepository,
    private readonly farmRepo: FarmRepository,
    private readonly system: SystemService,
  ) {}
  ```

  Replace the 6 `this.dbp.client` queries with `this.riskRepo.*` / `this.farmRepo.*`.
+ Update DI at `apps/api/src/app.module.ts:366-368`:

  ```ts
  useFactory: (riskRepo, farmRepo, system) => new RiskAnalysisService(riskRepo, farmRepo, system),
  inject: [RiskAnalysisRepository, FarmRepository, SystemService],
  ```

  (`FarmRepository` is provided elsewhere in `app.module.ts`; confirm/insert if missing.)
+ **CRITICAL — RLS scoping:** the cron `apps/api/src/jobs/risk-analysis.job.ts` calls `runAnalysis`
  **outside** `ExecutionPipeline.run()` today (global pool, no RLS tx). Wrap it:

  ```ts
  import { ExecutionPipeline } from "@rocky/execution";
  import { SYSTEM_PRINCIPAL } from "@rocky/authorization";
  // inside runAnnualAnalysis():
  const pipeline = new ExecutionPipeline(); // or injected
  const result = await pipeline.run(
    SYSTEM_PRINCIPAL,
    ExecutionPipeline.makeSystemContext(),
    () => this.riskAnalysisService.runAnalysis({ year, selectionPercentage: 10, createdBy: "system" }),
  );
  ```

  Inside the pipeline `RLSStage` opens `db.transaction` and stores the tx in CLS; `BaseRepository.client`
  returns it, so the repos inherit the RLS transaction automatically. Verify `ExecutionPipeline.run`
  signature (`packages/execution/src/execution-pipeline.ts:66`) and `makeSystemContext` (`:120`) before editing.

### Service D — `packages/domains/iot/src/services/iot.service.ts` (trivial)
+ Delete `L2` (`import { iotDevices } from "@rocky/database"`) — **dead import, never used**; every query
  already goes through `this.repo`. Zero behavioral change, no repo/transaction change.

---

## RobotFarm — AGENTS.md Updates (required after each domain change)

| File | Edit? | What to record |
|------|-------|---------------|
| `packages/domains/notification/AGENTS.md` | **Yes — minor** | List new `NotificationRepository` methods (`findActiveSubscriptionsByEventType`, `findDeliveryByKey`, `insertDelivery`, `markDeliverySent`, `insertReminder`) + document `SubscriptionResolver` with its new `UserRepository` dependency. Purpose/scope unchanged. |
| `packages/domains/inspection/AGENTS.md` | **Yes — minor** | Reflect `RiskAnalysisService` no longer injects `DatabaseProvider` (now `RiskAnalysisRepository` + `FarmRepository`); list new `RiskAnalysisRepository` methods + `FarmRepository` aggregate helpers. Purpose/scope unchanged. |
| `packages/domains/user/AGENTS.md` | **Yes — minor (cross-domain)** | Record new `UserRepository.findByRole(role)` and that it is consumed cross-domain by Notification's `SubscriptionResolver` (permitted by §8.5 module-wiring exception; User Bot owns the method). |
| `packages/domains/farm/AGENTS.md` | **Yes — minor** | Record new `FarmRepository.countActiveFarms()` + `getFarmsWithRiskFactors()` (read-join aggregate). |
| `packages/domains/iot/AGENTS.md` | **No edit** | Dead-import deletion doesn't alter contract. RobotFarm pass still confirms no contract change. |

**Guardians:** `pnpm check:agents` requires every bot in the Child RobotFarm Index to own an `AGENTS.md`
and the index to stay consistent; `pnpm check:adrs` is unaffected (no new ADR required). **Root
AGENTS.md warning — `ci:checks` != `pnpm build`.** A green `ci:checks` does NOT prove the production
build; **run `pnpm build` before declaring done.**

---

## RobotFarm Tracking Issue (Deliverable A — "track the arrears")

Open **one** Radicle issue covering the full **10-service arrears**:

+ Title: `RobotFarm: remediate 10 Diamond Seal §8.2 service/DB arrears (4 RED + 6 AMBER)`
+ Body: enumerate the 4 RED (notification.service, subscription-resolver.service, risk-analysis.service,
  iot.service) as **in progress / this plan**, and the 6 AMBER (animal/farm/movement/user/organization/
  device — type-only `$inferInsert` casts sourced from `@rocky/database`) as **deferred follow-up**.
  State the rule (§8.2 + Annex C visa matrix) and the planned fix pattern (repos re-export row-shape
  types; services import relative from the repo).
+ Command (worker step — `rad_issue_create` is not exposed as a tool, use the CLI):

  ```bash
  rad issue create --title "RobotFarm: remediate 10 Diamond Seal §8.2 service/DB arrears (4 RED + 6 AMBER)" \
    --description "$(cat .pi/plans/2026-07-17-service-db-arrears/issue-body.md)"
  ```

  Record the resulting issue ID in the plan's tracking log.
+ The 6 AMBER become tracking sub-tasks / a follow-up plan, not part of this execution.

---

## Verification

1. **`pnpm build`** (full turbo build — `next build` docs + `nest build` api, which type-checks
   `*.test.ts`). This is the real gate that catches build-rot; `ci:checks` does NOT run it.
2. **`pnpm ci:checks`** = `generate:trpc` -> `check:trpc-boundary` -> `check:adrs` -> `check:md-links` ->
   `check:agents` -> `check:pdfa` -> `test`. Must be green.
3. **`lens_diagnostics` mode=all** on the edited files (notification, inspection, user, farm, iot
   services/repos + `app.module.ts` + `risk-analysis.job.ts`) — zero blocking errors.
4. Confirm no service file under `packages/domains/*/services` still imports `@rocky/database` (client/tables):
   `grep -rnE "from \"@rocky/database\"" packages/domains/*/src/services` -> only `@rocky/database/constants`
   matches may remain.

---

## Follow-Up (deferred — NOT in this plan)

+ **6 AMBER services** (animal/farm/movement/user/organization/device): replace
  `typeof import("@rocky/database").X.$inferInsert` casts with repo-re-exported row types. Same pattern
  as Service A. Tracked by the RobotFarm issue above.
+ Optional: align `SubscriptionResolver.resolveAndNotify` to return `Result<T,E>` (Service B secondary flag).

---

## Ideal State Criteria (ISC)

### Core Functionality
+ [ ] ISC-1: `notification.service.ts` no longer imports `@rocky/database` (only `/constants` allowed); queries still via `this.repo`.
+ [ ] ISC-2: `subscription-resolver.service.ts` has zero `db`/`DatabaseProvider`/table/`drizzle-orm` imports; all 8 former direct queries now route via repos.
+ [ ] ISC-3: `risk-analysis.service.ts` no longer imports `DatabaseProvider`/tables/`drizzle-orm`; repos injected.
+ [ ] ISC-4: `iot.service.ts` no longer imports `@rocky/database`.
+ [ ] ISC-5: `UserRepository.findByRole(role)` exists and is used for `targetType:"role"` in `SubscriptionResolver`.
+ [ ] ISC-6: `RiskAnalysisRepository` + `FarmRepository.getFarmsWithRiskFactors`/`countActiveFarms` exist; `RiskAnalysisService` uses them (no `this.dbp.client`).
+ [ ] ISC-7: `risk-analysis.job.ts` wraps `runAnalysis` in `ExecutionPipeline.run(SYSTEM_PRINCIPAL, makeSystemContext(), ...)`.
+ [ ] ISC-8: `pnpm build` passes with no type errors from changed packages.
+ [ ] ISC-9: `pnpm ci:checks` passes (incl. `check:agents`, `check:adrs`, `test`).
+ [ ] ISC-10: RobotFarm tracking issue opened for all 10 services (4 RED + 6 AMBER).
+ [ ] ISC-11: AGENTS.md RobotFarm pass done for notification, inspection, user, farm domains.

### Anti-Criteria
+ [ ] ISC-A-1: No `packages/domains/*/services/*.ts` imports `@rocky/database` (client/tables) after remediation.
+ [ ] ISC-A-2: No new direct `db.` queries introduced in the service layer.
+ [ ] ISC-A-3: `ci:checks` green is not treated as a substitute for `pnpm build` green.

---

## Todos (tagged `service-db-arrears`)

Sequenced per RobotFarm per-domain flow: **scout done -> edit files -> AGENTS.md pass -> commit per
domain -> build+checks**. Each todo is independently implementable and references real code. Worker:
commit per domain (A+B share `notification`; B also touches `user`; C touches `inspection`+`farm`; D=`iot`).

### T1 — Open RobotFarm tracking issue for the 10-service arrears  `tags: [service-db-arrears, tracking]`

**Body:** Create a Radicle issue enumerating all 10 services. Mark the 4 RED (notification.service,
subscription-resolver.service, risk-analysis.service, iot.service) as in-progress/this-plan; the 6 AMBER
(animal/farm/movement/user/organization/device — type-only `$inferInsert` casts from `@rocky/database`)
as deferred follow-up. Cite ROCKY-DS 001:2026(E) §8.2 + Annex C visa matrix. Write the body to
`.pi/plans/2026-07-17-service-db-arrears/issue-body.md`, then run:

```bash
rad issue create --title "RobotFarm: remediate 10 Diamond Seal §8.2 service/DB arrears (4 RED + 6 AMBER)" \
  --description "$(cat .pi/plans/2026-07-17-service-db-arrears/issue-body.md)"
```

Record the issue ID back into the plan.
**Acceptance:** issue exists, lists 10 services, distinguishes RED (now) vs AMBER (deferred). (ISC-10)

### T2 — Service A: re-export row-shape types from NotificationRepository  `tags: [service-db-arrears, red-A, notification]`

**File:** `packages/domains/notification/src/repositories/notification.repository.ts`
**Code:** after the existing table imports, add:

```ts
export type NotificationRow = typeof notifications.$inferInsert;
export type DeviceTokenRow = typeof deviceTokens.$inferInsert;
```

(`notifications` and `deviceTokens` are already imported in this file — repo-layer imports are permitted by §8.3.)
**Acceptance:** types exported; no service import of `@rocky/database` tables needed. (ISC-1)

### T3 — Service A: decouple notification.service.ts from `@rocky/database` tables  `tags: [service-db-arrears, red-A, notification]`

**File:** `packages/domains/notification/src/services/notification.service.ts`
**Edit:** delete `L11` (`import type { notifications as notificationsTable } from "@rocky/database";`) and
`L12` (`import { deviceTokens as deviceTokensTable } from "@rocky/database";`). Keep `L14`
`import { NOTIFICATION_TYPE } from "@rocky/database/constants";`. Change the repo import to also bring the row types:

```ts
import type { NotificationRepository, NotificationRow, DeviceTokenRow } from "../repositories/notification.repository.js";
```

Replace every `as typeof notificationsTable.$inferInsert` -> `as NotificationRow` and
`as typeof deviceTokensTable.$inferInsert` -> `as DeviceTokenRow` (L58,81,107,122,135,201,232).
**Acceptance:** `grep -n "from \"@rocky/database\"" packages/domains/notification/src/services/notification.service.ts` -> only the `/constants` line remains. (ISC-1)

### T4 — Service A RobotFarm AGENTS.md pass (notification)  `tags: [service-db-arrears, red-A, notification]`

**File:** `packages/domains/notification/AGENTS.md`
**Edit:** in the Repository Methods table, add `NotificationRow` / `DeviceTokenRow` re-exported types note
(no new method). No scope/purpose change.
**Acceptance:** `pnpm check:agents` stays green; doc reflects row-type re-export. (ISC-11)

### T5 — Service B: add 5 methods to NotificationRepository  `tags: [service-db-arrears, red-B, notification]`

**File:** `packages/domains/notification/src/repositories/notification.repository.ts`
**Code (repo already imports `eventSubscriptions`, `reminders`, `notificationDeliveries` — add if not present):**

```ts
async findActiveSubscriptionsByEventType(eventType: string) {
  return this.client.select().from(eventSubscriptions)
    .where(and(eq(eventSubscriptions.eventType, eventType), eq(eventSubscriptions.isActive, true)));
}
async findDeliveryByKey(key: string) {
  const rows = await this.client.select({ id: notificationDeliveries.id })
    .from(notificationDeliveries).where(eq(notificationDeliveries.deliveryKey, key)).limit(1);
  return rows[0] ?? null;
}
async insertDelivery(values: typeof notificationDeliveries.$inferInsert) {
  const rows = await this.client.insert(notificationDeliveries).values(values)
    .onConflictDoNothing({ target: notificationDeliveries.deliveryKey }).returning();
  return rows[0] ?? null;
}
async markDeliverySent(id: string, notificationId: string) {
  await this.client.update(notificationDeliveries).set({
    notificationId, status: "sent", deliveredAt: new Date(),
  }).where(eq(notificationDeliveries.id, id));
}
async insertReminder(values: typeof reminders.$inferInsert) {
  await this.client.insert(reminders).values(values);
}
```

(`this.client` -> `this.dbp.client`; resolves the pipeline tx automatically. Match existing repo style —
return `Result` only if other repo methods do; otherwise plain async, mirroring the surrounding methods.)
**Acceptance:** 5 methods present; no `@rocky/database` import added at service layer. (ISC-2)

### T6 — Service B: add UserRepository.findByRole (cross-domain)  `tags: [service-db-arrears, red-B, user, cross-domain]`

**File:** `packages/domains/user/src/repositories/user.repository.ts`
**Code (repo already imports `users` table):**

```ts
async findByRole(role: string) {
  return this.client.select().from(users).where(eq(users.role, role));
}
```

Covers `targetType:"role"`; `findById` (L15) and `list({organizationId})` (L30) already cover `"user"`/`"org"`.
**Acceptance:** `findByRole` exists and returns user rows. (ISC-5)

### T7 — Service B: rewrite SubscriptionResolver to use repos + inject UserRepository  `tags: [service-db-arrears, red-B, notification]`

**File:** `packages/domains/notification/src/services/subscription-resolver.service.ts`
**Edit:** remove `L6` (`db`), `L8-11` (eventSubscriptions/reminders/notificationDeliveries), `L12` (`users` from
`@rocky/database/schema/sm`), `L13` (`eq,and` from `drizzle-orm`). Add `import type { UserRepository } from
"@rocky/domains-user"` (or relative). Change constructor:

```ts
constructor(
  private readonly notificationService: NotificationService,
  private readonly repo: NotificationRepository,
  private readonly userRepo: UserRepository,
) {}
```

Rewrite usages:
+ `resolveAndNotify` subscription SELECT -> `await this.repo.findActiveSubscriptionsByEventType(input.eventType)`
+ dedup -> `const existing = await this.repo.findDeliveryByKey(key); if (existing) continue;`
+ insert -> `const delivery = await this.repo.insertDelivery({ outboxEventId, subscriptionId: sub.id, userId: user.id, deliveryKey: key, status: "pending" }); if (!delivery) continue;`
+ on success -> `await this.repo.markDeliverySent(delivery.id, result.value.id);`
+ `resolveTargetUsers` -> `"user": await this.userRepo.findById(targetId)`, `"role": await this.userRepo.findByRole(targetId)`, `"org": (await this.userRepo.list({ organizationId: targetId })).data` (map ids)
+ `createReminder` -> `await this.repo.insertReminder({ outboxEventId, entityType, entityId, userId, title, dueAt, priority: "normal" });`
+ `createReminder` param type `sub: typeof eventSubscriptions.$inferSelect` -> import the SELECT type from the
  repo or use `Awaited<ReturnType<NotificationRepository["findActiveSubscriptionsByEventType"]>>[number]`.
**Secondary flag (align, optional this pass):** convert `resolveAndNotify(): Promise<void>` to
`Promise<Result<void, Error>>` via `fromAsyncThrowable(async () => {...}, toAppError)()`.
**Acceptance:** zero `db.`/`DatabaseProvider`/table/`drizzle-orm` imports in the file; all 8 former direct
queries route via `this.repo`/`this.userRepo`. (ISC-2, ISC-5)

### T8 — Service B: update DI for SubscriptionResolver in app.module.ts  `tags: [service-db-arrears, red-B, notification]`

**File:** `apps/api/src/app.module.ts` (lines `159-161`)
**Edit:**

```diff
- useFactory: (ns: NotificationService, repo: NotificationRepository) => new SubscriptionResolver(ns, repo),
- inject: [NotificationService, NotificationRepository],
+ useFactory: (ns: NotificationService, repo: NotificationRepository, userRepo: UserRepository) => new SubscriptionResolver(ns, repo, userRepo),
+ inject: [NotificationService, NotificationRepository, UserRepository],
```

(`UserRepository` is already provided at `:164-166`.)
**Acceptance:** DI compiles; `SubscriptionResolver` constructed with 3 deps. (ISC-2, ISC-5)

### T9 — Service B RobotFarm AGENTS.md pass (notification + user)  `tags: [service-db-arrears, red-B, notification, user]`

**Files:** `packages/domains/notification/AGENTS.md`, `packages/domains/user/AGENTS.md`
**Edit (notification):** add the 5 new `NotificationRepository` methods to the Repository Methods table;
document `SubscriptionResolver` (previously undocumented) with its new `UserRepository` dependency.
**Edit (user):** add `findByRole(role)` to `UserRepository` methods; note cross-domain consumption by
Notification's `SubscriptionResolver` (§8.5 module-wiring exception; User Bot owns the method).
**Acceptance:** `pnpm check:agents` green. (ISC-11)

### T10 — Service C: create RiskAnalysisRepository (sibling)  `tags: [service-db-arrears, red-C, inspection]`

**File (new):** `packages/domains/inspection/src/repositories/risk-analysis.repository.ts`
**Code:**

```ts
import { BaseRepository } from "@rocky/domains-shared";
import { riskAnalyses, riskAnalysisResults } from "@rocky/database"; // repo-layer import OK (§8.3)
import { eq, and, desc, sql } from "drizzle-orm";

export class RiskAnalysisRepository extends BaseRepository {
  async createRiskAnalysis(values: typeof riskAnalyses.$inferInsert) {
    const rows = await this.client.insert(riskAnalyses).values(values).returning();
    return rows[0] ?? null;
  }
  async insertRiskAnalysisResults(rows: (typeof riskAnalysisResults.$inferInsert)[]) {
    if (rows.length) await this.client.insert(riskAnalysisResults).values(rows);
  }
  async listRiskAnalyses(opts: { year?: number; status?: string; limit: number; offset: number }) {
    const where = and(opts.year ? eq(riskAnalyses.year, opts.year) : undefined,
                       opts.status ? eq(riskAnalyses.status, opts.status) : undefined);
    const data = await this.client.select().from(riskAnalyses).where(where)
      .orderBy(desc(riskAnalyses.createdAt)).limit(opts.limit).offset(opts.offset);
    const [{ count }] = await this.client.select({ count: sql<number>`count(*)` })
      .from(riskAnalyses).where(where);
    return { data, total: Number(count) };
  }
  async getRiskAnalysisById(id: string) {
    const rows = await this.client.select().from(riskAnalyses).where(eq(riskAnalyses.id, id)).limit(1);
    return rows[0] ?? null;
  }
}
```

Export it from the package barrel so `app.module.ts` can `inject: [RiskAnalysisRepository]`.
**Acceptance:** repository compiles; `countActiveFarms`/`getFarmsWithRiskFactors` are NOT here (they live in
`FarmRepository`). (ISC-6)

### T11 — Service C: add farm aggregate methods to FarmRepository  `tags: [service-db-arrears, red-C, farm]`

**File:** `packages/domains/farm/src/repositories/farm.repository.ts`
**Code (repo already imports `farmsTable`; also import `animals`, `inspections` for the read-join, and
`sql` from `drizzle-orm`):**

```ts
async countActiveFarms(): Promise<number> {
  const [{ count }] = await this.client.select({ count: sql<number>`count(*)` })
    .from(farmsTable).where(eq(farmsTable.isActive, true));
  return Number(count);
}
async getFarmsWithRiskFactors() {
  return this.client.select({
    id: farmsTable.id,
    type: farmsTable.type,
    animalCount: sql<number>`COALESCE(count(DISTINCT ${animals.id}), 0)`,
    pastInspections: sql<number>`count(DISTINCT CASE WHEN ${inspections.status} = 'completed' THEN ${inspections.id} END)`,
  }).from(farmsTable)
    .leftJoin(animals, eq(animals.currentFarmId, farmsTable.id))
    .leftJoin(inspections, eq(inspections.farmId, farmsTable.id))
    .where(eq(farmsTable.isActive, true))
    .groupBy(farmsTable.id)
    .having(sql`count(${animals.id}) > 0`);
}
```

This encapsulates the original L59-71 3-table join so `RiskAnalysisService` needs no `AnimalRepository`.
**Acceptance:** both methods present; aggregate matches original semantics (active farms, animalCount,
pastInspections, HAVING count(animals)>0). (ISC-6)

### T12 — Service C: decouple risk-analysis.service.ts from DatabaseProvider/tables  `tags: [service-db-arrears, red-C, inspection]`

**File:** `packages/domains/inspection/src/services/risk-analysis.service.ts`
**Edit:** remove `L9` (`DatabaseProvider` type), `L11` (5 tables), `L12` (`eq,and,sql,desc`). Change constructor:

```ts
constructor(
  private readonly riskRepo: RiskAnalysisRepository,
  private readonly farmRepo: FarmRepository,
  private readonly system: SystemService,
) {}
```

Rewrite the 6 queries:
+ `countActiveFarms` -> `await this.farmRepo.countActiveFarms()`
+ farms-with-risk-factors join -> `await this.farmRepo.getFarmsWithRiskFactors()`
+ INSERT risk_analysis -> `await this.riskRepo.createRiskAnalysis({ year, quarter, status, totalFarms, selectedFarms, algorithmVersion, selectionPercentage, paramsSnapshot, createdBy })`
+ bulk results -> `await this.riskRepo.insertRiskAnalysisResults(rows)`
+ `list` -> `await this.riskRepo.listRiskAnalyses(opts)`
+ `getById` -> `await this.riskRepo.getRiskAnalysisById(id)`
**Acceptance:** zero `DatabaseProvider`/table/`drizzle-orm` imports in the file; no `this.dbp.client`. (ISC-3, ISC-6)

### T13 — Service C: update DI for RiskAnalysisService in app.module.ts  `tags: [service-db-arrears, red-C, inspection]`

**File:** `apps/api/src/app.module.ts` (lines `366-368`)
**Edit:**

```diff
- useFactory: (dbp: DatabaseProvider, system: SystemService) => new RiskAnalysisService(dbp, system),
- inject: [DatabaseProvider, SystemService],
+ useFactory: (riskRepo: RiskAnalysisRepository, farmRepo: FarmRepository, system: SystemService) => new RiskAnalysisService(riskRepo, farmRepo, system),
+ inject: [RiskAnalysisRepository, FarmRepository, SystemService],
```

Confirm `FarmRepository` is provided in `app.module.ts` (it is, for FarmService); add `RiskAnalysisRepository`
provider if absent (`useFactory: (dbp) => new RiskAnalysisRepository(dbp), inject: [DatabaseProvider]`).
**Acceptance:** DI compiles; `RiskAnalysisService` constructed with repos. (ISC-3, ISC-6)

### T14 — Service C: wrap cron call in ExecutionPipeline (RLS scope)  `tags: [service-db-arrears, red-C, inspection]`

**File:** `apps/api/src/jobs/risk-analysis.job.ts`
**Edit:** verify `ExecutionPipeline.run` signature (`packages/execution/src/execution-pipeline.ts:66`) and
`makeSystemContext` (`:120`); `SYSTEM_PRINCIPAL` from `@rocky/authorization` (`:14`). Then:

```ts
import { ExecutionPipeline } from "@rocky/execution";
import { SYSTEM_PRINCIPAL } from "@rocky/authorization";
// ...
@Cron("0 0 1 1 *")
async runAnnualAnalysis() {
  const year = new Date().getFullYear();
  this.logger.log(`Starting annual risk analysis for ${year}...`);
  const pipeline = new ExecutionPipeline(); // or inject via constructor
  const result = await pipeline.run(
    SYSTEM_PRINCIPAL,
    ExecutionPipeline.makeSystemContext(),
    () => this.riskAnalysisService.runAnalysis({ year, selectionPercentage: 10, createdBy: "system" }),
  );
  if (result.isErr()) { this.logger.error("Risk analysis failed", result.error); return; }
  const { analysisId, selectedFarmCount, totalFarmCount } = result.value;
  this.logger.log(`Risk analysis ${analysisId} complete: ${selectedFarmCount}/${totalFarmCount} farms selected.`);
}
```

**Acceptance:** `runAnalysis` runs inside `ExecutionPipeline.run` -> repos inherit the RLS tx (no global-pool bypass). (ISC-7)

### T15 — Service C RobotFarm AGENTS.md pass (inspection + farm)  `tags: [service-db-arrears, red-C, inspection, farm]`

**Files:** `packages/domains/inspection/AGENTS.md`, `packages/domains/farm/AGENTS.md`
**Edit (inspection):** update `RiskAnalysisService` description (no longer injects `DatabaseProvider`; uses
`RiskAnalysisRepository` + `FarmRepository`); list the new `RiskAnalysisRepository` methods.
**Edit (farm):** add `countActiveFarms()` + `getFarmsWithRiskFactors()` to `FarmRepository` methods.
**Acceptance:** `pnpm check:agents` green. (ISC-11)

### T16 — Service D: delete dead import in iot.service.ts  `tags: [service-db-arrears, red-D, iot]`

**File:** `packages/domains/iot/src/services/iot.service.ts`
**Edit:** delete `L2` (`import { iotDevices } from "@rocky/database";`). Confirm via `grep -n "iotDevices"`
only the (now removed) import matched — every query already uses `this.repo`.
**Acceptance:** `iot.service.ts` no longer imports `@rocky/database`; no behavioral change. (ISC-4)
**Note:** `packages/domains/iot/AGENTS.md` needs NO edit (dead-import deletion doesn't alter contract) — RobotFarm pass only confirms no contract change.

### T17 — Verify: pnpm build + ci:checks + lens_diagnostics  `tags: [service-db-arrears, verify]`

**Body:** Run, in order:

1. `pnpm build` (full turbo build — the real gate; `ci:checks` does NOT run this).
2. `pnpm ci:checks` (generate:trpc -> check:trpc-boundary -> check:adrs -> check:md-links -> check:agents -> check:pdfa -> test).
3. `lens_diagnostics` mode=all on edited files (notification, inspection, user, farm, iot services/repos +
   `app.module.ts` + `risk-analysis.job.ts`) — zero blocking errors.
4. Guard: `grep -rnE "from \"@rocky/database\"" packages/domains/*/src/services` -> only `/constants` may remain.
**Acceptance:** all four green; no service-layer `@rocky/database` (non-constants) imports. (ISC-1..4, ISC-8, ISC-9, ISC-A-1..3)
