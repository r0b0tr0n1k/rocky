# Records of Processing Activities (RoPA) — Rocky

> _sniffs_ The cow is tagged, chipped, and row-level-secured. The RoPA is the
> paper that proves we know which PII we hold, why, and for how long — the
> Art 30 ledger the LPDP and GDPR both demand, harvested from enforcement we
> already run.

| Document field | Value |
| --- | --- |
| **Title** | Records of Processing Activities (RoPA) — Rocky |
| **Reference** | ROCKY-ROPA-001 |
| **Version** | 0.1.0-draft (harvest of existing enforcement) |
| **Status** | Draft — populated from as-built enforcement; not a conformity assessment |
| **Owner** | Docs Bot, co-owned with Validators / Authorization Bots |
| **Classification** | Internal — Reference |
| **Next review** | On Phase 2 completion (see ADR-0067) |
| **Related** | ADR-0067 (ISMS roadmap); ADR-0061 (erasure/retention); ROCKY-ISMS-001 (ISMS policy); ROCKY-ERP-001 (erasure & retention procedure); ROCKY-LBR-001 (lawful basis register); MACEDONIAN_LPDP_GDPR_ISO27701_CONTROLS_MATRIX |

---

## 1. Controller & contact — Art 30(1)(a) / ISO 27701 A.1.2.2

- **Controller:** `<competent veterinary / food-safety authority>` — the public body Rocky serves under veterinary official control. _Placeholder: legal entity name to be confirmed by the authority._
- **Representative (Art 27):** Not applicable — processing is domestic official control; appointed only if EU data subjects are processed.
- **DPO (Art 37):** `<to be designated>` — large-scale special-category processing triggers the appointment duty.
- **Relationship:** Rocky operates the register on the controller's behalf under official control; the controller determines purposes and means.

## 2. Purposes of processing — Art 30(1)(b) / A.1.2.2

- Animal identification & traceability (ear tags, passports).
- Disease surveillance, vaccination & treatment recording (Health domain).
- Movement, death, slaughter & import/export control (Movement domain).
- On-site inspection & risk analysis (Inspection domain); 3-tier document archive (Archive domain).
- **Lawful basis:** Art 6(1)(e) — task in the public interest / exercise of official authority. **No consent-based processing.**

## 3. Categories of data subjects & personal data — Art 30(1)(c) / A.1.4.2

- **Data subjects:** farm keepers / holders, veterinarians, farm operators, authorised field officers.
- **Direct PII** (per `PII_FIELD_REGISTRY`, ADR-0061 D1): keeper name, national ID, contact, farm address / GPS.
- **Special category (Art 9):** animal health records (diagnosis, treatment, vaccination) tied to a keeper's herd.
- **Indirect / derived:** location inferred from movement, keeper inferred from the animal↔farm link.

## 4. Categories of recipients — Art 30(1)(d) / A.1.2.7

- Veterinary stations (VS), inspection bodies (VI), Central archive (CPC) — the 3-tier `archive` domain.
- **Processors:** Better Auth (auth / session), EAS / Expo (push & delivery), database host `<host>`. Each documented in the processor register (ADR-0075).

## 5. International transfers — Art 30(1)(e) / A.1.5.2

- No routine cross-border transfer. Where a sub-processor sits outside MK, the country and the **Art 46 / Art 49 safeguard** are named in the processor register (ADR-0075). This is the A.1.5.2 / A.1.5.3 obligation.

## 6. Retention periods — Art 30(1)(f) / A.1.4.8

- Inspection & archive documents: **3 years** (daily `@Cron` disposal — Archive domain).
- Treatment / vaccination records: **≥ 5 years** (EU Veterinary Medicines Regulation floor — a _minimum_, not a deletion command).
- Movement records: **3–7 years** (Animal Health Law / traceability floor).
- **Erasure rule:** blocked while a living regulated animal is owned; eligible when the per-category floor has expired _and_ no living animal remains. Identity PII is erased, traceability is de-identified. Full procedure in ROCKY-ERP-001.

## 7. Technical & organizational measures — Art 30(1)(g) / Art 32 / A.3.5, A.3.26

- Row-Level Security (pgPolicy) + RBAC (Principal / PolicyEngine).
- Mask-by-default, purpose-bound reveal-gate, tamper-evident audit log (lifecycle events).
- `PII_FIELD_REGISTRY` classification + Diamond Seal SDLC.
- **Crypto-at-rest: PAUSED** (ADR-0071 open) — recorded as a gap, not claimed as implemented.

## 8. Special-category condition — Art 30(3) / A.1.2.3

- Health data is processed under **Art 9(2)(g)** (substantial public interest) / **Art 9(2)(i)** (public health), documented per processing activity in ROCKY-LBR-001.
- The Art 17(3)(b) / (3)(c) erasure exemptions apply while a living animal is owned (see ROCKY-ERP-001).

---

> _rubs nose vigorously_ This RoPA is **alignment documentation**, not a certification claim. The enforcement it describes is as-built; the `<placeholders>` are legal facts the authority must confirm.
