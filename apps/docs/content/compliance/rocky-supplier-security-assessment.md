---
title: Supplier / Processor Security Assessment Procedure
sidebarTitle: Supplier Assessment (ROCKY-SUP-001)
---

# Supplier / Processor Security Assessment Procedure — ROCKY-SUP-001

> The processor inventory and the data processing agreement already exist. What this procedure adds
> is the governance discipline over them: who is assessed, how, and what residual risk we accept when
> a supplier control is not yet implemented.

| Document field | Value |
| --- | --- |
| **Title** | Supplier / Processor Security Assessment Procedure — ROCKY-SUP-001 |
| **Reference** | ROCKY-SUP-001 |
| **Version** | 1.0.0 |
| **Status** | Draft — governance wrapper over the existing processor inventory |
| **Owner** | Architecture Review (co-owned with Authorization / Execution Bots) |
| **Classification** | Internal — Procedure |
| **Next review** | Annual, or on onboarding of a new critical supplier |
| **Related** | ADR-0098 (governing); ADR-0075 (processor / sub-processor management — inventory source); ADR-0067 (ISMS roadmap); ADR-0071 (cryptography-at-rest, paused); ADR-0103 (physical controls provider attestation); [isms-policy.md](./isms-policy.md) (ROCKY-ISMS-001, controls A.5.19 / A.5.20 / A.5.21); [rocky-processor-register.md](./rocky-processor-register.md) (ROCKY-PROC-001, inventory); [rocky-dpa.md](./rocky-dpa.md) (ROCKY-DPA-001, contractual terms) |

---

## 1. Purpose

This procedure defines how Rocky assesses the information-security posture of the suppliers and
processors it depends on, so that Annex A controls **A.5.19** (Information security in supplier
relationships), **A.5.20** (Addressing information security within supplier agreements) and **A.5.21**
(Managing information security in the ICT supply chain) are defensible as PLANNED with explicit, owned
governance evidence.

## 2. Scope

This procedure applies to every external party that processes Rocky information or personal data on
Rocky's behalf, including but not limited to:

- **Better Auth** — authentication / session provider (SaaS).
- **The cloud host** — infrastructure (compute, storage, database).
- **The PAdES signing HSM** — document signing authority.

It assesses; it does **not** re-contract. The contractual terms live in
[rocky-dpa.md](./rocky-dpa.md) (ROCKY-DPA-001) and the inventory in
[rocky-processor-register.md](./rocky-processor-register.md) (ROCKY-PROC-001).

## 3. Risk-tiered due-diligence model

| Tier | Criteria | Assessment minimum | Cadence |
| --- | --- | --- | --- |
| **T1 — Critical** | Processes direct PII or holds signing keys (Better Auth, cloud host, HSM) | Written security questionnaire + evidence of independent attestation (SOC 2 Type II / ISO 27001 / ISO 27701) + sub-processor flow-down review | Annual |
| **T2 — Significant** | Processes non-PII data or provides a security-relevant service | Written security questionnaire + attestation on file | Every 2 years |
| **T3 — Low** | No access to Rocky data or systems | Recorded in the processor register; attestation not required | On change |

## 4. Assessment content (minimum set)

Each T1/T2 assessment shall record:

1. The supplier's role and the data categories it processes.
2. The supplier's independent security attestations (with expiry dates).
3. The sub-processors the supplier may engage, and whether Rocky's DPA flow-down covers them.
4. The residual risks accepted because a control is not yet implemented, each with a **named owner**
   and a **review date**.
5. The assessment outcome (Accept / Accept-with-conditions / Reject).

## 5. Residual-risk acceptance

Where a supplier control is not yet implemented — for example cryptography at rest, which is **paused**
per ADR-0071 — this procedure shall record the residual risk as **accepted only with a named owner and a
review date**. It shall not assume acceptance. The acceptance is recorded in
[isms-policy.md](./isms-policy.md) (ROCKY-ISMS-001, A.8.24 / A.3.26) and in
[rocky-cryptography-policy.md](./rocky-cryptography-policy.md) (ROCKY-CRYPTO-001).

## 6. Roles and responsibilities

- **Architecture Review** owns this procedure and chairs the annual T1 assessment.
- **Authorization Bot** maintains the processor register (ADR-0075) and supplies the inventory input.
- **Execution Bot** supplies evidence of the at-rest cryptography decision (ADR-0071) for T1 suppliers.

## 7. Records

Assessment records are maintained as part of the processor register review and retained for the period
defined in [rocky-retention-schedule.md](./rocky-retention-schedule.md). The assessment outcome feeds
the Statement of Applicability evidence column for A.5.19 / A.5.20 / A.5.21.

## 8. Related controls

- A.5.19 / A.5.20 / A.5.21 — addressed by this procedure (PLANNED, governance-authored).
- A.2.2.x / A.3.10 (ISO/IEC 27701:2025) — supplier / processor security.
- A.7.* — physical controls, assessed via the provider attestation (ADR-0103).

## Bibliography

- ISO/IEC 27001:2022, Annex A.5.19, A.5.20, A.5.21.
- ISO/IEC 27701:2025, Annex A.2.2, A.3.10.
- GDPR Art. 28 (processor obligations) — given effect by [rocky-dpa.md](./rocky-dpa.md).
