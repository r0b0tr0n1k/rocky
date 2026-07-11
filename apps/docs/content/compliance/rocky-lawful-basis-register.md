# Lawful Basis Register — Rocky

> _sniffs_ Every processing activity names its lawful basis before the first byte
> is written. ISO 27701 A.1.2.3 demands we _determine, document and demonstrate_
> the basis — here it is, per domain, against GDPR Art 6 / Art 9 and the MK LPDP.

| Document field | Value |
| --- | --- |
| **Title** | Lawful Basis Register — Rocky |
| **Reference** | ROCKY-LBR-001 |
| **Version** | 0.1.0-draft (harvest of existing enforcement) |
| **Status** | Draft — populated from as-built processing; not a conformity assessment |
| **Owner** | Docs Bot, co-owned with Validators / Authorization Bots |
| **Classification** | Internal — Reference |
| **Next review** | On Phase 2 completion (see ADR-0067) |
| **Related** | ADR-0067 (ISMS roadmap); ADR-0061 (erasure/retention); ADR-0068 (lawful-basis charter); ROCKY-ROPA-001; ROCKY-ERP-001; MACEDONIAN_LPDP_GDPR_ISO27701_CONTROLS_MATRIX |

---

## Per-processing-activity basis — ISO 27701 A.1.2.3

| Processing activity | Art 6 basis | Art 9 condition | Erasure exemption | Legal-obligation source |
| --- | --- | --- | --- | --- |
| Animal identification / traceability | 6(1)(e) official control | n/a (animal id indirect PII via keeper link) | Art 17(3)(b) while living animal | Veterinary traceability law |
| Movement control | 6(1)(e) official control | n/a | Art 17(3)(b) while living animal | Animal Health Law |
| Health / vaccination / treatment | 6(1)(e) official control | 9(2)(g) substantial public interest / 9(2)(i) public health | Art 17(3)(b)/(c) while living animal | Veterinary Medicines Regulation |
| Inspection / risk analysis | 6(1)(e) official control | n/a | n/a | Official control |
| Archive retention | 6(1)(e) official control | 9(2)(g)/(i) for health records | Art 17(3)(b)/(c) while living animal + floor | Veterinary / archive law |

## Basis statements

- **Art 6(1)(e) — task in the public interest / official authority.** All Rocky processing serves veterinary official control (identification, movement, disease control, inspection). **No consent-based processing** is performed; consent is neither sought nor relied upon.
- **Art 9(2)(g) / 9(2)(i) — special categories.** Animal _health_ data is Art 9 data by virtue of its link to a keeper's herd. The condition relied on is substantial public interest (9(2)(g)) and public health (9(2)(i)), both exercised under official authority.
- **Art 17(3)(b) / (3)(c) — erasure exemptions.** While a keeper owns a living regulated animal, erasure is denied: (3)(b) processing is necessary for compliance with a legal obligation (traceability retention), and (3)(c) necessary for public-health reasons. The exemption lapses only when the animal is no longer owned **and** the per-category retention floor has expired (see ROCKY-ERP-001).

## Notes

- The veterinary regulation sets a **retention floor** (keep ≥ N years); it does not command deletion. Post-floor erasure is compelled by **storage limitation (Art 5(1)(e) / LPDP)**, not by the vet law.
- **DPO:** to be designated (Art 37 trigger — large-scale special-category processing). Recorded here as a gap, not claimed.
- This register is **alignment documentation**, not a certification claim.

> _rubs nose vigorously_ The basis is official control, end to end. Consent never enters the barn.
