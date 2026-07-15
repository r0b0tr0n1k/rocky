# ADR-0101: Non-PII Asset Inventory — Completing A.5.9

> The PII half of the asset inventory was already counted. The non-PII half — schema, infra, code,
> config — was the open half of A.5.9. This ADR authors that half as a maintained register.

| Key | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-15 |
| **Author** | Architecture Review |
| **Supersedes** | None |
| **Superseded** | None |

---

## Context

Control **A.5.9** (Inventory of information and other associated assets) was recorded as **PARTIAL**
in ROCKY-ISMS-001. The PII portion is implemented and inventoried by the `PII_FIELD_REGISTRY`
(ADR-0061). The non-PII portion — database schema, infrastructure definitions, source code, build
artefacts, configuration and non-PII telemetry — had no dedicated register, leaving the control only
defensible as "partial". The asset inventory is also the substrate that the as-built controls
inventory (ROCKY-INV-001) and the change-management procedure (ADR-0102) depend on.

## Decision

1. Author **ROCKY-AINV-001** (Non-PII Asset Inventory) as the non-PII half of A.5.9, enumerating the
   asset classes in Table 1 of that document and assigning an owner to each.
2. The register shall be maintained as a living document: updated on every schema migration, new
   package, or infrastructure change, with a quarterly reconciliation against the live schema.
3. The register shall cite the machine anchors (`@rocky/database` schema, `VALIDATED_CROSSWALK`) and
   shall not hand-copy the PII registry (ADR-0061) — that stays the single source for personal-data
   assets.
4. The SoA row A.5.9 remains **PARTIAL**; ROCKY-AINV-001 is added as its evidence. The control becomes
   **IMPLEMENTED** only once the living-maintenance procedure is operational (a later Phase 2 action).

## Consequences

### Positive

- A.5.9 becomes defensible as PARTIAL with explicit non-PII evidence, rather than an unbacked claim.
- The asset register gives change-management (ADR-0102) and the controls inventory (ROCKY-INV-001) a
  stable substrate to reference.

### Negative / Cost

- A new register to maintain; the quarterly reconciliation is a recurring governance task.

### Neutral

- No code change; this is a documentation/governance artifact only.

## Implementation

- **Owning Bot:** Docs Bot, co-owned with Database / Execution / Validators Bots (ADR-0033 §D5).
- RobotFarm pass: this ADR is filed under the compliance/standards layer; no bot-contract change is
  required beyond the doc cross-links already added.

## Verification (Definition of Done)

```bash
ls apps/docs/content/compliance/rocky-non-pii-asset-inventory.md   # exists
rg -n "ADR-0061" apps/docs/content/ADR/0101-isms-non-pii-asset-inventory.md   # PII-registry dep cited
rg -n "A.5.9"    apps/docs/content/compliance/isms-policy.md        # SoA row cites ROCKY-AINV-001
```

## Anti-Patterns (do not repeat)

1. Re-listing PII fields in the non-PII register — that is the `PII_FIELD_REGISTRY`'s job (ADR-0061).
2. Hand-copying the crosswalk — cite `VALIDATED_CROSSWALK`; treat `iso27701` as pending expert review.
3. Claiming A.5.9 IMPLEMENTED before the living-maintenance cadence exists.

## Related ADRs

- **ADR-0061** — PII Field Registry (the PII half of A.5.9).
- **ADR-0067** — ISMS Posture & ISO 27001 / ISO 27701:2025 Alignment Roadmap.
- **ADR-0102** — Change & Configuration Management (depends on this inventory).

## Compliance & Standards

- [Statement of Applicability — ROCKY-ISMS-001](../compliance/isms-policy.md) — control A.5.9 (Inventory of information and other associated assets).
- [Non-PII Asset Inventory — ROCKY-AINV-001](../compliance/rocky-non-pii-asset-inventory.md) — the register this ADR governs.
