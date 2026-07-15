---
title: Change & Configuration Management Procedure
sidebarTitle: Change-Mgmt Procedure
---

# Change & Configuration Management Procedure — Rocky

> _sniffs_ The mechanism already exists — typed Zod schemas, the Diamond Seal
> NoDrift guillotine, the RobotFarm review contracts. What was missing was the
> governance wrapper: who authorises a change, where the configuration register
> lives, and how duties are segregated at sign-off. This procedure is that wrapper.

| Document field | Value |
| --- | --- |
| **Title** | Change & Configuration Management Procedure — Rocky |
| **Reference** | ROCKY-CHG-001 |
| **Version** | 0.1.0-draft (governance wrapper; enforcing mechanism already present) |
| **Status** | Draft — procedure authored; configuration register to be established |
| **Owner** | Docs Bot, co-owned with Validators / Authorization Bots |
| **Classification** | Internal — Reference |
| **Next review** | On ADR-0102 acceptance; thereafter on each process change |
| **Related** | ADR-0102 (governing, A.8.32 / A.8.9); ADR-0018 / ADR-0019 (Diamond Seal); ADR-0067 (ISMS roadmap); ADR-0061 (erasure/retention); [Statement of Applicability — ROCKY-ISMS-001](./isms-policy.md) (A.8.32, A.8.9) |

---

## 1. Purpose

This procedure governs how changes to Rocky's information-processing systems and their configuration
are authorised, recorded and reviewed, satisfying control **A.8.32** (Change management) and
supporting **A.8.9** (Configuration management). It wraps the existing automated enforcement with an
explicit governance layer.

## 2. Scope

- **In scope:** changes to source code, schemas, configuration, deployment topology, and the
  crosswalk/control mappings, across all `packages/*` and `apps/*`.
- **Out of scope:** the automated schema-drift and contract checks themselves — those are enforced by
  the Diamond Seal NoDrift mechanism (ADR-0018 / ADR-0019) and are cited here, not redefined.

## 3. Terms and definitions

- **change** — any modification to code, schema, configuration or deployment that alters a controlled
  system.
- **configuration item** — a version-controlled artifact whose state is tracked (schema, env
  declarations, feature flags, crosswalk).
- **change authorisation** — the recorded approval that permits a change to proceed to merge/deploy.
- **segregation of duties (SoD)** — the principle that the author of a change shall not be its sole
  approver.

## 4. Normative references

- ISO/IEC 27001:2022 — Annex A.8.32 (Change management), A.8.9 (Configuration management).
- ADR-0102 — the governing decision for this procedure.
- ADR-0018 / ADR-0019 — the Diamond Seal validators (the enforcing mechanism).
- ADR-0067 — ISMS Posture roadmap (Phase 2 governance).

## 5. Change-authorisation workflow

Table 1 sets out the workflow. Each change shall follow it; the automated checks (Clause 6) are a
gate that runs before authorisation is meaningful.

| # | Step | Actor | Output |
| --- | --- | --- | --- |
| 1 | Propose change (branch + ADR/spec where required) | Author | Linked change request |
| 2 | Automated checks pass (NoDrift, type-check, tRPC generate) | CI | Green pipeline |
| 3 | Review & approve (reviewer ≠ author for privileged changes) | Reviewer / Approver | Recorded sign-off |
| 4 | Merge & deploy | Release Bot | Versioned artifact |
| 5 | Post-change verification & register update | Owner | Closed change record |

**Table 1 — Change-authorisation workflow**

## 6. Enforcing mechanism (already implemented)

The following are present today and shall be cited as the mechanism this procedure governs:

- **Diamond Seal NoDrift guillotine** (ADR-0018 / ADR-0019) blocks schema and contract drift in CI.
- **Typed Zod schemas** on every API input/output are the configuration contract for the data layer.
- **RobotFarm review contracts** (`AGENTS.md` chain) require re-reading the owning contract before an
  edit, effecting segregated, documented review.

This procedure does not claim these mechanisms as "the procedure"; it is the governance wrapper around
them.

## 7. Configuration register

A central **configuration register** shall be established that records each configuration item, its
owner, its current approved version, and the change that last modified it. Until that register exists
as a discrete artifact, the version-controlled source (`packages/*`, `apps/*`, the crosswalk) is the
provisional register. This document shall not claim a register that does not yet exist.

## 8. Segregation of duties at sign-off

For privileged or security-relevant changes, the approver shall be a different person from the author.
The Authorization Bot (Principal / PolicyEngine, ADR-0022) enforces role-separated privileged access
at runtime; this procedure extends the same principle to the change record.

## 9. Relationship to the Statement of Applicability

Control **A.8.32** in ROCKY-ISMS-001 is recorded as **PLANNED**; this procedure is added as its
evidence. Control **A.8.9** is recorded as **PARTIAL** and is supported by the Diamond Seal mechanism
cited above. Neither status is flipped by this document; the procedure makes the PLANNED control
defensible as governance-authored.

## 10. Bibliography

- ISO/IEC 27001:2022 — Information security management systems — Requirements.
- ADR-0102 — Change & Configuration Management (governing).
- ADR-0018 / ADR-0019 — Diamond Seal validators (enforcing mechanism).
- ADR-0067 — ISMS Posture & ISO 27001 / ISO 27701:2025 Conformity Roadmap.
- [Statement of Applicability — ROCKY-ISMS-001](./isms-policy.md).
