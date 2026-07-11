# ADR-0063: EUDR 2023/1115 Due-Diligence (WO-115)

- **Status:** Proposed — implemented in this change.
- **Supersedes:** —
- **Depends on:** ADR-0053 (geo / WO-110 PostGIS polygon), ADR-0054 (R1), ADR-0030 (RuleSet).

## Context

EUDR Reg (EU) 2023/1115 requires proving that cattle (CN 0102) originate from land **not
deforested after 2020-12-31**. The Slaughter Due-Diligence Statement (DDS) must overlay every
pasture a cow touched against the deforestation cutoff and **block EU export if the cutoff is
breached**. The geo foundation (WO-109/110) already provides `geofences.polygon` (PostGIS) and
`cadastral_reference`, but:

1. No deforestation status exists on any spatial entity.
2. There is no "pastures touched" traversal for an animal.
3. There is no export/slaughter gate enforcing the cutoff.

## Decision

1. **RuleSet.eudr** (ADR-0030): `enabled` (default `true`), `deforestationCutoffDate`
   (default `"2020-12-31"`). Jurisdiction-pluggable via `system_parameters`
   (`EUDR_ENABLED`, `EUDR_DEFORESTATION_CUTOFF_DATE`).
2. **Schema:** `geofences.deforestation_free_since date` (nullable). The deforestation-free
   attestation attaches to the **spatial pasture entity** — the polygon the EUDR overlay checks.
   Recreate-path migration (`db-recreate.sh`).
3. **Pastures touched:** `pasture_declarations.animal_ids` is an array.
   `MovementRepository.findPastureDeclarationsByAnimalId(animalId)` returns every declaration
   containing the animal (active + historical); each links to its `geofences` via `pasture_id`.
4. **Due-diligence core** (`runEudrDueDiligence`, Movement domain, shared): for each
   `PASTURE_BOUNDARY` geofence of the animal's pastures, flag a breach when `polygon` missing,
   `cadastral_reference` missing, `deforestation_free_since` null, or
   `deforestation_free_since > cutoff`. Returns `{ compliant, skipped, cutoff, breaches[] }`.
   If `eudr.enabled` is false → `{ skipped: true, compliant: true }`.
5. **Export/slaughter gate** (`MovementService.create`): for `SLAUGHTERHOUSE` / `HOME_SLAUGHTER`
   / `EXPORT` movements, if `eudr.enabled && !compliant` → throw `EUDR_BREACHED`
   (HTTP 403 FORBIDDEN via `MOVEMENT_TRPC_ERROR_MAP`). Mirrors the WO-113 withdrawal gate.
6. **tRPC:** `movement.eudrDueDiligence` query (class-level `authenticated: true`; no new seeded
   permission). Returns the result so operators can pre-check before slaughter.
7. **DDS document:** `eudr` `DocumentTemplate` in the PDF bot (mirrors CHED-A), registered in
   `app.module`, emits `DocumentGenerated` audit. Fetches animal + due-diligence result +
   pasture geofences and renders a Due-Diligence Statement.
8. **Validators:** `CreateGeofenceRequest` / `GeofenceResponse` gain `deforestationFreeSince`;
   `eudr.api.ts` defines the request/response contracts (NoDrift).

## Assumption (no deforestation raster)

Rocky has **no deforestation raster layer**. The "overlay" is therefore a *logical*
due-diligence: each pasture polygon must carry a declared `deforestation_free_since <= cutoff`.
A real satellite/raster overlay (sharing the PostGIS `ST_Intersects` infra from WO-119 disease
zones) can later replace the date check **without changing the gate**.

## Open Questions

- **Field placement:** `deforestation_free_since` is on `geofences` (the spatial entity the EUDR
  overlay checks). If a pasture ever has multiple geofences, the check must aggregate them.
- **>4 ha = polygon, <=4 ha = point** (ADR-0053): the DDS should record the area class; deferred
  (needs geofence area computation via PostGIS `ST_Area`).
- **Trigger scope:** EUDR applies to "relevant commodities" — cattle (CN 0102) are in scope.
  Confirm which MK export destinations require the DDS (currently gated on `EXPORT` movements).
