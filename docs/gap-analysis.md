# Workflow Gap Analysis

**Source:** `docs/old/workflow.md` — 25 I&R System Workflow Instances
**Date:** July 2026

---

## Executive Summary

| Metric                   | Count |
| ------------------------ | ----- |
| Total workflow instances | 25    |
| Fully implemented        | 0     |
| Schema + basic CRUD      | 9     |
| Schema only (no logic)   | 5     |
| No implementation        | 11    |

**The Real:** Schema layer is ~85% complete. Business logic is ~15% implemented. The central legal document (Cattle Passport) does not exist in the database.

---

## Instance Status Matrix

| #   | Instance                       | Schema             | Service              | Router | Validator | Business Logic % |
| --- | ------------------------------ | ------------------ | -------------------- | ------ | --------- | ---------------- |
| 1   | Farm Census                    | ✅                  | ✅                    | ✅      | ✅         | ~60%             |
| 2   | New Keeper/Holding             | ✅                  | ✅                    | ✅      | ✅         | ~70%             |
| 3   | Change Keeper/Holding          | ✅                  | ❌ (no update)        | ❌      | ❌         | ~10%             |
| 4   | First Allocation of Ear Tags   | ✅                  | ⚠️ (procurement only) | ⚠️      | ⚠️         | ~30%             |
| 5   | Routine Allocation of Ear Tags | ✅                  | ⚠️                    | ⚠️      | ⚠️         | ~25%             |
| 6   | Replacement Ear Tags           | ✅                  | ❌                    | ❌      | ❌         | ~10%             |
| 7   | Withdrawal of Ear Tags         | ⚠️ (enum only)      | ❌                    | ❌      | ❌         | ~5%              |
| 8   | Notification of Births         | ✅                  | ❌                    | ❌      | ⚠️         | ~15%             |
| 9   | Routine Registration & Tagging | ✅                  | ⚠️ (bare CRUD)        | ✅      | ⚠️         | ~20%             |
| 10  | First Tagging                  | ✅                  | ❌                    | ❌      | ⚠️         | ~5%              |
| 11  | Cattle Passports               | ❌                  | ❌                    | ❌      | ❌         | 0%               |
| 12  | Movements/Death by PDA         | ✅                  | ⚠️ (basic guards)     | ✅      | ✅         | ~30%             |
| 13  | Movements/Death by Postcards   | ⚠️ (no source diff) | ⚠️                    | ✅      | ✅         | ~25%             |
| 14  | Slaughter at Slaughterhouse    | ✅                  | ❌                    | ❌      | ❌         | ~10%             |
| 15  | Livestock Markets/Fairs        | ⚠️ (struct cols)    | ❌                    | ❌      | ❌         | ~5%              |
| 16  | Alpine Grazing Areas           | ✅                  | ❌                    | ❌      | ❌         | ~10%             |
| 17  | Form Re-prints                 | ❌                  | ❌                    | ❌      | ❌         | 0%               |
| 18  | On-Spot Inspections            | ❌                  | ❌                    | ❌      | ❌         | 0%               |
| 19  | Import from EU Countries       | ⚠️ (fields)         | ❌                    | ❌      | ⚠️         | ~10%             |
| 20  | Import from 3rd Countries      | ⚠️ (same as 19)     | ❌                    | ❌      | ⚠️         | ~10%             |
| 21  | Export of Animals              | ⚠️ (fields)         | ❌                    | ❌      | ⚠️         | ~10%             |
| 22  | Error Correction: Field        | ❌                  | ❌                    | ❌      | ❌         | 0%               |
| 23  | Error Correction: A Priori     | ❌                  | ❌                    | ❌      | ❌         | 0%               |
| 24  | Error Correction: A Posteriori | ❌                  | ❌                    | ❌      | ❌         | 0%               |
| 25  | I&R Archive                    | ⚠️ (audit log)      | ❌                    | ❌      | ❌         | ~5%              |

