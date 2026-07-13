# Food / Feed Withdrawal & Recall Procedure — Rocky

> _sniffs_ A sick animal is a food-safety event, not a bug. Reg 178/2002 Art 19 demands we
> withdraw unsafe food from the market and recall it from consumers. Here is the procedure —
> the traceability we have, and the first-class recall workflow we now name.

| Document field | Value |
| --- | --- |
| **Title** | Food / Feed Withdrawal & Recall Procedure — Rocky |
| **Reference** | ROCKY-WDRW-001 |
| **Version** | 0.1.0-draft (traceability MET; dedicated recall workflow drafted) |
| **Status** | Draft — traceability MET; recall notification workflow PARTIAL |
| **Owner** | Docs Bot, co-owned with Health / Movement / Inspection Bots |
| **Classification** | Internal — Reference |
| **Next review** | On ADR-0085 / ADR-0054 R6 completion |
| **Related** | ADR-0054 (R6 — Art 18 traceability, VERIFIED); ADR-0085 (traceability rules engine, 2021/520); ADR-0062 (TRACES/CHED-A); ADR-0063 (EUDR); ADR-0064 (disease zones); ADR-0029 (archive/retention); Health / Inspection / Passport / Movement domains |

## 1. Definition (Art 19 / Reg 178/2002)

A **withdrawal** removes unsafe food/feed from the market before it reaches the consumer.
A **recall** retrieves it from consumers already supplied. Trigger: the operator considers or
has reason to believe the food/feed is unsafe (Art 14 injurious/unfit; Art 15 unsafe feed;
notifiable disease; contaminated input).

## 2. Trigger & detection

- **Health domain:** notifiable disease / failed vaccination or treatment → `flagFarmForInspection`.
- **Inspection domain:** on-spot finding of unfit animal/food → seizure recommendation.
- **Passport domain:** `SEIZED` state marks an animal withdrawn from the food chain.
- **Movement domain:** death-at-slaughter / withdrawal recorded at the abattoir.

## 3. Withdrawal from market (Art 19(1))

Where the product has left the operator's immediate control, **initiate withdrawal** and
**inform the competent authority**. Traceability (Art 18) supplies the one-step-back/forward
batch, lot, or consignment identification.

## 4. Consumer notification & recall (Art 19(1))

Where the product may have reached the consumer, **effectively and accurately inform consumers
of the reason**, and **recall** already-supplied product when other measures are insufficient
to protect health.

## 5. Inform competent authorities (Art 19(3))

If the food may be **injurious to human health**, inform the competent authority immediately,
state the action taken, and cooperate (do not discourage others from cooperating).

## 6. Traceability support (Art 18)

The Lineage & Traceability Graph (ADR-0054 R6) walks `movements` + `animal_parents`
recursively — one step back (supplier) and one step forward (recipient) — bounded by
`traceability.maxDepth` / `traceability.retentionYears` RuleSet params. Bovine-specific rules
(transmission window, tag-before-move, dual-code, numeric code) are enforced by the
traceability rules engine (ADR-0085, Implementing Reg (EU) 2021/520).

## 7. Records & retention (Art 18(2)/(3), ADR-0029)

Withdrawal/recall actions and the traceability chain are retained in the archive (3-tier,
retention per RuleSet) to evidence due diligence.

## 8. Implementation status (honest)

| Capability | State | Evidence |
| --- | --- | --- |
| One-step-back/forward traceability | MET | Lineage Graph, ADR-0054 R6, ADR-0085 |
| Passport `SEIZED` / Movement death-at-slaughter | MET | Passport / Movement domains |
| Health notifiable-disease → `flagFarm` | MET | Health domain |
| Dedicated withdrawal/recall workflow + authority/consumer notice | PARTIAL | distributed above; first-class procedure drafted (this doc) |
| Recall register | PARTIAL | audit log present; dedicated register TBD |

> _rubs nose vigorously_ The traceability to _do_ a recall is built and VERIFIED (ADR-0054 R6).
> What was missing was naming the workflow — now it is a procedure. The authority/consumer
> notification clock is the open item to operationalise.
