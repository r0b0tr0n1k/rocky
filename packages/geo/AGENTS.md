# Geo Bot — `packages/geo/`

Spatial query/reference service for the livestock estate. Owns geofences, disease zones, and animal geofence events — the *where* of the registry — plus the spatial engine, the swappable map-provider boundary, and the EUDR deforestation-monitoring seam.

## Scope

- `packages/geo/src/**` — errors, repositories, services, and the `geo.router.ts` tRPC router (registered in `apps/api/src/app.module.ts`). Geofence mutations (`createGeofence`, `deleteGeofence`, `logGeofenceEvent`) and all geofence / disease-zone queries live here, relocated out of `iot.router.ts` per ADR-0078. `declareDiseaseZone` (ADR-0080) is built — anchored to the nearest settlement, derived as geodesic circles.
- Tables: `geofences`, `animal_geofence_events` (extracted out of `packages/database/src/schema/an/` into `packages/database/src/schema/geo/` per ADR-0078).
- Services:
  - `GeoService` — spatial *reference* facade (queried for geo data by other capabilities). Hosts `runDiseaseZoneCheck` (WO-119 / ADR-0064) — the canonical disease-zone spatial block, relocated here from the Movement domain per ADR-0078 — and `declareDiseaseZone(farmId, disease, opts)` (ADR-0080): resolves the farm's `farms.location`, finds the **nearest settlement** (KNN over the provided `settlements` reference layer), buffers that center into PROTECTION (3 km) / SURVEILLANCE (10 km) **geodesic circles**, and persists `disease_zone` geofences (dual-written `geometry` + `polygon`).
  - `PolygonService` — pure, deterministic spatial engine (axis-order normalization, geodesic area in ha, haversine, point-in-polygon, ring validation). No DB, no network.
  - `MapTilerMapService` (`GeoMapProvider`) — swappable external map provider (geocode, static maps, elevation, coordinate transform, geolocation).
  - `DeforestationMonitor` (`RasterSourcePort`) — EUDR deforestation raster overlay (ADR-0063 resolution).

## Nature: infrastructure, not a business domain

Geo has **no business workflow of its own**. It is *queried for geo data* by other capabilities — Movement (lineage fusion), Inspection (disease zones, ADR-0064), Farm (holding boundaries), and the admin dashboard (active disease zones, open geofence events). It is therefore a top-level cross-cutting package (sibling to `@rocky/database`, `@rocky/validators`), **not** a domain under `packages/domains/`.

## Responsibilities

