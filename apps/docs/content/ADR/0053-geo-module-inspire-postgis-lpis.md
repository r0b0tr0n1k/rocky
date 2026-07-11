# ADR-0053: Geo Module: INSPIRE / NUTS-LAU Hierarchy + PostGIS Polygons + LPIS Cadastre

| Key            | Value                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| **Status**     | Accepted                       |
| **Date**       | 2026-07-11                                                             |
| **Author**     | Architecture Review (Geo & Regulatory strike, prompted by user direction) |
| **Source**     | User directive "The Map and the Territory"; TRACES NT; EU AHL 2016/429; INSPIRE Directive 2007/2/EC; LPIS / CAP; Baudrillard _Simulacra and Simulation_ |
| **Supersedes** | Implicit debt confessed in `geofences.ts` ("PostGIS polygon column can be added later") |
| **Superseded** | None |
| **Related**    | ADR-0030 (RuleSet — jurisdiction params); ADR-0023 (traceability); ADR-0028 (risk); ADR-0054 (regulatory compliance) |

> _sniffs_ The cow grazing on a pasture that is not a valid polygon in the state database is eating
> **illegal grass**. The map precedes the territory; the Symbolic (the polygon) constitutes the Real
> (the pasture). This ADR makes the geo-module a sovereign GIS engine, not a drawer of pretty shapes.

## Context

Today the geo-module is ideologically broken in three ways:

1. **`admin_units` has no hierarchy.** It is a flat list (`id, name, auId`) with no `level` and no
   `parent_id`. It cannot represent NUTS 1/2/3 → LAU, so deploying outside Macedonia (PL voivodeships,
   DE Regierungsbezirke, …) requires a fork, not config. This contradicts ADR-0030.
2. **`geofences.geometry` is `jsonb`.** Under EU AHL, a Foot-and-Mouth outbreak demands an instant
   3 km Protection Zone + 10 km Surveillance Zone and a block on every farm whose polygon _intersects_
   those zones. A JSONB column cannot do a performant spatial intersection. The repo already admits this
   (`geofences.ts` comment: "PostGIS polygon column can be added later").
3. **No cadastral link.** A farm boundary is tied to CAP subsidies (LPIS). The legal reality is the
   cadastral parcel ID, not the drawn coordinates.

`animal_geofence_events.location` already uses `geometry(point, 4326)` from
`packages/database/src/geometry/postgis.ts`, so the PostGIS path is proven — we only lack a **polygon**
helper and the column.

## Decision

### 1. `admin_units` becomes a NUTS/LAU tree

- Add `level varchar(12) NOT NULL DEFAULT 'LAU'` — values `NUTS1 | NUTS2 | NUTS3 | LAU` (varchar, like
  `detection_source`, so new jurisdictions add levels without migration).
- Add `parent_id uuid REFERENCES admin_units(id)` (self-reference) to climb the tree.
- Add `nuts_code varchar(20)` (the official NUTS/LAU code) for TRACES reporting.
- Index `(level)` and `(parent_id)`.

The address model now survives any jurisdiction: it just climbs the NUTS tree regardless of how many
levels a country has.

### 2. `geofences.geometry` jsonb → native PostGIS `POLYGON (EPSG:4326)` + GiST

- Extend `packages/database/src/geometry/postgis.ts` with `polygonGeometry(columnName)` (mode `xy`,
  type `polygon`, srid `4326`).
- Replace `geometry: jsonb` with `polygon: geometry("polygon", { type: "polygon", srid: 4326 })`.
- `CREATE INDEX ... USING GIST (polygon)`.
- Keep the jsonb `geometry` column during a transition window (dual-write) then drop it once the API
  migrates (see Migration Plan).
- All regulatory spatial logic (disease zones, EUDR overlay) queries `polygon` via PostGIS functions
  (`ST_Intersects`, `ST_DWithin`, `ST_Contains`), never the jsonb.

### 3. `geofences.cadastral_reference varchar(100)`

- The legal parcel ID. The coordinate polygon is for internal GIS math; `cadastral_reference` is the
  truth reported to TRACES/LPIS. Drawing a polygon without a cadastral ref is rejected at the API.

### 4. `addresses.location varchar` → PostGIS `POINT (EPSG:4326)` (latent debt, WO-111)

- `addresses.ts` _claims_ PostGIS but `location` is `varchar(100)`. Add `location_geom
  geometry(Point, 4326)`, backfill from the varchar, then drop the varchar. Lower priority than the
  geofence polygon; tracked separately.

