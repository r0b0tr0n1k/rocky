# ADR-0100: Training & Awareness Programme — A.6.3 / A.3.17

> The enforcement is real; the trained workforce is not yet. What was missing was the
> governance wrapper: a programme and a records template. This ADR authors that wrapper
> as ROCKY-TRN-001, and honestly records the control as PLANNED until records exist.

| Key | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-15 |
| **Author** | Architecture Review |
| **Supersedes** | None |
| **Superseded** | None |

---

## Context

Controls **A.6.3** (Information security awareness, education and training) and **A.3.17** (PIMS
awareness, education and training) are recorded as **PLANNED** in ROCKY-ISMS-001. The technical
enforcement — RLS, RBAC, mask-by-default, the tamper-evident audit — is in operation, but the workforce
that operates it is not yet trained against the policy, and no training records are on file. The
awareness curriculum and the records template were absent.

## Decision

1. Author **ROCKY-TRN-001** (Training & Awareness Programme Records) as the governance wrapper,
   defining the curriculum (§5.1), the cadence (Table 1) and a blank training-completion-log template
   (Table 2, following the `DOC-005` record pattern).
2. The procedure shall cite — not fabricate — the training records: it establishes the programme and
   the blank template, and records the control as PLANNED until completion records evidence delivery.
3. The crypto-at-rest gap (ROCKY-CRYPTO-001, ADR-0071) shall be a named curriculum topic, so staff
   awareness covers the accepted risk.
4. The SoA rows A.6.3 and A.3.17 receive ROCKY-TRN-001 as evidence. Neither status is flipped by this
   ADR; the procedure makes the PLANNED control defensible as governance-authored.

## Consequences

### Positive

- A.6.3 / A.3.17 become defensible as PLANNED with explicit governance evidence, not an unbacked placeholder.
- The records template gives auditors a named, owned instrument to verify training once delivered.

### Negative / Cost

- Training records to complete per cycle (a later Phase 2 action); the annual refresher discipline is to sustain.

### Neutral

- No code change; this ADR documents the wrapper.

## Implementation

- **Owning Bot:** Docs Bot, co-owned with Authorization / Execution Bots (ADR-0033 §D5).
- RobotFarm pass: filed under the compliance/standards layer; the `DOC-005` record template is the pattern and requires no change from this ADR.

## Verification (Definition of Done)

```bash
ls apps/docs/content/compliance/rocky-training-awareness.md   # exists
rg -n "DOC-005" apps/docs/content/compliance/rocky-training-awareness.md   # record-template pattern cited
rg -n "ROCKY-TRN-001" apps/docs/content/compliance/isms-policy.md   # SoA rows A.6.3 / A.3.17 cite the paper
```

## Anti-Patterns (do not repeat)

1. Fabricating completed training records — this is the procedure + blank template, not evidence of past training.
2. Omitting the crypto-at-rest gap from the curriculum — staff awareness shall cover the accepted risk.
3. Flipping A.6.3 / A.3.17 to IMPLEMENTED before records evidence delivery.

## Related ADRs

- **ADR-0067** — ISMS Posture & ISO 27001 / ISO 27701:2025 Alignment Roadmap (parent).
- **ADR-0071** — Cryptography-at-rest (paused; named curriculum topic).
- **ADR-0022** — Authorization (Principal / PolicyEngine; curriculum topic 2).

## Compliance & Standards

- [Statement of Applicability — ROCKY-ISMS-001](../compliance/isms-policy.md) — controls A.6.3 (Information security awareness, education and training), A.3.17 (PIMS awareness, education and training).
- [Training & Awareness Programme Records — ROCKY-TRN-001](../compliance/rocky-training-awareness.md) — the programme this ADR governs.
