# ADR-NNNN: Title (one-line ruling)

> Optional one-line framing of the dialectic — the symptom this decision resolves.
> Client-surface ADRs: note "(standard: ADR-0033)" and cite backend deps (ADR-0033 §D4).

| Key | Value |
| --- | --- |
| **Status** | Proposed |
| **Date** | YYYY-MM-DD |
| **Author** | Architecture Review |
| **Supersedes** | None |
| **Superseded** | None |

---

## Context

What is the force of circumstance? Name the contradiction / symptom the Real is
pressing. Cite the backend ADRs this decision depends on (ADR-0033 §D4):
auth/session → ADR-0021; permission UI → ADR-0022; row scoping → ADR-0006;
tRPC → ADR-0032; validators → ADR-0018 / ADR-0019; offline → ADR-0015;
outbox/decoupling → ADR-0012 / ADR-0014; runtime/locale → ADR-0003.

## Decision

The ruling. **Lead with the decision, not a manifesto** (ADR-0033 §D3). Add a
mermaid diagram where it clarifies structure (author per `design-doc-mermaid`,
validate with `mmdc` before embedding; high-contrast `classDef` with explicit
`color:`).

## Consequences

### Positive

### Negative / Cost

### Neutral

## Implementation

How to build / roll out. Name the owning Bot (ADR-0033 §D5) and the RobotFarm
pass (update root `AGENTS.md` Bot descriptions + WORKORDER).

## Verification (Definition of Done)

```bash
# concrete, runnable checks proving the ADR is satisfied
ls apps/docs/content/ADR/<nnnn>-*.md                 # exists in canonical set
rg -n "ADR-00(06|18|19|21|22|32)" <nnnn>-*.md        # ≥1 backend dep cited
```

## Anti-Patterns (do not repeat)

1. …

## Related ADRs

- **ADR-XXXX** — dependency / foundation.
