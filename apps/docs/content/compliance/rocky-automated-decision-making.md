# Automated Decision-Making & Profiling — Rocky

> _sniffs_ Article 22 exists to stop a machine from deciding your fate with no
> human. Rocky's vet decisions are human-in-the-loop; the system _flags_, it does
> not _decide_. This note records that we considered Art 22 and why it's N/A.

| Document field | Value |
| --- | --- |
| **Title** | Automated Decision-Making & Profiling — Rocky |
| **Reference** | ROCKY-ADM-001 |
| **Version** | 0.1.0-draft (assessment of actual processing) |
| **Status** | Draft — Art 22 assessed N/A; future-state noted |
| **Owner** | Docs Bot, co-owned with Inspection / Authorization Bots |
| **Classification** | Internal — Reference |
| **Next review** | On Phase 2 completion (see ADR-0067) |
| **Related** | ADR-0067; ROCKY-ROPA-001; ROCKY-DPIA-001; MACEDONIAN_LPDP_GDPR_ISO27701_CONTROLS_MATRIX |

---

## 1. Scope (Art 22 / ISO 27701 A.1.3.11)

Art 22 applies to **solely automated** decisions producing legal or similarly
significant effects, with no human intervention.

## 2. Assessment — NOT APPLICABLE

Rocky performs **no solely-automated decisions** with legal/significant effect:

- **Diagnoses / treatments** — entered by a veterinarian (human).
- **Movement approvals / slaughter** — confirmed by a human officer.
- **Inspection selection** — the 10% risk-analysis flags farms; a **human** inspector conducts and concludes (decision-support, not automated decision).
- **Erasure / retention** — rule-driven but reviewed against the living-animal gate; no adverse individual decision without human authority.

Therefore the Art 22 safeguards (explicit consent, human intervention, explanation,
contest) are **not triggered**. Profiling (risk scoring) is **decision-support**,
subject to human confirmation.

## 3. Future-state condition

Should any **solely-automated** decision be introduced (e.g. automated eligibility
or auto-rejection), Art 22 + A.1.3.11 would require: human-intervention path,
explicit consent or official-authority basis, explainability, and a contest
mechanism — documented as a procedure at that point.

> _waves hands frantically_ We considered it and killed the myth: the cow is judged
> by people, not by the pipeline. The paper says we looked.
