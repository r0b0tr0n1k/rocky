# Movement Domain Service

**Scope:** `packages/domains/movement/` — service, repository, errors
**Source spec:** `docs/old/workflow.md` §Instances 12-16, 19-21
**Last verified:** 2026-07-05 — AGENTS.md aligned to actual code

## Overview

Handles all animal movements: departures, arrivals, deaths, slaughter, market transactions, pasture, import/export. The Movement domain imports `AnimalRepository` from `packages/domains/animal/` for cross-table checks.

## Workflow Instances Covered

| Instance | Description                  | Status                                                                           |
| -------- | ---------------------------- | -------------------------------------------------------------------------------- |
| 12       | Movements/Death by PDA       | ✅ `recordDeath()` with stillborn detection, status update                        |
| 13       | Movements/Death by Postcards | ✅ No longer relevant — all data entry is mobile-only (2026-07-05)                 |
| 14       | Slaughter at Slaughterhouse  | ✅ `recordSlaughter()` with min-age check + arrival correction                    |
| 15       | Livestock Markets/Fairs      | ✅ `recordMarketTransaction()` with 2-leg chain (seller→market→buyer)             |
| 16       | Alpine Grazing Areas         | ✅ `declareAlpine()` (batch) + `returnFromAlpine()` (single), C.4 invalidation    |
| 19       | Import from EU Countries     | ✅ `importEU()` with passport creation, foreign passport storage for 3 years      |
| 20       | Import from 3rd Countries    | ✅ `importThirdCountry()` with re-tagging + new animal record creation            |
| 21       | Export of Animals            | ✅ `exportAnimal()` with destination country tracking                             |

## Service Methods

`packages/domains/movement/src/services/movement.service.ts` — 14 methods:

| Method                           | Purpose                                           | Status |
| -------------------------------- | ------------------------------------------------- | ------ |
| `getById(id)`                    | Fetch single movement                             | ✅      |
| `listByAnimal(input)`            | List movements for an animal                      | ✅      |
| `create(input)`                  | Create a movement (arrival/departure)             | ✅      |
| `recordDeath(input)`             | Death scenario decision tree (5 scenarios)        | ✅      |
| `declarePasture(input)`          | Pasture departure declaration                     | ✅      |
| `declareAlpine(input)`           | Alpine departure declaration (batch)              | ✅      |
| `returnFromAlpine(input)`        | Alpine return movement (single)                   | ✅      |
| `recordSlaughter(input)`         | Slaughter with min-age + arrival correction       | ✅      |
| `recordMarketTransaction(input)` | Market: seller→market→buyer 2-leg chain           | ✅      |
| `recordMarketUnsold(input)`      | Reverse movement for unsold animals               | ✅      |
| `recordMarketSlaughter(input)`   | Market→slaughterhouse movement                    | ✅      |
| `importEU(input)`                | EU import (keeps ID, stores foreign passport 3yr) | ✅      |
| `importThirdCountry(input)`      | 3rd country import (re-tag, re-register)          | ✅      |
| `exportAnimal(input)`            | Export (BIP enters data, destination country)     | ✅      |

## Business Rules

### Death Scenarios (Rule Group B)

| #   | Rule                                                  | Status                                                                                                          |
| --- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| B.1 | Death scenario decision tree (5 scenarios)            | ✅ `recordDeath()` — validates alive, applies stillborn threshold, creates death movement, updates animal status |
| B.2 | Stillborn threshold: deathDate - birthDate <= 25 days | ✅ `recordDeath()` — auto-detects stillborn if age <= 25 days                                                    |

### Pasture Movements (Rule Group C)

