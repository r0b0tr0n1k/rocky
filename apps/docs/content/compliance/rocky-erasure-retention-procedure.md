# Erasure & Retention Procedure — Rocky

> _sniffs_ You cannot be forgotten while you own a living regulated animal. The
> State says privacy is secondary to epidemiological safety — until the lawful
> countdown expires. This procedure operationalises that rule against ISO 27701
> A.1.3.7 / A.1.4.8 / A.1.4.6 and GDPR Art 17 / Art 5(1)(e).

| Document field | Value |
| --- | --- |
| **Title** | Erasure & Retention Procedure — Rocky |
| **Reference** | ROCKY-ERP-001 |
| **Version** | 0.1.0-draft (design specified; enforcement partial) |
| **Status** | Draft — design locked; implementation pending ADR-0061 Phase 2 |
| **Owner** | Docs Bot, co-owned with Validators / Database / Execution Bots |
| **Classification** | Internal — Reference |
| **Next review** | On ADR-0061 Phase 2 completion |
| **Related** | ADR-0061 (erasure/retention); ADR-0067 (ISMS roadmap); ADR-0030 (RuleSet D10); ADR-0071 (crypto-at-rest); ROCKY-ROPA-001; ROCKY-LBR-001; MACEDONIAN_LPDP_GDPR_ISO27701_CONTROLS_MATRIX |

---

## 1. Scope & legal basis

- **ISO 27701:** A.1.3.7 (access / correction / erasure), A.1.4.8 (retention), A.1.4.6 (de-identification at end of processing), A.1.3.8 (notify recipients).
- **GDPR:** Art 17 (right to erasure), Art 5(1)(e) (storage limitation), Art 19 (notification to recipients).
- **MK LPDP:** right to erasure ("right to be forgotten") with 30-day erase duty; storage-limitation clause mirroring Art 5(1)(e) with public-interest archival carve-out (Art 86(1)).

## 2. The erasure rule (operational)

A farmer's / keeper's PII is **erased only when BOTH hold**:

1. **No living regulated animal owned** — all animals died, sold, or exported. While a living animal is owned, erasure is denied under **Art 17(3)(b)** (legal obligation to retain traceability) **and Art 17(3)(c)** (public health).
2. **The per-category statutory retention floor has expired.**

**Retention floors are legal MINIMA set by veterinary regulation — they command _keeping_, not deletion:**

| Record category | Floor | Source | Direction |
| --- | --- | --- | --- |
| Treatment / vaccination | ≥ 5 years | EU Veterinary Medicines Regulation | Keep (floor) |
| Movement | 3–7 years | Animal Health Law / traceability | Keep (floor) |

- After the floor, the veterinary law is **silent on deletion**. Erasure is then compelled by **storage limitation (Art 5(1)(e) / LPDP)** — _"no longer than necessary"_ — **not** by the vet law.
- The floor is _necessary but not sufficient_ for erasure: if the de-identified traceability remains necessary for public-health archival (Art 89 / LPDP Art 86(1)), it may be **retained de-identified** past the floor.

## 3. Retention anchor — mark all PII (Uber model)

- For every keeper, **mark ALL PII records** (via `PII_FIELD_REGISTRY`) with a single retention anchor.
- **`retention_anchor = max(last_movement_date, last_treatment_date)`** — the most recent still-binding regulated activity. A new treatment or movement _extends_ the clock, exactly as Uber keeps rider PII because the tax invoice must survive.
- A **`has_living_animal`** flag gates erasure _independently_ of the anchor: even an expired anchor does not trigger erasure while a living animal is owned.

## 4. Erasure execution

1. Eligibility met (no living animal **AND** `now − retention_anchor > floor`).
2. **Erase** keeper identity PII (name, national ID, contact) per `PII_FIELD_REGISTRY` `direct` classification.
3. **De-identify** the animal↔farm traceability (kept for public-health archival) — A.1.4.6.
4. **Write** the event to the tamper-evident, hash-chained audit log.
5. **Notify recipients** (A.1.3.8 / Art 19): VS, VI, archive — within the response window.

## 5. Implementation status (honest)

| Capability | State | Evidence |
| --- | --- | --- |
| PII inventory & classification | MET | `PII_FIELD_REGISTRY` (ADR-0061 D1) |
| Access control over PII | MET | RLS (pgPolicy) + RBAC (Principal / PolicyEngine) |
| Mask / reveal-gate | MET | mask-by-default + purpose-bound reveal |
| Tamper-evident audit | MET | lifecycle-event audit store |
| Archive disposal `@Cron` | PARTIAL | 3-yr blanket sweep; not per-category |
| Per-keeper anchor + living-animal predicate | GAP | ADR-0061 Phase 2; ADR-0030 RuleSet D10 retention "planned, not enforced" (gap-analysis G4) |
| Crypto-shredding (erasure by key deletion) | GAP | ADR-0071 paused |

> _waves hands frantically_ The _rule_ is specified; the _mechanism_ is partial. The blanket 3-yr cron must be parameterised per category and gated on `has_living_animal` before this procedure is enforceable.
