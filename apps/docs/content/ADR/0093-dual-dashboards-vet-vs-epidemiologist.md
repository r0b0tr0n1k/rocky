# ADR-0093: Dual Dashboards — Private Vet vs State Epidemiologist

> The same data serves two opposite subjectivities. The private vet needs productivity; the state
> epidemiologist needs panoptic surveillance. This ADR specifies two distinct web experiences built
> on the data the Veterinary & Sanitary expansion produces.

| Key | Value |
| --- | --- |
| **Status** | Proposed |
| **Date** | 2026-07-13 |
| **Author** | Architecture Review (user directive: expand Veterinary & Sanitary modules) |
| **Supersedes** | None |
| **Superseded** | None |

## Context

`apps/web` is the admin panel. Today it has generic list pages, but no role-differentiated health
views. The expansion (ADR-0088…0092) produces: due vaccinations, calves needing tags, today's
treatments (vet productivity), and lab-result geography, disease zones, condemnation alerts
(surveillance). One undifferentiated screen serves neither user. The Geo module already exposes LPIS
polygons + PostGIS (ADR-0053/0078), so the map backbone exists.

## Decision

Two distinct, permission-scoped web experiences:

1. **Private Vet Dashboard** (role: vet / farm vet) — productivity-first:
   - Vaccinations due; calves awaiting ear tags; treatments administered today; open lab samples
     (`sampleStatus` from ADR-0091); animals under movement ban.
   - Scoped to the vet's bound farms (RLS).
2. **State Epidemiologist Dashboard** (role: state epidemiologist / veterinary authority) — surveillance-first:
   - National map (Leaflet/Mapbox) of **LPIS polygons** + active `geofences` / disease zones
     (ADR-0092), with **heatmaps of `lab_tests` results** (positive clusters).
   - Live alerts: overdue birth notifications, CATEGORY_A zone lockdowns, post-mortem condemnations
     (ADR-0090), notifiable-disease flags.
   - A panoptic, read-mostly view of the nation's biological health.

Both consume existing tRPC queries; no new backend beyond what ADR-0088…0092 delivers. Permissions
follow the `@Policy`/Principal model (ADR authorization package).

## Consequences

- The same Diamond Seal data serves the productive individual and the panoptic State — two realities,
  one source of truth.
- Reuses Geo/LPIS map backbone and the tRPC/authorization layer; mostly frontend composition.
- Clear role separation prevents the vet from drowning in surveillance noise and the epidemiologist
  from lacking the national picture.
- Cost: two dashboard pages + map/heatmap components; no schema change.

## Compliance & Standards

This ADR's dual dashboards (vet vs state epidemiologist) enforce purpose- and role-based segregation
of access documented in the canonical Statement of Applicability:

- [Statement of Applicability — ROCKY-ISMS-001](../compliance/isms-policy.md) — A.5.15 / A.5.18 (access rights), A.8.3 (information access restriction).

## Sources

- **Reg (EU) 2016/429 (AHL)** — surveillance and reporting obligations (epidemiologist view).
- Existing: `apps/web` admin panel; `packages/geo` (LPIS/PostGIS, ADR-0053/0078);
  `packages/authorization` (Principal/@Policy); ADR-0088 (Component 4), ADR-0090/0091/0092 (data
  sources).
