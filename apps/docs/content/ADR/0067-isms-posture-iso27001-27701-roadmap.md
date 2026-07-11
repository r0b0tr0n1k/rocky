# ADR-0067: ISMS Posture & ISO 27001 / ISO 27701:2025 Conformity Roadmap

> The cow is already tagged, chipped, and row-level-secured. What the auditor wants next is
> the **paper** that says we meant to. Rocky built the enforcement before the policy — the
> dialectical inverse of the usual failing org. This ADR makes that inversion a plan, not a shame.

| Key            | Value                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| **Status**     | Proposed                                                               |
| **Date**       | 2026-07-11                                                             |
| **Author**     | Architecture Review (Compliance homework)                                    |
| **Source**     | Gap analysis `apps/docs/content/compliance/iso27701-2025-gap-analysis.md` (8d4fe99); `graphgrc-main/iso27001.json` (93 Annex A), `graphgrc-main/iso27701_2025.json` (115 PIMS) |
| **Related**    | ADR-0061 (GDPR erasure/retention); ADR-0066 (Error Sovereignty); ADR-0030 (RuleSet); ADR-0054 (Regulatory); ADR-0007 (audit); ADR-0003 (execution) |

## Context

Reading ISO/IEC 27001:2022 (93 Annex A controls) and ISO/IEC 27701:2025 (115 PIMS
controls across Tables A.1/A.2/A.3 + B.1 guidance) against Rocky's actual territory produced a
single, uncomfortable finding: **we are technically ahead of the standard on the controls code can
enforce, and behind on the management-system layer certification actually demands.**

What we already RUN (MET):
- Row-Level Security via pgPolicy; RBAC + Principal + Policy engine (Authorization Bot).
- An explicit PII inventory — `PII_FIELD_REGISTRY` (ADR-0061 D1), categorized `direct/indirect/derived`.
- Mask-by-default + reveal-gate + tamper-evident access log (ADR-0061 D5).
- Result/Error Sovereignty (ADR-0066) → typed, auditable failure.
- Audit via lifecycle events (ADR-0007); Diamond Seal SDLC (NoDrift).

What is ABSENT (GAP) — the *governance* layer, not the code:
- No documented ISMS policy / top-management commitment (A.5.1 / A.5.4).
- No recorded lawful basis, consent management, DPIA (A.1.2.3 / .4-.6 / .2.5).
- No RoPA register, DPO designation, awareness training, NDAs (A.1.2.9 / A.1.3 / A.6 / A.3.17).
- Cryptography-at-rest **paused** (key custody unsettled) (A.8.24 / A.3.26).
- No formal breach-notification workflow, supplier/processor agreements (A.5.24-.27 / A.5.19-.23 / A.2).
- Erasure + retention **deferred** to ADR-0061 Phase 2 (A.1.3.7 / A.1.4.6 / A.1.4.8).

This is the **Symbolic without the Imaginary**: the machinery of compliance exists; the
committed, documented, trained *intent* does not. ISO 27701:2025 certifies both.

## Decision

**Adopt the phased roadmap from the gap analysis. Document the enforcement we already
run; build the governance we have deferred; certify only after expert review.**

1. **Phase 1 — Harvest the code into an ISMS (weeks, not months).** Write the ISMS
   policy + operating procedures that *describe the reality already running*: RLS, RBAC,
   `PII_FIELD_REGISTRY`, mask/reveal-gate, tamper-evident log, Result sovereignty, Diamond
   Seal. These already satisfy A.5.9/.12/.13, A.5.15-.18, A.5.28, A.8.2-.5/.11/.15/.16,
   A.3.5/.6/.8/.9/.14/.23-.26, A.3.27-.30. Lowest cost, highest visible gain.
2. **Phase 2 — The governance layer (the real work).** G1-G10 from the gap register:
   policies + leadership sign-off; lawful-basis + processor DPAs; DPIA template wired to
   high-risk ops (health/risk); explicit RoPA from the registry + audit log; resolve crypto-at-rest
   (off-server KEK, envelope encryption); breach-notification workflow; enforced retention/erasure
   (ADR-0061 Phase 2); supplier/processor security assessment; awareness + NDAs.
