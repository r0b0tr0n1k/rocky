# ADR-0092: Zone-of-Alienation Automation — LabTestCompletedEvent → Geofence Lockdown

> When a lab result comes back positive for a Category A disease (e.g., Anthrax, Foot & Mouth), the
> region must be locked down instantly. This ADR listens for `LabTestCompletedEvent` and, for
> Category A, draws the legally mandated 3 km protection / 10 km surveillance zones and freezes every
> farm inside them. It extends the *existing* `declareDiseaseZone` / `runDiseaseZoneCheck` machinery.

| Key | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-13 |
| **Author** | Architecture Review (user directive: expand Veterinary & Sanitary modules) |
| **Supersedes** | None |
| **Superseded** | None |

## Context

The AHL (Reg 2016/429) defines **protection zones (3 km)** and **surveillance zones (10 km)** around
an infected holding (Art 2(42)/(43)). Rocky already has the pieces: a `geofences` table
(`isActive` + PostGIS `polygon`), `declareDiseaseZone` / `GeoService.runDiseaseZoneCheck`,
`MovementService.runDiseaseZoneCheck` (used to block movements inside active zones), the
`diseaseZoneEnabled` system parameter, and the Outbox. What is missing is the **automated trigger**:
a positive Category A result does not yet draw the zones or freeze farms.

## Decision

1. **Event listener:** a service subscribes to `LabTestCompletedEvent` (ADR-0091). If
   `disease.diseaseCategory == CATEGORY_A` and `result` is positive, it triggers the lockdown.
2. **Draw zones:** use the farm's coordinates to create two `geofences` — a **3 km protection zone**
   and a **10 km surveillance zone** — reusing `declareDiseaseZone` / `GeoService` spatial helpers
   (ADR-0053/0078). The zones are linked to the disease + source movement for traceback.
3. **Freeze farms:** set `isActive = false` on every farm whose `polygon` intersects either zone
   (PostGIS), and rely on the existing `runDiseaseZoneCheck` block in `MovementService` to refuse
   movements out of frozen farms. (`diseaseZoneEnabled` gates the whole behaviour.)
4. **Cross-link:** also call `InspectionRepository.flagFarmForInspection()` for retroactive
   inspection of the origin farm (ties to ADR-0090 condemnation traceback).

## Consequences

- Pure automated state power: a positive Category A result → instant geometric lockdown, no human in
  the loop. This is the "Zone of Alienation" the expansion requires.
- Reuses, does not rebuild: geofences, Geo zone check, Outbox, and `diseaseZoneEnabled` already
  exist (ADR-0064/0080).
- Correct legal geometry: 3 km / 10 km per AHL Art 2(42)/(43).
- Cost: one event-listener service + the zone-draw call; the freeze/block path is already built.

## Implementation Status

Implemented (2026-07-13) via the outbox pipeline (no new standalone service — the existing
`OutboxEventHandlers` registry is the listener):

- `apps/api/src/jobs/outbox-handlers.ts` — registers `lab_test.completed` → `handleLabTestCompleted`,
  which gates on `DISEASE_CATEGORY.CATEGORY_A` + `TEST_RESULT.POSITIVE`, then calls
  `GeoService.declareDiseaseZone(farmId, woahCode)` (the 3 km / 10 km draw, ADR-0078) and
  `InspectionService.flagFarmForInspection(...)` for retroactive inspection.
- `packages/domains/health/src/services/health.service.ts` — `recordLabTest` now publishes
  `LabTestCompletedEvent` (`type: "lab_test.completed"`, `OUTBOX_AGGREGATE_TYPE.LAB_TEST`).
- `packages/database/src/constants/outbox-aggregate-type.ts` — added `LAB_TEST` to the canonical enum.
- The movement block (`runDiseaseZoneCheck`) already refuses movements out of the active zones,
  so no farm-deactivation code was needed for the legal lockdown.

## Sources

- **Reg (EU) 2016/429 (AHL)** — protection/surveillance zone definitions, Art 2(42)/(43), zone
  restrictions (Art 71+).
- Existing: `packages/database/src/schema/an/geofences.ts`; `packages/geo` (`runDiseaseZoneCheck`);
  `packages/domains/movement/src/services/movement.service.ts` (`runDiseaseZoneCheck`);
  `diseaseZoneEnabled` (`packages/domains/system/src/rule-set.ts`); ADR-0064, ADR-0080, ADR-0088
  (Component 3), ADR-0091 (event source).
