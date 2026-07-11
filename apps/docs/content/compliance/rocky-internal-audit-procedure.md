# Internal Audit Procedure — Rocky

> _sniffs_ ISO 27001 9.2: audit the ISMS against the SoA, on a programme, by
> someone independent of the control owner. The evidence is our enforcement — the
> audit reads the code and the logs, not the brochure.

| Document field | Value |
| --- | --- |
| **Title** | Internal Audit Procedure — Rocky |
| **Reference** | ROCKY-AUD-001 |
| **Version** | 0.1.0-draft (procedure specified) |
| **Status** | Draft — programme defined; execution TBD |
| **Owner** | Docs Bot, co-owned with Authorization Bot |
| **Classification** | Internal — Reference |
| **Next review** | Annual programme (ADR-0067) |
| **Related** | ADR-0067; ROCKY-SOA-001; ROCKY-RISK-001; ROCKY-RTP-001 |

---

## 1. Scope (9.2)

Audit the ISMS/PIMS against **ROCKY-SOA-001** — the Annex A + PIMS controls, with
evidence drawn from the as-built enforcement (RLS, RBAC, audit log, `PII_FIELD_REGISTRY`,
Diamond Seal, retention cron).

## 2. Programme

- **Frequency:** at least annual; ad-hoc on architecture change.
- **Independence:** auditor independent of the Bot that owns the control.
- **Coverage:** rotate control domains so the full SoA is audited on a 2-year cycle.

## 3. Method

1. Select control(s) from the SoA.
2. Gather evidence: schema (RLS policies), PolicyEngine config, audit-log samples, `PII_FIELD_REGISTRY`, pipeline runs.
3. Judge status: MET / PARTIAL / GAP (mirrors SoA column).
4. Record nonconformities → feed ROCKY-RTP-001 (corrective action).

## 4. Reporting

- Audit report per cycle: findings, status vs SoA, nonconformities.
- Raised to management review (when established) and tracked to closure.

## 5. Status

Procedure specified. **Execution not yet run** — no internal audit has been
performed (gap tracked in ADR-0067 Phase 2).

> _rubs nose vigorously_ The audit reads the wire and the log, Comrade — not the
> paper. When we run it, the paper will have earned the right to exist.