| #   | Rule                                                         | Status                                                       |
| --- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| C.1 | Only animals currently at home farm can be added to pasture  | ✅ `declarePasture()` — checks `currentFarmId === fromFarmId` |
| C.2 | Animals cannot auto-transfer between pastures                | ✅ Enforced by departure/return movement pattern              |
| C.3 | Pasture cannot be used as departure farm                     | ✅ `declarePasture()` — checks `fromFarmType !== PASTURE_MOUNTAIN/PASTURE_VILLAGE` |
| C.4 | Unexpected movement invalidates pending pasture declarations | ✅ `invalidatePastureIfNeeded()` called in all non-pasture movements (death, slaughter, market, export, create) |

### Slaughter (Rule Group D)

| #   | Rule                                               | Status                                                                                                                |
| --- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| D.1 | Minimum age 25 days                                | ✅ `recordSlaughter()` — `ageDays >= slaughterMinAgeDays`                                                              |
| D.2 | Farm restrictions (single-farm orgs)               | 🔲 Comment says "Enforced via RLS"                                                                                     |
| D.3 | Arrival correction: >2 days adjusts departure date | ✅ `recordSlaughter()` — adjusts movementDate if diff > 2 days (note: corrects when diff EXCEEDS 2, not "within +/-2") |

### Arrival (Rule Group E)

| #   | Rule                                          | Status                                                                                            |
| --- | --------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| E.1 | Unregistered departure farm → use `100000014` | ✅ `create()` — substitutes placeholder when fromFarmId null (conditional on PURCHASE/IMPORT type) |
| E.2 | Unregistered arrival farm → use `100000027`   | ✅ `create()` — substitutes placeholder when toFarmId null                                         |
| E.3 | Single-farm orgs restricted to their farm ID  | 🔲 Comment says "Enforced via RLS"                                                                 |

### Market Movements (Instance 15)

| #   | Rule                                                    | Status                                                                                   |
| --- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| M.1 | 2-leg automatic movement generation                     | ✅ `recordMarketTransaction()` — creates 2-leg chain with `parentMovementId` + `legOrder` |
| M.2 | Off-farm seller → On-holding market → On-farm purchaser | ✅ `recordMarketTransaction()` — leg1=MARKET_SALE, leg2=MARKET_PURCHASE                   |
| M.3 | Unsold animal fallback (purchaser acts as seller)       | ✅ `recordMarketUnsold()` — reverse movement buyer→seller                                 |
| M.4 | Home slaughter status on market off-movement            | ✅ `recordMarketSlaughter()` — market→slaughterhouse(SLAUGHTERHOUSE), status→SLAUGHTERED  |

### Import/Export (Instances 19-21)

| #    | Rule                                                             | Status    | Note                                                                                                           |
| ---- | ---------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------- |
| IE.1 | EU import: original ID unchanged, new national passport printed  | ✅ | `importEU()` — keeps animal ID, creates IMPORT movement + record, creates national passport via `PassportService.issueForAnimal()` |
| IE.2 | EU import: foreign passport stored 3 years                       | ✅ | `foreignPassportStored=true`, `storageExpiry=now+3yr`                                                          |
| IE.3 | 3rd country import: re-tag with national ear tag                 | ✅ | `importThirdCountry()` — `retagged=true`, `newEarTagNumber`                                                    |
| IE.4 | 3rd country import: full re-registration as new animal           | ✅ | `importThirdCountry()` — creates new animal record via `AnimalRepository.insert()`, movement + record reference new animal ID |
| IE.5 | Export: BIP enters animal data, indicates country of destination | ✅ | `exportAnimal()` — EXPORT movement + record, status→EXPORTED                                                   |

## ⚠️ Schema Cleanup

`slaughter_records` table was **removed** 2026-07-05 (legacy Oracle artifact — slaughter data is tracked via `animals.status` + `movements` table).

## Architecture

```
MovementRouter (tRPC, 12 endpoints) → MovementService → MovementRepository (DB)
                                              ↑
                                     AnimalRepository (cross-domain)
```

All slaughter, pasture, market, and import/export logic lives in the single `MovementRouter` and `MovementService` — no dedicated sub-routers.

## Error Codes (`movement.errors.ts`)

