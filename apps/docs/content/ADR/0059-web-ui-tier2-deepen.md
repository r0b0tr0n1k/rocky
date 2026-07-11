# ADR-0059: Web UI — Tier 2 Deepen

> Five routers already have *partial* CRUD (Tier 2 of ADR-0055). The design thesis: **deepen, don't rebuild** — wire the missing Mutations into the existing pages so the lifecycle is complete.

| Key | Value |
| --- | --- |
| **Status** | Proposed |
| **Date** | 2026-07-11 |
| **Author** | Architecture Review (RobotFarm) |
| **Supersedes** | None |
| **Superseded** | None |

---

## Context

`archive`, `device`, `inspection`, `movement`, `organization` have pages + some forms, but specific procedures are **un-wired**:

Key backend procedures (grounded in `api-reference.mdx`):

- `archive`: `list`, `create`, `listExpired`, `markArchived`, `markDestroyed`, `archiveInspectionForm`.
- `device`: `create`, `update`, `assignUser`, `recordSync`, `registerFailedAttempt`, `unblock`.
- `inspection`: `create`, `schedule`, `complete`, `printForm`, `runRiskAnalysis` (+ listByFarm).
- `movement`: `recordDeath`, `declarePasture`, `declareAlpine` / `returnFromAlpine`, `recordSlaughter`, `importEU` / `importThirdCountry`, `exportAnimal`, `recordMarketTransaction` / `…Unsold` / `…Slaughter`.
- `organization`: `list`, `listByType`, `create` (+ missing `edit`).

## Decision

Extend the **existing** pages (do not rewrite) with the missing affordances. Each gets a **design signature** for the missing piece:

### `archive` — 3-tier browser + retention

Add a **tier filter** (CPC / VS / VI) and **retention-expiry badges**; wire `listExpired` + `markDestroyed` (the daily retention job's manual counterpart). *Signature: the tier filter + retention countdown.*

### `device` — Device health rows

Extend the device list with **online/offline + token-health** indicators; wire `recordSync` / `unblock` / `registerFailedAttempt`. *Signature: the device-health row.*

### `inspection` — Risk analysis + form

Add a **run-risk-analysis** action (weighted score from RuleSet, ADR-0030) and the **9-section inspection form** + `printForm`; `schedule` / `complete` gated. *Signature: the weighted risk score + printable 9-section form.*

### `movement` — Movement-type flows

A **movement-type selector** (death / pasture / alpine / slaughter / import / export / market) drives a *per-type form*; show the **farm-lock indicator** (OVERDUE births, ADR-0028/WO-022). *Signature: the movement-type selector + farm-lock indicator.*

### `organization` — Add the edit surface

Wire the missing **edit** page/route (`update`); member/role table inline. *Signature: the org detail with member/role edit.*

## Consequences

### Positive

Closes the partial-CRUD gaps without throwing away working pages.

### Negative / Cost

Risk of bolting actions onto pages inconsistently — mitigated by the Phase-0 scaffold's shared action/empty/error patterns.

### Neutral

None.

## Implementation

Owning Bot: **Admin Bot** (`apps/web`). **Phase 3** of ADR-0055. Builds on existing pages. `movement` farm-lock reads `farmHasOverdueBirths` (WO-022); `inspection` risk uses RuleSet weights.

## Verification

```bash
rg -n "trpc.(archive.markDestroyed|inspection.runRiskAnalysis|movement.recordSlaughter|organization).*useMutation" apps/web
# each missing Mutation now has a wired affordance on its existing page
```

## Anti-Patterns

1. Rewriting a working page instead of extending it.
2. `movement` as one giant form (it is *per-type* — branch by movement kind).
3. `inspection` risk score shown without citing the RuleSet weights that produced it.

## Related ADRs

- **ADR-0055** — parity charter (Tier 2, Phase 3).
- **ADR-0029** — archive (3-tier retention); **ADR-0028** — inspection risk analysis.
- **ADR-0025** — animal/movement domain; **ADR-0027** — organization/farm/subject.
- **ADR-0030** — RuleSet (risk weights, retention); **ADR-0022** — policy engine.
