# Information Security Risk Assessment — Rocky

> _sniffs_ ISO 27001 6.1.2 / 8.2 demands a risk assessment, not a vibe. Here is
> the methodology and our actual scenarios — the threats a livestock PII system
> realistically faces, scored and residual-rated against the enforcement we run.

| Document field | Value |
| --- | --- |
| **Title** | Information Security Risk Assessment — Rocky |
| **Reference** | ROCKY-RISK-001 |
| **Version** | 0.1.0-draft (as-built assessment) |
| **Status** | Draft — scenarios scored; treatment in ROCKY-RTP-001 |
| **Owner** | Docs Bot, co-owned with Database / Authorization Bots |
| **Classification** | Internal — Reference |
| **Next review** | Annual / on architecture change (ADR-0067) |
| **Related** | ADR-0067; ROCKY-SOA-001; ROCKY-TOMS-001; ROCKY-RTP-001 |

---

## 1. Methodology (6.1.2)

- **Scale:** qualitative — Likelihood (1–5) × Impact (1–5) = Risk (1–25).
- **Criteria:** ≥ 15 = High (treat mandatory); 8–14 = Medium; < 8 = Low.
- **Assets:** PII store (Postgres + RLS), tamper-evident audit log, auth/session (Better Auth), sync edge (mobile).

## 2. Scenarios (as-built)

| # | Threat | L | I | Risk | Residual (with controls) |
| --- | --- | --- | --- | --- | --- |
| R1 | Unauthorized PII read via RLS bypass | 2 | 5 | 10 M | Low — RLS + RBAC + audit detect |
| R2 | Credential theft → privileged session | 2 | 5 | 10 M | Medium — MFA unverified (TOMS) |
| R3 | Audit-log tampering (lose forensics) | 1 | 5 | 5 L | Low — hash-chained append-only |
| R4 | Mass PII exposure at rest (no crypto) | 2 | 5 | 10 M | Medium — **crypto-at-rest GAP (ADR-0071)** |
| R5 | Re-identification via keeper↔herd join | 2 | 4 | 8 M | Low — mask / de-identification |
| R6 | Sub-processor data leak (extra-jurisdiction) | 1 | 4 | 4 L | Low — DPA + SCC pending (XFER) |
| R7 | Retention overrun (PII kept too long) | 2 | 3 | 6 L | Low–Med — per-category cron GAP (RET) |

## 3. Conclusion

No **High** residual risk with current controls; **Medium** items are the known
gaps (crypto-at-rest, MFA enforcement, per-category retention) already tracked in
the SoA and gap-analysis. Treatment in ROCKY-RTP-001.

> _rubs nose vigorously_ The risk is real but named — and naming it is the control.
