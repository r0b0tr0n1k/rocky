# ADR-0058: Web UI — Tier 1 Operational

> Six list-only routers (≈36 procedures) are *operational*, not lifecycle-driven. The design thesis: match the UI shape to the **data's natural structure** — a matrix, a map, a queue, a generator — not a one-size CRUD form.

| Key | Value |
| --- | --- |
| **Status** | Proposed |
| **Date** | 2026-07-11 |
| **Author** | Architecture Review (RobotFarm) |
| **Supersedes** | None |
| **Superseded** | None |

---

## Context

`correction`, `iot`, `notification`, `rbac`, `systemParameters`, `document` are **list-only** (Tier 1 of ADR-0055). Each has a *distinct* natural representation:

Key backend procedures (grounded in `api-reference.mdx`):

- `correction`: `create`, `list`, `review`, `resolve`, `escalate`, `reject`.
- `iot`: `createGeofence`, `listGeofences`, `deleteGeofence`, `ingestReading(s)`, `listReadings`, `logGeofenceEvent`, `listGeofenceEvents`, `registerDevice`, `listDevices`.
- `notification`: `registerDevice`, `markAsRead`, `unreadCount` (+ compose/send).
- `rbac`: `listRoles`, `getRole`, `listPermissions`, `assignRole`, `revokeRole`.
- `systemParameters`: `list` / `update` (RuleSet params).
- `document`: `generate`, `listTypes`.

## Decision

Composed from the Phase-0 scaffold, Zod-validated, RBAC-gated. Each domain's **design signature** follows its data shape:

### `correction` — The case board

A **queue** of correction cases (a-priori / a-posteriori, simple / complex) with status; `create` / `review` / `resolve` / `escalate` / `reject` are state actions. *Signature: the correction case queue.*

### `iot` — The geofence map

A **map view** rendering geofences (GeoJSON) with device/reading/event tables beside it; `createGeofence` / `logGeofenceEvent` wired. *Signature: the geofence map + sensor reading sparklines.*

### `notification` — Outbox / inbox

A **delivery-status list** (sent / delivered / failed / read); `registerDevice` + compose/send gated by permission. *Signature: the delivery-status list.*

### `rbac` — The permission matrix

Roles × permissions **grid**; `assignRole` / `revokeRole` toggle cells. This is the one place a *matrix* is the correct UI. *Signature: the role×permission grid.*

### `systemParameters` — The rule-set editor

Grouped parameter form (business / inspection groups from RuleSet, ADR-0030); `update` persists. *Signature: the grouped parameter form.*

### `document` — The generator

A **type→document generator** form (type → YAML/XML via PDF Bot) + a downloadable archive browser. *Signature: the type→document generator form.*

## Consequences

### Positive

Each operational domain gets the UI shape its data *wants*, not a forced table.

### Negative / Cost

The map (iot) and matrix (rbac) are non-trivial components; the geofence map needs a mapping dependency decision (ADR-0031 abstraction).

### Neutral

None.

## Implementation

Owning Bot: **Admin Bot** (`apps/web`). **Phase 3** of ADR-0055. Depends on Phase-0 scaffold. `iot` map behind the RuleSet `iot` flag (WO-060).

## Verification

```bash
rg -n "trpc.(correction|iot|notification|rbac|systemParameters|document)" apps/web   # all six invoked
# rbac renders a role×permission grid; iot renders a geofence map
```

## Anti-Patterns

1. A CRUD table where a matrix (rbac) or map (iot) is correct.
2. `systemParameters` as ungrouped key-values (it is a RuleSet — group it).
3. `document` without a download path for the generated artifact.

## Related ADRs

- **ADR-0055** — parity charter (Tier 1, Phase 3).
- **ADR-0031** — IoT connectivity abstraction (map/geofence); **ADR-0030** — RuleSet (params).
- **ADR-0023** — traceability (correction); **ADR-0014** — outbox (notification).
- **ADR-0022** — policy engine; **ADR-0042** — permission UI; **ADR-0050** — Permissions catalog.
