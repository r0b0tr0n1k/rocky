---
title: Non-PII Asset Inventory
sidebarTitle: Non-PII Asset Inventory
---

# Non-PII Asset Inventory — Rocky

> _sniffs_ The PII half of A.5.9 was already counted — the `PII_FIELD_REGISTRY`
> enumerates every personal-data column. What the Statement of Applicability
> flagged as the missing half was the **non-PII** asset register: the schema,
> the infrastructure, the code, the configuration. This document is that half.

| Document field | Value |
| --- | --- |
| **Title** | Non-PII Asset Inventory — Rocky |
| **Reference** | ROCKY-AINV-001 |
| **Version** | 0.1.0-draft (initial non-PII register) |
| **Status** | Draft — non-PII scope enumerated; to be maintained as a living register |
| **Owner** | Docs Bot, co-owned with Database / Execution / Validators Bots |
| **Classification** | Internal — Reference |
| **Next review** | On ADR-0101 acceptance; thereafter on each schema/infra change |
| **Related** | ADR-0101 (governing, A.5.9 completion); ADR-0061 (PII registry); ADR-0067 (ISMS roadmap); ROCKY-INV-001 (as-built controls inventory); [Statement of Applicability — ROCKY-ISMS-001](./isms-policy.md) (A.5.9) |

---

## 1. Purpose

This document completes the asset-inventory requirement of control **A.5.9** (Inventory of
information and other associated assets) for the **non-PII** portion of Rocky's estate. It records,
at a controlled level of detail, the information assets and associated assets that are not personal
data, and it states how that register is maintained.

## 2. Scope

- **In scope:** non-PII information assets (database schema, operational configuration, source code,
  build and deployment artefacts, infrastructure definitions, logs and metrics that carry no personal
  data) and the associated assets that store or process them (servers, containers, datastores,
  repositories, CI runners).
- **Out of scope:** personal-data assets. Those are inventoried authoritatively by the
  `PII_FIELD_REGISTRY` and reported under ROCKY-INV-001 / ADR-0061. This document does not
  duplicate that register; it references it.

## 3. Terms and definitions

- **information asset** — any data or information owned, controlled or processed by Rocky that is not
  personal data.
- **associated asset** — the hardware, software, service or repository that stores, processes or
  transmits an information asset.
- **register** — the maintained list of assets with their owner, location and classification.

## 4. Normative references

- ISO/IEC 27001:2022 — Annex A.5.9 (Inventory of information and other associated assets).
- ISO/IEC 27701:2025 — as the PIMS extension context for asset classification.
- ADR-0101 — the governing decision for this register.
- ADR-0061 — the PII Field Registry (the PII half of A.5.9).
- ROCKY-INV-001 — the as-built controls inventory.

## 5. Asset classes

Table 1 enumerates the non-PII asset classes. Each class shall be assigned an owner and a location
and shall be reviewed on the cadence in Clause 6.

| # | Asset class | Example assets | Owner |
| --- | --- | --- | --- |
| 1 | Database schema (non-PII) | Drizzle table definitions, enum chains, RLS policy objects | Database Bot |
| 2 | Infrastructure as code | Docker / Cloudflare Access topology, deployment manifests | Execution Bot |
| 3 | Source code & repositories | `packages/*`, `apps/*`, ADR corpus | Architecture Review |
| 4 | Build & CI artefacts | `turbo` build graphs, generated tRPC types, migration SQL | Validators Bot |
| 5 | Configuration & secrets references | `system_parameters`, feature flags, env declarations (secret values excluded) | Execution Bot |
| 6 | Operational telemetry (non-PII) | hash-chained audit store, metrics, request logs with anonymised actor refs | Audit Bot |

**Table 1 — Non-PII information and associated asset classes**

## 6. Maintenance

1. The register shall be updated whenever a schema migration, a new package, or an infrastructure
   change is merged.
2. The Database Bot shall be the owner of class 1; the Execution Bot of classes 2, 4 and 5; the
   Architecture Review of class 3; the Audit Bot of class 6.
3. A quarterly review shall reconcile the register against the live schema and infrastructure.
4. Machine-anchored provenance: the canonical schema and enum definitions live in
   `@rocky/database`; the crosswalk and control mappings live in `VALIDATED_CROSSWALK`
   (`packages/validators/src/compliance/gdpr-articles.ts`). This register cites those anchors and
   shall not hand-copy them.

## 7. Relationship to the Statement of Applicability

Control **A.5.9** in ROCKY-ISMS-001 was recorded as **PARTIAL** because the PII portion was
implemented (the `PII_FIELD_REGISTRY`) while the broader non-PII inventory was a later artifact. The
authoring of this register provides the missing evidence; the control remains **PARTIAL** pending the
living-maintenance procedure in Clause 6. The PII half is tracked under ROCKY-INV-001 / ADR-0061 and
shall not be re-listed here.

## 8. Bibliography

- ISO/IEC 27001:2022 — Information security management systems — Requirements.
- ISO/IEC 27701:2025 — Extension to ISO/IEC 27001 and ISO/IEC 27002 for privacy information management.
- ADR-0101 — Non-PII Asset Inventory (governing).
- ADR-0061 — PII Field Registry.
- ADR-0067 — ISMS Posture & ISO 27001 / ISO 27701:2025 Alignment Roadmap.
- ROCKY-INV-001 — As-Built Security & Privacy Controls Inventory.
- [Statement of Applicability — ROCKY-ISMS-001](./isms-policy.md).
