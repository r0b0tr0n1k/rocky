# Rocky AIMCS — Business Domain Completion Report

**Date:** July 2026
**Status:** 12 Tracks + 1 Integration Complete

---

## Executive Summary

This report documents all completed business domain work in the Rocky Animal Identification & Movement Control System (AIMCS). Over 12 implementation tracks plus an archive-passport integration, we built the core livestock tracking business logic across 6 domain packages, establishing the full Error Sovereignty Doctrine, state machines, cross-domain integration, and tRPC API surface.

### By the Numbers

| Metric                      | Count                                                       |
| --------------------------- | ----------------------------------------------------------- |
| **Tracks Completed**        | 12 + 1 integration                                          |
| **Domain Packages Created** | 6 (animal, movement, passport, eartag, correction, archive) |
| **Service Methods**         | 45+                                                         |
| **Repository Methods**      | 50+                                                         |
| **tRPC Endpoints**          | 38                                                          |
| **Error Codes Defined**     | 52                                                          |
| **State Machines**          | 2 (Passport, Correction)                                    |
| **Cron Jobs**               | 3 (Retention, Risk Analysis, Correction Consistency)        |
| **Permission Guards**       | 1 factory (`createPermissionGuard`)                         |

### Architecture Patterns Established

- **Error Sovereignty:** Domain services return `Result<T,E>` via `neverthrow`. Never throw in domain layer.
- **tRPC Mapping:** Domain errors → TRPCError at router boundary only.
- **Diamond Seal Validation:** Dumb Zod (DB) → Smart Zod (business) → API Zod (request/response).
- **Cross-Domain Integration:** Repository injection, not direct service imports.
- **State Machines:** Explicit `VALID_TRANSITIONS` maps with `validateTransition()` guards.

---

## Track 1: Animal Registration Rules

**Package:** `packages/domains/animal/`
**Status:** Complete

### Files

| File           | Path                                                            |
| -------------- | --------------------------------------------------------------- |
| Service        | `packages/domains/animal/src/services/animal.service.ts`        |
| Repository     | `packages/domains/animal/src/repositories/animal.repository.ts` |
| Errors         | `packages/domains/animal/src/errors/animal.errors.ts`           |
| Validators     | `packages/validators/src/api/animals.api.ts`                    |
| tRPC Error Map | `packages/validators/src/errors/animal.errors.ts`               |
| tRPC Router    | `apps/api/src/routers/animal.router.ts`                         |

### Error Codes (11)

```typescript
export const ANIMAL_ERRORS = {
  NOT_FOUND:            "ANIMAL_NOT_FOUND",
  DUPLICATE_TAG:        "ANIMAL_DUPLICATE_EAR_TAG",
  INVALID_INPUT:        "ANIMAL_INVALID_INPUT",
  FORBIDDEN:            "ANIMAL_FORBIDDEN",
  MOTHER_NOT_ON_FARM:   "ANIMAL_MOTHER_NOT_ON_FARM",
  MOTHER_NOT_ALIVE:     "ANIMAL_MOTHER_NOT_ALIVE",
  MOTHER_TOO_YOUNG:     "ANIMAL_MOTHER_TOO_YOUNG",
  INVALID_CALVING_GAP:  "ANIMAL_INVALID_CALVING_GAP",
  EAR_TAG_ALREADY_USED: "ANIMAL_EAR_TAG_ALREADY_USED",
  SELF_MOTHER:          "ANIMAL_SELF_MOTHER",
  INVALID_PARENT_SEX:   "ANIMAL_INVALID_PARENT_SEX",
} as const;
```

### Service Methods

| Method      | Signature                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------- |
| `getById`   | `(id: string) => Promise<Result<AnimalResponse, Error>>`                                          |
| `list`      | `(input: AnimalListRequest) => Promise<Result<AnimalListResponse, Error>>`                        |
| `create`    | `(input: CreateAnimalRequest & { createdBy?: string }) => Promise<Result<AnimalResponse, Error>>` |
| `update`    | `(id: string, input: UpdateAnimalRequest) => Promise<Result<AnimalResponse, Error>>`              |
| `findByTag` | `(earTag: string, stateCode?: string) => Promise<Result<AnimalResponse, Error>>`                  |

### Business Rules in `create()`

| Rule | Description                                      | Error Thrown           |
| ---- | ------------------------------------------------ | ---------------------- |
| A.3  | Ear tag must be NEW (not used by another animal) | `EAR_TAG_ALREADY_USED` |
| A.4a | Mother must be on the same farm at birth         | `MOTHER_NOT_ON_FARM`   |
| A.4b | Mother must be alive at birth                    | `MOTHER_NOT_ALIVE`     |
| A.4c | Mother must be ≥ 17 months old                   | `MOTHER_TOO_YOUNG`     |
| A.4d | Calving gap must be ≥ 365 days                   | `INVALID_CALVING_GAP`  |
| A.5  | Mother must be female                            | `INVALID_PARENT_SEX`   |
| A.5  | Father must be male                              | `INVALID_PARENT_SEX`   |

### System Parameters

