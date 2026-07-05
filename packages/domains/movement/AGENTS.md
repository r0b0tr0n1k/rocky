# Movement Domain Service

**Scope:** `packages/domains/movement/` — service, repository, errors
**Source spec:** `docs/old/workflow.md` §Instances 12-16, 19-21
**Status:** Business rules for death/pasture/slaughter/import/export implemented. Market 4-leg generation pending.

## Overview

Handles all animal movements: departures, arrivals, deaths, slaughter, market transactions, pasture, import/export.

## Workflow Instances Covered

| Instance | Description | Status |
|----------|-------------|--------|
| 12 | Movements/Death by PDA | ⚠️ Basic CRUD only |
| 13 | Movements/Death by Postcards | ⚠️ No source differentiator |
| 14 | Slaughter at Slaughterhouse | ❌ Schema only, no service |
| 15 | Livestock Markets/Fairs | ❌ No 4-leg generation |
| 16 | Alpine Grazing Areas | ❌ Schema only, no service |
| 19 | Import from EU Countries | ❌ No workflow |
| 20 | Import from 3rd Countries | ❌ No workflow |
| 21 | Export of Animals | ❌ No workflow |

## Business Rules

### Death Scenarios (Rule Group B)
| # | Rule | Status |
|---|------|--------|
| B.1 | Death scenario decision tree (5 scenarios) | ✅ `recordDeath()` — validates alive, applies stillborn threshold, creates death movement, updates animal status |
| B.2 | Stillborn threshold: deathDate - birthDate <= 25 days | ✅ `recordDeath()` — auto-detects stillborn if age ≤ 25 days |

### Pasture Movements (Rule Group C)
| # | Rule | Status |
|---|------|--------|
| C.1 | Only animals currently at home farm can be added to pasture | ✅ `declarePasture()` — checks `currentFarmId === fromFarmId` |
| C.2 | Animals cannot auto-transfer between pastures | ✅ Enforced by departure/return movement pattern |
| C.3 | Pasture cannot be used as departure farm | 🔲 Enforced by caller (farm type check) |
| C.4 | Unexpected movement invalidates pending pasture declarations | 🔲 Future implementation |

### Slaughter (Rule Group D)
| # | Rule | Status |
|---|------|--------|
| D.1 | Minimum age 25 days | ✅ `recordSlaughter()` — `ageDays >= slaughterMinAgeDays` |
| D.2 | Farm restrictions (single-farm orgs) | 🔲 Enforced via RLS |
| D.3 | Arrival correction: +/- 2 days auto-correct departure | ✅ `recordSlaughter()` — adjusts movementDate if arrival differs |

### Arrival (Rule Group E)
| # | Rule | Status |
|---|------|--------|
| E.1 | Unregistered departure farm → use `100000014` | ✅ `create()` — substitutes placeholder when fromFarmId null |
| E.2 | Unregistered arrival farm → use `100000027` | ✅ `create()` — substitutes placeholder when toFarmId null |
| E.3 | Single-farm orgs restricted to their farm ID | 🔲 Enforced via RLS

### Market Movements (Instance 15)
| # | Rule | Status |
|---|------|--------|
| M.1 | 4-leg automatic movement generation | ✅ `recordMarketTransaction()` — creates 2-leg chain with parentMovementId + legOrder |
| M.2 | Off-farm seller → On-holding market → Off-holding market → On-farm purchaser | ✅ `recordMarketTransaction()` — seller→market(MARKET_SALE) + market→buyer(MARKET_PURCHASE) |
| M.3 | Unsold animal fallback (purchaser acts as seller) | ✅ `recordMarketUnsold()` — reverse movement buyer→seller |
| M.4 | Home slaughter status on market off-movement | ✅ `recordMarketSlaughter()` — market→slaughterhouse(SLAUGHTERHOUSE), status→SLAUGHTERED |

### Import/Export (Instances 19-21)
| # | Rule | Status |
|---|------|--------|
| IE.1 | EU import: original ID unchanged, new national passport printed | ✅ `importEU()` — keeps animal ID, creates IMPORT movement + record |
| IE.2 | EU import: foreign passport stored 3 years | ✅ `importEU()` — foreignPassportStored=true, storageExpiry=now+3yr |
| IE.3 | 3rd country import: re-tag with national ear tag | ✅ `importThirdCountry()` — retagged=true, newEarTagNumber |
| IE.4 | 3rd country import: full re-registration as new animal | ✅ `importThirdCountry()` — creates import_export_record with re-tagging |
| IE.5 | Export: BIP enters animal data, indicates country of destination | ✅ `exportAnimal()` — creates EXPORT movement + record, status→EXPORTED |

## Architecture

```
Router (tRPC) → MovementService (validate + orchestrate) → MovementRepository (DB)
                     │
                     └── Returns Result<T, MovementError>
```

## Error Codes

| Code | When |
|------|------|
| `NOT_FOUND` | Movement not found |
| `SAME_FARM` | Departure and arrival farm are the same |
| `ANIMAL_NOT_ALIVE` | Animal is not alive |
| `ANIMAL_NOT_ON_FARM` | Animal not at departure farm |
| `MIN_AGE_NOT_REACHED` | Animal too young for slaughter |
| `INVALID_STATUS_TRANSITION` | Illegal state change |
| `INVALID_INPUT` | Validation failure |
| `FORBIDDEN` | Permission denied |

## Schema

- Table: `movements` (`packages/database/src/schema/an/movements.ts`)
- Table: `slaughterRecords` (`packages/database/src/schema/an/slaughter.ts`)
- Table: `pastureDeclarations` (`packages/database/src/schema/an/pasture.ts`)
- Table: `importExportRecords` (`packages/database/src/schema/an/import-export-records.ts`)
- Type pgEnum: `movement_type` (SALE, PURCHASE, MARKET_SALE, MARKET_PURCHASE, etc.)
- Death cause pgEnum: `death_cause`

## Implementation Priority

1. **Phase 1:** Death scenario decision tree + stillborn threshold ✅
2. **Phase 2:** Pasture movement rules (C.1-C.4) ✅ (C.3-C.4 deferred to RLS/caller)
3. **Phase 3:** Market 4-leg generation (M.1-M.4) ✅
4. **Phase 4:** Slaughter service + min age check ✅
5. **Phase 5:** Import/Export workflow orchestration ✅
