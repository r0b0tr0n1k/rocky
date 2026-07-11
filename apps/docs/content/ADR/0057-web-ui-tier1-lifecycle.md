# ADR-0057: Web UI — Tier 1 Lifecycle (Regulatory Core)

> Three list-only routers hold **47 procedures** between them — the richest, most regulated surfaces in the system. The design thesis: a lifecycle is not a table; it is a **journey with state**. Each gets a state-bearing UI.

| Key | Value |
| --- | --- |
| **Status** | Proposed |
| **Date** | 2026-07-11 |
| **Author** | Architecture Review (RobotFarm) |
| **Supersedes** | None |
| **Superseded** | None |

---

## Context

`earTag` (17), `health` (20), `passport` (7) are **list-only** today — the admin can see records but cannot *act* on the lifecycle (Tier 1 of ADR-0055). These are the regulatory heart: the ear-tag 6-stage order, the clinical vaccination/treatment record, the passport issue/seize/reprint chain.

Key backend procedures (grounded in `api-reference.mdx`; full list there):

- `earTag`: `listOrders`, `getOrderById`, `transitionStatus`, `collectOrderTags`, `cancelOrder`, `cancelOrderItem`, `appendToOrder`, `generateTagNumbers`, `getTakeoverFile`, `findByNumber`, `listTypes` (+5 order/stock procedures).
- `health`: `recordVaccination`, `listVaccinations`, `recordTreatment`, `listTreatments`, `recordLabTest`, `listLabTests`, `createVaccineBatch`, `listBatches`, `createDisease`/`createVaccine`, `getVaccineDiseases`/`linkVaccineDisease`.
- `passport`: `issueForAnimal`, `shipToVs`, `deliverToKeeper`, `seize`, `reprint`, `list`.

## Decision

Composed from the Phase-0 scaffold (ADR-0055), Zod-validated, RBAC-gated. Each domain's **design signature** makes its state *visible*:

### `earTag` — The 6-stage lifecycle stepper

DRAFT → SUBMITTED → CONFIRMED → SHIPPED → RECEIVED → COMPLETED. The order list is secondary; the **stepper is the hero** — `transitionStatus` advances it, `collectOrderTags` / `cancelOrder` / `cancelOrderItem` are gated side-actions. *Signature: the lifecycle stepper.*

### `health` — The clinical timeline

Per-animal **vertical timeline** of vaccinations + treatments + lab tests (sequence = the medical story). A separate **batch-inventory** panel shows stock with **expiry + low-stock warnings** (the WO-020 reconciliation surface). `recordVaccination` / `recordTreatment` / `recordLabTest` open validated forms. *Signature: the clinical timeline + batch stock-expiry warnings.*

### `passport` — The passport state machine

A **status badge** (ACTIVE / SEIZED / REPRINTED / CANCELLED) with a **gated action rail**: `issueForAnimal` → `shipToVs` → `deliverToKeeper`, plus `seize` / `reprint` (veterinary-inspector actions). Actions appear/disappear by `@Policy` permission. *Signature: the passport status badge + action rail.*

## Consequences

### Positive

The three most-regulated workflows become fully actionable from the back office — the system *acts*, not just displays.

### Negative / Cost

Largest UI effort in the program (47 procedures). The stepper/timeline require careful state-machine UI, not form boilerplate.

### Neutral

None.

## Implementation

Owning Bot: **Admin Bot** (`apps/web`). **Phase 2** of ADR-0055. Depends on Phase-0 scaffold. State transitions call the routers' Mutation procedures directly; badges derive from response `status` fields.

## Verification

```bash
rg -n "trpc.earTag.transitionStatus|trpc.health.recordVaccination|trpc.passport.seize" apps/web
# each lifecycle Mutation is wired to a UI affordance; no list-only page remains for these three
```

## Anti-Patterns

1. A flat table for `earTag` orders (the stepper *is* the UI).
2. `health` as separate list pages with no timeline (the clinical story is sequential).
3. `passport` actions shown to users lacking the `@Policy` permission.


## Component & feedback map

Cross-cutting design contract: **ADR-0060**.

| Domain | Distinctive components | Design / feedback note |
| --- | --- | --- |
| `earTag` | **Stepper** (build, ADR-0060); `data-table`→`sheet`; `row-actions`; `validated-form`; `alert-dialog` | 6-stage stepper is the hero; `notifySuccess` on `transitionStatus` |
| `health` | **Timeline** (build); `tabs`; `card` batch panel + `alert`; `validated-form` | clinical timeline; batch-expiry `alert`; `notifyError` if batch expired |
| `passport` | `status-badge` + gated action rail; `tabs`; `alert-dialog` | actions appear by `@Policy`; `alert-dialog` for `seize`/`reprint` |

## Related ADRs

- **ADR-0055** — parity charter (Tier 1, Phase 2).
- **ADR-0024** — ear-tag domain; **ADR-0026** — health domain; **ADR-0029** — passport/archive.
- **ADR-0023** — traceability; **ADR-0030** — RuleSet (thresholds).
- **ADR-0032** — tRPC; **ADR-0042** — permission UI.
