# ADR-0078: Geo Spatial Service — Extract `packages/geo` (cross-cutting, queried-for-geo-data)

> The geofence tables squat inside the IoT device-registry — a category error. Geo is spatial reference data, not a device. We extract it into its own top-level package.

| Key | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-12 |
| **Author** | Architecture Review |
| **Supersedes** | None |
| **Superseded** | None |

---

## Context

Geo concerns — geofences, disease zones, animal geofence events — currently live inside `packages/domains/iot`, a *device/sensor registry*. That is the symptom: IoT answers "which tracker / what reading"; geo answers "where". Conflating them represses the real distinction.

Geo has **no business process of its own**. It is *queried for geo data* by Movement (lineage fusion), Inspection (disease zones), Farm (holding boundaries), and the admin dashboard (active disease zones, open geofence events). It is infrastructure, not a business capability.

This materializes decisions already on the record: **ADR-0053** (Geo Module: INSPIRE / NUTS-LAU hierarchy + PostGIS polygons + LPIS cadastre) contemplated a geo module, and **ADR-0064** (Disease-Zone Spatial Block, WO-119) places disease zones in geo. This ADR is the packaging ruling that makes those real.

## Decision

Create **`packages/geo` (`@rocky/geo`)** as a **top-level cross-cutting package** — sibling to `@rocky/database` / `@rocky/validators` — **not** a domain under `packages/domains/`.

- **`GeoService`** = a spatial *query/reference* facade. No business invariants. Methods: `listGeofencesByFarm`, `findActiveDiseaseZonesByFarm`, `listGeofenceEvents`. Geo answers "where", never "may".
- **Tables** `geofences` + `animal_geofence_events` (+ disease zones) move from `packages/database/src/schema/an/` → `packages/database/src/schema/geo/`. IoT keeps `iot_devices` + `sensor_readings` (device telemetry stays IoT even when tagged with `animalId`).
- **Validators**: geofence / geofence-event / disease-zone schemas extract from `iot.api.ts` → `geo.api.ts` (consolidating the existing `diseaseZone.api.ts`).
- **Router**: new `apps/api/src/routers/geo.router.ts` (API Bot), registered in `app.module.ts`. `pnpm generate:trpc` exposes `trpc.geo.*` to web + mob.
- **RobotFarm**: add **Geo Bot** to root `AGENTS.md` + this `AGENTS.md`.

```mermaid
graph TD
  subgraph cross["Cross-cutting (top-level)"]
    DB[@rocky/database]
    VAL[@rocky/validators]
    GEO[@rocky/geo]
  end
  subgraph domains["Business domains (packages/domains/*)"]
    IOT[iot]
    MOV[movement]
    INS[inspection]
    FARM[farm]
  end
  IOT -->|keeps devices/sensors| DB
  GEO -->|owns geofences/events| DB
  MOV -->|queries lineage| GEO
  INS -->|queries disease zones| GEO
  FARM -->|queries boundaries| GEO
```

## Consequences

### Positive

- Clean separation: IoT = device registry, geo = spatial reference. The category error is resolved.
- Geo can grow toward ADR-0053 (PostGIS / INSPIRE / LPIS) without polluting IoT.
- Movement Lineage can finally fuse `geo`'s geofence events into its Timeline, closing the Symbolic/Real rift.
- Dashboard gains real geo counts (active disease zones, open geofence events).

### Negative / Cost

- Caller migration: web `iot/page.tsx` currently calls `trpc.iot.listGeofences` / `listGeofenceEvents` → must repoint to `trpc.geo.*`.
- Transient two-package state during extraction (geo queries tables that still live under `an/` until the schema move lands).

### Neutral

- Reuses ExecutionPipeline + RLS stage; no new auth/authorization model required (geo owns no business action).

## Implementation

Owning Bot: **Geo Bot** (new) + **Database Bot** (schema move) + **Validation Bot** (`geo.api.ts`) + **API Bot** (`geo.router.ts`). RobotFarm pass: update root `AGENTS.md` Bot descriptions + Child RobotFarm Index, and this `AGENTS.md`.

## Verification (Definition of Done)

```bash
ls packages/geo/src/services/geo.service.ts              # geo package exists
ls packages/geo/AGENTS.md                                 # Bot contract present
rg -n "ADR-00(53|64|33)" 0078-geo-spatial-service.md      # backend deps cited
pnpm check:agents                                         # Geo Bot declared, 0 stale
ls packages/database/src/schema/geo/                     # tables extracted (pass 2)
```

## Anti-Patterns (do not repeat)

1. Treating geo as a business domain with workflows — it is a *query* service.
2. Leaving geofences inside IoT — the category error this ADR resolves.
3. Putting business invariants in `GeoService` — geo answers "where", not "may".

## Related ADRs

- **ADR-0053** — Geo Module: INSPIRE / NUTS-LAU Hierarchy + PostGIS Polygons + LPIS Cadastre (foundation).
- **ADR-0064** — Disease-Zone Spatial Block (WO-119) (disease zones live here).
- **ADR-0033** — Frontend & Mobile Architecture-Decision Standard (RobotFarm discipline).
