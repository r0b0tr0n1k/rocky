# ADR-0099: Business Continuity & ICT Readiness Plan — A.5.29 / A.5.30

> The system can be rebuilt from source in one script. What was missing was the governance
> wrapper: a continuity plan that names the rebuild as evidence and the missing RTO/RPO as a
> planned gap. This ADR authors that wrapper as ROCKY-BCP-001.

| Key | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-15 |
| **Author** | Architecture Review |
| **Supersedes** | None |
| **Superseded** | None |

---

## Context

Controls **A.5.29** (Information security during disruption) and **A.5.30** (ICT readiness for business
continuity) are recorded as **PLANNED** in ROCKY-ISMS-001. Rocky already has a reproducible rebuild
capability — `scripts/db-recreate.sh` regenerates the schema, resolves RLS placeholders and runs an
idempotent seed — and a tamper-evident audit store that preserves evidence independently of the primary
database. What was absent was the continuity plan that names these as evidence and records the missing
backup/restore SLA and redundancy as planned gaps rather than claims.

## Decision

1. Author **ROCKY-BCP-001** (Business Continuity & ICT Readiness Plan) as the governance wrapper over
   the existing rebuild capability, defining continuity objectives (Table 1) and the backup/restore
   position.
2. The plan shall cite — not over-claim — `scripts/db-recreate.sh` as the rebuild evidence for A.8.13,
   and shall mark RTO/RPO and redundancy (A.8.14) as planned where the code cannot yet meet them.
3. The plan shall reference the system-architecture diagram set (ADR-0104) and the operational runbooks
   as the recovery-planning inputs.
4. The SoA rows A.5.29 and A.5.30 receive ROCKY-BCP-001 as evidence. Neither status is flipped by this
   ADR; the procedure makes the PLANNED control defensible as governance-authored.

## Consequences

### Positive

- A.5.29/.30 become defensible as PLANNED with explicit governance evidence, anchored to a real rebuild capability.
- The plan honestly records redundancy and RTO/RPO as planned, so an auditor sees the gap, not a boast.

### Negative / Cost

- A backup/restore SLA and redundancy to establish (later Phase 2 actions); the continuity-test discipline is to sustain.

### Neutral

- No code change; the rebuild mechanism already exists. This ADR documents the wrapper.

## Implementation

- **Owning Bot:** Docs Bot, co-owned with Execution / Database Bots (ADR-0033 §D5).
- RobotFarm pass: filed under the compliance/standards layer; the recreate script and runbooks are the sources and require no change from this ADR.

## Verification (Definition of Done)

```bash
ls apps/docs/content/compliance/rocky-bcp-ict-readiness.md   # exists
rg -n "db-recreate" apps/docs/content/compliance/rocky-bcp-ict-readiness.md   # rebuild evidence cited
rg -n "ROCKY-BCP-001" apps/docs/content/compliance/isms-policy.md   # SoA rows A.5.29/.30 cite the paper
```

## Anti-Patterns (do not repeat)

1. Claiming an RTO/RPO the code cannot meet — state redundancy and SLA as planned.
2. Inventing redundancy the system lacks — the recreate script is rebuild, not hot standby.
3. Flipping A.5.29/.30 to IMPLEMENTED before a backup/restore SLA is operated.

## Related ADRs

- **ADR-0067** — ISMS Posture & ISO 27001 / ISO 27701:2025 Conformity Roadmap (parent).
- **ADR-0104** — Architecture diagrams & software-engineering ISO standards map (recovery-planning inputs).
- **ADR-0003** — ExecutionPipeline / environment stages (separation of environments).
- **ADR-0007** — Audit via lifecycle events (evidence preserved independently of the primary DB).

## Compliance & Standards

- [Statement of Applicability — ROCKY-ISMS-001](../compliance/isms-policy.md) — controls A.5.29 (Information security during disruption), A.5.30 (ICT readiness for business continuity).
- [Business Continuity & ICT Readiness Plan — ROCKY-BCP-001](../compliance/rocky-bcp-ict-readiness.md) — the plan this ADR governs.
