# Personal Data Breach Notification Procedure — Rocky

> _sniffs_ A breach is a breach of security, not a moral failing. ISO 27701
> A.5.24–.27 and GDPR Art 33/34 demand we detect, assess, and notify — here is
> the procedure, with the mechanism we have and the workflow we still owe.

| Document field | Value |
| --- | --- |
| **Title** | Personal Data Breach Notification Procedure — Rocky |
| **Reference** | ROCKY-BRCH-001 |
| **Version** | 0.1.0-draft (design specified; enforcement partial) |
| **Status** | Draft — detection MET; notification workflow GAP |
| **Owner** | Docs Bot, co-owned with Audit / Execution Bots |
| **Classification** | Internal — Reference |
| **Next review** | On ADR-0072 completion |
| **Related** | ADR-0072 (breach charter); ADR-0067; ROCKY-ROPA-001; MACEDONIAN_LPDP_GDPR_ISO27701_CONTROLS_MATRIX |

---

## 1. Definition (Art 4(12) / A.5.24)

A **personal data breach** is a breach of security leading to accidental or
unlawful destruction, loss, alteration, unauthorised disclosure of, or access to,
personal data transmitted, stored or otherwise processed.

## 2. Detection (MET)

All state transitions emit tamper-evident, hash-chained **lifecycle events**
(A.5.26). Unauthorised access, bulk read, or disclosure attempts are visible in
the audit store. Detection capability exists; a dedicated breach-alert rule is
not yet wired.

## 3. Assessment (A.5.25)

On suspected breach: assess **scope** (records affected), **sensitivity**
(special-category health data weighs highest), and **risk to rights and freedoms**.
Severity decides whether notification is required.

## 4. Notification to the supervisory authority (Art 33 / A.5.25)

Where risk to rights exists, notify the Macedonian DPA **without undue delay and
within 72 hours** of becoming aware. Content: nature, categories & approximate
number of data subjects, likely consequences, measures taken, and the DPO contact.

## 5. Notification to data subjects (Art 34 / A.5.26)

Where the breach is **likely to result in high risk**, notify affected data
subjects **without undue delay** — plain-language description, consequences, and
recommended mitigations.

## 6. Record-keeping (Art 33(5) / A.5.27)

Maintain a **register of all breaches**, including non-notifiable ones: facts,
effects, and remedial action.

## 7. Implementation status (honest)

| Capability | State | Evidence |
| --- | --- | --- |
| Tamper-evident audit / detection | MET | lifecycle-event audit store |
| Risk assessment procedure | PARTIAL | defined above; no automated trigger |
| 72h DPA notification workflow | GAP | ADR-0072 — not yet built |
| Data-subject notification workflow | GAP | ADR-0072 — not yet built |
| Breach register | PARTIAL | audit log present; dedicated register TBD |

> _rubs nose vigorously_ The _procedure_ is specified; the _notification workflow_
> is the open item (ADR-0072). Detection we have; the 72-hour clock we must build.