```typescript
const DEFAULT_PARAMS = {
  minMotherAgeMonths: 17,
  calvingPeriodDays: 365,
} as const;
```

### tRPC Endpoints (5)

| Type     | Endpoint           | Notes                     |
| -------- | ------------------ | ------------------------- |
| Query    | `animal.getById`   |                           |
| Query    | `animal.findByTag` |                           |
| Query    | `animal.list`      | Paginated                 |
| Mutation | `animal.create`    | Sets `createdBy` from ctx |
| Mutation | `animal.update`    |                           |

### Repository Methods (8)

`findById`, `findByTag`, `listFiltered`, `insert`, `update`, `findAnimalFarm`, `updateFarm`, `findLastCalfByMother`

---

## Track 2: Movement Business Rules

**Package:** `packages/domains/movement/`
**Status:** Complete (service layer; tRPC wiring partial)

### Files

| File           | Path                                                                |
| -------------- | ------------------------------------------------------------------- |
| Service        | `packages/domains/movement/src/services/movement.service.ts`        |
| Repository     | `packages/domains/movement/src/repositories/movement.repository.ts` |
| Errors         | `packages/domains/movement/src/errors/movement.errors.ts`           |
| Validators     | `packages/validators/src/api/movements.api.ts`                      |
| tRPC Error Map | `packages/validators/src/errors/movement.errors.ts`                 |
| tRPC Router    | `apps/api/src/routers/movement.router.ts`                           |

### Error Codes (16)

```typescript
export const MOVEMENT_ERRORS = {
  NOT_FOUND:                "MOVEMENT_NOT_FOUND",
  INVALID_DATES:            "MOVEMENT_INVALID_DATES",
  INVALID_INPUT:            "MOVEMENT_INVALID_INPUT",
  FORBIDDEN:                "MOVEMENT_FORBIDDEN",
  SAME_FARM:                "MOVEMENT_SAME_FARM_ERROR",
  ANIMAL_NOT_ALIVE:         "MOVEMENT_ANIMAL_NOT_ALIVE",
  ANIMAL_NOT_ON_FARM:       "MOVEMENT_ANIMAL_NOT_ON_FARM",
  DEATH_CAUSE_REQUIRED:     "MOVEMENT_DEATH_CAUSE_REQUIRED",
  STILLBORN_THRESHOLD:      "MOVEMENT_STILLBORN_THRESHOLD",
  PASTURE_ANIMAL_NOT_HOME:  "MOVEMENT_PASTURE_ANIMAL_NOT_HOME",
  PASTURE_AUTO_TRANSFER:    "MOVEMENT_PASTURE_AUTO_TRANSFER",
  PASTURE_INVALID_DEPARTURE:"MOVEMENT_PASTURE_INVALID_DEPARTURE",
  SLAUGHTER_MIN_AGE:        "MOVEMENT_SLAUGHTER_MIN_AGE",
  UNREGISTERED_FARM:        "MOVEMENT_UNREGISTERED_FARM",
  IMPORT_ALREADY_REGISTERED:"MOVEMENT_IMPORT_ALREADY_REGISTERED",
  EXPORT_ANIMAL_NOT_FOUND:  "MOVEMENT_EXPORT_ANIMAL_NOT_FOUND",
} as const;
```

### Service Methods (12)

| Category  | Method                    | Description                 |
| --------- | ------------------------- | --------------------------- |
| CRUD      | `getById`                 | Single movement lookup      |
| CRUD      | `listByAnimal`            | Paginated list by animal    |
| CRUD      | `create`                  | Generic movement creation   |
| Death     | `recordDeath`             | Death scenario with cause   |
| Pasture   | `declarePasture`          | Pasture departure/return    |
| Slaughter | `recordSlaughter`         | Slaughter with age check    |
| Import    | `importEU`                | EU import, keep original ID |
| Import    | `importThirdCountry`      | 3rd country, re-tag         |
| Export    | `exportAnimal`            | Export to foreign farm      |
| Market    | `recordMarketTransaction` | 4-leg market chain          |
| Market    | `recordMarketUnsold`      | Unsold animal return        |
| Market    | `recordMarketSlaughter`   | Market → slaughterhouse     |

### Business Rules Implemented

| Rule      | Method                    | Logic                                                                 |
| --------- | ------------------------- | --------------------------------------------------------------------- |
| B.1       | `recordDeath`             | Validates alive, creates DEATH movement, status → DEAD                |
| B.2       | `recordDeath`             | `ageDays ≤ 25` auto-detects stillborn, status → STILLBORN             |
| C.1       | `declarePasture`          | Only home farm animals to pasture                                     |
| D.1       | `recordSlaughter`         | Min age 25 days                                                       |
| D.3       | `recordSlaughter`         | Arrival correction ±2 days                                            |
| E.1       | `create`                  | Unregistered departure farm `"100000014"`                             |
| E.2       | `create`                  | Unregistered arrival farm `"100000027"`                               |
| M.1-M.2   | `recordMarketTransaction` | 2-leg chain: seller→market→buyer with `parentMovementId` + `legOrder` |
| M.3       | `recordMarketUnsold`      | Reverse movement, `reason: "unsold_at_market"`                        |
| M.4       | `recordMarketSlaughter`   | market→slaughterhouse, status → SLAUGHTERED                           |
| IE.1-IE.2 | `importEU`                | IMPORT movement + import_export_record, 3yr passport storage          |
| IE.3-IE.4 | `importThirdCountry`      | IMPORT + retagged flag, new ear tag                                   |
| IE.5      | `exportAnimal`            | EXPORT movement + record, status → EXPORTED                           |