### 5. OpenStreetMap is the Imaginary — display & telemetry only

- **Use OSM for:** base-map tiles (Leaflet/Mapbox in web+mobile), routing/ETA for transport vehicles,
  reverse geocoding (Nominatim) of IoT bolus coordinates to readable places.
- **NEVER use OSM for:** legal boundary validation. If OSM says 5 ha but the Cadastre (LPIS) says 4.2 ha,
  the State is the truth. OSM boundaries are hobbyist drawings; they do not constitute the Symbolic.

## Migration Plan (draft SQL — NOT yet executed)

```sql
CREATE EXTENSION IF NOT EXISTS postgis;

-- admin_units NUTS/LAU tree
ALTER TABLE admin_units ADD COLUMN level varchar(12) NOT NULL DEFAULT 'LAU';
ALTER TABLE admin_units ADD COLUMN parent_id uuid REFERENCES admin_units(id);
ALTER TABLE admin_units ADD COLUMN nuts_code varchar(20);
CREATE INDEX idx_admin_units_level ON admin_units(level);
CREATE INDEX idx_admin_units_parent ON admin_units(parent_id);

-- geofences: PostGIS polygon + cadastral ref (dual-write window)
ALTER TABLE geofences ADD COLUMN polygon geometry(Polygon, 4326);
UPDATE geofences SET polygon =
  ST_SetSRID(ST_GeomFromGeoJSON(geometry::text), 4326)::geometry(Polygon, 4326)
  WHERE geometry IS NOT NULL;
CREATE INDEX idx_geofences_polygon ON geofences USING GIST (polygon);
ALTER TABLE geofences ADD COLUMN cadastral_reference varchar(100);

-- later (after API migration): DROP COLUMN geometry;
```

`drizzle-kit` cannot express `geometry(Polygon,4326)` natively, so this ships as a hand-written
migration run through `scripts/fix-rls-sql.mjs` + `psql` (per AGENTS Phase-1 DB workflow), not `push`.

## Consequences

### Positive

- Disease-zone intersection (3 km / 10 km) becomes a millisecond PostGIS query, not app-side jsonb scanning.
- Cross-jurisdictional deployment is config (RuleSet + NUTS tree), not a fork.
- TRACES/LPIS reports carry the legal cadastral ref, satisfying the Big Other.

### Negative

- API impact: `iot.service` geometry validation (`GeofenceGeometry` Zod) must emit WKT/hex EWKB, not
  jsonb; mobile map-draw must POST WKT. Dual-write window needed.
- Migration is hand-written (no `drizzle-kit` PostGIS support).

### Open

- RLS on `polygon` column reuses `rlsForFarmColumn(farmId)` — same policy, new column.
- SRID enforcement: reject inserts with SRID != 4326.


## Evidence needed (G1-G5 now CITED — see ADR-0054 Evidence Register)
Geo citations (INSPIRE 2007/2/EC; NUTS 1059/2003; LPIS/CAP 2021/2116; EPSG:4326; OSM/Nominatim ToS)
are user-provided and tracked as `CITED` in ADR-0054. Before WO-109/110 execute, promote them to
`VERIFIED` by attaching the primary-source PDFs. The technical migration (PostGIS polygon, cadastral
reference, NUTS/LAU tree) is sound regardless of the exact article numbers.

> **CRITICAL axis-order trap (verified, regulatory-verification-report.md §CRS):** EPSG:4326 is defined
**latitude-first** by EPSG, but GeoJSON, mapping libraries, and PostGIS spatial indexes expect
**longitude-first**. The ingestion layer MUST normalize axis order before persisting or querying -
otherwise every spatial intersection (disease zones, EUDR overlay) is computed on swapped coordinates.
Add a `normalizeAxisOrder()` step in `iot.service` geofence ingest + the Nominatim reverse-geocode path.

## Workorder strikes (draft)

- **WO-109** — `admin_units` NUTS/LAU `level` + `parent_id` + `nuts_code` + indexes + RuleSet seed.
- **WO-110** — `geofences` PostGIS `POLYGON` + GiST + `cadastral_reference`; `postgis.ts` polygon helper; dual-write + API migration; drop jsonb.
- **WO-111** — `addresses.location` varchar → PostGIS `POINT`.
- **WO-112** — OSM integration boundaries doc + Nominatim reverse-geocode helper (telemetry only).