3. **Phase 3 — Certification.** Independent ISMS audit (A.5.35 / A.3.15); physical
   controls (A.7.*); international-transfer safeguards (A.1.5.*). Engage counsel competent in
   both technology and data-protection law to confirm the mappings before any conformity claim.
4. **The compliance reference module is canonical.** `packages/validators/src/compliance/
   gdpr-articles.ts` (`VALIDATED_CROSSWALK`) is the machine-readable anchor. Its `iso27701`
   field is now populated from `iso27701_2025.json` `gdprMapping` (14/15 articles mapped;
   ART_37 DPO and ART_82 liability have *no normative mapping in source* and are left absent,
   not fabricated). These mappings are **machine-derived and unverified** — reference only.

## Consequences

### Positive
- The hard part (enforcement) is done; Phase 1 is honest documentation of existing code.
- A single typed source (`VALIDATED_CROSSWALK`) ties GDPR ↔ MK LPDP ↔ AL Law 124 ↔ ISO 27701.

### Negative / Cost
- Phase 2 is genuine organizational work (policy, training, legal registers), not code.
- Cryptography-at-rest needs a key-custody decision (Phase 2, G5).

### Neutral
- `graphgrc-main` is **not** imported (its Go engine will not build here; its local
  `scf*.json` / `gdpr.json` are orphaned by its own generator). We took only the
  validated cross-walk + per-control GDPR mappings, as homework.

## Implementation

- Owning Bot: **Docs Bot** (ISMS policy, procedures, gap register) + **Validators Bot**
  (registry, RoPA, mask/reveal-gate) + **Authorization Bot** (RBAC/DPO) + **DB/Execution Bot**
  (crypto-at-rest).
- RobotFarm pass: add WO (ISMS Phase 1 — harvest code into policy) to WORKORDER;
  update Bot descriptions in root AGENTS.md (Docs/Validators/Auth/Execution).
- The gap-analysis doc (`apps/docs/content/compliance/iso27701-2025-gap-analysis.md`, 8d4fe99) is the living register.
- The ISMS / PIMS policy (`apps/docs/content/compliance/isms-policy.md`) harvests the
  enforcement already in operation into the recital + article + Statement-of-Applicability
  form; this ADR is their ruling.

## Verification (Definition of Done)

```bash
ls apps/docs/content/compliance/iso27701-2025-gap-analysis.md   # exists
rg -n "ADR-0061|ADR-0066|ADR-0030" 0067-*.md
# compliance module builds + pii test green
pnpm --filter @rocky/validators build
pnpm --filter @rocky/validators exec vitest run src/pii
# iso27701 populated for 14/15 cross-walk entries (ART_37/82 absent by source)
rg -c "iso27701:" packages/validators/src/compliance/gdpr-articles.ts
```

## Anti-Patterns

1. Claiming ISO 27701 conformity from the unverified `gdprMapping` leads — counsel must review first.
2. Importing the `graphgrc` engine (won't build; orphaned local data).
3. The inverse vice we are tempted by: treating **paperwork as substitute for enforcement**.
   We have the opposite problem (enforcement without paperwork) — do not over-correct into
   documents that describe controls we do not run.

## Related ADRs

- **ADR-0061** — GDPR erasure/retention; Phase 2 *is* the A.1.3.7 / A.1.4.6 / A.1.4.8 work.
- **ADR-0066** — Error Sovereignty; backs A.8.15 / A.8.16 logging + A.5.28 evidence.
- **ADR-0030** — RuleSet; retention params (D10) are the A.1.4.8 enforcement hook.
- **ADR-0054** — Regulatory Compliance Framework; the A.5.31 / A.3.13 legal spine.
- **ADR-0007** — Audit via lifecycle events; the tamper-evident log (A.3.14 / A.5.28).
- **ADR-0003** — Execution pipeline; the RLS stage that enforces A.5.15-.18 at the DB.
