# Architecture Decision Records

| ADR | Title | Status |
|-----|-------|--------|
| [0001](0001-auth-vs-authorization-boundary.md) | Auth vs. Authorization Boundary | Accepted |
| [0002](0002-principal-as-canonical-actor.md) | Principal as Canonical Runtime Actor | Accepted |
| [0003](0003-execution-pipeline-stages.md) | Execution Pipeline as Composable Stages | Accepted |
| [0004](0004-policy-actions-not-permissions.md) | Policy Actions, Not Permissions | Accepted |
| [0005](0005-transport-adapters-in-apps.md) | Transport Adapters in `apps/api/adapters/` | Accepted |
| [0006](0006-rls-via-transactional-connection.md) | RLS via Transactional Connection | Accepted |
| [0007](0007-audit-via-lifecycle-events.md) | Audit via Lifecycle Events | Accepted |
| [0008](0008-testing-doctrine.md) | Diamond Seal Testing Doctrine | Accepted |
| [0009](0009-document-generation-architecture.md) | Document Generation Architecture | Accepted |
| [0010](0010-date-coercion-architecture.md) | Date Coercion Architecture | Accepted |
| [0011](0011-diamond-seal-layer-boundaries.md) | Diamond Seal Layer Boundaries | Accepted |
| [0012](0012-transactional-outbox-domain-events.md) | Transactional Outbox for Domain Events | Accepted |
| [0013](0013-principal-caching.md) | Principal Caching Strategy | Accepted |
| [0014](0014-cross-domain-event-decoupling.md) | Cross-Domain Event Decoupling via Outbox | Accepted |
| [0015](0015-pda-sync-conflict-resolution.md) | PDA Sync Conflict Resolution via Error Corrections | Accepted |
| [0016](0016-subversive-audit-metadata.md) | Subversive Audit Metadata Injection | Accepted |

## Decision Timeline

```
0001 ── Boundary ─────────────────────────────────────────────────────────────
0002 ── Principal ────────────────────────────────────────────────────────────
0003 ── Pipeline ─────────────────────────────────────────────────────────────
0004 ── Actions ──────────────────────────────────────────────────────────────
0005 ── Transport ────────────────────────────────────────────────────────────
0006 ── RLS ──────────────────────────────────────────────────────────────────
0007 ── Audit ────────────────────────────────────────────────────────────────
      ├── Phase 0: ADRs (complete)
      ├── Phase 1: Scaffold packages
      ├── Phase 2: Principal + Pipeline
      ├── Phase 3: Migrate Routers
      ├── Phase 4: Cleanup
0009 ── Documents ───────────────────────────────────────────────────────
      └── Phase 1: Framework + inspection/passport/movement templates
0010 ── Date Coercion ──────────────────────────────────────────────────
      └── Phase 1: Factory + end-to-end z.coerce.date() propagation
0011 ── Layer Boundaries ─────────────────────────────────────────────
      └── Phase 1: api.ts/router.ts/service.ts/repository.ts contracts
```

## Usage

- **Proposing a new ADR**: Copy an existing ADR as template, assign the next number, set status to "Proposed."
- **Accepting an ADR**: Change status to "Accepted," add date and author.
- **Deprecating an ADR**: Change status to "Deprecated," add "Superseded by" reference.
- **Superseding an ADR**: Create a new ADR, set "Supersedes" to the old ADR number.
