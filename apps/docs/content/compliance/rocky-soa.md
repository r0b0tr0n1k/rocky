# Statement of Applicability (SoA) — Rocky

> _sniffs_ The SoA is the heart of an ISMS/PIMS: every Annex A control, marked
> Applicable or Not, with the justification and our actual status. ISO 27001
> 6.1.3 / Annex A + ISO 27701 PIMS controls. We fill it from enforcement we run
> and the gap-analysis — not from aspiration.

| Document field | Value |
| --- | --- |
| **Title** | Statement of Applicability (SoA) — Rocky |
| **Reference** | ROCKY-SOA-001 |
| **Version** | 0.1.0-draft (as-built control mapping) |
| **Status** | Draft — control-by-control; status from as-built enforcement |
| **Owner** | Docs Bot, co-owned with Authorization / Database / Execution Bots |
| **Classification** | Internal — Reference |
| **Next review** | On ADR-0067 completion |
| **Related** | ADR-0067; ROCKY-ISMS-001; iso27701-2025-gap-analysis; ROCKY-TOMS-001; ROCKY-LBR-001; ROCKY-ROPA-001 |

---

## 1. Organizational controls (A.5)

| Control | Title | Applicable | Justification | Status |
| --- | --- | --- | --- | --- |
| A.5.1 | Policies for info sec | Yes | ROCKY-ISMS-001 | MET |
| A.5.2 | Roles / responsibilities | Yes | Principal / PolicyEngine | PARTIAL |
| A.5.3 | Segregation of duties | Yes | RBAC | MET |
| A.5.5 | Contact with authorities | Yes | DPA (LPDP) | PARTIAL |
| A.5.8 | Sec in project management | Yes | Diamond Seal SDLC | MET |
| A.5.9 | Inventory of assets | Yes | DB schema known | PARTIAL |
| A.5.12 | Data leakage prevention | Yes | mask / reveal-gate | PARTIAL |
| A.5.13 | Information backup | Yes | GPG backup unverified | PARTIAL |
| A.5.15 | Logging | Yes | lifecycle-event audit | MET |
| A.5.16 | Monitoring | Yes | audit store | PARTIAL |
| A.5.18 | Use of privileged rights | Yes | RBAC | MET |
| A.5.19 | Sec in development | Yes | Diamond Seal | MET |
| A.5.20 | Secure system architecture | Yes | RLS / RBAC | MET |
| A.5.23 | Cloud services security | Yes | host responsibility | PARTIAL |
| A.5.24 | Use of cryptography | Yes | **crypto-at-rest paused** | GAP (ADR-0071) |
| A.5.25 | Secure development lifecycle | Yes | Diamond Seal | MET |

## 2. People controls (A.6)

| Control | Title | Applicable | Justification | Status |
| --- | --- | --- | --- | --- |
| A.6.1 | Screening | Yes | — | PARTIAL |
| A.6.2 | Terms / conditions | Yes | — | PARTIAL |
| A.6.3 | Awareness / training | Yes | **not established** | GAP |
| A.6.4 | Disciplinary | Yes | — | PARTIAL |
| A.6.6 | Confidentiality / NDA | Yes | — | PARTIAL |

## 3. Physical controls (A.7)

| Control | Title | Applicable | Justification | Status |
| --- | --- | --- | --- | --- |
| A.7.1–7.14 | Physical / environmental | Partial | DB host is cloud-provided; physical security is the **provider's** responsibility under the DPA (ROCKY-PROC-001) | N/A (provider) |

## 4. Technological controls (A.8)

| Control | Title | Applicable | Justification | Status |
| --- | --- | --- | --- | --- |
| A.8.3 | Info access restriction | Yes | RLS (pgPolicy) | MET |
| A.8.4 | Access control auth | Yes | Better Auth | MET |
| A.8.5 | Secure authentication | Yes | session / SSO | MET |
| A.8.11 | Data masking | Yes | mask-by-default | MET |
| A.8.12 | Data leakage prevention | Yes | reveal-gate | PARTIAL |
| A.8.13 | Information backup | Yes | GPG unverified | PARTIAL |
| A.8.14 | Redundancy | Yes | — | PARTIAL |
| A.8.15 | Logging | Yes | audit log | MET |
| A.8.16 | Monitoring | Yes | audit store | PARTIAL |
| A.8.18 | Use of privileged rights | Yes | RBAC | MET |
| A.8.19 | Sec in development | Yes | Diamond Seal | MET |
| A.8.20 | Secure system architecture | Yes | RLS / RBAC | MET |
| A.8.24 | Use of cryptography | Yes | **crypto-at-rest paused** | GAP (ADR-0071) |
| A.8.25 | Secure dev lifecycle | Yes | Diamond Seal | MET |
| A.8.27 | Secure coding | Yes | NoDrift / Diamond Seal | MET |

## 5. PIMS controls (ISO 27701)

| Control | Title | Status | Doc |
| --- | --- | --- | --- |
| A.1.2.2 | Purpose documentation | MET | ROCKY-ROPA-001 §2 |
| A.1.2.3 | Lawful basis | MET | ROCKY-LBR-001 |
| A.1.2.6 | Privacy impact assessment | MET | ROCKY-DPIA-001 |
| A.1.2.7 | Processor contracts | PARTIAL | ROCKY-PROC-001 |
| A.1.2.9 | Records of processing | MET | ROCKY-ROPA-001 |
| A.1.3.7 | Access / correction / erasure | PARTIAL | ROCKY-ERP-001 / ROCKY-DSR-001 |
| A.1.4.6 | De-identification | PARTIAL | ROCKY-ERP-001 |
| A.1.4.8 | Retention | PARTIAL | ROCKY-RET-001 |
| A.1.5.2–.5 | Transfers | PARTIAL | ROCKY-XFER-001 |
| A.5.24–.27 | Breach notification | PARTIAL | ROCKY-BRCH-001 |

## 6. Note

The full 93-control Annex A set is tracked in `iso27701-2025-gap-analysis.md`;
this SoA consolidates the meaningful rows with our status. A.7 is N/A by virtue of
cloud-provider responsibility (documented in the DPA), not by omission.

> _waves hands frantically_ The SoA is the map the auditor flips to first. Ours
> says what we enforce and where we still owe — no boast, Comrade.
