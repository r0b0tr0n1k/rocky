# ADR-0065: Regulatory Gating on Mobile / Offline

> The server draws the line; the field worker is offline. The regulatory block must travel to the
> device without becoming a second, divergent source of truth.

| Key            | Value                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| **Status**     | Proposed                                                               |
| **Date**       | 2026-07-11                                                             |
| **Author**     | Architecture Review                                                    |
| **Supersedes** | None |
| **Superseded** | None |
| **Source**     | Gap surfaced in ADR audit; WO-115 (EUDR), WO-119 (disease-zone), WO-121 (IMSOC/CHED) gate server-side |
| **Related**    | ADR-0036 (offline sync); ADR-0025 (movement); ADR-0030 (RuleSet); ADR-0063 / 0064 / 0062; ADR-0015 (conflict resolution); ADR-0003 (execution) |

## Context

The backend now enforces three regulatory pre-conditions on `movement.create()`:
- EUDR deforestation-free attestation (WO-115 / ADR-0063)
- Disease-zone spatial block, 3 km / 10 km (WO-119 / ADR-0064)
- IMSOC/CHED requirement for export movements (WO-121 / ADR-0062)

All three live **server-side** in `movement.service.ts`, evaluated via shared pure functions
(`runEudrDueDiligence`, `runDiseaseZoneCheck`). The mobile app is **offline-first** (ADR-0036): a
farmer can create a movement with no signal. The contradiction — the Real pressing — is that the
regulatory line is drawn only where there is a connection. The field worker discovers the block only
after sync, as a rejection.

## Decision

**The device pre-checks; the server decides. One shared predicate, two call sites.**

1. **Extract the gating predicates into a shared, pure, testable module** (e.g.
   `packages/domains/movement/src/regulatory/`) that takes repository-like interfaces + the RuleSet
   and returns a verdict. The server already has the logic — promote it out of the service into a
   reusable function (same pattern as `runEudrDueDiligence` / `runDiseaseZoneCheck`).
2. **Mobile pre-check (UX guard, not enforcement).** The mobile movement-create flow calls the same
   predicate locally, using cached geofences (ADR-0036 offline cache) + the synced RuleSet (ADR-0030),
   and shows a warning/block *before* the user commits. Courtesy guard only.
3. **Server remains the source of truth.** On sync, the API re-runs the identical predicate
   (authoritative). If the device allowed but the server blocks (e.g. a disease zone appeared while
   offline), the sync queue surfaces the rejection; the user resolves via error corrections (ADR-0015).
4. **No logic divergence.** Both call sites import the SAME function + SAME RuleSet params, so the
   "NoDrift" guillotine that protects validators also protects regulatory gating. A unit test asserts
   server and mobile verdicts agree on a shared fixture.

## Consequences

### Positive
- Field workers warned before sync, not after — fewer rejected movements, less rework.
- Single source of regulatory truth (the shared predicate); the device is a mirror, not a fork.

### Negative / Cost
- Must keep geofences + RuleSet cached and fresh on device (ADR-0036 payload growth).
- Duplicate *evaluation* (device + server) — acceptable because server is authoritative and the shared
  function prevents drift.

### Neutral
- Regulatory *verdicts* (not raw PII) may be cached on device for offline display.

## Implementation

- Owning Bot: **Mobile Bot** + **Movement Bot** + **Execution Bot** (RuleSet sync).
- Extract `evaluateMovementRegulatory(...)` into `packages/domains/movement/src/regulatory/`.
- Mobile: call it in the movement-create screen before submit; server calls it in `create()`.
- RobotFarm pass: add WO (mobile regulatory pre-check) to WORKORDER; update Mobile Bot + Movement Bot
  descriptions in root AGENTS.md.

## Verification (Definition of Done)

```bash
ls apps/docs/content/ADR/0065-*.md
rg -n "ADR-0036|ADR-0025|ADR-0030" 0065-*.md
# shared predicate imported by BOTH the api movement router and the mob movement screen
rg -n "evaluateMovementRegulatory" apps/api apps/mob packages/domains/movement
```

## Anti-Patterns

1. Re-implementing the gating logic natively on mobile (divergence → wrong blocks).
2. Treating the device pre-check as enforcement (only the server verdict is authoritative).
3. Caching raw PII on device for the pre-check (use verdicts + pseudonyms, ADR-0061).

## Related ADRs

- **ADR-0036** — offline-first sync; the geofence + RuleSet cache the device uses.
- **ADR-0025** — animal movement domain (the gated operation).
- **ADR-0030** — RuleSet; jurisdiction params the predicate consumes.
- **ADR-0063 / 0064 / 0062** — the three gates (EUDR / disease-zone / IMSOC-CHED).
- **ADR-0015** — conflict resolution when server blocks what device allowed.