---

## Detailed Instance Analysis

### Group A: Farm & Keeper Management (Instances 1-3)

**Coverage:** `packages/domains/farm/`, `packages/domains/subject/`

#### Instance 1: Farm Census

- **Schema:** ✅ `farms`, `subjects`, `farm_subjects`, `addresses`
- **Service:** ✅ `FarmService` (CRUD), `SubjectService` (CRUD + bind)
- **Router:** ✅ `FarmRouter`, `SubjectRouter`
- **Validator:** ✅ `farms.api.ts`, `subjects.api.ts`
- **Missing:** Farm book printing/delivery, VS service contract assignment, I&R unit checking workflow, batch staging file

#### Instance 2: New Keeper/Holding

- **Coverage:** Same as Instance 1
- **Missing:** Check-against-register dedup logic, farm book assembly/delivery workflow

#### Instance 3: Change Keeper/Holding Information

- **Schema:** ✅ Tables exist
- **Service:** ❌ No `update()` methods on FarmService or SubjectService
- **Router:** ❌ No update mutations
- **Validator:** ❌ No update schemas
- **Missing:** Update mutations, change audit trail, passport/cattle register reprint triggers

### Group B: Ear Tag Lifecycle (Instances 4-7)

**Coverage:** `packages/domains/eartag/`

#### Instance 4: First Allocation of Ear Tags

- **Schema:** ✅ `earTagAllocations`, `earTagOrders`, `earTagTypes`
- **Service:** ⚠️ `EarTagService` handles procurement orders only
- **Missing:** Allocation-to-VS logic, manufacturer order placement, delivery confirmation, tag range generation

#### Instance 5: Routine Allocation of Ear Tags

- **Coverage:** Same as Instance 4
- **Missing:** VS-level request/justify/allocate workflow, rejection handling

#### Instance 6: Replacement Ear Tags

- **Schema:** ✅ `earTagReplacements` table
- **Service:** ❌ No domain service
- **Router:** ❌ No router
- **Validator:** ❌ Event payload only
- **Missing:** Everything — keeper reports loss, VS orders, CPC batches, packing/labeling, delivery tracking

#### Instance 7: Withdrawal of Ear Tags

- **Schema:** ⚠️ `WITHDRAWN` status constant only
- **Service:** ❌
- **Missing:** Withdrawal table, request workflow, wrong-shipment handling

### Group C: Birth & Registration (Instances 8-10)

**Coverage:** `packages/domains/animal/`

#### Instance 8: Notification of Births

- **Schema:** ✅ `birthNotifications` table
- **Service:** ❌ No BirthNotificationService
- **Router:** ❌ No router
- **Validator:** ⚠️ Event payload only
- **Missing:** CRUD service, 7-day notification deadline, 20-day tagging deadline, daily action list for VS, link to animal registration

#### Instance 9: Routine Registration & Tagging

- **Schema:** ✅ `animals` table
- **Service:** ⚠️ `AnimalService.create()` — bare CRUD, 0/10 business rules
- **Router:** ✅ `AnimalRouter`
- **Validator:** ⚠️ `registration.api.ts` with birth date check only
- **Missing:** All 10 registration rules (mother age/gap/alive/on-farm, tag validity, sex checks, permission checks)

#### Instance 10: First Tagging

- **Schema:** ✅ `isFirstTagging` flag on animals
- **Service:** ❌ No first-tagging logic
- **Missing:** Campaign workflow, suppressed checks (tag reuse, mother validation)

### Group D: Cattle Passport (Instance 11)

**Coverage:** ❌ **No domain exists**

#### Instance 11: Issuing of Cattle Passports

- **Schema:** ❌ **No `cattle_passports` table**
- **Service:** ❌
- **Router:** ❌
- **Validator:** ❌
- **Utility:** ⚠️ `generatePassportNumber()` exists (`MK-YYYY-XXXXX` format)
- **Missing:** Entire system — passport issuance from error-free registrations, shipment to VS, keeper transfer, seizure on death/slaughter, reprint on error correction

