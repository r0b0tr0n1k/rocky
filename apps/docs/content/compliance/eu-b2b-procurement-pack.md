# EU B2B Procurement Compliance Pack — Rocky

> _sniffs_ A German buyer does not sign on "we have good RLS." They sign on paper: a DPA,
> a RoPA, a DPIA, a breach SLA. The engineering is 80% done and demonstrable; this pack is
> the other 20% — the governance paperwork that converts enforcement-ahead code into a
> signature. It operationalizes ADR-0067 Phase 2 and the gap-analysis §11 governance layer.

| Document field | Value |
| --- | --- |
| **Title** | EU B2B Procurement Compliance Pack — Rocky |
| **Reference** | ROCKY-PROC-PACK-001 |
| **Version** | 0.1.0-draft |
| **Status** | Draft — assembly of existing procedures + DPA template |
| **Owner** | Docs Bot, co-owned with Authorization / Execution Bots |
| **Classification** | External — Controller-facing (packet) |
| **Governs** | ADR-0067 (Phase 2); gap-analysis §11; ADR-0075 / 0068–0070 / 0072 |

## 1. The compliance floor (why this pack exists)

In DACH/EU B2B, GDPR compliance is a **procurement gate**, not just a fine-avoidance exercise.
A buyer's DPO typically stalls the contract until they receive the artifacts in §2.
Certification (ISO 27701 / TÜV) is the tender-winner, but the **floor is demonstrable
compliance on paper**. Rocky's enforcement-ahead posture means the demonstrable part is cheap;
this pack supplies the paper.

## 2. Requirement → artifact map

| What the DPO asks | Rocky artifact | Status |
| --- | --- | --- |
| Art 28 DPA (written contract) | rocky-dpa.md (ROCKY-DPA-001) | Template ready; execute per customer |
| Sub-processor list + terms | rocky-processor-register.md (ROCKY-PROC-001) | Draft; DPA execution pending |
| Technical & organizational measures | rocky-toms.md (ROCKY-TOMS-001) | Draft; MET vs GAP stated |
| RoPA (Art 30) | rocky-ropa.md (ROCKY-ROPA-001) | Draft; harvested from enforcement |
| Lawful basis register (Art 6) | rocky-lawful-basis-register.md | Draft; Phase 2 |
| DPIA (Art 35, high-risk) | rocky-dpia-health.md (ROCKY-DPIA-001) | Draft; DPO sign-off pending |
| Breach notification (Art 33–34) | rocky-breach-notification-procedure.md | Draft; SLA defined |
| Data-subject rights | rocky-dsr-procedure.md | Draft |
| Retention / erasure | rocky-erasure-retention-procedure.md | Draft |
| International transfers | rocky-international-transfer-assessment.md | Draft |

## 3. Procurement readiness checklist

- [ ] DPA (rocky-dpa.md) executed with the controller's legal entity + signatory.
- [ ] Sub-processor register (rocky-processor-register.md) current; each bound by Art 28 terms.
- [ ] TOMs (rocky-toms.md) attached as DPA Annex; MET/GAP stated honestly.
- [ ] RoPA (rocky-ropa.md) supplied; reflects actual processing.
- [ ] Lawful-basis register (rocky-lawful-basis-register.md) maps each activity → Art 6 basis.
- [ ] DPIA (rocky-dpia-health.md) completed + DPO-signed for any special-category processing.
- [ ] Breach SLA (rocky-breach-notification-procedure.md) references the 72h clause.
- [ ] Demo: pull a PAdES-sealed passport (ADR-0082) + an offline-verifiable signed QR (ADR-0084)
      to show cryptographic, court-provable, gate-verifiable evidence integrity.

## 4. How the enforcement-ahead code backs the "security measures" clause

The DPA's Art 28(3)(c) security obligation is not aspirational — it is as-built:

| Control | Evidence | ADR |
| --- | --- | --- |
| Access control | RLS + RBAC, least-privilege | 0006, Authorization Bot |
| Encryption at rest | Off-server envelope encryption | 0071 |
| Auditability | Tamper-evident audit log | 0007 / 0066 |
| Network / ingress | Cloudflare Access Zero-Trust + tunnel-only | 0083 |
| Evidence integrity | PAdES-LTV seal + RFC 3161 timestamp | 0082 |
| Offline verification | Ed25519 signed QR (EU DCC / mDL paradigm) | 0084 |

These are the assets to _show_ in the procurement meeting — most vendors cannot demonstrate
cryptographic, court-provable, offline-verifiable records.

## 5. Status & next steps

All artifacts are Draft (Phase 2, per ADR-0067). To reach the **compliance floor** for a
German signature: execute the DPA + attach TOMs/RoPA + DPIA sign-off + breach SLA. Certification
(Phase 3) remains a separate, later investment. Clause mappings are engineering leads — counsel
must review before any conformity claim (gap-analysis §9).
