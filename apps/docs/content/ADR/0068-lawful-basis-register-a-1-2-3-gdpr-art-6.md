# ADR-0068: Lawful Basis Register (A.1.2.3 / GDPR Art 6)

> The map (our code) enforces. The territory (certified ISMS) demands the paper.
> This ADR is one sheet of that paper -- a Phase 2 governance control, not code.

| Key            | Value                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| **Status** | Proposed |
| **Phase**  | Phase 2 -- governance, pending expert review |
| **Date**       | 2026-07-11                                                             |
| **Author**     | Architecture Review (Compliance homework)                                    |
| **Supersedes** | — |
| **Superseded** | — |
| **Source**     | graphgrc-main analysis; `iso27701-2025-gap-analysis.md`; ADR-0067 (ISMS roadmap) |
| **Related**    | ADR-0061; ADR-0067; ADR-0030; ADR-0054; compliance module |

## Context

PII is processed today with **no recorded lawful basis per activity**. The Imaginary of
"we are compliant because we have Row-Level Security" hides the Real: GDPR Art 6(1) demands a
lawful basis for *every* processing; MK LPDP Art 10 and AL Law 124 Art 7 mirror it. Our
`VALIDATED_CROSSWALK` already maps ART_06 <-> MK_LPDP_ART_10 <-> AL_124_ART_07 -- the
anchor exists, the register does not.

## Decision

Create a **lawful-basis register** -- the Single Source of Truth for "why are we processing
this?". Each entry is keyed by a `processingActivityId` and records: the purpose
(A.1.2.2, already captured by the reveal-gate `purpose`), the lawful basis
(consent / contract / legal obligation / vital interest / public task / legitimate interest),
the linked PII fields (pulled from `PII_FIELD_REGISTRY`), the jurisdiction
(MK / AL / EU), and the retention class (RuleSet D10). It is *read* via the
compliance module and *cited* by every high-risk operation. This is governance paper,
not enforcement code -- Phase 2, expert review pending.

## Consequences

### Positive
- Closes a named GAP from the ISMS gap register (ADR-0067 Decision P2 / gap doc G-entries); converts a "Planned" control into a documented, reviewable one.

### Negative / Cost
- Governance-layer work, not code: it is a register / template / workflow, owned by people, not the pipeline. Requires expert (law + security) review before any conformity claim.

### Neutral
- Sits alongside (not inside) the enforcement code; the compliance reference module (`packages/validators/src/compliance/gdpr-articles.ts`) is the canonical anchor it cites.

## Implementation

- Owning Bot: **Validators Bot** (registry / RoPA / mask-reveal) + **Docs Bot** (template / procedure) + **Execution / DB Bot** (crypto / breach).
- RobotFarm pass: add a WO (Phase 2 governance) to WORKORDER; update Bot descriptions in root AGENTS.md.
- This ADR is the Phase-2 decomposition of ADR-0067; the gap-analysis doc enumerates the parent GAP.

## Verification (Definition of Done)

```bash
ls apps/docs/content/compliance/   # the governance artifact exists
rg -n "ADR-0067|ADR-0061" 0068-*.md
# the artifact cites the validated crosswalk (VALIDATED_CROSSWALK)
rg -n "VALIDATED_CROSSWALK|crossWalkFor" packages/validators/src/compliance
```

## Anti-Patterns

1. Treating the document as a substitute for the enforcement already running (we have the inverse problem; do not over-correct).
2. Recording a lawful basis / DPIA / breach that is not reviewed by counsel competent in both tech and data-protection law.
3. Storing RoPA as a fourth redundant register instead of deriving it from sources we already keep.

## Related ADRs

- **ADR-0067** -- ISMS posture & ISO 27001 / 27701:2025 conformity roadmap (parent).
- **ADR-0061** -- GDPR Right-to-be-Forgotten vs Mandatory Retention (the erasure / retention spine).
- **ADR-0030** -- RuleSet (jurisdiction params, retention classes D10).
- **ADR-0054** -- Regulatory Compliance Framework (legal / statutory spine).
- **ADR-0007** -- Audit via lifecycle events (the tamper-evident log these controls cite).