### Group E: Movements & Death (Instances 12-16)

**Coverage:** `packages/domains/movement/`

#### Instance 12: Movements/Death by PDA

- **Schema:** ✅ `movements` table with death fields, `DEATH_CAUSE` enum
- **Service:** ⚠️ `MovementService.create()` with same-farm + animal checks
- **Router:** ✅ `MovementRouter`
- **Validator:** ✅ `movements.api.ts`
- **Missing:** PDA download/upload flow, death scenario decision tree, passport seizure, `source` field to distinguish PDA vs postcard

#### Instance 13: Movements/Death by Postcards

- **Schema:** ⚠️ No source differentiator
- **Missing:** Source field, postcard tracking, passport seizure for postcard deaths

#### Instance 14: Slaughter at Slaughterhouse

- **Schema:** ✅ `slaughterRecords` table
- **Service:** ❌ No SlaughterService
- **Router:** ❌
- **Validator:** ❌
- **Missing:** Everything — VI collects lists, destroys ear tags, completes passports, enters data, tracks storage

#### Instance 15: Livestock Markets/Fairs

- **Schema:** ⚠️ `parentMovementId`, `legOrder` columns exist
- **Service:** ❌ No market logic
- **Missing:** 4-leg automatic movement generation, unsold animal fallback, home slaughter status, passport scanning

#### Instance 16: Alpine Grazing Areas

- **Schema:** ✅ `pastureDeclarations` table
- **Service:** ❌ No PastureService
- **Router:** ❌
- **Validator:** ❌
- **Missing:** All 4 pasture rules, collective list management, departure/return workflow

### Group F: Form Reprints (Instance 17)

**Coverage:** ❌ **No domain exists**

#### Instance 17: Re-prints of Forms

- **Schema:** ❌
- **Service:** ❌
- **Router:** ❌
- **Validator:** ❌
- **Missing:** Document type catalog, inventory tracking, reprint request workflow, shipping tracking

### Group G: Inspections (Instance 18)

**Coverage:** ❌ **No domain exists**

#### Instance 18: On-Spot Inspections

- **Schema:** ❌
- **Service:** ❌
- **Router:** ❌
- **Validator:** ❌
- **Existing:** `INSPECTION_DUE`/`INSPECTION_OVERDUE` notification categories, `analysis:read`/`analysis:run` permissions
- **Missing:** Inspection table, risk analysis engine (10% selection), form generation, result recording, 3-year retention tracking

### Group H: Import/Export (Instances 19-21)

**Coverage:** Fields exist on `animals`/`movements` tables, no workflow orchestration

#### Instance 19: Import from EU Countries

- **Schema:** ⚠️ `animals.imported`, `animals.importCountry`, `MOVEMENT_TYPE.IMPORT`, `FARM_TYPE.BIP`/`QUARANTINE`
- **Service:** ❌
- **Missing:** BIP communication, quarantine movement, foreign passport storage, national passport printing

#### Instance 20: Import from 3rd Countries

- **Schema:** ⚠️ Same as 19, no EU/3rd-country distinction
- **Missing:** Re-tagging workflow, full re-registration, country of origin indication

#### Instance 21: Export of Animals

- **Schema:** ⚠️ `movements.exportCountry`, `MOVEMENT_TYPE.EXPORT`
- **Service:** ❌
- **Missing:** Selling keeper communication, BIP exit data entry, passport reading workflow

### Group I: Error Correction (Instances 22-24)

**Coverage:** ❌ **No domain exists**

#### Instance 22: Error Correction — Spotted in Field

- **Schema:** ❌ (only `MOVEMENT_TYPE.CORRECTION` enum)
- **Service:** ❌
- **Missing:** Vet marks corrections on passport → CPC plausibility checks → replacement passport

