# Retention Schedule — Rocky

> _sniffs_ The RoPA names the periods; this schedule specifies the _mechanism_.
> Veterinary law sets a floor (keep), data-protection law sets the ceiling
> (erase when no longer necessary). The clock is anchored to the last regulated
> act, gated on living-animal ownership.

| Document field | Value |
| --- | --- |
| **Title** | Retention Schedule — Rocky |
| **Reference** | ROCKY-RET-001 |
| **Version** | 0.1.0-draft (harvest of actual retention rules) |
| **Status** | Draft — design specified; per-category enforcement partial |
| **Owner** | Docs Bot, co-owned with Database / Execution Bots |
| **Classification** | Internal — Reference |
| **Next review** | On ADR-0061 Phase 2 / ADR-0030 RuleSet D10 completion |
| **Related** | ROCKY-ERP-001; ROCKY-ROPA-001; ADR-0061; ADR-0030; MACEDONIAN_LPDP_GDPR_ISO27701_CONTROLS_MATRIX |

---

## 1. Retention floors (legal MINIMA — veterinary regulation)

| Record category | Floor | Source | Direction |
| --- | --- | --- | --- |
| Inspection & archive documents | 3 years | Archive domain (daily `@Cron`) | Keep |
| Treatment / vaccination | ≥ 5 years | EU Veterinary Medicines Regulation | Keep |
| Movement | 3–7 years | Animal Health Law / traceability | Keep |
| Health records (special category) | per 9(2)(g)/(i) | retained while epidemiologically necessary | Keep |

The floor is a **retention obligation**, not a deletion command. Post-floor erasure is compelled by **storage limitation (Art 5(1)(e) / LPDP)**.

## 2. Retention anchor (mechanism)

- For every keeper: `retention_anchor = max(last_movement_date, last_treatment_date)`.
- A new regulated act **extends** the clock (Uber model — the newest still-binding record wins).
- `has_living_animal` flag gates erasure **independently**: no erasure while a living animal is owned (Art 17(3)(b)/(c)).

## 3. Erasure eligibility

`no living animal` **AND** `now − retention_anchor > floor` → erase keeper identity PII, **de-identify** traceability (public-health archival). Full procedure in ROCKY-ERP-001.

## 4. Implementation status

| Capability | State | Evidence |
| --- | --- | --- |
| Archive 3-yr disposal `@Cron` | PARTIAL | blanket sweep; not per-category |
| Per-keeper anchor + living-animal predicate | GAP | ADR-0061 Phase 2; ADR-0030 RuleSet D10 "planned, not enforced" |
| De-identification at expiry | PARTIAL | `PII_FIELD_REGISTRY` classifies; crypto-shred paused (ADR-0071) |

> _rubs nose vigorously_ This schedule is the _technical_ retention spec — the law
> says keep, the clock says when; the code must learn both.