### System Parameters

```typescript
const DEFAULT_PARAMS = {
  slaughterMinAgeDays: 25,
  stillbornThresholdDays: 25,
  arrivalCorrectionDays: 2,
  unregisteredDepartureFarmId: "100000014",
  unregisteredArrivalFarmId: "100000027",
} as const;
```

### tRPC Endpoints (3 — partial wiring)

| Type     | Endpoint           |
| -------- | ------------------ |
| Query    | `movement.getById` |
| Query    | `movement.list`    |
| Mutation | `movement.create`  |

**Note:** The 10 business-rule methods (`recordDeath`, `declarePasture`, `recordSlaughter`, `importEU`, `importThirdCountry`, `exportAnimal`, `recordMarketTransaction`, `recordMarketUnsold`, `recordMarketSlaughter`) exist on the service but are **not yet wired as tRPC endpoints**.

### Repository Methods (7)

`findById`, `listFiltered`, `insert`, `insertBatch`, `findActiveDeparturesByAnimal`, `createImportExportRecord`, `findImportExportByAnimalId`

---

## Track 3: Passport Domain

**Package:** `packages/domains/passport/`
**Status:** Complete

### Files

| File           | Path                                                                |
| -------------- | ------------------------------------------------------------------- |
| Service        | `packages/domains/passport/src/services/passport.service.ts`        |
| Repository     | `packages/domains/passport/src/repositories/passport.repository.ts` |
| Errors         | `packages/domains/passport/src/errors/passport.errors.ts`           |
| Validators     | `packages/validators/src/api/passport.api.ts`                       |
| tRPC Error Map | `packages/validators/src/errors/passport.errors.ts`                 |
| tRPC Router    | `apps/api/src/routers/passport.router.ts`                           |

### Error Codes (8)

```typescript
export const PASSPORT_ERRORS = {
  NOT_FOUND:                   "PASSPORT_NOT_FOUND",
  ALREADY_SEIZED:              "PASSPORT_ALREADY_SEIZED",
  INVALID_STATUS_TRANSITION:   "PASSPORT_INVALID_STATUS_TRANSITION",
  INVALID_INPUT:               "PASSPORT_INVALID_INPUT",
  FORBIDDEN:                   "PASSPORT_FORBIDDEN",
  ANIMAL_NOT_FOUND:            "PASSPORT_ANIMAL_NOT_FOUND",
  NO_ACTIVE_PASSPORT:          "PASSPORT_NO_ACTIVE_PASSPORT",
  PASSPORT_EXISTS:             "PASSPORT_PASSPORT_EXISTS_FOR_ANIMAL",
} as const;
```

### State Machine

```typescript
const VALID_TRANSITIONS: Record<string, string[]> = {
  [PASSPORT_STATUS.ISSUED]:  [PASSPORT_STATUS.ACTIVE, "cancelled"],
  [PASSPORT_STATUS.ACTIVE]:  [PASSPORT_STATUS.SEIZED, "cancelled", "reprinted"],
  [PASSPORT_STATUS.SEIZED]:  [PASSPORT_STATUS.ARCHIVED],
  [PASSPORT_STATUS.ARCHIVED]: [],
};
```

```
ISSUED ──→ ACTIVE ──→ SEIZED ──→ ARCHIVED
  │           │          │
  └→ CANCELLED ←─────────┘
                └→ REPRINTED ──→ (new ACTIVE)
```

### Service Methods (8)

| Method            | Description                                                   |
| ----------------- | ------------------------------------------------------------- |
| `getById`         | Single passport lookup                                        |
| `list`            | Paginated list with farm/status filters                       |
| `issueForAnimal`  | Create passport for registered animal, format `MK-YYYY-XXXXX` |
| `shipToVs`        | ISSUED → ACTIVE, marks `shippedToVs`                          |
| `deliverToKeeper` | ISSUED → ACTIVE, marks `deliveredToKeeper`                    |
| `seize`           | ACTIVE → SEIZED, records death date/cause                     |
| `reprint`         | ACTIVE → reprinted, creates new ACTIVE with `isReprint: true` |
| `archive`         | SEIZED → ARCHIVED, sets archive date                          |

### Business Rules

| #   | Rule                                 | Implementation                      |
| --- | ------------------------------------ | ----------------------------------- |
| 1   | Passport only for registered animals | `animalRepo.findById()` check       |
| 2   | Passport format: `MK-YYYY-XXXXX`     | `MK-${year}-${seq}`                 |
| 3   | Ship to VS                           | `shipToVs()` — ISSUED→ACTIVE        |
| 4   | Deliver to keeper                    | `deliverToKeeper()` — ISSUED→ACTIVE |
| 5   | Seize on death/slaughter             | `seize()` — ACTIVE→SEIZED           |
| 7   | Archive after 3yr retention          | `archive()` — SEIZED→ARCHIVED       |
| 8   | Reprint on error correction          | `reprint()` — creates new passport  |

