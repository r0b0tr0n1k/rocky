# International Transfer Assessment — Rocky

> _sniffs_ Chapter V of the GDPR (Art 44–49) governs PII leaving the jurisdiction.
> Rocky's processing is domestic; the only cross-border exposure is a sub-processor
> sitting outside North Macedonia. This assessment records that, and the safeguard.

| Document field | Value |
| --- | --- |
| **Title** | International Transfer Assessment — Rocky |
| **Reference** | ROCKY-XFER-001 |
| **Version** | 0.1.0-draft (assessment of actual transfers) |
| **Status** | Draft — domestic processing; sub-processor safeguard noted |
| **Owner** | Docs Bot, co-owned with Authorization / Execution Bots |
| **Classification** | Internal — Reference |
| **Next review** | On ADR-0067 completion / processor changes |
| **Related** | ADR-0067; ROCKY-ROPA-001 §5; ROCKY-PROC-001; MACEDONIAN_LPDP_GDPR_ISO27701_CONTROLS_MATRIX |

---

## 1. Scope (Art 44–49 / ISO 27701 A.1.5.2–.5)

Transfers of PII to a third country require a valid Art 46 safeguard (e.g. Standard
Contractual Clauses) or an Art 49 derogation, unless the destination has an
adequacy decision.

## 2. Assessment — domestic, with one conditional edge

- **Primary processing** occurs within North Macedonia (and the Albanian jurisdiction
  Rocky also serves) — **no routine cross-border transfer** of PII.
- **Sub-processors** (Better Auth, EAS / Expo, database host — ROCKY-PROC-001): if
  any resides **outside MK**, that country and the **Art 46 SCC / Art 49 derogation**
  are recorded in the processor register before go-live.
- **No adequacy decision** is relied upon for routine processing.

## 3. Safeguard in force

Where a sub-processor is extra-jurisdictional, the DPA (ROCKY-PROC-001) imposes
Art 32 security + the transfer clause; the SCC is the default Art 46 mechanism.

## 4. Status

| Capability | State | Evidence |
| --- | --- | --- |
| Domestic processing confirmation | MET | architecture / jurisdiction scope |
| Sub-processor transfer safeguard | PARTIAL | register identifies processors; SCC execution TBD |
| Transfer record (Art 30(1)(e)) | PARTIAL | recorded in ROCKY-ROPA-001 §5 |

> _rubs nose vigorously_ The PII stays home; only a processor leaving the border
> triggers the safeguard — and the register catches it.