| Code (key)            | String Value                         | When                                    |
| --------------------- | ------------------------------------ | --------------------------------------- |
| `NOT_FOUND`           | `MOVEMENT_NOT_FOUND`                 | Movement not found                      |
| `SAME_FARM`           | `MOVEMENT_SAME_FARM_ERROR`           | Departure and arrival farm are the same |
| `ANIMAL_NOT_ALIVE`    | `MOVEMENT_ANIMAL_NOT_ALIVE`          | Animal is not alive                     |
| `ANIMAL_NOT_ON_FARM`  | `MOVEMENT_ANIMAL_NOT_ON_FARM`        | Animal not at departure farm            |
| `MIN_AGE_NOT_REACHED` | `MOVEMENT_SLAUGHTER_MIN_AGE`         | Animal too young for slaughter          |
| `INVALID_INPUT`       | `MOVEMENT_INVALID_INPUT`             | Validation failure                      |
| `FORBIDDEN`           | `MOVEMENT_FORBIDDEN`                 | Permission denied                       |
| —                     | `MOVEMENT_PASTURE_ANIMAL_NOT_HOME`   | Animal not at home farm for pasture     |
| —                     | `MOVEMENT_INVALID_DATES`             | Invalid date combination                |
| —                     | `MOVEMENT_DEATH_CAUSE_REQUIRED`      | Death cause missing                     |
| —                     | `MOVEMENT_STILLBORN_THRESHOLD`       | Stillborn threshold violation           |
| —                     | `MOVEMENT_PASTURE_AUTO_TRANSFER`     | Auto-transfer blocked                   |
| —                     | `MOVEMENT_PASTURE_INVALID_DEPARTURE` | Invalid pasture departure               |
| —                     | `MOVEMENT_UNREGISTERED_FARM`         | Farm not registered                     |
| —                     | `MOVEMENT_IMPORT_ALREADY_REGISTERED` | Animal already imported                 |
| —                     | `MOVEMENT_EXPORT_ANIMAL_NOT_FOUND`   | Animal not found for export             |

> **Note:** Error codes documented in older docs used bare names (e.g. `NOT_FOUND`). The actual codes all use `MOVEMENT_` prefix (e.g. `MOVEMENT_NOT_FOUND`). The `INVALID_STATUS_TRANSITION` code does NOT exist in this domain.

## Schema

- Table: `movements` (`packages/database/src/schema/an/movements.ts`)
- Table: `pastureDeclarations` (`packages/database/src/schema/an/pasture.ts`) — wired 2026-07-05
- Table: `importExportRecords` (`packages/database/src/schema/an/import-export-records.ts`)
- Type pgEnum: `movement_type` (15 values incl. SALE, PURCHASE, MARKET_SALE, MARKET_PURCHASE, etc.)
- Death cause pgEnum: `death_cause`

## tRPC Endpoints

`apps/api/src/routers/movement.router.ts` — 14 endpoints:

- Query: `getById`, `list`
- Mutation: `create`, `recordDeath`, `declarePasture`, `recordSlaughter`, `importEU`, `importThirdCountry`, `exportAnimal`, `recordMarketTransaction`, `recordMarketUnsold`, `recordMarketSlaughter`

## Remaining Work

1. **Rules D.2, E.3** — single-farm org restrictions (RLS-enforced)

## Context Boundaries

| Bot | Reads | Writes |
|-----|-------|--------|
| **Movement Bot** | `packages/domains/movement/` | errors, repo, service |
| **Animal Bot** | `packages/domains/animal/` | AnimalRepository for cross-domain checks |
| **Passport Bot** | `packages/domains/passport/` | PassportService for EU import passport creation |
| **Validation Bot** | `packages/validators/src/api/movements.api.ts` | Movement API schemas |
| **API Bot** | `apps/api/src/routers/movement.router.ts` | tRPC router |
| **PDF Bot** | `packages/pdf/` | `MovementTemplate` uses MovementRepository + AnimalRepository + FarmRepository |