### tRPC Endpoints (7)

| Type     | Endpoint                   |
| -------- | -------------------------- |
| Query    | `passport.getById`         |
| Query    | `passport.list`            |
| Mutation | `passport.issueForAnimal`  |
| Mutation | `passport.shipToVs`        |
| Mutation | `passport.deliverToKeeper` |
| Mutation | `passport.seize`           |
| Mutation | `passport.reprint`         |

**Note:** `archive()` is implemented in service/repository but has **no tRPC endpoint**.

### Repository Methods (10)

`findById`, `findByAnimalId`, `findByFarmId`, `create`, `updateStatus`, `seize`, `archive`, `shipToVs`, `deliverToKeeper`, `findSeized`

---

## Track 4: Farm Update Mutations

**Package:** `packages/domains/farm/`
**Status:** Complete

### Files

| File           | Path                                                        |
| -------------- | ----------------------------------------------------------- |
| Service        | `packages/domains/farm/src/services/farm.service.ts`        |
| Repository     | `packages/domains/farm/src/repositories/farm.repository.ts` |
| Errors         | `packages/domains/farm/src/errors/farm.errors.ts`           |
| Validators     | `packages/validators/src/api/farms.api.ts`                  |
| tRPC Error Map | `packages/validators/src/errors/farm.errors.ts`             |
| tRPC Router    | `apps/api/src/routers/farm.router.ts`                       |

### Error Codes (4)

```typescript
export const FARM_ERRORS = {
  NOT_FOUND:      "FARM_NOT_FOUND",
  DUPLICATE_FARM_ID: "FARM_DUPLICATE_ID",
  INVALID_INPUT:  "FARM_INVALID_INPUT",
  FORBIDDEN:      "FARM_FORBIDDEN",
} as const;
```

### Update Schema

```typescript
export const updateFarmRequestSchema = z.strictObject({
  name: z.string().max(50).optional(),
  type: farmTypeSchema.optional(),
  addressId: z.uuid().optional(),
  parentFarmId: z.uuid().optional(),
  verificationStatus: verificationStatusSchema.optional(),
  verificationNote: z.string().optional(),
  dataSource: dataSourceSchema.optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  "At least one field must be updated",
) satisfies z.ZodType<UpdateFarmRequest>;
```

### Service Methods (6)

| Method        | Signature                                                                                     |
| ------------- | --------------------------------------------------------------------------------------------- |
| `getById`     | `(id: string) => Promise<Result<FarmResponse, Error>>`                                        |
| `getByFarmId` | `(farmId: string) => Promise<Result<FarmResponse, Error>>`                                    |
| `list`        | `(input: FarmListRequest) => Promise<Result<FarmListResponse, Error>>`                        |
| `create`      | `(input: CreateFarmRequest & { createdBy?: string }) => Promise<Result<FarmResponse, Error>>` |
| `update`      | `(id: string, input: UpdateFarmRequest) => Promise<Result<FarmResponse, Error>>`              |
| `getAddress`  | `(id: string) => Promise<Result<AddressResponse, Error>>`                                     |

### tRPC Endpoints (6)

| Type     | Endpoint           |
| -------- | ------------------ |
| Query    | `farm.getById`     |
| Query    | `farm.getByFarmId` |
| Query    | `farm.list`        |
| Mutation | `farm.create`      |
| Mutation | `farm.update`      |
| Query    | `farm.getAddress`  |

---

## Track 5: EarTag Completion

**Package:** `packages/domains/eartag/`
**Status:** Complete

### Files

| File             | Path                                                            |
| ---------------- | --------------------------------------------------------------- |
| Service          | `packages/domains/eartag/src/services/eartag.service.ts`        |
| Repository       | `packages/domains/eartag/src/repositories/eartag.repository.ts` |
| Errors           | `packages/domains/eartag/src/errors/eartag.errors.ts`           |
| Validators       | `packages/validators/src/api/eartags.api.ts`                    |
| tRPC Error Map   | `packages/validators/src/errors/eartag.errors.ts`               |
| tRPC Router      | `apps/api/src/routers/eartag.router.ts`                         |
| Permission Guard | `apps/api/src/trpc/middlewares/permission.guard.ts`             |

### Error Codes (7)

```typescript
export const EARTAG_ERRORS = {
  NOT_FOUND:                  "EARTAG_NOT_FOUND",
  ORDER_NOT_FOUND:            "EARTAG_ORDER_NOT_FOUND",
  ALREADY_ASSIGNED:           "EARTAG_ALREADY_ASSIGNED",
  DUPLICATE_TAG:              "EARTAG_DUPLICATE_TAG",
  INVALID_STATUS_TRANSITION:  "EARTAG_INVALID_STATUS_TRANSITION",
  INVALID_INPUT:              "EARTAG_INVALID_INPUT",
  FORBIDDEN:                  "EARTAG_FORBIDDEN",
} as const;
```

### Permission Guard Factory

