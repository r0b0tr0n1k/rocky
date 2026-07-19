# ADR-0069: Data Protection Impact Assessment Template (A.1.2.5 / GDPR Art 35)

> The map (our code) enforces. The territory (certified ISMS) demands the paper.
> This ADR is one sheet of that paper -- a Phase 2 governance control, not code.

| Key            | Value                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| **Status** | Accepted |
| **Phase**  | Phase 2 -- governance, pending expert review |
| **Date**       | 2026-07-11                                                             |
| **Author**     | Architecture Review (Compliance homework)                                    |
| **Supersedes** | — |
| **Superseded** | — |
| **Source**     | graphgrc-main analysis; `iso27701-2025-gap-analysis.md`; ADR-0067 (ISMS roadmap) |
| **Related**    | ADR-0061; ADR-0067; ADR-0068; ADR-0030; compliance module; eu-b2b-procurement-pack.md |

## Context

We perform **high-risk processing with no Article 35 impact assessment**. Vaccination batch-expiry
prediction, disease-zone spatial blocking (WO-119), EUDR geospatial overlay (WO-115), and
mass location tracking are exactly the "high risk to rights and freedoms" Art 35 contemplates.
The crosswalk maps ART_35 <-> MK_LPDP_ART_39 <-> AL_124_ART_29. The Imaginary:
"we only do what the law says" -- the Real: high-risk *requires* a prior written assessment.

## Decision

Author a **DPIA template** (structured: description of processing, necessity and
proportionality, risk to rights and freedoms, mitigations, residual risk) and **wire it to
high-risk domain ops** -- Health (vaccination / treatment), Inspection (risk scoring),
Movement (EUDR / disease-zone). Triggered automatically when a processing activity is
flagged `highRisk: true` in the lawful-basis register (ADR-0068). Output is stored and
referenced by the tamper-evident audit log. Phase 2; a lawyer confirms the trigger
thresholds before any "no DPIA required" decision is recorded.

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
rg -n "ADR-0067|ADR-0061" 0069-*.md
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
