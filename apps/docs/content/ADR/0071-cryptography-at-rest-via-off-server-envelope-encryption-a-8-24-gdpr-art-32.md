# ADR-0071: Cryptography-at-Rest via Off-Server Envelope Encryption (A.8.24 / GDPR Art 32)

> The map (our code) enforces. The territory (certified ISMS) demands the paper.
> This ADR is one sheet of that paper -- a Phase 2 governance control, not code.

| Key            | Value                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| **Status**     | Proposed (Phase 2 -- governance, pending expert review)                      |
| **Date**       | 2026-07-11                                                             |
| **Author**     | Architecture Review (Compliance homework)                                    |
| **Source**     | graphgrc-main analysis; `iso27701-2025-gap-analysis.md`; ADR-0067 (ISMS roadmap) |
| **Related**    | ADR-0061; ADR-0067; ADR-0030; compliance module |

## Context

PII is masked in projection but stored in **plaintext at rest** in Postgres. Row-Level
Security is *logical*, not physical -- a database breach (which RLS does not prevent)
exposes every direct PII column. Art 32(1)(a) demands encryption of personal data. The
crosswalk maps ART_32 <-> MK_LPDP_ART_36 <-> AL_124_ART_27. Pausing crypto (key custody
unsettled) was the correct *temporary* call; this ADR makes it permanent and safe.

## Decision

**Envelope encryption, off-server KEK.** PII columns flagged `category: direct` /
`defaultExcluded` are encrypted at rest with a per-row / per-table Data Encryption Key (DEK);
the Key Encryption Key (KEK) lives in an **external KMS / HSM the application server never
holds long-term**. Key custody is the separate boundary -- never in the Rocky repo, never in
the database, ideally in the cloud provider's managed KMS. This is the deferred crypto piece
from ADR-0061 Phase 2; ADR-0061's D-crypto section references this ADR. Phase 2;
expert review on key rotation + jurisdiction of the KMS. RLS stays (it scopes *access*;
crypto scopes *exposure at rest* -- they are complementary, not substitutes).

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
rg -n "ADR-0067|ADR-0061" 0071-*.md
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
