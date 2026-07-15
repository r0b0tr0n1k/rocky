---
title: Change & Configuration Management Procedure
sidebarTitle: Change & Config Mgmt (ROCKY-CHG-001)
---

# Change & Configuration Management Procedure — ROCKY-CHG-001

> The enforcing mechanism already ships (Diamond Seal NoDrift, typed Zod, RobotFarm review
> contracts). This procedure is the governance wrapper over it: who authorises a change, where the
> configuration register lives, and how duties are segregated at sign-off.

| Document field | Value |
| --- | --- |
| **Title** | Change & Configuration Management Procedure — ROCKY-CHG-001 |
| **Reference** | ROCKY-CHG-001 |
| **Version** | 1.0.0 |
| **Status** | Draft — governance wrapper over the existing enforcement |
| **Owner** | Architecture Review (co-owned with Validators / Authorization Bots) |
| **Classification** | Internal — Procedure |
| **Next review** | On material change to the CI enforcement or the RobotFarm review chain |
| **Related** | ADR-0102 (governing); ADR-0018 / ADR-0019 (Diamond Seal validators — enforcing mechanism); ADR-0022 (Authorization — SoD at runtime); ADR-0061 (PII erasure/retention); ADR-0067 (ISMS roadmap); [isms-policy.md](./isms-policy.md) (ROCKY-ISMS-001, controls A.8.32 / A.8.9) |

---

## 1. Purpose

This procedure defines how changes to Rocky are authorised and how configuration is managed, so that
Annex A controls **A.8.32** (Change management) and **A.8.9** (Configuration management) are defensible
as PLANNED / PARTIAL with explicit, owned governance evidence.

## 2. Scope

This procedure applies to all changes to the Rocky codebase, schema, infrastructure, and
configuration across `apps/` and `packages/`. It governs the human authorisation and register
discipline; the automated drift prevention is out of scope here (it is the mechanism, cited in §4).

## 3. Change-authorisation workflow

| Step | Actor | Action | Record |
| --- | --- | --- | --- |
| 1 | Author | Open change with stated intent and affected surfaces | PR description |
| 2 | Validator Bot | Run NoDrift + type/lint gates (ADR-0018 / ADR-0019) | CI evidence |
| 3 | Reviewer | Segregated review per RobotFarm `AGENTS.md` chain | Review approval |
| 4 | Authoriser | Sign off where the change touches a security-relevant surface (auth, RLS, PII) | Sign-off recorded |
| 5 | Merger | Merge only after steps 2–4 green | Merge commit |

Emergency changes may compress steps 1–3 but shall be reviewed retrospectively within one business day.

## 4. Enforcing mechanism (cited, not redefined)

The following already enforce configuration integrity and shall be cited by every assessment, not
re-implemented:

- **Diamond Seal NoDrift guillotine** (ADR-0018 / ADR-0019) — blocks schema/contract drift at CI.
- **Typed Zod schemas** — the data-layer configuration contract.
- **RobotFarm `AGENTS.md` review chain** — segregated, documented review (the SoD control at author time).

## 5. Configuration register

A central configuration register shall be established. Until it exists as a discrete artifact, the
version-controlled source tree and the crosswalk (`VALIDATED_CROSSWALK`) are the **provisional register**.
This procedure shall not claim a register that does not yet exist; the to-be-established register is a
Phase 2 action tracked in ADR-0067.

## 6. Segregation of duties at sign-off

Security-relevant changes (authentication, Row-Level Security, PII handling) require sign-off by an
actor distinct from the author. Runtime SoD is reinforced by the Authorization layer (ADR-0022,
Principal / PolicyEngine).

## 7. Records

Change authorisation and sign-off records are retained with the version-controlled history and the
audit log (ADR-0007). The assessment outcome feeds the Statement of Applicability evidence column for
A.8.32 / A.8.9.

## 8. Related controls

- A.8.32 — Change management (PLANNED, governance-authored).
- A.8.9 — Configuration management (PARTIAL, register to be established).
- A.8.25–.28 — Secure development (reinforced by the NoDrift CI).

## Bibliography

- ISO/IEC 27001:2022, Annex A.8.32, A.8.9.
- ISO/IEC 27701:2025, Annex A.2.4 (change management for PII).
