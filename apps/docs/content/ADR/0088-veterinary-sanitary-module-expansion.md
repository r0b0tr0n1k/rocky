# ADR-0088: Veterinary & Sanitary Module Expansion (EU Resource-Aligned Architecture)

> The State already maintains the master data Rocky needs — diseases (WOAH WAHIS), medicines and
> withdrawal periods (EMA UPD), and the legal framework (AHL 2016/429, OCR 2017/625). We must not
> invent biology. This ADR plans the expansion of the Veterinary & Sanitary modules by translating
> those EU resources into the Diamond Seal architecture, reusing existing Outbox / PostGIS /
> Inspection infrastructure. Component decisions are split into ADR-0089 … ADR-0093.

| Key            | Value                                                                      |
| -------------- | -------------------------------------------------------------------------- |
| **Status**     | Accepted                                                                   |
| **Date**       | 2026-07-13                                                                 |
| **Author**     | Architecture Review (user directive: expand Veterinary & Sanitary modules) |
| **Supersedes** | None                                                                       |
| **Superseded** | None                                                                       |

## Context

Rocky's Animal Health module (`packages/database/src/schema/hd/`) already covers field veterinary
work: `diseases`, `vaccinations`, `treatments`, `vaccineBatches`, `labTests`, plus a notifiable
disease → inspection trigger (`HealthService` → `InspectionRepository.flagFarmForInspection()`).
`MovementService.recordSlaughter()` and a `geofences` table (with `isActive` + PostGIS `polygon`)
exist, and disease zones are already declared/checked (`declareDiseaseZone`,
`GeoService.runDiseaseZoneCheck`, `diseaseZoneEnabled` system parameter).

But the **sanitary + epidemiological cycle is incomplete**, and the disease model is too coarse for
EU compliance:

- A disease is a single boolean (`notifiable`), not the tiered, legally-defined category the EU
  Animal Health Law uses.
- An animal arriving at a slaughterhouse is recorded as slaughtered with **no ante-/post-mortem
  sanitary gate** — it becomes "food" without the State's explicit pass.
- `lab_tests` has no chain-of-custody status (only `sampleDate`/`resultDate`) — a result "appears"
  with no sample / in-transit / processing workflow.
- A positive Category A result does **not** automatically draw restriction zones and lock farms,
  even though `geofences` and the zone machinery already exist.

The State already maintains the master data. **We must not invent diseases or medicines** — we
translate the EU's own lists into the Diamond Seal architecture.

## Decision

Adopt a **resource-aligned expansion** of the Veterinary & Sanitary modules, grounded in the EU
instruments below, built on existing infrastructure (Outbox events, PostGIS `geofences`, the
Inspection domain, the Geo service). Four components, each with its own ADR.

| EU instrument                                   | Governs                                                                                                      | Rocky maps to                                           |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| **Reg (EU) 2016/429 (AHL)** — Animal Health Law | Disease prevention/control framework; diseases listed in **Annex II**; defines protection/surveillance zones | Disease master data, zone concepts, notifiable triggers |
| **Delegated Reg (EU) 2018/1629**                | Animal disease categories for annual Union reporting (the A–E tiering)                                       | `diseaseCategory` enum values                           |
| **Reg (EU) 2017/625 (OCR)**                     | Official controls — incl. **ante-/post-mortem** inspection at slaughterhouses                                | `sanitary_inspections` entity                           |
| **Reg (EC) 853/2004**                           | Hygiene rules for food of animal origin                                                                      | ante/post-mortem pass / condemn decisions               |
| **Reg (EC) 1069/2009 (ABP)**                    | Animal by-products — **Category 1 ABP** condemnation/disposal                                                | post-mortem condemnation → incineration                 |
| **WOAH WAHIS**                                  | International master disease list + codes                                                                    | Seed `diseases` + `woahCode`                            |
| **Reg (EU) 2019/6 (VMPR) + EMA UPD**            | Vet medicinal products; legally mandated **withdrawal periods**                                              | Seed `vaccines`/`treatments` + `withdrawalPeriod`       |

**Component 1 — Sanitary Chokepoint** (ADR-0090): new `sanitary_inspections` entity in the
inspection domain, linked to a `movementId` (slaughter arrival), with `anteMortemDecision`
(passed/condemned) and `postMortemDecision` (passed/condemned/partial_condemnation). Ante-mortem
fail → kill + Category 1 ABP incineration; post-mortem condemn → automatic retroactive alert to
farm of origin. Maps to OCR 2017/625 + 853/2004 + 1069/2009.

