# Data Subject Rights (DSR) Procedure — Access, Rectification, Portability — Rocky

> _sniffs_ Erasure we specified in ROCKY-ERP-001. Its sibling rights — access,
> rectification, restriction, portability — need the same procedure. ISO 27701
> A.1.3.7 / .9 / .10 and GDPR Art 15 / 16 / 18 / 20 demand we meet them.

| Document field | Value |
| --- | --- |
| **Title** | Data Subject Rights (DSR) Procedure — Rocky |
| **Reference** | ROCKY-DSR-001 |
| **Version** | 0.1.0-draft (design specified; intake GAP) |
| **Status** | Draft — access-control MET; intake mechanism GAP |
| **Owner** | Docs Bot, co-owned with Validators / Authorization Bots |
| **Classification** | Internal — Reference |
| **Next review** | On ADR-0061 Phase 2 completion |
| **Related** | ADR-0061; ADR-0067; ROCKY-ERP-001 (erasure); ROCKY-PRIV-001 (notice); ROCKY-ROPA-001 |

---

## 1. Request channels (Art 12(3) / A.1.3.10)

A data subject may request via `<channel to be published>`. The request is logged
with receipt time. **Intake mechanism: GAP** — no automated request channel exists
yet (ADR-0061 Phase 2).

## 2. Identity verification

The requester's identity is verified against the `PII_FIELD_REGISTRY` before any
disclosure, to prevent unauthorised access to another's PII.

## 3. Response timeframe

Acknowledged and acted upon **within one month** (Art 12(3)); extendable by two
further months for complex / numerous requests, with notice.

## 4. Right of access (Art 15 / A.1.3.9)

Confirm whether PII is processed; provide a **copy** of the PII in a structured,
commonly used, machine-readable format. RLS + RBAC already scope the data the
operator can read (MET).

## 5. Right to rectification (Art 16 / A.1.3.7)

Correct inaccurate / incomplete PII without undue delay; disseminate the correction
to recipients (A.1.3.8 / Art 19).

## 6. Right to restriction (Art 18) & portability (Art 20 / A.1.3.9)

- **Restriction:** mark PII restricted where accuracy contested or processing opposed.
- **Portability:** provide the PII in a structured, machine-readable format, and
  transfer it directly to another controller where technically feasible.

## 7. Implementation status (honest)

| Capability | State | Evidence |
| --- | --- | --- |
| Access control over PII | MET | RLS (pgPolicy) + RBAC (Principal / PolicyEngine) |
| Audit of rights actions | MET | lifecycle-event audit store |
| Request intake channel | GAP | ADR-0061 Phase 2 — not yet built |
| Identity-verification flow | PARTIAL | defined; not automated |
| Portability export | PARTIAL | data model supports; export TBD |

> _rubs nose vigorously_ Erasure is specified; access / rectification / portability
> are governed by the same enforcement but lack the **intake channel**. That is the
> open item — ADR-0061 Phase 2.
