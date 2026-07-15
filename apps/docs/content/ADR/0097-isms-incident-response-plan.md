# ADR-0097: Information Security Incident Response Plan — A.5.24–.27

> Detection exists (tamper-evident audit). The GDPR breach flow exists (ROCKY-BRCH-001). What was
> missing was the ISO management wrapper — preparation, assessment, response, and the learning step
> everyone forgets. This ADR authors that wrapper and explicitly contains, not replaces, the breach
> procedure.

| Key | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-15 |
| **Author** | Architecture Review |
| **Supersedes** | None |
| **Superseded** | None |

---

## Context

Controls **A.5.24** (preparation), **A.5.25** (assessment/decision), **A.5.26** (response) and
**A.5.27** (learning) are recorded as **PLANNED** in ROCKY-ISMS-001. Two real mechanisms already exist:
the tamper-evident, hash-chained audit store (ADR-0007) provides detection and evidence, and the GDPR
personal-data breach notification procedure (ROCKY-BRCH-001, ADR-0072) owns the 72-hour legal flow. What
was absent was the ISO management wrapper that binds preparation → assessment → response → learning and
that explicitly complements the breach procedure rather than duplicating it.

## Decision

1. Author **ROCKY-IRP-001** (Information Security Incident Response Plan) as the ISO wrapper covering
   A.5.24–.27, with an explicit learning step (A.5.27) and a mermaid lifecycle (Figure 1).
2. The plan shall **complement, not replace** ROCKY-BRCH-001: when an incident is assessed as a
   personal-data breach, the plan triggers and feeds the GDPR procedure. The plan shall cite ADR-0072
   and ADR-0007 rather than redefining their content.
3. The SoA rows A.5.24, A.5.25, A.5.26, A.5.27 receive ROCKY-IRP-001 as evidence. Status stays
   **PLANNED**; the plan makes the controls defensible as governance-authored. A.3.11 / A.3.12 (PIMS)
   remain served by ROCKY-BRCH-001 and are not flipped.

## Consequences

### Positive

- A.5.24–.27 become defensible as PLANNED with a single owned, cross-linked procedure.
- The learning step (A.5.27) is no longer the unaddressed gap; post-incident reviews are mandated.

### Negative / Cost

- A dedicated breach-alert rule and the annual rehearsal are recurring governance tasks not yet wired.

### Neutral

- No code change; detection (ADR-0007) and the GDPR flow (ADR-0072) already exist.

## Implementation

- **Owning Bot:** Docs Bot, co-owned with Audit / Execution Bots (ADR-0033 §D5).
- RobotFarm pass: filed under the compliance/standards layer; no bot-contract change required.

## Verification (Definition of Done)

```bash
ls apps/docs/content/compliance/rocky-incident-response-plan.md   # exists
rg -n "ADR-0072" apps/docs/content/ADR/0097-isms-incident-response-plan.md   # breach-procedure dep cited
rg -n "A.5.26"   apps/docs/content/compliance/isms-policy.md    # SoA row cites ROCKY-IRP-001
```

## Anti-Patterns (do not repeat)

1. Scoping the plan to GDPR only — that is ROCKY-BRCH-001; this is the broader ISO wrapper.
2. Using `must` instead of `shall` in the controlled-language clauses.
3. Omitting A.5.27 (learning) — the common gap this plan is specifically meant to close.

## Related ADRs

- **ADR-0072** — Personal Data Breach Notification Workflow (the legal procedure this plan complements).
- **ADR-0007** — Tamper-evident audit (detection + evidence store).
- **ADR-0067** — ISMS Posture & ISO 27001 / ISO 27701:2025 Alignment Roadmap.

## Compliance & Standards

- [Statement of Applicability — ROCKY-ISMS-001](../compliance/isms-policy.md) — controls A.5.24, A.5.25, A.5.26, A.5.27 (incident management).
- [Information Security Incident Response Plan — ROCKY-IRP-001](../compliance/rocky-incident-response-plan.md) — the plan this ADR governs.
- [Personal Data Breach Notification Procedure — ROCKY-BRCH-001](../compliance/rocky-breach-notification-procedure.md) — the GDPR flow this plan complements.