**Component 2 — Lab chain of custody** (ADR-0091): add `sampleStatus` enum to `lab_tests` —
`SAMPLE_COLLECTED → IN_TRANSIT → PROCESSING → COMPLETED`. Field vet logs the sample on the PDA;
State lab logs the result on the portal. Emits `LabTestCompletedEvent` (Outbox).

**Component 3 — Zone of Alienation** (ADR-0092): a service listens to `LabTestCompletedEvent`; if
the disease is **Category A**, it takes the farm coordinates, draws a **3 km protection zone** + a
**10 km surveillance zone** via `geofences`, and sets `isActive = false` on every farm inside the
polygon (blocking movements). Extends the *existing* `declareDiseaseZone` / `runDiseaseZoneCheck`
machinery; does not rebuild it.

**Component 4 — Dual frontend realities** (ADR-0093): two distinct web experiences — (a) **Private
Vet Dashboard** (productivity: due vaccinations, calves needing tags, today's treatments); (b)
**State Epidemiologist Dashboard** (surveillance: LPIS-polygon map, lab-result heatmaps,
overdue-birth alerts) — a panoptic view of national biological health.

### Child ADRs

| ADR          | Scope                                                                                 | Status                |
| ------------ | ------------------------------------------------------------------------------------- | --------------------- |
| **ADR-0089** | Disease master data: AHL Annex II categories (Delegated 2018/1629) + WOAH WAHIS codes | Proposed (this batch) |
| **ADR-0090** | Sanitary inspections (ante/post-mortem) — OCR 2017/625 / 853/2004 / 1069/2009         | Proposed              |
| **ADR-0091** | Lab test chain-of-custody status + PDA/lab workflow                                   | Proposed              |
| **ADR-0092** | Zone-of-Alienation automation: `LabTestCompletedEvent` → geofence lockdown            | Proposed              |
| **ADR-0093** | Dual dashboards: Private Vet vs State Epidemiologist                                  | Proposed              |

## Consequences

- **No invented data.** Disease master data seeds from WOAH WAHIS; medicines + withdrawal periods
  from EMA UPD. One-time, versioned, idempotent imports — not hand-typed rows.
- **Complete cycle.** Birth → vaccination/treatment → lab test (with custody) → slaughter (with
  sanitary gate) → condemnation/alert → zone lockdown. The epidemiological loop closes.
- **Reuses infrastructure.** Outbox events, PostGIS `geofences`, Geo `runDiseaseZoneCheck`, and the
  Inspection domain already exist — this is extension, not greenfield.
- **Finer epidemiology.** Replacing `notifiable: boolean` with `diseaseCategory` enables correct
  zone triggers and reporting without losing the existing alert path (Category A/B still flag
  inspection).
- **Gated by data seeding.** Value realises only after the WOAH/EMA imports land; the schema is
  buildable independently of the imports.

## Sources

- `docs/reference/AHL_EU_CELEX_02016R0429-20191214_EN_TXT.pdf` — **Reg (EU) 2016/429 (Animal Health
  Law)**, OJ L 139, 9.4.2016; Annex II disease list; protection/surveillance zone definitions
  (Art 2(42)/(43)), zone restrictions (Art 71+).
- **Delegated Reg (EU) 2018/1629** — animal disease categories for annual Union reporting.
- **Reg (EU) 2017/625 (OCR)** — official controls, incl. ante-/post-mortem inspection.
- **Reg (EC) 853/2004** — hygiene rules for food of animal origin.
- **Reg (EC) 1069/2009 (ABP)** — Category 1 Animal By-Product condemnation/disposal.
- **WOAH WAHIS** — World Animal Health Information System master disease list + codes
  (`https://wahis.woah.org/`).
- **Reg (EU) 2019/6 (VMPR) + EMA Union Product Database (UPD)** — vet medicines + withdrawal periods
  (`https://www.ema.europa.eu/en/veterinary-regulatory/union-product-database`).
- Existing code: `packages/database/src/schema/hd/diseases.ts`, `lab-tests.ts`;
  `packages/domains/movement/src/services/movement.service.ts` (`runDiseaseZoneCheck`);
  `packages/geo` (`runDiseaseZoneCheck`); `geofences` table
  (`packages/database/src/schema/an/geofences.ts`).
