# Animal Domain Service

**Scope:** `packages/domains/animal/` — service, repository, errors
**Source spec:** `docs/old/fs2.md` — Registration_MK (Registration and Movements)

## Implementation Status

All schema tables exist (animals, movements, pasture, slaughter, birth notifications). Business rules are mostly unimplemented — current `AnimalService.create()` is bare CRUD with no validation.

### Rule Group A: Normal Registration Rules

| # | Rule | Status | Location |
|---|------|--------|----------|
| 1 | User must have privilege to register on the specified farm | ✅ RLS | `pgPolicy` on animals table |
| 2 | Registration date cannot be in the future | ✅ Zod | `animals.api.ts` birthDate validation |
| 3 | Only a valid + NEW ear tag can be used (not previously applied) | ✅ | `AnimalService.create()` — `findByTag()` check |
| 4a | Mother must be on the farm at time of birth | ✅ | `AnimalService.create()` — `currentFarmId` comparison |
| 4b | Mother must be alive at time of birth | ✅ | `AnimalService.create()` — `status === ALIVE` check |
| 4c | Mother must be >= 17 months old (system param) | ✅ | `AnimalService.create()` — `monthsBetween()` check |
| 4d | Calving gap >= CalvingPeriod (e.g. 120 days) | ✅ | `AnimalService.create()` — `findLastCalfByMother()` + gap check |
| 5 | Mother not male, father not female | ✅ | `AnimalService.create()` — parent sex validation |
| 6 | Birth date cannot be in the future | ✅ Zod | Already validated |

### Rule Group B: Death/Stillborn

| # | Rule | Status | Location |
|---|------|--------|----------|
| 1 | Death scenario decision tree (5 scenarios) | 🔲 | See fs2.md Diagram 3 — `DEATH_CAUSE` enum has all values |
| 2 | Stillborn threshold: deathDate - birthDate <= 25 days (system param) | 🔲 | `defaultParams.slaughterMinAgeDays = 25` exists |

### Rule Group C: Pasture Movements

| # | Rule | Status | Location |
|---|------|--------|----------|
| 1 | Only animals currently at home farm can be added to pasture | 🔲 | `MovementService.create()` |
| 2 | Animals cannot auto-transfer between pastures | 🔲 | `MovementService.create()` |
| 3 | Pasture cannot be used as departure farm | 🔲 | `MovementService.create()` |
| 4 | Unexpected movement invalidates pending pasture declarations | 🔲 | `MovementService.create()` |

### Rule Group D: Slaughter

| # | Rule | Status | Location |
|---|------|--------|----------|
| 1 | Minimum age 25 days (system param) | 🔲 | `MovementService.create()` or slaughter service |
| 2 | Farm restrictions (single-farm orgs limited) | 🔲 | `MovementService.create()` |
| 3 | Arrival correction: +/- 2 days auto-correct departure | 🔲 | `MovementService.create()` |

### Rule Group E: Arrival

| # | Rule | Status | Location |
|---|------|--------|----------|
| 1 | Unregistered departure farm → use `100000014` | 🔲 | `MovementService.create()` |
| 2 | Unregistered arrival farm → use `100000027` | 🔲 | `MovementService.create()` |
| 3 | Single-farm orgs restricted to their farm ID | 🔲 | `MovementService.create()` |

## Architecture

```
Router (tRPC) → AnimalService (validate + orchestrate) → AnimalRepository (DB)
                MovementService (movement rules)      → MovementRepository (DB)
                     │
                     └── Both return Result<T, DomainError>
```

- **AnimalService** — animal creation, tag validation, mother checks
- **MovementService** — departures, arrivals, pasture, slaughter
- MovementService depends on `AnimalRepository` for cross-table checks
- Both follow Error Sovereignty Doctrine

## Error Codes (`ANIMAL_ERRORS`)

| Code | When |
|------|------|
| `NOT_FOUND` | Animal not found |
| `DUPLICATE_EAR_TAG` | Duplicate tag number |
| `INVALID_INPUT` | Validation failure |
| `FORBIDDEN` | Permission denied |

Next step: add `INVALID_MOTHER_AGE`, `INVALID_CALVING_GAP`, `INVALID_DEATH_SCENARIO`, etc. if frontend needs distinct branching.

### Rule Group F: Error Correction (Instances 22-24)

| # | Rule | Status | Location |
|---|------|--------|----------|
| F.1 | Vet spots discrepancy, marks corrections on passport, sends to CPC | 🔲 | `CorrectionService` |
| F.2 | CPC runs plausibility checks on new data | 🔲 | `CorrectionService` |
| F.3 | If OK: corrections made, replacement passport printed | 🔲 | `CorrectionService` + `PassportService` |
| F.4 | If NOT: communicated to VS to clarify | 🔲 | `CorrectionService` |
| F.5 | A priori: PDA upload validated before insertion | 🔲 | `CorrectionService` |
| F.6 | A priori: Rejected records get reasons | 🔲 | `CorrectionService` |
| F.7 | A priori: Three case types (A/B/C) | 🔲 | `CorrectionService` |
| F.8 | A posteriori: Regular consistency checks | 🔲 | `CorrectionService` |
| F.9 | A posteriori: Error list sorted by villages | 🔲 | `CorrectionService` |
| F.10 | A posteriori: VS resolves during farm visits | 🔲 | `CorrectionService` |

### Rule Group G: Import/Export (Instances 19-21)

| # | Rule | Status | Location |
|---|------|--------|----------|
| G.1 | EU import: original ID unchanged, new national passport printed | 🔲 | `MovementService` |
| G.2 | EU import: foreign passport stored 3 years | 🔲 | `ArchiveService` |
| G.3 | 3rd country import: re-tag with national ear tag | 🔲 | `MovementService` |
| G.4 | 3rd country import: full re-registration as new animal | 🔲 | `AnimalService` + `MovementService` |
| G.5 | Export: BIP enters animal data, indicates country of destination | 🔲 | `MovementService` |

## System Parameters (from spec)

| Param | Default | Used By |
|-------|---------|---------|
| `minMotherAgeMonths` | 17 | Rule A.4c |
| `calvingPeriodDays` | 365 | Rule A.4d |
| `slaughterMinAgeDays` | 25 | Rule D.1 |
| `stillbornThresholdDays` | 25 | Rule B.2 |
| `arrivalCorrectionDays` | 2 | Rule D.3 |
| `unregisteredDepartureFarmId` | `100000014` | Rule E.1 |
| `unregisteredArrivalFarmId` | `100000027` | Rule E.2 |
