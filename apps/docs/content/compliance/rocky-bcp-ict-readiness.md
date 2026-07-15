---
title: Business Continuity & ICT Readiness Plan
sidebarTitle: BCP & ICT Readiness
---

# Business Continuity & ICT Readiness Plan — ROCKY-BCP-001

> _sniffs_ The system can be rebuilt from source in one script — that is a continuity
> capability, not a marketing claim. Where a real RTO/RPO or live redundancy is owed but
> not yet operated, this plan says so, and names the gap as planned.

| Document field | Value |
| --- | --- |
| **Title** | Business Continuity & ICT Readiness Plan — ROCKY-BCP-001 |
| **Reference** | ROCKY-BCP-001 |
| **Version** | 0.1.0-draft (as-built continuity capabilities; RTO/RPO formalised as planned) |
| **Status** | Draft — rebuild capability documented; redundancy SLA to be established |
| **Owner** | Docs Bot, co-owned with Execution / Database Bots |
| **Classification** | Internal — Reference |
| **Next review** | On establishment of the backup/restore SLA (see §4) |
| **Related** | ADR-0099 (governing); ADR-0067 (ISMS roadmap); ADR-0104 (architecture diagrams); [isms-policy.md](./isms-policy.md) (ROCKY-ISMS-001, controls A.5.29/.30, A.8.13/.14, A.8.31); [../runbooks/db-recreate.mdx](../runbooks/db-recreate.mdx) (recreate evidence); [../runbooks/index.mdx](../runbooks/index.mdx) |

---

## 1. Purpose

This plan specifies how Rocky maintains information-security continuity and ICT readiness during
disruption, and how it restores its information-processing capability. It gives effect to ISO/IEC
27001:2022 Annex A.5.29 (Information security during disruption), A.5.30 (ICT readiness for business
continuity), A.8.13 (Information backup), A.8.14 (Redundancy of information processing facilities) and
A.8.31 (Separation of development, test and production environments).

## 2. Scope

This plan covers the Rocky application stack: the NestJS API (`apps/api`), the Next.js admin and
documentation (`apps/web`, `apps/docs`), the Expo mobile app (`apps/mob`), the Postgres database with
Row-Level Security, and the supporting runbooks. It addresses disruption of the service or its data,
not the physical perimeter (which is the hosting provider's responsibility, ROCKY-PHY-001, ADR-0103).

## 3. Business impact and objectives

The system underpins livestock identification, movement, health and inspection. A sustained outage
degrades the enforcement layer (movement blocking, inspection recording) but does not, by itself,
expose personal data, because data is access-scoped by RLS and masked by default.

| Objective | As-built capability | Status |
| --- | --- | --- |
| Rebuild environments from source | `scripts/db-recreate.sh` regenerates schema + applies RLS + idempotent seed | **Available** |
| Restore from backup | Recreate script reproduces state; a formal backup/restore SLA is pending | **Partial** |
| Redundant processing facilities | Single-environment deployment; no hot standby operated | **Planned** |
| Segregation of environments | Dev/test/prod separation governed by RobotFarm review; no enforced network isolation | **Partial** |

**Table 1 — Continuity objectives and as-built status**

## 4. Backup and restore

Database state is reproducible through the recreate script (`scripts/db-recreate.sh`), which performs a
Drizzle push, resolves RLS placeholders via `fix-rls-sql.mjs`, and runs an idempotent seed (see
[../runbooks/db-recreate.mdx](../runbooks/db-recreate.mdx)). This provides a **rebuild** capability.

A formal **backup/restore SLA** (RPO and RTO) is not yet operated. Until it is established, the
recreate script is the documented recovery mechanism and its restore objective is recorded as
**planned**, with the SLA to be defined by the Execution Bot under ADR-0067 Phase 2.

## 5. ICT readiness

ICT readiness is maintained through:

1. version-controlled infrastructure and schema, so any environment can be reconstructed deterministically;
2. the tamper-evident audit store (ADR-0007), which preserves the evidentiary record independently of the primary database;
3. the system-architecture diagram set (ADR-0104), which documents the container and component boundaries used for recovery planning.

## 6. Redundancy and environment separation

Redundant processing facilities (A.8.14) and enforced separation of development, test and production
environments (A.8.31) are recorded as planned. The RobotFarm `AGENTS.md` review chain provides a
process-level separation of duties, but no network-level isolation of environments is operated today.

## 7. Plan activation and testing

This plan shall be activated on a declared disruption to the service or its data. The recreate
procedure shall be exercised at least once per major schema change; a formal continuity test is a
Phase 2 action.

## 8. Related documents

- [Statement of Applicability — ROCKY-ISMS-001](./isms-policy.md) — controls A.5.29/.30 (continuity planning / ICT readiness), A.8.13 (backup), A.8.14 (redundancy), A.8.31 (environment separation).
- [DB Recreate & RLS runbook](../runbooks/db-recreate.mdx) — the rebuild evidence for §4.
- [Runbooks index](../runbooks/index.mdx) — the operational procedure set.

## Bibliography

- ISO/IEC 27001:2022 — Information security management systems — Requirements.
- ISO/IEC 20000-1 — Information technology — Service management.
- ISO/IEC 27031 — Information security — ICT readiness for business continuity.
- ADR-0099 — Business Continuity & ICT Readiness Plan (governing ADR).
- ADR-0067 — Rocky ISMS Posture & ISO 27001 / ISO 27701:2025 Alignment Roadmap.