#### Instance 23: Error Correction — A Priori Plausibility

- **Schema:** ❌ (`syncErrors` is HK-only, not for animal data)
- **Service:** ❌
- **Missing:** PDA upload validation, rejection reasons, technician review, case types (A/B/C), archive numbers

#### Instance 24: Error Correction — A Posteriori Plausibility

- **Schema:** ❌
- **Service:** ❌
- **Missing:** Consistency checks (movement matching, date validity, animal age > 10yr), error list by villages, VS resolution tracking

### Group J: Archive (Instance 25)

**Coverage:** ⚠️ `auditLog` table provides foundation

#### Instance 25: I&R Archive

- **Schema:** ⚠️ `auditLog` for change tracking, no document tracking
- **Service:** ❌
- **Missing:** 3-tier archive (CPC/VS/VI), document type catalog, retention enforcement (3-year rules), physical location tracking

---

## Missing Database Schemas

| Table                   | Instances | Purpose                                                   |
| ----------------------- | --------- | --------------------------------------------------------- |
| `cattle_passports`      | 11        | Passport lifecycle (issuance, seizure, reprint)           |
| `inspections`           | 18        | Inspection records, risk analysis, form data              |
| `import_export_records` | 19-21     | BIP communication, quarantine workflow, country tracking  |
| `error_corrections`     | 22-24     | Correction requests, plausibility checks, case management |
| `archive_documents`     | 25        | Document retention, location tracking, 3-tier archive     |
| `form_reprints`         | 17        | Reprint requests, document inventory, shipping            |

---

## RobotFarm Bot Status

| Bot                | Domain                         | Instances    | Status                       |
| ------------------ | ------------------------------ | ------------ | ---------------------------- |
| EarTag Bot         | `packages/domains/eartag/`     | 4-7          | ⚠️ Partial (AGENTS.md exists) |
| Animal Bot         | `packages/domains/animal/`     | 8-10, 22-24  | ⚠️ Partial (AGENTS.md exists) |
| Farm Bot           | `packages/domains/farm/`       | 1-3          | ❌ No AGENTS.md               |
| Movement Bot       | `packages/domains/movement/`   | 12-16, 19-21 | ❌ No AGENTS.md               |
| **Passport Bot**   | `packages/domains/passport/`   | 11           | ❌ **New domain needed**      |
| **Inspection Bot** | `packages/domains/inspection/` | 18           | ❌ **New domain needed**      |
| **Correction Bot** | `packages/domains/correction/` | 22-24        | ❌ **New domain needed**      |
| **Archive Bot**    | `packages/domains/archive/`    | 17, 25       | ❌ **New domain needed**      |

---

## Priority Roadmap

### Phase 1: Core Business Rules (High Impact)

1. **Animal registration rules** (Instance 9) — 10 rules, foundational
2. **Birth notification service** (Instance 8) — prerequisite for registration
3. **Movement business rules** (Instances 12-16) — death scenarios, pasture, markets
4. **Cattle Passport** (Instance 11) — central legal document, entirely missing

### Phase 2: Ear Tag Completion (Medium Impact)

5. **Ear tag allocation** (Instances 4-5) — allocation-to-VS workflow
2. **Ear tag replacement** (Instance 6) — full replacement lifecycle
3. **Ear tag withdrawal** (Instance 7) — withdrawal tracking

### Phase 3: Import/Export (Medium Impact)

8. **EU import** (Instance 19) — quarantine workflow
2. **3rd country import** (Instance 20) — re-tagging
3. **Export** (Instance 21) — BIP exit

### Phase 4: Quality & Compliance (Low-Medium Impact)

11. **Error correction** (Instances 22-24) — plausibility engine
2. **Inspections** (Instance 18) — risk analysis, 10% selection
3. **Archive** (Instance 25) — document retention
4. **Form reprints** (Instance 17) — document inventory
