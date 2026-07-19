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

## References

### Project documentation standards

- **ROCKY-DOC-STD-001** ([Writing Technical Documents](../how-to/writing-technical-documents.mdx)) —
  the house standard for internal engineering documents (structure, controlled language, templates).
  This ADR and its implementation artefacts (dashboard spec, UX rationale) follow its structure.
- **Internal Standard Style** ([`Standardization/internal-standard-style.md`](../Standardization/internal-standard-style.md)) —
  house style guide for formatting, clause numbering, and terminology. The dashboard labels, column
  headings, and status chips follow its vocabulary conventions.
- **ADR-0052** — Documentation Architecture (Diátaxis). The dashboards live under `reference/`
  (factual description) and `how-to/` (operational use); this ADR is the decision record.
- **Writing ISO-Compatible Documentation** ([`Standardization/writing-iso-compatible-documentation.md`](../Standardization/writing-iso-compatible-documentation.md)) —
  discipline for formal regulatory documents that the dashboards may surface (e.g. disease reports,
  inspection summaries rendered as ISO-style clauses).

### External ergonomics & accessibility standards

- **ISO 9241-110:2006** — Dialogue Principles (suitability for task, self-descriptiveness,
  conformity with user expectations, error tolerance). The vet dashboard prioritises task efficiency;
  the epidemiologist dashboard prioritises surveillance completeness — each role gets a dialogue
  suited to its work.
- **ISO 9241-151:2008** — Guidance on World Wide Web User Interfaces (navigation structure, search,
  content presentation). Applies to both dashboards as web admin surfaces.
- **ISO 9241-12:1998** — Presentation of Information (information grouping, sorting, visual coding).
  Both dashboards use data tables, KPI tiles, and maps — visual coding must not rely on colour alone
  (legends + labels required).
- **ISO 9241-143:2012** — Form-based dialogues (filters, search panels, date-range selectors common
  to dashboard controls).
- **ISO 9241-161:2016** — Visual User Interface Elements (buttons, menus, tabs, lists). The
  component palette for both dashboard views.
- **ISO 9241-171:2008** — Guidance on Software Accessibility (keyboard navigation, colour contrast,
  screen-reader support). Mandatory for an admin tool used by diverse civil servants.

### Supporting disciplines

- **ISO 704:2009** — Terminology Work (concept analysis, term formation, definition drafting).
  Dashboard labels, filter names, and status values must use consistent terminology across both
  role views and with the underlying domain models to avoid confusing vet and epidemiologist users.
- **ISO 9001:2015** — Quality Management Systems (clause 7.5: documented information). The
  dashboard UI itself is not a QMS-documented output, but its design process follows
  document-control discipline: versioned UX specs, review-and-approve gates, traceability to
  user requirements.
