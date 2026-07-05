# Farm Domain Service

**Scope:** `packages/domains/farm/` — service, repository, errors
**Source spec:** `docs/old/workflow.md` §Instances 1-3
**Status:** CRUD + update mutations (~75%), no farm book workflow

## Overview

Manages farms (holdings) and their keepers. The farm is the spatial unit of the I&R system.

## Workflow Instances Covered

| Instance | Description                | Status                   |
| -------- | -------------------------- | ------------------------ |
| 1        | Farm Census                | ~60% (CRUD exists)       |
| 2        | New Keeper/Holding         | ~70% (CRUD exists)       |
| 3        | Change Keeper/Holding Info | ~10% (no update methods) |

## Business Rules

### Farm Census (Instance 1)

| #   | Rule                                                            | Status |
| --- | --------------------------------------------------------------- | ------ |
| 1   | Farm ID with check digit validation                             | ✅      |
| 2   | Auto-generated 9-digit farm ID                                  | ✅      |
| 3   | Address hierarchy (states → zip codes → communes → admin units) | ✅      |
| 4   | Farm type classification                                        | ✅      |
| 5   | PostGIS location/GPS coordinates                                | ✅      |
| 6   | Verification workflow (PENDING_VD_APPROVAL → approved/rejected) | ✅      |
| 7   | Farm book printing/delivery                                     | 🔲      |
| 8   | VS service contract assignment                                  | 🔲      |
| 9   | VS assignment to keepers/holdings                               | 🔲      |

### New Keeper/Holding (Instance 2)

| #   | Rule                                                 | Status |
| --- | ---------------------------------------------------- | ------ |
| 1   | Create new subject (keeper) with dual-language names | ✅      |
| 2   | Create new farm with check-digit farm ID             | ✅      |
| 3   | Bind keeper to farm with role                        | ✅      |
| 4   | Check-against-register dedup logic                   | 🔲      |
| 5   | Farm book assembly/delivery                          | 🔲      |

### Change Keeper/Holding Info (Instance 3)

| #   | Rule                                      | Status               |
| --- | ----------------------------------------- | -------------------- |
| 1   | Update farm information                   | ✅ (FarmService.update) |
| 2   | Update keeper information                 | ✅ (SubjectService.update) |
| 3   | Change audit trail                        | 🔲                    |
| 4   | Passport/cattle register reprint triggers | 🔲                    |

## Architecture

```
Router (tRPC) → FarmService (validate + orchestrate) → FarmRepository (DB)
                     │
                     └── Returns Result<T, FarmError>
```

## Error Codes

| Code                | When                          |
| ------------------- | ----------------------------- |
| `NOT_FOUND`         | Farm not found                |
| `DUPLICATE_FARM_ID` | Farm ID already exists        |
| `INVALID_FARM_ID`   | Check digit validation failed |
| `INVALID_INPUT`     | Validation failure            |
| `FORBIDDEN`         | Permission denied             |

## Schema

- Table: `farms` (`packages/database/src/schema/hk/farms.ts`)
- Table: `subjects` (`packages/database/src/schema/hk/subjects.ts`)
- Table: `farm_subjects` (`packages/database/src/schema/hk/farm-subjects.ts`)
- Table: `addresses` (`packages/database/src/schema/hk/addresses.ts`)
- Type pgEnum: `farm_type`, `subject_role`

## Implementation Priority

1. **Phase 1:** Add update mutations (FarmService.update, SubjectService.update) ✅
2. **Phase 2:** Add update validators (updateFarmRequestSchema, updateSubjectRequestSchema) ✅
3. **Phase 3:** Change audit trail integration — pending
4. **Phase 4:** Farm book workflow (printing/delivery tracking) — pending
5. **Phase 5:** VS assignment workflow — pending
