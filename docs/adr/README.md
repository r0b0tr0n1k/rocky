# Architecture Decision Records — Index

> **Canonical source of truth:** `apps/docs/content/ADR/` — published through the Nextra docs site
> (`apps/docs`). All ADRs **0001–0051** live there and are the versions of record. Cross-references in
> code and in other ADRs (e.g. "ADR-0006 (RLS)", "ADR-0004 (Actions, not Permissions)") resolve there.

> **This folder (`docs/adr/`) is a legacy navigational mirror.** It keeps local copies of the early
> foundational ADRs (0001–0016) and is held in sync with the canonical store. **Edit ADRs in
> `apps/docs/content/ADR/`, not here** — changes made only in this folder will not reach the published
> site and will diverge (this is how `0032` once fell behind). When the canonical file changes, mirror
> it back into this folder.

## Index (0001–0051 — every link points to the canonical store)

| ADR | Title | Status |
|-----|-------|--------|
| [0001](../apps/docs/content/ADR/0001-auth-vs-authorization-boundary.md) | Auth vs authorization boundary | Accepted |
| [0002](../apps/docs/content/ADR/0002-principal-as-canonical-actor.md) | Principal as canonical actor | Accepted |
| [0003](../apps/docs/content/ADR/0003-execution-pipeline-stages.md) | Execution pipeline stages | Accepted |
| [0004](../apps/docs/content/ADR/0004-policy-actions-not-permissions.md) | Policy actions not permissions | Accepted |
| [0005](../apps/docs/content/ADR/0005-transport-adapters-in-apps.md) | Transport adapters in apps | Accepted |
| [0006](../apps/docs/content/ADR/0006-rls-via-transactional-connection.md) | Rls via transactional connection | Accepted |
| [0007](../apps/docs/content/ADR/0007-audit-via-lifecycle-events.md) | Audit via lifecycle events | Accepted |
| [0008](../apps/docs/content/ADR/0008-testing-doctrine.md) | Testing doctrine | Accepted |
| [0009](../apps/docs/content/ADR/0009-document-generation-architecture.md) | Document generation architecture | Accepted |
| [0010](../apps/docs/content/ADR/0010-date-coercion-architecture.md) | Date coercion architecture | Accepted |
| [0011](../apps/docs/content/ADR/0011-diamond-seal-layer-boundaries.md) | Diamond seal layer boundaries | Accepted |
| [0012](../apps/docs/content/ADR/0012-transactional-outbox-domain-events.md) | Transactional outbox domain events | Accepted |
| [0013](../apps/docs/content/ADR/0013-principal-caching.md) | Principal caching | Accepted |
| [0014](../apps/docs/content/ADR/0014-cross-domain-event-decoupling.md) | Cross domain event decoupling | Accepted |
| [0015](../apps/docs/content/ADR/0015-pda-sync-conflict-resolution.md) | Pda sync conflict resolution | Accepted |
| [0016](../apps/docs/content/ADR/0016-subversive-audit-metadata.md) | Subversive audit metadata | Accepted |
| [0017](../apps/docs/content/ADR/0017-frontend-architecture.md) | Frontend architecture | Accepted |
| [0018](../apps/docs/content/ADR/0018-api-validator-design.md) | Api validator design | Accepted |
| [0019](../apps/docs/content/ADR/0019-two-type-contracts.md) | Two type contracts | Accepted |
| [0020](../apps/docs/content/ADR/0020-pragmatic-marxist-doctrine.md) | Pragmatic marxist doctrine | Accepted |
| [0021](../apps/docs/content/ADR/0021-better-auth-configuration.md) | Better auth configuration | Accepted |
| [0022](../apps/docs/content/ADR/0022-authorization-policy-engine.md) | Authorization policy engine | Accepted |
| [0023](../apps/docs/content/ADR/0023-business-rule-traceability.md) | Business rule traceability | Accepted |
| [0024](../apps/docs/content/ADR/0024-ear-tag-domain.md) | Ear tag domain | Accepted |
| [0025](../apps/docs/content/ADR/0025-animal-movement-domain.md) | Animal movement domain | Accepted |
| [0026](../apps/docs/content/ADR/0026-health-domain.md) | Health domain | Accepted |
| [0027](../apps/docs/content/ADR/0027-farm-holder-subject.md) | Farm holder subject | Accepted |
| [0028](../apps/docs/content/ADR/0028-inspection-risk-analysis.md) | Inspection risk analysis | Accepted |
| [0029](../apps/docs/content/ADR/0029-passport-archive.md) | Passport archive | Accepted |
| [0030](../apps/docs/content/ADR/0030-jurisdiction-rule-engine.md) | Jurisdiction rule engine | Accepted |
| [0031](../apps/docs/content/ADR/0031-iot-connectivity-abstraction.md) | Iot connectivity abstraction | Accepted |
| [0032](../apps/docs/content/ADR/0032-trpc-output-schema-ts6059.md) | Trpc output schema ts6059 | Accepted |
| [0033](../apps/docs/content/ADR/0033-frontend-mobile-adr-standard.md) | Frontend mobile adr standard | Accepted |
| [0034](../apps/docs/content/ADR/0034-client-surface-inventory.md) | Client surface inventory | Accepted |
| [0035](../apps/docs/content/ADR/0035-rendering-data-fetching.md) | Rendering data fetching | Accepted |
| [0036](../apps/docs/content/ADR/0036-offline-sync-architecture.md) | Offline sync architecture | Accepted |
| [0037](../apps/docs/content/ADR/0037-design-system-theming.md) | Design system theming | Accepted |
| [0038](../apps/docs/content/ADR/0038-forms-validation.md) | Forms validation | Accepted |
| [0039](../apps/docs/content/ADR/0039-navigation-routing.md) | Navigation routing | Accepted |
| [0040](../apps/docs/content/ADR/0040-i18n-rtl.md) | I18n rtl | Accepted |
| [0041](../apps/docs/content/ADR/0041-error-empty-loading-ux.md) | Error empty loading ux | Accepted |
| [0042](../apps/docs/content/ADR/0042-permission-aware-ui.md) | Permission aware ui | Accepted |
| [0043](../apps/docs/content/ADR/0043-push-background-sync-deeplink.md) | Push background sync deeplink | Accepted |
| [0044](../apps/docs/content/ADR/0044-livestock-domain-feature.md) | Livestock domain feature | Accepted |
| [0045](../apps/docs/content/ADR/0045-health-domain-feature.md) | Health domain feature | Accepted |
| [0046](../apps/docs/content/ADR/0046-inspections-corrections-domain-feature.md) | Inspections corrections domain feature | Accepted |
| [0047](../apps/docs/content/ADR/0047-infrastructure-iot-domain-feature.md) | Infrastructure iot domain feature | Accepted |
| [0048](../apps/docs/content/ADR/0048-administration-domain-feature.md) | Administration domain feature | Accepted |
| [0049](../apps/docs/content/ADR/0049-client-auth-session.md) | Client auth session | Accepted |
| [0050](../apps/docs/content/ADR/0050-frontend-backend-contract-sync.md) | Frontend backend contract sync | Accepted |
| [0051](../apps/docs/content/ADR/0051-web-mobile-page-matrix-nav.md) | Web mobile page matrix nav | Accepted |
