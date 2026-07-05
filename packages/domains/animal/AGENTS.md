# Animal Domain Service

**Scope:** `packages/domains/animal/` — service, repository, errors
**Source spec:** `docs/old/fs2.md` — Registration_MK (Registration and Movements)
**Last verified:** 2026-07-05 — AGENTS.md aligned to actual code

> ⚠️ **MovementService is NOT in this package.** It lives in `packages/domains/movement/`. The Animal domain exports `AnimalRepository` which MovementService imports for cross-table checks.

## Implementation Status

All schema tables exist (animals, ear_tags, movements, slaughter, pasture, birth notifications). Rule Group A (registration) fully implemented. Groups B/C/D/E/G substantially implemented via `MovementService`. Group F (error correction) lives in `packages/domains/correction/`.

### Rule Group A: Normal Registration Rules

| # | Rule | Status | Location |
|---|------|--------|----------|
| 1 | User must have privilege to register on the specified farm | ✅ RLS | `pgPolicy` on animals table |
| 2 | Registration date cannot be in the future | ✅ Zod | `animals.api.ts` birthDate validation (.refine() exists but NO satisfies/guillotine — see Diamond Seal note) |
| 3 | Only a valid + NEW ear tag can be used (not previously applied) | ✅ | `AnimalService.create()` — `findByTag()` check |
| 4a | Mother must be on the farm at time of birth | ✅ | `AnimalService.create()` — `currentFarmId` comparison |
| 4b | Mother must be alive at time of birth | ✅ | `AnimalService.create()` — `status === ALIVE` check |
| 4c | Mother must be >= 17 months old (system param) | ✅ | `AnimalService.create()` — `monthsBetween()` check |
| 4d | Calving gap >= CalvingPeriod (e.g. 120 days) | ✅ | `AnimalService.create()` — `findLastCalfByMother()` + gap check |
| 5 | Mother not male, father not female | ✅ | `AnimalService.create()` — parent sex validation |
| 6 | Birth date cannot be in the future | ✅ Zod | Already validated (same refinement as A.2) |

### Rule Group B: Death/Stillborn

| # | Rule | Status | Location |
|---|------|--------|----------|
| 1 | Death scenario decision tree (5 scenarios) | ✅ | `MovementService.recordDeath()` — validates alive, auto-detects stillborn, creates movement, updates status |
| 2 | Stillborn threshold: deathDate - birthDate <= 25 days (system param) | ✅ | `MovementService.recordDeath()` — `ageDays <= stillbornThresholdDays` (25) |

### Rule Group C: Pasture Movements

| # | Rule | Status | Location |
|---|------|--------|----------|
| 1 | Only animals currently at home farm can be added to pasture | ✅ | `MovementService.declarePasture()` — checks `currentFarmId === fromFarmId` |
| 2 | Animals cannot auto-transfer between pastures | ✅ | Enforced by departure/return movement pattern (no explicit guard, architecture enforces it) |
| 3 | Pasture cannot be used as departure farm | 🔲 | `declarePasture()` — comment says "Enforced by caller", no code-level check |
| 4 | Unexpected movement invalidates pending pasture declarations | 🔲 | Not implemented |

### Rule Group D: Slaughter

| # | Rule | Status | Location |
|---|------|--------|----------|
| 1 | Minimum age 25 days (system param) | ✅ | `MovementService.recordSlaughter()` — `ageDays < slaughterMinAgeDays` (25) |
| 2 | Farm restrictions (single-farm orgs limited) | 🔲 | Comment says "Enforced via RLS" |
| 3 | Arrival correction: >2 days auto-correct departure date | ✅ | `MovementService.recordSlaughter()` — adjusts movementDate if diff > 2 days |

### Rule Group E: Arrival

| # | Rule | Status | Location |
|---|------|--------|----------|
| 1 | Unregistered departure farm → use `100000014` | ✅ | `MovementService.create()` — conditional on PURCHASE/IMPORT type |
| 2 | Unregistered arrival farm → use `100000027` | ✅ | `MovementService.create()` — unconditional fallback |
| 3 | Single-farm orgs restricted to their farm ID | 🔲 | Comment says "Enforced via RLS" |

### Rule Group F: Error Correction (Instances 22-24)

Handled in `packages/domains/correction/`. See [Correction Bot AGENTS.md](../correction/AGENTS.md).

| # | Rule | Status | Service |
|---|------|--------|---------|
| F.1-F.10 | All error correction rules | See Correction Bot | `CorrectionService` |

### Rule Group G: Import/Export (Instances 19-21)

