# ADR-0102: Change & Configuration Management Procedure — A.8.32 / A.8.9

> The enforcing mechanism already ships (Diamond Seal NoDrift, typed Zod, RobotFarm review
> contracts). What was missing was the governance wrapper: authorisation, a configuration register,
> and SoD at sign-off. This ADR authors that wrapper as ROCKY-CHG-001.

| Key | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-15 |
| **Author** | Architecture Review |
| **Supersedes** | None |
| **Superseded** | None |

---

## Context

Control **A.8.32** (Change management) is recorded as **PLANNED** and **A.8.9** (Configuration
management) as **PARTIAL** in ROCKY-ISMS-001. The underlying enforcement already exists: the Diamond
Seal NoDrift guillotine (ADR-0018 / ADR-0019) blocks schema/contract drift, typed Zod schemas are the
data-layer configuration contract, and the RobotFarm `AGENTS.md` review chain enforces segregated,
documented review. What was absent was the governance wrapper — who authorises a change, where the
configuration register lives, and how duties are segregated at sign-off. Without that wrapper the
controls could not be claimed as implemented.

## Decision

1. Author **ROCKY-CHG-001** (Change & Configuration Management Procedure) as the governance wrapper
   over the existing mechanism, defining the change-authorisation workflow (Table 1) and SoD at
   sign-off.
2. The procedure shall cite — not redefine — the Diamond Seal NoDrift mechanism (ADR-0018 / ADR-0019)
   and the RobotFarm review contracts as the enforcing layer.
3. A central configuration register shall be established; until it exists as a discrete artifact, the
   version-controlled source and the crosswalk are the provisional register. The procedure shall not
   claim a register that does not yet exist.
4. The SoA rows A.8.32 (PLANNED) and A.8.9 (PARTIAL) receive ROCKY-CHG-001 as evidence. Neither status
   is flipped by this ADR; the procedure makes the PLANNED control defensible as governance-authored.

## Consequences

### Positive

- A.8.32 becomes defensible as PLANNED with explicit governance evidence, not an unbacked placeholder.
- The change workflow gives auditors a named, owned process over the already-present CI enforcement.

### Negative / Cost

- A configuration register to establish (a later Phase 2 action); the SoD sign-off is a process
  discipline to sustain.

### Neutral

- No code change; the enforcement already exists. This ADR documents the wrapper.

## Implementation

- **Owning Bot:** Docs Bot, co-owned with Validators / Authorization Bots (ADR-0033 §D5).
- RobotFarm pass: filed under the compliance/standards layer; the existing `AGENTS.md` review chain
  is the mechanism and requires no change from this ADR.

## Verification (Definition of Done)

```bash
ls apps/docs/content/compliance/rocky-change-mgmt-procedure.md   # exists
rg -n "ADR-0018" apps/docs/content/ADR/0102-isms-change-config-mgmt.md   # enforcing-mechanism dep cited
rg -n "A.8.32"   apps/docs/content/compliance/isms-policy.md    # SoA row cites ROCKY-CHG-001
```

## Anti-Patterns (do not repeat)

1. Describing the NoDrift CI as "the procedure" — it is the mechanism; ROCKY-CHG-001 is the wrapper.
2. Claiming a configuration register that does not exist — state it as a to-be-established artifact.
3. Flipping A.8.32 to IMPLEMENTED before the authorisation/register workflow is operational.

## Related ADRs

- **ADR-0018 / ADR-0019** — Diamond Seal validators (the enforcing mechanism).
- **ADR-0022** — Authorization (Principal / PolicyEngine; SoD at runtime).
- **ADR-0061** — PII erasure/retention (configuration-owned).
- **ADR-0067** — ISMS Posture & ISO 27001 / ISO 27701:2025 Alignment Roadmap.

## Compliance & Standards

- [Statement of Applicability — ROCKY-ISMS-001](../compliance/isms-policy.md) — controls A.8.32 (Change management), A.8.9 (Configuration management).
- [Change & Configuration Management Procedure — ROCKY-CHG-001](../compliance/rocky-change-mgmt-procedure.md) — the procedure this ADR governs.
