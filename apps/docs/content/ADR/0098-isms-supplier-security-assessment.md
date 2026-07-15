# ADR-0098: Supplier / Processor Security Assessment Procedure — A.5.19 / A.5.20 / A.5.21

> The enforcement already uses third-party auth and hosting. What was missing was the
> governance wrapper: who is assessed, how, and what residual risk we accept. This ADR
> authors that wrapper as ROCKY-SUP-001.

| Key | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-15 |
| **Author** | Architecture Review |
| **Supersedes** | None |
| **Superseded** | None |

---

## Context

Controls **A.5.19** (Information security in supplier relationships), **A.5.20** (Addressing
information security within supplier agreements) and **A.5.21** (Managing information security in the
ICT supply chain) are recorded as **PLANNED** in ROCKY-ISMS-001. Rocky already depends on external
processors — Better Auth (authentication), the cloud host (infrastructure) and the PAdES signing HSM
(document signing) — but the assessment of those suppliers was not documented as a procedure. The
processor inventory exists ([rocky-processor-register.md](../compliance/rocky-processor-register.md)) and the
contractual terms exist ([rocky-dpa.md](../compliance/rocky-dpa.md), ROCKY-PROC-001), yet there was no
risk-tiered assessment governance over them.

## Decision

1. Author **ROCKY-SUP-001** (Supplier / Processor Security Assessment Procedure) as the governance
   wrapper over the existing processor inventory, defining a three-tier due-diligence model
   (Table 1) and an assessment-content minimum set.
2. The procedure shall cite — not redefine — the processor register and the data processing agreement
   as the inventory and contractual sources; it adds the assessment discipline on top.
3. Where a supplier control is not yet implemented (for example cryptography at rest, paused per
   ADR-0071), the procedure shall record residual risk as accepted only with a named owner and a
   review date; it shall not assume acceptance.
4. The SoA rows A.5.19, A.5.20 and A.5.21 receive ROCKY-SUP-001 as evidence. Neither status is flipped
   by this ADR; the procedure makes the PLANNED control defensible as governance-authored.

## Consequences

### Positive

- A.5.19/.20/.21 become defensible as PLANNED with explicit governance evidence, not an unbacked placeholder.
- The assessment tiering gives auditors a named, owned process over the already-present processor inventory.

### Negative / Cost

- Assessment records to complete per cycle (a later Phase 2 action); the annual re-assessment discipline is to sustain.

### Neutral

- No code change; this ADR documents the wrapper over existing supplier relationships.

## Implementation

- **Owning Bot:** Docs Bot, co-owned with Authorization / Execution Bots (ADR-0033 §D5).
- RobotFarm pass: filed under the compliance/standards layer; the existing processor register and DPA are the sources and require no change from this ADR.

## Verification (Definition of Done)

```bash
ls apps/docs/content/compliance/rocky-supplier-security-assessment.md   # exists
rg -n "ADR-0075" apps/docs/content/ADR/0098-isms-supplier-security-assessment.md   # processor-mgmt dep cited
rg -n "ROCKY-SUP-001" apps/docs/content/compliance/isms-policy.md       # SoA rows A.5.19/.20/.21 cite the paper
```

## Anti-Patterns (do not repeat)

1. Duplicating the DPA (it is LAW, already exists) — ROCKY-SUP-001 assesses, it does not re-contract.
2. Assuming residual-risk acceptance where a control is absent — acceptance requires owner + review date.
3. Flipping A.5.19/.20/.21 to IMPLEMENTED before the assessment records exist.

## Related ADRs

- **ADR-0075** — Processor / sub-processor management (the inventory source).
- **ADR-0067** — ISMS Posture & ISO 27001 / ISO 27701:2025 Alignment Roadmap (parent).
- **ADR-0071** — Cryptography-at-rest (paused; referenced by the assessment for at-rest status).
- **ADR-0103** — Physical controls provider attestation (shared-responsibility boundary).

## Compliance & Standards

- [Statement of Applicability — ROCKY-ISMS-001](../compliance/isms-policy.md) — controls A.5.19 (Information security in supplier relationships), A.5.20 (Addressing information security within supplier agreements), A.5.21 (Managing information security in the ICT supply chain).
- [Supplier / Processor Security Assessment Procedure — ROCKY-SUP-001](../compliance/rocky-supplier-security-assessment.md) — the procedure this ADR governs.
