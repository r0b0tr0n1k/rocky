---
title: Training & Awareness Programme Records
sidebarTitle: Training & Awareness
---

# Training & Awareness Programme Records — ROCKY-TRN-001

> _sniffs_ The system is access-controlled and tamper-evident, but the workforce that
> operates it is not yet trained on the policy. This document is the programme and the
> blank record — not evidence of training already done. The gap is named, not hidden.

| Document field | Value |
| --- | --- |
| **Title** | Training & Awareness Programme Records — ROCKY-TRN-001 |
| **Reference** | ROCKY-TRN-001 |
| **Version** | 0.1.0-draft (programme + blank records template; no completed training on file) |
| **Status** | Draft — procedure authored; training records to be completed per cycle |
| **Owner** | Docs Bot, co-owned with Authorization / Execution Bots |
| **Classification** | Internal — Reference |
| **Next review** | On completion of the first training cycle (see §5) |
| **Related** | ADR-0100 (governing); ADR-0067 (ISMS roadmap); [isms-policy.md](./isms-policy.md) (ROCKY-ISMS-001, controls A.6.3 / A.3.17); [Standardization/documents/documentation/records/DOC-005_Training Completion Log.md](../Standardization/documents/documentation/records/DOC-005_Training Completion Log.md) (record template pattern) |

---

## 1. Purpose

This document specifies Rocky's information-security awareness, education and training programme and the
records that evidence it. It gives effect to ISO/IEC 27001:2022 Annex A.6.3 (Information security
awareness, education and training) and ISO/IEC 27701:2025 Annex A.3.17 (Information security awareness,
education and training).

## 2. Scope

The programme applies to all personnel and contracted roles with access to Rocky information or
personal data: developers, administrators, inspectors' support staff, and any external party operating
the system. Out of scope: formal certification of personnel (a later Phase 2 action).

## 3. Terms and definitions

- **awareness** — personnel understand the information-security policy and their security responsibilities.
- **training** — personnel acquire the role-specific competence to perform secure tasks.
- **training record** — the dated evidence that a named person completed a defined training item.

## 4. Normative references

- ISO/IEC 27001:2022 — Annex A.6.3 (Information security awareness, education and training).
- ISO/IEC 27701:2025 — Annex A.3.17 (Information security awareness, education and training).
- Regulation (EU) 2016/679 — Art 39 (staff awareness of data-protection obligations).
- ADR-0067 — Rocky ISMS roadmap (Phase 2 procedures).

## 5. Programme

### 5.1 Topics

The awareness curriculum shall cover at minimum:

1. the information-security and privacy policy (ROCKY-ISMS-001);
2. the access-control model (RLS, RBAC, Principal, mask-by-default);
3. the tamper-evident audit and the obligation to report security events;
4. the data-protection obligations under GDPR / MK LPDP (Art 39 awareness);
5. the cryptography posture, including the accepted at-rest gap (ROCKY-CRYPTO-001, ADR-0071).

### 5.2 Cadence

| Item | Frequency |
| --- | --- |
| Initial awareness (on role start) | Within 30 days of access grant |
| Refresher awareness | Annually |
| Targeted training (on control change) | On material change to a covered control |

**Table 1 — Training cadence**

### 5.3 Roles and responsibility

The programme owner (Docs Bot, co-owned with Authorization / Execution Bots) shall schedule training,
maintain the records, and report completion status to the management review. Line owners shall ensure
their personnel complete assigned items.

## 6. Records template

Each training event shall be recorded on the completion log, capturing: person, role, training item,
date, mode (in-person / self-study), and the approving signature. The record follows the
[Standardization record template pattern](../Standardization/documents/documentation/records/DOC-005_Training Completion Log.md).

| Person | Role | Training item | Date | Mode | Approved by |
| --- | --- | --- | --- | --- | --- |
| _&lt;name&gt;_ | _&lt;role&gt;_ | _&lt;item&gt;_ | _&lt;YYYY-MM-DD&gt;_ | _&lt;mode&gt;_ | _&lt;signatory&gt;_ |

**Table 2 — Training completion log (blank template)**

## 7. Status

No completed training records are on file at the time of authoring; the programme and the blank
template are established here as the governance layer. Completion records shall be added as the first
cycle runs. The control remains **PLANNED** in the SoA until records evidence delivery.

## 8. Related documents

- [Statement of Applicability — ROCKY-ISMS-001](./isms-policy.md) — controls A.6.3 (Awareness, education and training), A.3.17 (PIMS awareness).
- [Training Completion Log — record template](../Standardization/documents/documentation/records/DOC-005_Training Completion Log.md) — the record pattern this programme fills.
- [Cryptography Policy — ROCKY-CRYPTO-001](./rocky-cryptography-policy.md) — topic 5 of the curriculum (§5.1(5)).

## Bibliography

- ISO/IEC 27001:2022 — Information security management systems — Requirements (A.6.3).
- ISO/IEC 27701:2025 — Extension to ISO/IEC 27001 and ISO/IEC 27002 for privacy information management (A.3.17).
- Regulation (EU) 2016/679 — General Data Protection Regulation (GDPR Art 39).
- ADR-0100 — Training & Awareness Programme (governing ADR).
- ADR-0067 — Rocky ISMS Posture & ISO 27001 / ISO 27701:2025 Conformity Roadmap.
