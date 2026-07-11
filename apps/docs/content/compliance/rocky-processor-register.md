# Processor / Sub-processor Register — Rocky

> _sniffs_ We do not process alone. ISO 27701 A.1.2.7 demands a written contract
> with every PII processor; GDPR Art 28 makes it mandatory. Here is the register
> of who touches our PII and which controls bind them.

| Document field | Value |
| --- | --- |
| **Title** | Processor / Sub-processor Register — Rocky |
| **Reference** | ROCKY-PROC-001 |
| **Version** | 0.1.0-draft (register skeleton; DPA terms partial) |
| **Status** | Draft — processors identified; DPA execution pending |
| **Owner** | Docs Bot, co-owned with Authorization / Execution Bots |
| **Classification** | Internal — Reference |
| **Next review** | On ADR-0075 completion |
| **Related** | ADR-0075 (processor charter); ADR-0067; ROCKY-ROPA-001; ROCKY-LBR-001 |

---

## Register (Art 28(3) / A.1.2.7)

| Processor | Service | PII processed | A.1.2.7 controls | DPA status |
| --- | --- | --- | --- | --- |
| Better Auth | Authentication / session | identity, session state | all Table A.2 controls | Partial — to execute |
| EAS / Expo | Push & delivery | device token, contact | all Table A.2 controls | Partial — to execute |
| Database host | Storage at rest | all PII (incl. health) | all Table A.2 controls | Partial — to execute |

## Contractual controls required (A.1.2.7)

Each contract shall address, at minimum:

- **Processing only on documented instructions** (Art 28(3)(a)).
- **Confidentiality** of personnel (Art 28(3)(b)).
- **Security measures** per Art 32 / A.3 (Art 28(3)(c)).
- **Sub-processor engagement** only with prior authorisation (Art 28(3)(d)).
- **Assistance** with data-subject rights & breach notification (Art 28(3)(e)/(f)).
- **Deletion / return** of PII at engagement end (Art 28(3)(g)).
- **Audits** (Art 28(3)(h)).

## Transfers

Where a processor sits outside North Macedonia, the country and the **Art 46 / 49
safeguard** are recorded here (see ROCKY-ROPA-001 §5).

## Status

Processors identified from the as-built architecture. **DPA terms are partial** —
the written agreements remain to be executed (ADR-0075). This register is the
inventory; the contracts are the next artifact.

> _waves hands frantically_ We know _who_ processes our PII; we must still _paper_
> the contracts. The register is honest about the gap.
