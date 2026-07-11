# Technical & Organizational Measures (TOMs) — Rocky

> _sniffs_ The pasted template claimed TDE, GPG backups, Zero Trust and Wazuh as
> done. They are not. This document keeps the template's structure but reports
> Rocky's _actual_ measures — MET where real, GAP where owed. MK LPDP Art 28/29/36
> mirror GDPR Art 32; our enforcement is as-built, not aspirational.

| Document field | Value |
| --- | --- |
| **Title** | Technical & Organizational Measures (TOMs) — Rocky |
| **Reference** | ROCKY-TOMS-001 |
| **Version** | 0.1.0-draft (harvest of actual measures) |
| **Status** | Draft — MET vs GAP stated honestly; not a conformity assessment |
| **Owner** | Docs Bot, co-owned with Authorization / Execution / Audit Bots |
| **Classification** | Internal — Reference |
| **Next review** | On Phase 2 completion (see ADR-0067) |
| **Related** | ADR-0067; ADR-0071 (crypto-at-rest); ROCKY-ROPA-001 §7; ROCKY-BRCH-001; ROCKY-DSR-001; ROCKY-PROC-001; MACEDONIAN_LPDP_GDPR_ISO27701_CONTROLS_MATRIX |

---

## 1. Legal framework (MK LPDP Art 28 / 29 / 36; GDPR Art 32)

- **Art 28** — controller accountability: internal policies + staff awareness training. _Training: GAP (to be established)._
- **Art 29 / 36** — security of processing: appropriate TOMs (encryption, pseudonymization, resilience).
- **Art 37 / 38** — breach notification + transparency / data-subject rights.
- The MK LPDP articles mirror GDPR; we map to our as-built enforcement below.

## 2. Encryption & data protection

| Measure | State | Evidence |
| --- | --- | --- |
| In transit (TLS 1.2/1.3) | MET (platform-level) | Expo / EAS / Next transport security |
| At rest — crypto-at-rest | **GAP** | ADR-0071 paused; TDE/LUKS2 **not** claimed |
| Backup encryption (GPG) | UNVERIFIED | to confirm with infra |
| Pseudonymization — `PII_FIELD_REGISTRY` + mask-by-default | MET | ADR-0061 D1; reveal-gate |
| Tokenization / hashing for non-prod | PARTIAL | classification exists; non-prod tokenization TBD |

> _rubs nose vigorously_ The template's "Full Disk Encryption LUKS2 / TDE" is **not** asserted here — crypto-at-rest is explicitly paused (ADR-0071).

## 3. Access control & authentication

| Measure | State | Evidence |
| --- | --- | --- |
| RBAC (Principal / PolicyEngine) | MET | Authorization Bot |
| Row-Level Security (pgPolicy) | MET | Database Bot |
| Least privilege (farm/tenant scope) | MET | RLS + Principal resolution |
| Centralized auth (Better Auth) | MET | Auth Bot |
| MFA for administrative access | UNVERIFIED | to confirm enforcement |
| Quarterly access reviews / recertification | GAP | no review workflow |
| Zero Trust architecture | GAP | not architected |

## 4. Resilience & availability

| Measure | State | Evidence |
| --- | --- | --- |
| Tamper-evident audit / monitoring | MET | lifecycle-event audit store |
| 24/7 monitoring | UNVERIFIED | to confirm |
| Backup encryption / geo-distribution | UNVERIFIED | to confirm with infra |
| RTO / RPO (4h / 1h) | UNVERIFIED | not documented |

## 5. Privacy by design & default

- **Data minimization / purpose limitation** — MET (A.1.4.2 / .3): `PII_FIELD_REGISTRY` classifies and limits fields.
- **Storage limitation / retention automation** — PARTIAL: blanket 3-yr archive `@Cron`; per-category schedule per ROCKY-ERP-001 is GAP.

## 6. Incident response & breach (Art 37)

- Detection: audit log — MET.
- 72h DPA notification / data-subject notification — **GAP** (notification workflow not built). See ROCKY-BRCH-001.

## 7. Data subject rights (Art 38)

- Access / rectification / erasure / portability — access-control MET; **intake mechanism GAP**. See ROCKY-DSR-001.

## 8. Processor management (Art 28)

- Written DPAs with all processors — PARTIAL (processors identified in ROCKY-PROC-001; terms to execute).

## 9. Testing & assessment

- Vulnerability scanning / penetration testing / patch management — **UNVERIFIED / GAP** (no verified program; the template's "Wazuh / annual pen test" is not claimed).

---

> _waves hands frantically_ This TOMs register is **alignment documentation**, not a
> certification claim. Where the source template asserted a control, we marked it
> MET only if enforced, GAP if owed, UNVERIFIED if unknown. The honest inventory
> is the point — the auditor trusts the gap list more than the boast.
