# Correction Domain Service — Correction Bot

**Scope:** `packages/domains/correction/` — service, repository, errors
**Source spec:** `docs/old/workflow.md` §Instances 22-24 — Error Correction
**Status:** Implementation complete (CRUD + lifecycle management). A posteriori scheduled checks pending.

## Overview

Three types of error correction in the I&R system:

1. **Spotted in field** (Instance 22): Vet spots discrepancy, marks corrections on passport, sends to CPC. CPC runs plausibility checks, corrects if OK, escalates if not.

2. **A priori plausibility** (Instance 23): PDA data uploaded, records failing checks get rejection reasons. Technicians review — three case types:
   - **Case A** (Technician Resolvable): Resolved and entered
   - **Case B** (Requires Clarification): Contact parties, obtain info, resolved with tech code + timestamp + archive number
   - **Case C** (Complex): Handed to responsible person/VI for on-spot control

3. **A posteriori plausibility** (Instance 24): Regular data consistency checks (on/off movement matching, date validity, animal age > 10yr). Error list sorted by villages/dates sent to VS. Unresolved issues go back to CPC.

## Architecture

```
CorrectionRouter (tRPC) → CorrectionService (validate + state machine) → CorrectionRepository (DB)
```

## Business Rules

| # | Rule | Status |
|---|------|--------|
| 1 | Vet marks corrections on passport, signs, sends to CPC | ✅ `create()` with field detection source |
| 2 | CPC runs plausibility checks on new data | ✅ `review()` — PENDING → UNDER_REVIEW |
| 3 | If OK: corrections made, replacement passport printed | ✅ `resolve()` — UNDER_REVIEW → RESOLVED |
| 4 | If NOT: communicated to VS to clarify | ✅ `escalate()` — UNDER_REVIEW → ESCALATED |
| 5 | A priori: PDA upload validated before insertion | ✅ `create()` with a_priori detection source |
| 6 | A priori: Rejected records get reasons | ✅ `reject()` — sets status to REJECTED |
| 7 | A priori: Three case types (A/B/C) | ✅ `caseType` field on create |
| 8 | A posteriori: Regular consistency checks | ⚠️ **Stubs only** — `CorrectionConsistencyJob` exists with weekly @Cron (Sunday 03:00 UTC) but both `checkOrphanedAnimals()` and `checkFutureDates()` return `false` — not real checks |
| 9 | A posteriori: Error list sorted by villages | 🔲 Future enhancement |
| 10 | A posteriori: VS resolves during farm visits | 🔲 VS workflow pending |

## State Machine

```
PENDING → UNDER_REVIEW → RESOLVED
  ↓            ↓
REJECTED    ESCALATED → UNDER_REVIEW (re-open)
              ↓
            RESOLVED
REJECTED → PENDING (re-open)
```

## Implementation Inventory

### Done ✅

| Component | File | Notes |
|-----------|------|-------|
| Drizzle schema | `packages/database/src/schema/an/error-corrections.ts` | 22 columns, JSONB data, RLS |
| Constants | `packages/database/src/constants/correction-status.ts` | PENDING/UNDER_REVIEW/RESOLVED/ESCALATED/REJECTED |
| Constants | `packages/database/src/constants/correction-case-type.ts` | TECHNICIAN_RESOLVABLE/REQUIRES_CLARIFICATION/COMPLEX |
| Dumb Zod | `packages/database/src/zod/an.ts` | errorCorrectionSelectSchema + errorCorrectionInsertSchema |
| Domain package | `packages/domains/correction/` | package.json, tsconfig.json, src/{errors,repositories,services}/ |
| Errors | `packages/domains/correction/src/errors/correction.errors.ts` | 6 error codes |
| Repository | `packages/domains/correction/src/repositories/correction.repository.ts` | findById, listFiltered, create, updateStatus, escalate, findByFarm |
| Service | `packages/domains/correction/src/services/correction.service.ts` | State machine, create, review, resolve, escalate, reject, list |
| API validators | `packages/validators/src/api/correction.api.ts` | Response + create + review + resolve + escalate + list schemas |
| TRPC error map | `packages/validators/src/errors/correction.errors.ts` | 6 error code → TRPCError mappings |
| tRPC router | `apps/api/src/routers/correction.router.ts` | 7 endpoints: getById, list, create, review, resolve, escalate, reject |
| App module wiring | `apps/api/src/app.module.ts` | CorrectionRepository + CorrectionService + CorrectionRouter |

## Error Codes

| Code | When |
|------|------|
| `NOT_FOUND` | Correction not found |
| `INVALID_STATUS_TRANSITION` | Illegal state change |
| `INVALID_INPUT` | Validation failure |
| `FORBIDDEN` | Permission denied |
| `ESCALATION_REQUIRED` | Complex case needs VI |
| `ALREADY_RESOLVED` | Correction already resolved |

## Context Boundaries

| Bot | Reads | Writes |
|-----|-------|--------|
| **Correction Bot** | `packages/domains/correction/` | errors, repo, service |
| **Passport Bot** | `packages/domains/passport/` | ✅ `PassportService.reprint()` triggered from `CorrectionService.resolve()` when `passportReprintRequired` + `passportId` set |
| **Archive Bot** | `packages/domains/archive/` | ✅ `archiveErrorCorrection()` called from `CorrectionService.resolve()` (wired 2026-07-05) |
| **Validation Bot** | `packages/validators/src/api/correction.api.ts` | Correction API schemas |
| **API Bot** | `apps/api/src/routers/correction.router.ts` | tRPC router |