- Spatial reference queries + geofence mutations (canonical geo home): `createGeofence`, `listGeofences`, `deleteGeofence`, `logGeofenceEvent`, `listGeofenceEvents`, `findActiveDiseaseZones`, `findGeofencesForAnimalPastures`, `findGeofencesIntersectingPolygon`, `findActiveDiseaseZonesNearFarm`.
- Basic persistence for geofences + events (no event queues, no real-time evaluation engine).
- **Spatial engine** (`PolygonService`): EPSG:4326 axis-order normalization, geodesic polygon area in hectares, haversine distance, point-in-polygon, ring validation — the sovereign geometry truth the EUDR guillotine leans on.
- **Map-provider boundary** (`GeoMapProvider`): MapTiler Cloud today, swappable for a self-hosted server with zero caller change.
- **EUDR deforestation monitoring** (`DeforestationMonitor`): overlays a deforestation raster against a geofence polygon and returns an EUDR-ready verdict; `NoDataRasterSource` is the graceful "no coverage yet" default that falls back to the declared date.
- EUDR traversal: `findGeofencesForAnimalPastures` (pastures touched → geofences), `findGeofencesIntersectingPolygon` (`ST_Intersects` seam), `findActiveDiseaseZonesNearFarm` (proximity via `ST_DWithin` in metres — WO-119 / AHL 2016/429 reuse).
- Disease-zone spatial check: `runDiseaseZoneCheck` (ADR-0064) returns whether a farm lies inside an active PROTECTION (3 km) / SURVEILLANCE (10 km) zone; the Movement gate and the WO-121 CHED exporter (`imsoc.requireDiseaseClear`) consume it. Reuses `findActiveDiseaseZonesNearFarm` (`ST_DWithin`, geography cast).
- Disease-zone **declaration** (ADR-0080, built): `declareDiseaseZone(farmId, disease, opts)` resolves the farm's `farms.location`, finds the **nearest settlement** via KNN over the provided `settlements` reference layer (`GeoRepository.findNearestSettlement`), and buffers that center into a PROTECTION (3 km) + concentric SURVEILLANCE (10 km) `disease_zone` geofence as **geodesic circles** (`PolygonService.geodesicCircle`) — never hand-drawn by vets/farmers; the authoritative reference data is **provided to us** on go-live. Radii come from `RuleSet.thresholds` (3 km / 10 km are AHL floors). The settlement name is the public label. Falls back to the farm point if no settlement is known. **Critical:** the check intersects `geofences.polygon` (PostGIS), so declaration MUST dual-write `polygon` (WKT from the circle ring) alongside `geometry`, or the block silently never fires. WAHIS is an upstream *alert* feed (country-level, no premises GPS), not the geometry source. The `settlements` table migration is pending push; until then the KNN falls back to the farm point.
- Reuses the ExecutionPipeline + RLS stage; never throws to callers (returns `Result<T,E>`).
- Grows toward ADR-0053 (INSPIRE / NUTS-LAU + PostGIS polygons + LPIS cadastre) and ADR-0064 (Disease-Zone Spatial Block).

## Swappability & ToS

- **Map provider**: `GeoMapProvider` is the contract; `MapTilerMapService` the current impl. A self-hosted map server implements the same interface and is swapped at the composition root (`apps/api/src/app.module.ts`) — no caller changes.
- **MapTiler ToS**: geocoding and static-map results are licensed for *client-side* use; server-side use here is a transitional convenience. Review the ToS before production.
- **Deforestation raster**: heavy Sentinel-2 ingestion (EOPF Zarr, SCL cloud-masking, DN→reflectance) lives in an external Python/xarray job. This package owns the per-pixel decision kernels (`computeNdvi`, `forestMask`, `forestChange`, `lossYear`) and the overlay verdict — ported from that notebook to typed arrays.

## Testing discipline

- `PolygonService` and the deforestation kernels are deterministic and fully unit-tested: `src/services/polygon.service.test.ts`, `src/services/deforestation.service.test.ts`.
- Run with `pnpm --filter @rocky/geo test` (vitest).

## RobotFarm

Geo Bot is a node in the RobotFarm network (see root `../../AGENTS.md`). This file is the local contract; the root index is the rail.

## Documentation

This bot is maintained to the repo-wide standard (root `../../AGENTS.md` §Documentation Discipline):

- Architecture decisions → ADR (`cp ../../apps/docs/content/ADR/ADR-TEMPLATE.md ../../apps/docs/content/ADR/00NN-slug.md`), Proposed → Accepted. Validate `pnpm check:adrs`.
  - ADR-0078 — Geo spatial service package extraction.
  - ADR-0079 — Geo map-provider abstraction & deforestation raster overlay (ADR-0063 resolution).
- Doc pages → correct Diátaxis quadrant per [ADR-0052](https://github.com/r0b0tr0n1k/rocky/blob/main/apps/docs/content/ADR/0052-documentation-architecture.md). Validate `pnpm check:md-links`.
- Recipes: [Write an ADR](https://github.com/r0b0tr0n1k/rocky/blob/main/apps/docs/content/how-to/write-an-adr.mdx) · [Add a doc page](https://github.com/r0b0tr0n1k/rocky/blob/main/apps/docs/content/how-to/add-a-doc-page.mdx) · [Run the Guardians](https://github.com/r0b0tr0n1k/rocky/blob/main/apps/docs/content/how-to/run-the-guardians.mdx).
- Gateway: `pnpm ci:checks` green before merge.