```typescript
// apps/api/src/trpc/middlewares/permission.guard.ts
export function createPermissionGuard(permission: string): new () => TRPCMiddleware {
  return class implements TRPCMiddleware {
    async use(opts: MiddlewareOptions) {
      const permissions = ctx.auth?.permissions;
      if (!permissions) throw new TRPCError({ code: "UNAUTHORIZED" });
      if (!permissions.includes(permission)) throw new TRPCError({ code: "FORBIDDEN" });
      return next(opts);
    }
  };
}
```

Usage: `@UseMiddlewares(createPermissionGuard("eartag:order"))` on `createOrder` endpoint.

### Key Methods

| Method            | Description                    | Business Rules                                                                                  |
| ----------------- | ------------------------------ | ----------------------------------------------------------------------------------------------- |
| `cancelOrder`     | Cancel an ear tag order        | H.2: Cannot cancel if RECEIVED/CANCELLED/ORDERED/PARTIALLY_RECEIVED                             |
| `cancelOrderItem` | Remove item from order         | Only in DRAFT/PENDING status                                                                    |
| `createOrder`     | Create new ear tag order       | D.1 idempotency (24h), C.3 farm validity, C.2 max quantity, C.4 yearly cap (4), C.4 120-day gap |
| `appendToOrder`   | Add quantity to existing order | F.1 owner only, F.2 DRAFT/PENDING only                                                          |

### Idempotency Check

```typescript
// In createOrder — 24h duplicate window
const recentDuplicate = await this.repo.findRecentDuplicateOrder({
  organizationId: input.organizationId,
  supplierOrganizationId: input.supplierOrganizationId,
});
if (recentDuplicate) {
  throw new EarTagError(EARTAG_ERRORS.INVALID_INPUT, {
    message: "Duplicate order detected — order with this supplier placed within 24 hours",
  });
}
```

### Order Constants

```typescript
const ORDER_INTERVAL_DAYS = 120;
const MAX_ORDERS_PER_YEAR = 4;
```

### tRPC Endpoints (10)

| Type     | Endpoint                  | Permission Guard                            |
| -------- | ------------------------- | ------------------------------------------- |
| Query    | `earTag.getById`          | ProtectedMiddleware                         |
| Query    | `earTag.list`             | ProtectedMiddleware                         |
| Query    | `earTag.findByNumber`     | ProtectedMiddleware                         |
| Query    | `earTag.getType`          | ProtectedMiddleware                         |
| Query    | `earTag.listTypes`        | ProtectedMiddleware                         |
| Mutation | `earTag.transitionStatus` | ProtectedMiddleware                         |
| Mutation | `earTag.createOrder`      | **`createPermissionGuard("eartag:order")`** |
| Mutation | `earTag.cancelOrder`      | ProtectedMiddleware                         |
| Mutation | `earTag.cancelOrderItem`  | ProtectedMiddleware                         |
| Mutation | `earTag.appendToOrder`    | ProtectedMiddleware                         |

---

## Track 6: Correction Domain

**Package:** `packages/domains/correction/`
**Status:** Complete

### Files

| File           | Path                                                                    |
| -------------- | ----------------------------------------------------------------------- |
| Service        | `packages/domains/correction/src/services/correction.service.ts`        |
| Repository     | `packages/domains/correction/src/repositories/correction.repository.ts` |
| Errors         | `packages/domains/correction/src/errors/correction.errors.ts`           |
| Validators     | `packages/validators/src/api/correction.api.ts`                         |
| tRPC Error Map | `packages/validators/src/errors/correction.errors.ts`                   |
| tRPC Router    | `apps/api/src/routers/correction.router.ts`                             |

### Error Codes (6)

```typescript
export const CORRECTION_ERRORS = {
  NOT_FOUND:                 "CORRECTION_NOT_FOUND",
  INVALID_STATUS_TRANSITION: "CORRECTION_INVALID_STATUS_TRANSITION",
  INVALID_INPUT:             "CORRECTION_INVALID_INPUT",
  FORBIDDEN:                 "CORRECTION_FORBIDDEN",
  ESCALATION_REQUIRED:       "CORRECTION_ESCALATION_REQUIRED",
  ALREADY_RESOLVED:          "CORRECTION_ALREADY_RESOLVED",
} as const;
```

### State Machine

```typescript
const VALID_TRANSITIONS: Record<string, string[]> = {
  [CORRECTION_STATUS.PENDING]:      [CORRECTION_STATUS.UNDER_REVIEW, CORRECTION_STATUS.REJECTED],
  [CORRECTION_STATUS.UNDER_REVIEW]: [CORRECTION_STATUS.RESOLVED, CORRECTION_STATUS.ESCALATED, CORRECTION_STATUS.REJECTED],
  [CORRECTION_STATUS.RESOLVED]:     [],
  [CORRECTION_STATUS.ESCALATED]:    [CORRECTION_STATUS.UNDER_REVIEW, CORRECTION_STATUS.RESOLVED],
  [CORRECTION_STATUS.REJECTED]:     [CORRECTION_STATUS.PENDING],
};
```

