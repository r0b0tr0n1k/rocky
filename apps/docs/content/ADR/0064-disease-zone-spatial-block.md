# ADR-0064: Disease-Zone Spatial Block (WO-119)

| Key | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-11 |
| **Author** | Architecture Review (regulatory strike, prompted by user directive) |
| **Supersedes** | None |
| **Superseded** | None |
| **Related** | WO-119 · ADR-0053 (Geo/PostGIS) · ADR-0054 (Regulatory R1–R10, AHL 2016/429) · WO-115 (EUDR overlay) · WO-121 (CHED `requireDiseaseClear`); ADR-0025 (animal-movement-domain — disease-zone gates cross-farm moves) |

## Context

A confirmed notifiable-disease premises triggers an EU Animal Health Law (Reg. 2016/429, Art.21-22)
restriction: a **PROTECTION zone** (3 km) and a concentric **SURVEILLANCE zone** (10 km) around the
infected holding. Within the protection zone, animals may not move off the premises without official
licence (quarantine). Within the surveillance zone, exports are prohibited without certification.

WO-109/WO-110 delivered `geofences.polygon` (PostGIS) and `farms.location` (PostGIS point, SRID 4326).
ADR-0054 already specifies the rule path `ruleset.thresholds.protectionZoneKm` (3) /
`surveillanceZoneKm` (10) and a `ST_DWithin` intersection. This ADR turns that into enforced code.

## Decision

1. **Disease zones are geofences.** A new `fence_type = 'disease_zone'` marks the infected-premises
   polygon. No new table — the geofence already carries `polygon`, `farm_id`, `is_active`, `name`.
2. **Radii are RuleSet-driven.** `RuleSetThresholds.protectionZoneKm` (default 3) and
   `surveillanceZoneKm` (default 10) + `diseaseZoneEnabled` (default true). Read via `buildRuleSet`,
   never hardcoded (ADR-0054 mandate).
3. **Spatial intersection via `ST_DWithin` on cast-to-geography.** `movement` asks
   `GeoService.findActiveDiseaseZonesNearFarm(farmId, radiusMeters)` (extracted from IoT into
   `packages/geo` per ADR-0078), which joins
   `geofences.polygon::geography` against `farms.location::geography` with `ST_DWithin(..., meters)`.
   The geography cast is mandatory: a SRID-4326 *geometry* `ST_DWithin` would measure in **degrees**,
   silently turning 3 km into ~0.027°, a classic GIS bug.
4. **Shared, reusable check.** `runDiseaseZoneCheck(geoService, ruleSet, fromFarmId)` returns
   `{ enabled, inProtectionZone, inSurveillanceZone, protectionZones, surveillanceZones }`. The
   `MovementService.create()` gate consumes it (protection → block all cross-farm moves; surveillance
   → block EXPORT), and WO-121's CHED exporter can consume it for `imsoc.requireDiseaseClear`.
5. **Gate + query, not a PDF doc.** WO-119 is the spatial *block*. A `movement.diseaseZoneCheck` query
   exposes the result for UX (map highlight). No new document template; the CHED `requireDiseaseClear`
   tie-in is deferred (animals have no direct `farmId`; the source holding must be resolved via the
   movement/registration — tracked separately).

## Block matrix

| Zone            | Blocked movement types (from a holding in the zone)        |
| --------------- | ------------------------------------------------------------ |
| Protection 3 km | ANY cross-farm movement (`fromFarmId !== toFarmId`) — quarantine |
| Surveillance 10 km | `EXPORT` only                                             |

Both return **403 FORBIDDEN** (`MOVEMENT_DISEASE_ZONE_BREACHED`).

## Consequences

- **Positive:** Disease control is now a first-class regulatory guillotine, consistent with WO-113/115;
  radii are jurisdiction-overridable; the same `geofences.polygon` infra serves EUDR + disease zones.
- **Negative:** Requires PostGIS `ST_DWithin` + a populated `disease_zone` geofence. With no disease
  zones seeded, every check returns `inProtectionZone:false` (no false blocks). The `geography` cast
  assumes SRID 4326 — a misconfigured `farms.location` SRID would corrupt distances.
- **Maintenance:** If the disease-zone declaration workflow lands, it only needs to `INSERT` a
  `disease_zone` geofence; the block lights up automatically. The collection/declaration
  mechanism — per-premises declaration (AHL 2016/429 Art.21-22), the Geo-owned
  `declareDiseaseZone` service, the missing `geo.router.ts`, and the mandatory `polygon`
  dual-write — is specified separately in **ADR-0080**.

## Validation

- `rule-set` unit: `protectionZoneKm`/`surveillanceZoneKm`/`diseaseZoneEnabled` build from params.
- `disease-zone.test.ts`: disabled → skipped; protection hit; surveillance hit; no-zone clear.
- `pnpm test` green; `movement.router.diseaseZoneCheck` returns the typed response.
