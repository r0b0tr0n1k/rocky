---
title: Cryptography Policy (Risk-Accepted Gap)
sidebarTitle: Cryptography Policy
---

# Cryptography Policy — ROCKY-CRYPTO-001

> _sniffs_ The auditor asks: "Is the data encrypted at rest?" The honest answer is no — and
> this policy says so, names who owns that decision, and sets a date to revisit it. That is
> risk acceptance, not a deferred build masquerading as done.

| Document field | Value |
| --- | --- |
| **Title** | Cryptography Policy — ROCKY-CRYPTO-001 |
| **Reference** | ROCKY-CRYPTO-001 |
| **Version** | 0.1.0-draft (documents the ADR-0071 pause + residual-risk acceptance) |
| **Status** | Draft — crypto-at-rest is a **risk-accepted gap**; not implemented |
| **Owner** | Execution Bot / Architecture Review (key-custody decision) |
| **Classification** | Internal — Reference |
| **Next review** | 2026-Q4 (or on the ADR-0071 key-custody decision) |
| **Related** | ADR-0071 (governing — cryptography-at-rest, PAUSED); ADR-0061 (GDPR erasure/retention); ADR-0067 (ISMS roadmap, G5); ADR-0084 (offline signed-QR credentials, in-transit only); [isms-policy.md](./isms-policy.md) (ROCKY-ISMS-001, controls A.8.24 / A.3.26); [rocky-supplier-security-assessment.md](./rocky-supplier-security-assessment.md) (ROCKY-SUP-001) |

---

## 1. Purpose

This policy records Rocky's cryptographic posture, the intended control for data at rest, and — most
importantly — the explicit, governed acceptance of the residual risk arising from the fact that the
control is **not implemented**. It gives effect to ISO/IEC 27001:2022 Annex A.8.24 (Use of
cryptography) and ISO/IEC 27701:2025 Annex A.3.26 (Use of cryptography).

## 2. Scope

This policy covers cryptographic protection of Rocky information and personal data, in transit and at
rest. It does not authorise any code change; the at-rest control remains paused (ADR-0071).

## 3. Terms and definitions

- **envelope encryption** — data encrypted with a per-row / per-table Data Encryption Key (DEK); the DEK encrypted with a Key Encryption Key (KEK).
- **off-server KEK** — the KEK held in a vault / KMS / HSM on a host separate from the database and application, never in the Rocky repository or database.
- **residual risk** — the risk that remains because crypto-at-rest is not implemented, accepted here with an owner and a review date.

## 4. Cryptographic controls in transit

Data in transit is protected by platform-level transport security (TLS 1.2/1.3). Records additionally
carry cryptographic **authenticity and integrity** through the offline-verifiable signed-QR credentials
(ADR-0084, Ed25519 signatures). This is the only cryptographic control currently in operation.

## 5. Cryptographic controls at rest — intended design (NOT implemented)

The intended control, defined in ADR-0071, is **envelope encryption with an off-server KEK**: PII
columns flagged `direct` / `defaultExcluded` are encrypted at rest with a per-row / per-table DEK; the
KEK lives in a vault on a separate server (an external KMS / HSM), never held long-term by the
application server.

**This control is NOT implemented.** Personal data is stored in plaintext at rest in Postgres.
Row-Level Security is logical, not physical: a database-level breach, which RLS does not prevent,
exposes every direct PII column. This is a documented gap, not a claim of implementation.

## 6. Key-custody decision (open)

The key-custody model (HSM versus vault, custody split, rotation) is **not yet decided**. The default
custody stated in ADR-0071 is a vault on a separate server; the final decision is owned by the
Execution Bot / Architecture Review and is the gate for any future implementation.

## 7. Residual-risk acceptance

The organisation **accepts** the residual risk of unencrypted data at rest, on the following governed
terms:

| Field | Value |
| --- | --- |
| **Risk** | Exposure of direct PII on a database-level breach (RLS does not protect at rest) |
| **Owner** | Execution Bot / Architecture Review (key-custody decision) |
| **Review date** | 2026-Q4, or earlier on the ADR-0071 key-custody decision |
| **Mitigating controls** | RLS access-scoping; mask-by-default projection (fields omitted unless `pii:read` + purpose); tamper-evident audit (ADR-0007); signed-QR integrity in transit (ADR-0084) |
| **Re-assessment trigger** | Any change to data-residency, a reported storage breach, or counsel direction under ADR-0067 Phase 3 |

**Table 1 — Risk-accepted gap register entry (A.8.24 / A.3.26)**

This acceptance is recorded, time-boxed and owned. It is not a permanent silence: the review date
forces a decision (implement, or re-accept with revised terms).

## 8. Related documents

- [Statement of Applicability — ROCKY-ISMS-001](./isms-policy.md) — controls A.8.24 / A.3.26 recorded as PLANNED (risk-accepted gap).
- [ADR-0071 — Cryptography-at-Rest (PAUSED)](https://earendil-works.github.io/rocky-docs/ADR/0071-cryptography-at-rest-via-off-server-envelope-encryption-a-8-24-gdpr-art-32) — the governing decision this policy documents.
- [Offline signed-QR credentials — ADR-0084](https://earendil-works.github.io/rocky-docs/ADR/0084-offline-signed-qr-credentials) — the only in-operation crypto control (in transit).
- [Supplier / Processor Security Assessment — ROCKY-SUP-001](./rocky-supplier-security-assessment.md) — assesses supplier crypto posture (§5.3(4)).

## Bibliography

- ISO/IEC 27001:2022 — Information security management systems — Requirements (A.8.24).
- ISO/IEC 27701:2025 — Extension to ISO/IEC 27001 and ISO/IEC 27002 for privacy information management (A.3.26).
- Regulation (EU) 2016/679 — General Data Protection Regulation (GDPR Art 32).
- ADR-0071 — Cryptography-at-Rest via Off-Server Envelope Encryption (governing; PAUSED).
- ADR-0067 — Rocky ISMS Posture & ISO 27001 / ISO 27701:2025 Alignment Roadmap.
