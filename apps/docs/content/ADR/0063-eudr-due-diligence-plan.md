# ADR-0063: EUDR 2023/1115 Due-Diligence (WO-115)

| Key | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-11 |
| **Author** | Architecture Review (regulatory strike, prompted by user directive) |
| **Supersedes** | None |
| **Superseded** | None |
| **Related** | ADR-0053 (geo / WO-110 PostGIS); ADR-0054 (R1); ADR-0030 (RuleSet); WO-115 (EUDR); ADR-0025 (animal-movement-domain — EUDR gates movement create) |

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

## Consequences

### Positive

- EUDR due-diligence is a first-class guillotine (slaughter/export blocked on a deforestation breach), consistent with WO-113/115.
- Pasture-overlay logic reuses the PostGIS `ST_Intersects` infra from WO-119; the gate is config (`eudr.enabled`), not a fork.

### Negative / Cost

- Requires `geofences.deforestation_free_since` populated; with no seeded raster, the check is logical (declared date), not a satellite overlay.
- The export/slaughter path gains a synchronous due-diligence call (acceptable — not hot-path).

### Neutral

- Schema adds one nullable column; migration via `db-recreate.sh`. No new router permission.

## Open Questions

- **Field placement:** `deforestation_free_since` is on `geofences` (the spatial entity the EUDR
  overlay checks). If a pasture ever has multiple geofences, the check must aggregate them.
- **>4 ha = polygon, <=4 ha = point** (ADR-0053): the DDS should record the area class; deferred
  (needs geofence area computation via PostGIS `ST_Area`).
- **Trigger scope:** EUDR applies to "relevant commodities" — cattle (CN 0102) are in scope.
  Confirm which MK export destinations require the DDS (currently gated on `EXPORT` movements).

## Implementation (verified 2026-07-12)

EUDR due-diligence is **built and Accepted**, not aspirational. Verified in code:

- **Due-diligence core + export gate** — `packages/domains/movement/src/services/eudr-due-diligence.ts`
  (`runEudrDueDiligence` + the `EUDR_BREACHED` 403 gate on `SLAUGHTERHOUSE` / `HOME_SLAUGHTER` /
  `EXPORT` movements per Decision 5). The Slaughter DDS overlays every pasture against the
  `2020-12-31` cutoff and **blocks EU export on breach**.
- **Deforestation raster** — ADR-0063's original "no raster layer" assumption is **resolved by
  ADR-0079** (Geo Map-Provider Abstraction + Deforestation Raster Overlay): the overlay is now a
  swappable, testable seam (`packages/geo/src/services/deforestation.service.ts`) rather than a
  logical date-only check. WO-143 wired the `/admin/geo` Forest/EUDR overlay toggle.
- **Validators** — `packages/validators/src/api/eudr.api.ts` defines the request/response contracts
  (NoDrift); `geofences.deforestation_free_since` is in the schema.
- **DDS document** — the `eudr` `DocumentTemplate` in the PDF bot (Decision 7) emits the Due-Diligence
  Statement alongside CHED-A (ADR-0062).

**Feature-parity evidence:** see gap-analysis **§14** (Rocky vs EUDR.Supply scorecard) and **WO-154**.