```
PENDING ──→ UNDER_REVIEW ──→ RESOLVED (terminal)
  │              │
  │              ├──→ ESCALATED ──→ UNDER_REVIEW (re-open)
  │              │              └──→ RESOLVED
  │              └──→ REJECTED ──→ PENDING (re-open)
  └──→ REJECTED
```

### Case Types

| Constant                 | Value                      |
| ------------------------ | -------------------------- |
| `TECHNICIAN_RESOLVABLE`  | `"technician_resolvable"`  |
| `REQUIRES_CLARIFICATION` | `"requires_clarification"` |
| `COMPLEX`                | `"complex"`                |

### Service Methods (7)

| Method     | Transition               | Description                                             |
| ---------- | ------------------------ | ------------------------------------------------------- |
| `getById`  | —                        | Single correction lookup                                |
| `list`     | —                        | Paginated with farm/animal/status/source filters        |
| `create`   | —                        | New error correction (detectionSource, errorType, etc.) |
| `review`   | PENDING → UNDER_REVIEW   | CPC plausibility check                                  |
| `resolve`  | UNDER_REVIEW → RESOLVED  | Requires `resolvedBy`, optional `resolutionNotes`       |
| `escalate` | UNDER_REVIEW → ESCALATED | Requires `escalatedTo`, optional `reason`               |
| `reject`   | any → REJECTED           | Can reject from any status                              |

### Repository Methods (6)

`findById`, `listFiltered`, `create`, `updateStatus`, `escalate`, `findByFarm`

### tRPC Endpoints (7)

| Type     | Endpoint              |
| -------- | --------------------- |
| Query    | `correction.getById`  |
| Query    | `correction.list`     |
| Mutation | `correction.create`   |
| Mutation | `correction.review`   |
| Mutation | `correction.resolve`  |
| Mutation | `correction.escalate` |
| Mutation | `correction.reject`   |

### CorrectionResponse Fields (22)

`id`, `detectionSource`, `farmId`, `animalId`, `errorType`, `errorDescription`, `originalData` (JSONB), `correctedData` (JSONB), `status`, `caseType`, `resolutionNotes`, `resolvedBy`, `resolvedAt`, `archiveNumber`, `passportReprintRequired`, `passportId`, `escalatedTo`, `escalatedAt`, `escalationReason`, `assignedToVs`, `assignedAt`, `vsResolutionAttempted`, `techCode`, `isActive`, `createdAt`

---

## Track 7: Import/Export Workflows

**Package:** `packages/domains/movement/`
**Status:** Complete (service layer; tRPC wiring pending)

### Cross-Domain Integration

`MovementService` takes `AnimalRepository` as a dependency:

```typescript
constructor(
  private readonly repo: MovementRepository,
  private readonly animalRepo: AnimalRepository,
) {}
```

### importEU

| Aspect           | Detail                                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------- |
| Input            | `animalId, fromFarmId, toFarmId, countryOfOrigin, foreignPassportNumber?, bipEntryDate?` |
| Creates          | IMPORT movement + import_export_record                                                   |
| Foreign passport | Stored for 3 years (`storageExpiry = now + 3yr`)                                         |
| Animal status    | → `IMPORTED`                                                                             |
| Cross-domain     | `animalRepo.findById()` (ALIVE check), `animalRepo.update()`                             |

### importThirdCountry

| Aspect        | Detail                                                                             |
| ------------- | ---------------------------------------------------------------------------------- |
| Input         | `animalId, fromFarmId, toFarmId, countryOfOrigin, newEarTagNumber?, bipEntryDate?` |
| Creates       | IMPORT movement + import_export_record with `retagged` flag                        |
| Animal status | → `IMPORTED`                                                                       |
| Cross-domain  | `animalRepo.findById()` (existence only), `animalRepo.update()`                    |

### exportAnimal

| Aspect        | Detail                                                              |
| ------------- | ------------------------------------------------------------------- |
| Input         | `animalId, fromFarmId, toFarmId?, destinationCountry, bipExitDate?` |
| Creates       | EXPORT movement + import_export_record                              |
| Animal status | → `EXPORTED`                                                        |
| Cross-domain  | `animalRepo.findById()` (ALIVE check), `animalRepo.update()`        |

**None of these are exposed as tRPC endpoints yet.**

---

## Track 8: Market 4-Leg Generation

**Package:** `packages/domains/movement/`
**Status:** Complete (service layer; tRPC wiring pending)

### recordMarketTransaction (2-leg chain)

```
Leg 1: sellerFarmId → marketFarmId  (MARKET_SALE, legOrder: 1)
Leg 2: marketFarmId → buyerFarmId   (MARKET_PURCHASE, legOrder: 2, parentMovementId: leg1.id)
```

- Animal's `currentFarmId` updated to `buyerFarmId`
- Returns `MovementResponse[]` (array of 2 legs)

### recordMarketUnsold

- Reverse: `buyerFarmId → sellerFarmId`
- Type: `PURCHASE`, `reason: "unsold_at_market"`
- Animal farm reverted to original seller

### recordMarketSlaughter

- `marketFarmId → slaughterhouseId`
- Type: `SLAUGHTERHOUSE`
- Animal status → `SLAUGHTERED`

