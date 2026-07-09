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
| [0017](0017-frontend-architecture.md) | Frontend Architecture — Type-Safe Admin Shell | Accepted |
| [0018](0018-api-validator-design.md) | API Validator Schema Design (Diamond Seal Guillotines) | Accepted |
| [0019](0019-two-type-contracts.md) | Two Type Contracts — The Dialectic from Postgres to tRPC Client | Accepted |
| [0020](0020-pragmatic-marxist-doctrine.md) | Pragmatic Marxist Doctrine for Testing, Documentation, and Observability | Accepted |
| [0021](0021-better-auth-configuration.md) | Better Auth Configuration & Session Resolution | Accepted |
| [0022](0022-authorization-policy-engine.md) | Authorization Policy Engine | Accepted |
| [0023](0023-business-rule-traceability.md) | Business-Rule Adoption & Source-to-Code Traceability | Accepted |
| [0024](0024-ear-tag-domain.md) | Ear Tag Order Lifecycle & Numbering | Accepted |
| [0025](0025-animal-movement-domain.md) | Animal Registration & Movement Rules | Accepted |
| [0026](0026-health-domain.md) | Health & Disease Domain | Accepted |
| [0027](0027-farm-holder-subject.md) | Farm & Holder (HK) + Subject Roles | Accepted |
| [0028](0028-inspection-risk-analysis.md) | Risk Analysis & On-Spot Inspection | Accepted |
| [0029](0029-passport-archive.md) | Passport Lifecycle & Archive Retention | Accepted |
| [0030](0030-jurisdiction-rule-engine.md) | Jurisdiction-Configurable Rule Engine | Accepted |
| [0031](0031-iot-connectivity-abstraction.md) | IoT & Connectivity Abstraction | Accepted |
| [0032](0032-trpc-output-schema-ts6059.md) | tRPC Transport Architecture & Mandatory `@Output` Schemas | Accepted |

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
0017 ── Frontend Shell ──────────────────────────────────────────────────
       └── Phase 0: shadcn components + AdminShell + ValidatedForm + DataTable
0018 ── API Validator Design ──────────────────────────────────────────
       └── Standard: schema derivation + 3-tier guillotine + .strict() target
0019 ── Two Type Contracts ─────────────────────────────────────────────
       └── Type-flow companion to ADR-0011 / ADR-0018
0020 ── Marxist Doctrine (Testing · Docs · Observability) ───────────────
       └── Philosophy companion to ADR-0008; corrects false "already-built" claims
0021 ── Better Auth Configuration ─────────────────────────────────────
       └── Auth singleton + AuthResolver + createRockyAuthClient (identity-only)
0022 ── Authorization Policy Engine ───────────────────────────────────
       └── Principal + @Policy + PolicyRegistry + PolicyEngine mechanics
0023 ── Business-Rule Traceability ───────────────────────────────────
       └── docs/old specs → domain packages; bug/deferral registers; ADR-0024+ roadmap
0024 ── Ear Tag Order Lifecycle & Numbering ──────────────────────────
       └── 8-state order + 10-state tag machines; check digit; takeover-file defect B1
0025 ── Animal Registration & Movement Rules ──────────────────────────
       └── A.4a–e integrity; ANIMAL_STATUS; MOVEMENT_TYPE (16); market 4-leg
0026 ── Health & Disease Domain ──────────────────────────────────────
       └── batch expiry/age; notifiable_disease.detected → flagFarmForInspection
0027 ── Farm & Holder (HK) + Subject Roles ────────────────────────────
       └── farmId immutable; VD-approval outbox; SUBJECT_ROLE (8); VI role gap B3
0028 ── Risk Analysis & On-Spot Inspection ────────────────────────────
       └── @Cron annual 10% selection; INSPECTION_STATUS; health→inspection
0029 ── Passport Lifecycle & Archive Retention ────────────────────────
       └── PASSPORT_STATUS machine; 3-tier archive; 3-year daily-cron destruction
0030 ── Jurisdiction-Configurable Rule Engine ──────────────────────────
       └── docs/old = MK reference instance (not law); RuleSet + provider model; reframes 0023
0031 ── IoT & Connectivity Abstraction ─────────────────────────────────
       └── optional, hidden-by-default; TRANSMISSION_TYPE; device classes; edge-AI future
0032 ── tRPC Transport Architecture ───────────────────────────────────
       └── @rocky/trpc owns AppRouter/AppContext/superjson/unwrap; mandatory @Output; no @rocky/api dep
```

## Usage

- **Proposing a new ADR**: Copy an existing ADR as template, assign the next number, set status to "Proposed."
- **Accepting an ADR**: Change status to "Accepted," add date and author.
- **Deprecating an ADR**: Change status to "Deprecated," add "Superseded by" reference.
- **Superseding an ADR**: Create a new ADR, set "Supersedes" to the old ADR number.
