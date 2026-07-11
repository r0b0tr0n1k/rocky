# Risk Treatment Plan — Rocky

> _sniffs_ ISO 27001 6.1.3: for every risk, choose a treatment — mitigate,
> transfer, avoid, or accept. Rocky mitigates with engineering; this plan maps
> each scenario from ROCKY-RISK-001 to the control that treats it.

| Document field | Value |
| --- | --- |
| **Title** | Risk Treatment Plan — Rocky |
| **Reference** | ROCKY-RTP-001 |
| **Version** | 0.1.0-draft (as-built treatment) |
| **Status** | Draft — treatments mapped; build items tracked |
| **Owner** | Docs Bot, co-owned with Database / Authorization Bots |
| **Classification** | Internal — Reference |
| **Next review** | On ADR-0067 Phase 2 completion |
| **Related** | ROCKY-RISK-001; ROCKY-SOA-001; ADR-0071; ADR-0061 |

---

## Treatment mapping

| Risk | Option | Treating control | Status |
| --- | --- | --- | --- |
| R1 Unauth PII read | Mitigate | RLS (pgPolicy) + RBAC + audit | MET |
| R2 Credential theft | Mitigate | MFA enforcement (Better Auth) | GAP — enforce |
| R3 Audit tampering | Mitigate | Hash-chained append-only log | MET |
| R4 PII at rest | Mitigate | Crypto-at-rest (ADR-0071) | GAP — build |
| R5 Re-identification | Mitigate | Mask / de-identification | MET / PARTIAL |
| R6 Sub-processor leak | Transfer + Mitigate | DPA + Art 46 SCC (XFER) | PARTIAL |
| R7 Retention overrun | Mitigate | Per-category retention cron (RET) | GAP — wire predicate |

## Residual acceptance

Medium risks R2 / R4 / R7 are **accepted pending build** with documented owner
(ADR-0071 crypto, ADR-0061 retention). No risk is accepted without a tracked
remediation.

> _waves hands frantically_ Treat the risk or name it as accepted-with-a-plan.
> Silent acceptance is the sin the auditor smells first.