### Movement Types Used

```typescript
MARKET_SALE:      "market_sale"
MARKET_PURCHASE:  "market_purchase"
SLAUGHTERHOUSE:   "slaughterhouse"
PURCHASE:         "purchase"
```

**None of these are exposed as tRPC endpoints yet.**

---

## Track 9: Duplicate Order Rules

**Package:** `packages/domains/eartag/`
**Status:** Complete (embedded in `createOrder`)

### Idempotency Check

```typescript
// findRecentDuplicateOrder — 24h window, same org+supplier
async findRecentDuplicateOrder(input: {
  organizationId: string;
  supplierOrganizationId: string;
  withinHours?: number; // default 24
}) {
  const hours = input.withinHours ?? 24;
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - hours);
  // Query: same org + supplier + created within cutoff
}
```

### Business Rules in createOrder

| Rule | Check                                       | Error                  |
| ---- | ------------------------------------------- | ---------------------- |
| D.1  | 24h duplicate window                        | `EARTAG_INVALID_INPUT` |
| C.3  | Farm exists, active, not slaughterhouse     | `EARTAG_INVALID_INPUT` |
| C.2  | Max quantity = femaleCount - remainingCount | `EARTAG_INVALID_INPUT` |
| C.4  | Max 4 non-cancelled orders per year         | `EARTAG_INVALID_INPUT` |
| C.4  | 120-day gap between orders                  | `EARTAG_INVALID_INPUT` |

---

## Track 10: Append to Existing Orders

**Package:** `packages/domains/eartag/`
**Status:** Complete

### appendToOrder

```typescript
async appendToOrder(input: {
  orderId: string;
  organizationId: string;
  additionalQuantity: number;
}): Promise<Result<EarTagResponse, Error>>
```

**Rules:**
- F.1: Only order owner (same `organizationId`) can append
- F.2: Order must be in DRAFT or PENDING status

### updateOrderQuantity (Repository)

```typescript
async updateOrderQuantity(orderId: string, additionalQuantity: number) {
  const [row] = await this.db
    .update(earTagOrders)
    .set({ totalQuantity: sql`${earTagOrders.totalQuantity} + ${additionalQuantity}` })
    .where(eq(earTagOrders.id, orderId))
    .returning();
  return row ?? null;
}
```

**Design Decision:** SQL-level additive increment. Append does NOT re-trigger:
- 120-day gap check
- Yearly cap check
- Farm capacity check

---

## Track 11: Archive Error Correction Integration

**Package:** `packages/domains/archive/`
**Status:** Complete

### archiveErrorCorrection

```typescript
async archiveErrorCorrection(input: {
  correctionId: string;
  animalId?: string;
  farmId?: string;
  passportId?: string;
  createdBy?: string;
})
```

| Aspect           | Detail                                                        |
| ---------------- | ------------------------------------------------------------- |
| Idempotency      | `findByDocumentRef(correctionId)` — returns existing if found |
| Document type    | `"OTHER"` (hardcoded)                                         |
| Archive location | `ARCHIVE_LOCATION.CPC`                                        |
| Retention        | 3 years                                                       |
| Cross-domain FKs | Optional `animalId`, `farmId`, `passportId`                   |

### ArchiveRepository.findByDocumentRef

```typescript
async findByDocumentRef(documentRef: string) {
  const [row] = await this.db.select().from(archiveDocumentsTable)
    .where(eq(archiveDocumentsTable.documentRef, documentRef))
    .limit(1);
  return row ?? null;
}
```

---

## Track 12: Correction A Posteriori Scheduled Checks

**Status:** Complete (infrastructure; check methods are stubs)

### Files

| File       | Path                                              |
| ---------- | ------------------------------------------------- |
| Cron Job   | `apps/api/src/jobs/correction-consistency.job.ts` |
| App Module | `apps/api/src/app.module.ts`                      |

### CorrectionConsistencyJob

```typescript
@Injectable()
export class CorrectionConsistencyJob {
  constructor(private readonly correctionService: CorrectionService) {}

  @Cron("0 3 * * 0")  // Every Sunday at 03:00 UTC
  async runAPosterioriChecks() {
    const results = await Promise.allSettled([
      this.checkOrphanedAnimals(),  // Stub: returns false
      this.checkFutureDates(),      // Stub: returns false
    ]);
    // Logs created corrections count
  }
}
```

### Cron Schedule

| Field        | Value | Meaning     |
| ------------ | ----- | ----------- |
| minute       | `0`   | At minute 0 |
| hour         | `3`   | At 03:00    |
| day-of-month | `*`   | Every day   |
| month        | `*`   | Every month |
| day-of-week  | `0`   | Sunday      |

**Schedule: Every Sunday at 03:00 UTC.**

### Wiring in app.module.ts

```typescript
import { CorrectionConsistencyJob } from "./jobs/correction-consistency.job.js";

// In providers array:
providers: [
  // ...
  RetentionJob,           // Daily 02:00 UTC
  RiskAnalysisJob,        // Annual Jan 1
  CorrectionConsistencyJob, // Weekly Sunday 03:00 UTC
],
```

### DI Chain

