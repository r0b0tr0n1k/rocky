---
title: Supplier / Processor Security Assessment Procedure
sidebarTitle: Supplier Security Assessment
---

# Supplier / Processor Security Assessment Procedure — ROCKY-SUP-001

> _sniffs_ The cow is identified by a third party's auth cloud, its credentials
> minted off our servers. That is a supplier relationship — and ISO 27001 treats
> it as a control, not an afterthought. This procedure is the governance wrapper
> that turns "we use Better Auth" into "we assessed Better Auth".

| Document field | Value |
| --- | --- |
| **Title** | Supplier / Processor Security Assessment Procedure — ROCKY-SUP-001 |
| **Reference** | ROCKY-SUP-001 |
| **Version** | 0.1.0-draft (governance wrapper over existing processor inventory) |
| **Status** | Draft — procedure authored; assessment records to be completed per cycle |
| **Owner** | Docs Bot, co-owned with Authorization / Execution Bots |
| **Classification** | Internal — Reference |
| **Next review** | On completion of the first assessment cycle (see §6) |
| **Related** | ADR-0098 (governing); ADR-0075 (processor / sub-processor management); ADR-0067 (ISMS roadmap); [isms-policy.md](./isms-policy.md) (ROCKY-ISMS-001, controls A.5.19–.23); [rocky-dpa.md](./rocky-dpa.md) (ROCKY-PROC-001); [rocky-processor-register.md](./rocky-processor-register.md) |

---

## 1. Purpose

This procedure specifies how Rocky shall identify, assess and monitor the information-security posture
of suppliers and processors that handle, process or store Rocky information or personal data on its
behalf. It gives effect to the controls in ISO/IEC 27001:2022 Annex A.5.19, A.5.20 and A.5.21.

## 2. Scope

This procedure applies to all external parties that provide information-processing services to Rocky,
including but not limited to:

- authentication / identity providers (for example Better Auth as a managed service);
- cloud hosting and database infrastructure providers;
- document-generation and signing subsystems (for example the PAdES signing HSM).

Out of scope: physical perimeters of the hosting provider, which are captured under the shared-responsibility attestation (ROCKY-PHY-001, ADR-0103). The legal obligations of processors are recorded separately in the processor register and the data processing agreements.

## 3. Terms and definitions

- **supplier** — an external party that supplies products or services to Rocky.
- **processor** — a supplier that processes personal data on behalf of Rocky (GDPR Art 28).
- **assessment** — the documented review of a supplier's security controls, certifications and contractual terms.
- **residual risk** — the risk that remains after the supplier's controls are applied and accepted by Rocky.

## 4. Normative references

- ISO/IEC 27001:2022 — Annex A.5.19 (Information security in supplier relationships), A.5.20 (Addressing information security within supplier agreements), A.5.21 (Managing information security in the ICT supply chain).
- ISO/IEC 27701:2025 — A.3.10 (Addressing information security within supplier agreements), A.2.2.x (processor obligations).
- Regulation (EU) 2016/679 — Art 28 (processor obligations), Art 32 (security of processing).
- ADR-0075 — Processor / sub-processor management.
- ADR-0067 — Rocky ISMS roadmap (Phase 2 procedures).

## 5. Assessment procedure

### 5.1 Identification

Rocky shall maintain an inventory of suppliers and processors. The processor inventory already exists as [rocky-processor-register.md](./rocky-processor-register.md) and shall be the source of the supplier list for assessment.

### 5.2 Due-diligence tiers

Suppliers shall be assigned a tier based on the sensitivity of the data and the function they perform.

| Tier | Trigger | Minimum assessment |
| --- | --- | --- |
| **T1 — Critical** | Processes or stores direct PII, or provides the authentication boundary | Written DPA (ROCKY-PROC-001); ISO 27001 / SOC 2 attestation; cryptography posture review |
| **T2 — Material** | Hosts infrastructure or handles indirect/derived PII | Written DPA; attestation or self-assessment questionnaire |
| **T3 — Standard** | Non-PII or commodity service | Contractual security clause; periodic re-confirmation |

**Table 1 — Supplier due-diligence tiers**

### 5.3 Assessment content

For each supplier at T1 or T2, the assessment record shall capture at minimum:

1. the data categories processed and the legal basis for transfer;
2. the supplier's certifications (ISO 27001, SOC 2, or equivalent) and their validity;
3. the contractual security obligations (the DPA and any supplier agreement);
4. the cryptographic controls in transit and at rest (see ADR-0071 for the status of at-rest controls);
5. the incident-notification commitments (GDPR Art 33/34 mirror).

### 5.4 Acceptance and residual risk

Where a supplier control is not yet implemented (for example cryptography at rest, paused per ADR-0071), the residual risk shall be recorded as accepted only with a named owner and a review date. Acceptance shall be documented in the assessment record, not assumed.

### 5.5 Monitoring and review

Each T1/T2 supplier shall be re-assessed at least annually, or upon a material change to the service or a reported incident. The assessment date and the next-review date shall be recorded.

## 6. Records

The assessment record for each supplier shall be retained alongside the processor register. A blank
assessment template shall record: supplier identity, tier, data categories, certifications, DPA
reference, residual-risk acceptance (owner + review date), assessment date, next-review date.

## 7. Related documents

- [Statement of Applicability — ROCKY-ISMS-001](./isms-policy.md) — controls A.5.19 (Information security in supplier relationships), A.5.20 (Addressing information security within supplier agreements), A.5.21 (Managing information security in the ICT supply chain).
- [Data Processing Agreement — ROCKY-PROC-001](./rocky-dpa.md) — the Art 28 contractual terms.
- [Processor / Sub-processor Register](./rocky-processor-register.md) — the supplier inventory source.
- [Cryptography Policy](https://earendil-works.github.io/rocky-docs/ADR/0071-cryptography-at-rest-via-off-server-envelope-encryption-a-8-24-gdpr-art-32) (ADR-0071) — the at-rest control status referenced in §5.3(4).

## Bibliography

- ISO/IEC 27001:2022 — Information security management systems — Requirements.
- ISO/IEC 27701:2025 — Extension to ISO/IEC 27001 and ISO/IEC 27002 for privacy information management.
- Regulation (EU) 2016/679 — General Data Protection Regulation (GDPR).
- ADR-0075 — Processor / sub-processor management.
- ADR-0098 — Supplier / Processor Security Assessment Procedure (governing ADR).
- ADR-0067 — Rocky ISMS Posture & ISO 27001 / ISO 27701:2025 Alignment Roadmap.
