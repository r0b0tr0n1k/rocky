# Data Protection Impact Assessment — Health Domain (Rocky)

> _sniffs_ Health data is explicitly high-risk: special category under Article 9,
> processed at scale across every herd. ISO 27701 A.1.2.6 demands a DPIA before
> such processing — here it is, scoped to the Health domain we already run.

| Document field | Value |
| --- | --- |
| **Title** | DPIA — Health Domain (Rocky) |
| **Reference** | ROCKY-DPIA-001 |
| **Version** | 0.1.0-draft (harvest of existing processing) |
| **Status** | Draft — requires DPO sign-off (DPO to be designated) |
| **Owner** | Docs Bot, co-owned with Health / Validators Bots |
| **Classification** | Internal — Reference |
| **Next review** | On Phase 2 completion (see ADR-0067) |
| **Related** | ADR-0067; ADR-0069 (DPIA charter); ROCKY-ROPA-001; ROCKY-LBR-001; MACEDONIAN_LPDP_GDPR_ISO27701_CONTROLS_MATRIX |

---

## 1. Description of processing (A.1.2.6 / Art 35(3)(a))

The Health domain records animal diagnoses, treatments, vaccinations and lab
tests. Each event links an animal to a keeper's herd, so health status is
attributable to a natural person. Scale: all regulated animals in the jurisdiction.

## 2. Necessity & proportionality (Art 35(3)(b))

- **Necessary:** disease surveillance and veterinary public health are a legal
  obligation (official control). Processing cannot be narrower and still meet it.
- **Proportionate:** the `PII_FIELD_REGISTRY` (ADR-0061 D1) classifies and
  minimises fields; mask-by-default omits PII from responses unless `pii:read`
  - a recorded purpose apply.

## 3. Risks to data subjects (Art 35(3)(c)/(d))

| Risk | Source | Severity |
| --- | --- | --- |
| Re-identification of keeper via herd link | animal↔farm↔keeper join | Medium |
| Disclosure of health status | breach / over-broad access | High |
| Discrimination / reputational harm | health-status exposure | Medium |
| Unauthorised access | credential / RLS failure | High |

## 4. Measures (Art 35(3)(d) / A.1.2.6 guidance)

- Row-Level Security (pgPolicy) + RBAC (Principal / PolicyEngine) — restrict every query to lawful scope.
- Mask-by-default + purpose-bound reveal-gate — PII never reaches the wire by default.
- Tamper-evident, hash-chained audit log — detects unauthorised access.
- `PII_FIELD_REGISTRY` classification + Diamond Seal SDLC.
- De-identification for any research / statistical reuse (Art 89 / LPDP Art 86(1)).

## 5. Residual risk & consultation

With the above measures, residual risk is **low–moderate**. If a planned change
raised it to high, **Article 36 prior consultation** with the supervisory authority
would be triggered before go-live.

## 6. Status

Drafted from as-built processing. **DPO sign-off pending** — the DPO is to be
designated (Art 37 trigger: large-scale special-category processing).

> _waves hands frantically_ This DPIA is **alignment documentation**, not a
> certification claim. It records the assessment we can already defend.