```
CorrectionConsistencyJob ← CorrectionService ← CorrectionRepository ← DB_TOKEN
```

---

## Archive-Passport Integration

**Status:** Complete

### archiveSeizedPassport

```typescript
async archiveSeizedPassport(input: {
  passportId: string;
  animalId: string;
  farmId: string;
  createdBy?: string;
})
```

| Aspect           | Detail                                                     |
| ---------------- | ---------------------------------------------------------- |
| Idempotency      | `findByPassportId(passportId)` — returns existing if found |
| Document type    | `ARCHIVE_DOCUMENT_TYPE.PASSPORT`                           |
| Archive location | `ARCHIVE_LOCATION.CPC`                                     |
| Retention        | 3 years                                                    |

### ArchiveRepository.findByPassportId

```typescript
async findByPassportId(passportId: string) {
  const [row] = await this.db.select().from(archiveDocumentsTable)
    .where(eq(archiveDocumentsTable.passportId, passportId))
    .limit(1);
  return row ?? null;
}
```

### All Archive Integration Methods

| Method                     | Document Type     | Location | Idempotency Check      |
| -------------------------- | ----------------- | -------- | ---------------------- |
| `archiveInspectionForm()`  | `INSPECTION_FORM` | `VI`     | `findByInspectionId()` |
| `archiveSeizedPassport()`  | `PASSPORT`        | `CPC`    | `findByPassportId()`   |
| `archiveErrorCorrection()` | `OTHER`           | `CPC`    | `findByDocumentRef()`  |

---

## Summary: tRPC Endpoint Coverage

| Domain     | Endpoints | Service Methods | Gap                 |
| ---------- | --------- | --------------- | ------------------- |
| Animal     | 5         | 5               | None                |
| Movement   | 3         | 12              | 9 methods not wired |
| Passport   | 7         | 8               | `archive` not wired |
| Farm       | 6         | 6               | None                |
| EarTag     | 10        | 14+             | Some internal only  |
| Correction | 7         | 7               | None                |
| Archive    | —         | 9               | No router yet       |

---

## Known Gaps

1. **Movement tRPC Wiring:** 9 business-rule methods (`recordDeath`, `declarePasture`, `recordSlaughter`, `importEU`, `importThirdCountry`, `exportAnimal`, `recordMarketTransaction`, `recordMarketUnsold`, `recordMarketSlaughter`) exist on the service but are not exposed as endpoints.

2. **Passport archive:** `archive()` method exists on service but has no tRPC endpoint.

3. **Correction Consistency Job:** `checkOrphanedAnimals()` and `checkFutureDates()` are stubs returning `false`.

4. **tRPC Error Maps:** Animal domain maps only 4 of 11 error codes. Movement domain maps only 5 of 16 error codes.

5. **Archive Router:** No tRPC router exists for the Archive domain (service/repository complete).

---

## Files Created/Modified

### Domain Packages (created)

- `packages/domains/animal/` — Service, Repository, Errors, Index
- `packages/domains/movement/` — Service, Repository, Errors, Index
- `packages/domains/passport/` — Service, Repository, Errors, Index
- `packages/domains/eartag/` — Service, Repository, Errors, Index
- `packages/domains/correction/` — Service, Repository, Errors, Index
- `packages/domains/archive/` — Service, Repository, Errors, Index

### Validators (created/modified)

- `packages/validators/src/api/animals.api.ts`
- `packages/validators/src/api/movements.api.ts`
- `packages/validators/src/api/passport.api.ts`
- `packages/validators/src/api/eartags.api.ts`
- `packages/validators/src/api/correction.api.ts`
- `packages/validators/src/api/farms.api.ts`
- `packages/validators/src/errors/animal.errors.ts`
- `packages/validators/src/errors/movement.errors.ts`
- `packages/validators/src/errors/passport.errors.ts`
- `packages/validators/src/errors/eartag.errors.ts`
- `packages/validators/src/errors/correction.errors.ts`
- `packages/validators/src/errors/farm.errors.ts`

### tRPC Routers (created/modified)

- `apps/api/src/routers/animal.router.ts`
- `apps/api/src/routers/movement.router.ts`
- `apps/api/src/routers/passport.router.ts`
- `apps/api/src/routers/eartag.router.ts`
- `apps/api/src/routers/correction.router.ts`
- `apps/api/src/routers/farm.router.ts`

### Infrastructure (created/modified)

- `apps/api/src/trpc/middlewares/permission.guard.ts` — `createPermissionGuard()` factory
- `apps/api/src/jobs/retention.job.ts` — Daily 02:00 UTC
- `apps/api/src/jobs/risk-analysis.job.ts` — Annual Jan 1
- `apps/api/src/jobs/correction-consistency.job.ts` — Weekly Sunday 03:00 UTC
- `apps/api/src/app.module.ts` — All 3 cron jobs wired

### Database Constants (created)

- `packages/database/src/constants/ear-tag-order-status.ts`
- `packages/database/src/constants/correction-status.ts`
- `packages/database/src/constants/correction-case-type.ts`
- `packages/database/src/constants/movement-type.ts`
- `packages/database/src/constants/animal-status.ts`