| # | Rule | Status | Location |
|---|------|--------|----------|
| 1 | EU import: original ID unchanged, new national passport printed | ✅ | `MovementService.importEU()` — keeps animalId, creates IMPORT movement, creates national passport via `PassportService.issueForAnimal()` (fire-and-forget) |
| 2 | EU import: foreign passport stored 3 years | ✅ | `MovementService.importEU()` — `storageExpiry = now+3yr`, `foreignPassportStored=true` |
| 3 | 3rd country import: re-tag with national ear tag | ✅ | `MovementService.importThirdCountry()` — `retagged=true`, `newEarTagNumber` |
| 4 | 3rd country import: full re-registration as new animal | ✅ | `MovementService.importThirdCountry()` — creates new animal record via `AnimalRepository.insert()` with re-tagged ear tag, then creates IMPORT movement + import_export_record for the new animal |
| 5 | Export: BIP enters animal data, indicates country of destination | ✅ | `MovementService.exportAnimal()` — EXPORT movement + record, status → EXPORTED |

## Architecture

```
┌─ Animal Domain (packages/domains/animal/) ─────────────────┐
│  AnimalService (register, tag validation, mother checks)    │
│  AnimalRepository (DB queries for animals)                  │
│  animal.errors.ts (11 error codes)                          │
└────────────────────────┬───────────────────────────────────┘
                         │ (exports AnimalRepository)
┌─ Movement Domain (packages/domains/movement/) ─────────────┐
│  MovementService (death, pasture, slaughter, market,       │
│                   import/export)                            │
│  MovementRepository (DB queries for movements)              │
└─────────────────────────────────────────────────────────────┘
```

- **AnimalService** — animal creation, tag validation, mother checks (returns `Result<T, AnimalError>`)
- **MovementService** — departures, arrivals, pasture, slaughter, import/export (separate domain!)
- MovementService imports `AnimalRepository` for cross-table checks
- Both follow Error Sovereignty Doctrine

## Error Codes (`animal.errors.ts`)

11 error codes (not 4 as in older docs):

| Code | String Value |
|------|-------------|
| `NOT_FOUND` | `ANIMAL_NOT_FOUND` |
| `DUPLICATE_TAG` | `ANIMAL_DUPLICATE_EAR_TAG` |
| `INVALID_INPUT` | `ANIMAL_INVALID_INPUT` |
| `FORBIDDEN` | `ANIMAL_FORBIDDEN` |
| `MOTHER_NOT_ON_FARM` | `ANIMAL_MOTHER_NOT_ON_FARM` |
| `MOTHER_NOT_ALIVE` | `ANIMAL_MOTHER_NOT_ALIVE` |
| `MOTHER_TOO_YOUNG` | `ANIMAL_MOTHER_TOO_YOUNG` |
| `INVALID_CALVING_GAP` | `ANIMAL_INVALID_CALVING_GAP` |
| `EAR_TAG_ALREADY_USED` | `ANIMAL_EAR_TAG_ALREADY_USED` |
| `SELF_MOTHER` | `ANIMAL_SELF_MOTHER` |
| `INVALID_PARENT_SEX` | `ANIMAL_INVALID_PARENT_SEX` |

All mapped to TRPC errors in `packages/validators/src/errors/animal.errors.ts`.

## Diamond Seal — `animals.api.ts` ✅ FIXED (2026-07-05)

`packages/validators/src/api/animals.api.ts` now has **full Diamond Seal enforcement** (all 3 tiers):

| Tier | Pattern | Present? |
|------|---------|----------|
| 1 | `satisfies z.ZodType<Interface>` on every schema | ✅ Added |
| 2 | `NoDrift` / `NoDriftSimple` type aliases | ✅ Added (8 drift guards) |
| 3 | `ActivateGuillotines<[...]>` at file end | ✅ Added (`_AnimalGuillotines`) |
| — | `.strict()` on all schemas | ✅ Added to `createAnimalRequestSchema`, changed `updateAnimalRequestSchema` to `z.strictObject` |

## System Parameters

| Param | Default | Used by | Defined in |
|-------|---------|---------|-----------|
| `minMotherAgeMonths` | 17 | Rule A.4c | `animal.service.ts` |
| `calvingPeriodDays` | 365 | Rule A.4d | `animal.service.ts` |
| `slaughterMinAgeDays` | 25 | Rule D.1 | `movement.service.ts` |
| `stillbornThresholdDays` | 25 | Rule B.2 | `movement.service.ts` |
| `arrivalCorrectionDays` | 2 | Rule D.3 | `movement.service.ts` |
| `unregisteredDepartureFarmId` | `100000014` | Rule E.1 | `movement.service.ts` |
| `unregisteredArrivalFarmId` | `100000027` | Rule E.2 | `movement.service.ts` |

## Remaining Work

1. **Rules D.2, E.3** — single-farm org restrictions (lower priority, RLS covers basic cases)
2. ~~**Rule G.4 gap** — done 2026-07-05~~
3. ~~**Rule G.1 gap** — done 2026-07-05~~
4. ~~**Diamond Seal remediation** — done 2026-07-05~~
5. ~~**Schema weirdness** — `slaughter_records` removed 2026-07-05 (legacy artifact)~~
