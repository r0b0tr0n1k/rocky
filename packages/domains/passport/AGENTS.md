# Passport Domain Service — Passport Bot

**Scope:** `packages/domains/passport/` — service, repository, errors
**Source spec:** `docs/old/workflow.md` §Instance 11 — Issuing of Cattle Passports
**Status:** Implementation complete (Phases 1-4). State machine enforced.

## Overview

The Cattle Passport is the **central legal document** of the I&R system. Every animal must have a passport. The passport is:
- Issued automatically from error-free registrations
- Shipped to VS, then delivered to keeper
- Seized on death/slaughter and returned to CPC
- Reprinted when errors are corrected
- Stored at CPC for at least 3 years after seizure

## State Machine

```
ISSUED → ACTIVE → SEIZED → ARCHIVED
  ↓        ↓        ↓
CANCELLED CANCELLED  ↓
                   REPRINTED → ACTIVE
```

## Architecture

```
PassportRouter (tRPC) → PassportService (validate + state machine) → PassportRepository (DB)
                                ↑
AnimalRepository (animal existence check)
```

## Business Rules

| # | Rule | Status |
|---|------|--------|
| 1 | Passport issued only for error-free registered animals | ✅ `issueForAnimal()` — verifies animal exists, no duplicate active passport |
| 2 | Passport number format: `MK-YYYY-XXXXX` | ✅ Auto-generated in `issueForAnimal()` |
| 3 | Passport shipped to VS in defined time intervals | ✅ `shipToVs()` — marks shippedToVs + shippedAt |
| 4 | VS transfers passport to keeper by routine tours | ✅ `deliverToKeeper()` — marks deliveredToKeeper + deliveredAt |
| 5 | On death/slaughter: passport seized, death date + cause recorded | ✅ `seize()` — ACTIVE → SEIZED, records deathDate + deathCause |
| 6 | Seized passport sent to CPC by VS | ✅ Implied by seize workflow |
| 7 | Seized passport stored at CPC for at least 3 years | ✅ `archive()` — SEIZED → ARCHIVED |
| 8 | On error correction: old passport invalidated, replacement printed | ✅ `reprint()` — ACTIVE → REPRINTED, creates new ACTIVE with isReprint=true |

## Implementation Inventory

### Done ✅

| Component | File | Notes |
|-----------|------|-------|
| Drizzle schema | `packages/database/src/schema/an/cattle-passports.ts` | Full passport lifecycle columns, RLS, indexes |
| Constants | `packages/database/src/constants/passport-status.ts` | ISSUED/ACTIVE/SEIZED/ARCHIVED |
| pgEnum | `packages/database/src/schemas/enums/passport-status.ts` | Pre-existing |
| zEnum | `packages/validators/src/enums/domain.ts` | `passportStatusSchema` |
| Dumb Zod | `packages/database/src/zod/an.ts` | `cattlePassportSelectSchema` + `cattlePassportInsertSchema` |
| Domain package | `packages/domains/passport/` | package.json, tsconfig.json, src/{errors,repositories,services}/ |
| Errors | `packages/domains/passport/src/errors/passport.errors.ts` | 8 error codes |
| Repository | `packages/domains/passport/src/repositories/passport.repository.ts` | findById, findByAnimalId, findByFarmId, create, updateStatus, seize, archive, shipToVs, deliverToKeeper, findSeized |
| Service | `packages/domains/passport/src/services/passport.service.ts` | State machine, issueForAnimal, shipToVs, deliverToKeeper, seize, reprint, archive, list, getById |
| API validators | `packages/validators/src/api/passport.api.ts` | Response + issue + seize + reprint + list schemas |
| TRPC error map | `packages/validators/src/errors/passport.errors.ts` | 8 error code → TRPCError mappings |
| tRPC router | `apps/api/src/routers/passport.router.ts` | 7 endpoints: getById, list, issueForAnimal, shipToVs, deliverToKeeper, seize, reprint |
| App module wiring | `apps/api/src/app.module.ts` | PassportRepository + PassportService + PassportRouter |

## Error Codes

| Code | When |
|------|------|
| `NOT_FOUND` | Passport not found |
| `ALREADY_SEIZED` | Passport already seized |
| `INVALID_STATUS_TRANSITION` | Illegal state change |
| `INVALID_INPUT` | Validation failure |
| `FORBIDDEN` | Permission denied |
| `ANIMAL_NOT_FOUND` | Animal not found for passport issuance |
| `NO_ACTIVE_PASSPORT` | No active passport found |
| `PASSPORT_EXISTS` | Animal already has an active passport |

## Context Boundaries

| Bot | Reads | Writes |
|-----|-------|--------|
| **Passport Bot** | `packages/domains/passport/` | errors, repo, service |
| **Animal Bot** | `packages/domains/animal/` | AnimalRepository for existence checks |
| **Validation Bot** | `packages/validators/src/api/passport.api.ts` | Passport API schemas |
| **API Bot** | `apps/api/src/routers/passport.router.ts` | tRPC router |
