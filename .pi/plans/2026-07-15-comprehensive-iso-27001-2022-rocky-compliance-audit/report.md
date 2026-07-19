# ISO/IEC 27001:2022 — Rocky Compliance Audit & Gap Analysis (Standards Layer)

> Scope: documentation layer only (`apps/docs/content/Standardization/` + `apps/docs/content/compliance/`) and its linkage to the code it cites. This is a *documentation/standards* audit, not a code review and not a certification assessment. All source standards are themselves machine-extracted and the GDPR mappings inside them are explicitly "machine-derived and unverified" (per ADR-0067 and the gap-analysis front-matter) — treat all standard→law mappings as leads, not authority.

## Source map (what exists today)

**Standards (raw + machine-readable) — `apps/docs/content/Standardization/`**

- `iso-27001-2022.md` (85 lines) — canonical human-readable wrapper; points to `iso27001-2022-controls.md`.
- `iso27001-2022-controls.md` (2000 lines) — machine-readable control source (JSON-as-markdown), 93 Annex A controls with `gdprMapping`, `legacy_mappings`, `compliance_checklist`, `legal_framework_mappings` (MK_LPDP / AL_LAW124).
- `iso-27701-2025.md` (99 lines, index stub) + `iso27701_2025.md` (3454 lines, full wrapper) + `a-1.md`,`a-2.md`,`a-3.md`,`b-1.md` (Annex fragments).
- `index.md` (15 lines) — folder index (titled "ISO/IEC 27701:2025" but serves as the Standardization landing).
- `iso27001-2022-annex-a-mapping.md` (165 lines) — 2013→2022 control renumbering crosswalk.
- `MACEDONIAN_LPDP_GDPR_ISO27701_*.md` (5 files, ~3.2k lines) + `MACEDONIAN_LPDP_GDPR_ISO27701_CONTROLS_MATRIX.md` — MK-specific clause crosswalk.
- `writing-iso-compatible-documentation.md`, `internal-standard-style.md` — authoring style guides.

**Rocky posture — `apps/docs/content/compliance/`**

- `isms-policy.md` (ROCKY-ISMS-001, v1.0 **Adopted**) — the ISMS/PIMS policy + a full 158-control Statement of Applicability (Annex A.5–A.8 + PIMS A.1–A.3).
- `rocky-soa.md` (ROCKY-SOA-001, v0.1.0 **Draft**) — a *second* SoA, condensed/subset.
- `iso27701-2025-gap-analysis.md` — a *third* control-status register (MET/PARTIAL/GAP), §4 = ISO 27001:2022 Annex A mapping.
- `rocky-controls-inventory.md` (ROCKY-INV-001, Draft) — as-built inventory.
- `rocky-toms.md` (ROCKY-TOMS-001), `rocky-risk-assessment.md`, `rocky-risk-treatment-plan.md`, `rocky-internal-audit-procedure.md`, `rocky-retention-schedule.md`, `rocky-erasure-retention-procedure.md`.
- GDPR/PIMS artifacts: `rocky-ropa.md`, `rocky-lawful-basis-register.md`, `rocky-dpia-health.md`, `rocky-dsr-procedure.md`, `rocky-breach-notification-procedure.md`, `rocky-processor-register.md`, `rocky-dpa.md`, `rocky-privacy-notice.md`, `rocky-cookie-notice.md`, `rocky-automated-decision-making.md`, `rocky-international-transfer-assessment.md`, `rocky-withdrawal-recall-procedure.md`, `MACEDONIAN_LPDP.md`, `eu-b2b-procurement-pack.md`.
- `_meta.ts` (present) — but **no `index.mdx`/`index.md` landing page** for the folder.

**Governing roadmap**: `apps/docs/content/ADR/0067-isms-posture-iso27001-27701-roadmap.md` — **Status: Proposed** (not Accepted).

---

## Deliverable 1 — ISO 27001:2022 Annex A control themes → existing doc → code evidence → gap

Status legend (as used across the docs): IMPLEMENTED/MET = enforced by running code; PARTIAL = present, to be wrapped/formalised; PLANNED/GAP = absent (governance/paperwork layer).

> ⚠️ **Cross-register inconsistency warning**: the three registers disagree on the same control (see Deliverable 6). The "Doc" column lists the *primary* doc that addresses the theme; "Gap" reflects the dominant posture (governance-layer absence unless code enforces it).

### A.5 — Organizational Controls (37 controls)

| Theme (representative) | Primary doc | Code evidence | Gap |
| --- | --- | --- | --- |
| A.5.1 Policies for info sec | `isms-policy.md` (self), `rocky-soa.md` | The policy doc itself | **Contradictory**: PLANNED (isms-policy SoA) vs MET (rocky-soa, gap-analysis). See D6. |
| A.5.2/.3 Roles & segregation of duties | `isms-policy.md` SoA, `rocky-soa.md` | RBAC + Principal + PolicyEngine (`packages/authorization`, ADR-0022) | PARTIAL — technical, no documented InfoSec org |
| A.5.4 Mgmt responsibilities | `isms-policy.md` Art.3 | Declared "in advance of the ink" | PLANNED per SoA, yet Art.3 asserts commitment — self-contradiction (D6). |
| A.5.9/.12/.13 Inventory / classification / labelling | `isms-policy.md`, `rocky-controls-inventory.md` | `PII_FIELD_REGISTRY` (`packages/validators/src/pii/pii-field-registry.ts`), ADR-0061 D1 | IMPLEMENTED for **PII only** — no broader asset inventory (D2). |
| A.5.15/.16/.17/.18 Access / identity / auth / rights | `isms-policy.md` SoA | RLS via pgPolicy (`packages/database`), Better Auth (`packages/auth`, ADR-0021), Authorization Bot (ADR-0006/0022) | IMPLEMENTED |
| A.5.19–.23 Supplier / cloud | `isms-policy.md` SoA, `rocky-processor-register.md`, `rocky-dpa.md` | Better Auth (SaaS) | GAP — no formal supplier security assessment/agreement (D2). |
| A.5.24–.27 Incident mgmt | `rocky-breach-notification-procedure.md`, `rocky-internal-audit-procedure.md` | Audit via lifecycle events (ADR-0007) | PARTIAL — no ISO incident *response plan* (GDPR breach only). See D2. |
| A.5.28 Collection of evidence | `isms-policy.md` SoA | Tamper-evident access log (ADR-0061 reveal-gate, event-emitter) | IMPLEMENTED |
| A.5.29/.30 Continuity / ICT readiness | — | `scripts/db-recreate.sh` | GAP — no BCP/ICT-readiness plan (D2). |
| A.5.31 Legal/regulatory | `isms-policy.md` SoA, ADR-0054 | Regulatory framework + RuleSet (ADR-0030) | PARTIAL — no maintained obligation register (D2). |
| A.5.33/.34 Protection of records / PII | `isms-policy.md`, `rocky-toms.md` | RLS + append-only hash-chained audit | PARTIAL — no approved PII-protection *policy* doc (D2). |
| A.5.35 Independent review | — | — | GAP |
| A.5.36/.37 Compliance / documented procedures | `isms-policy.md` | AGENTS.md + Diamond Seal doctrine | PARTIAL — not packaged as ISMS procedures |

### A.6 — People Controls (8)

| Theme | Primary doc | Code evidence | Gap |
| --- | --- | --- | --- |
| A.6.1 Screening | — | — | GAP (HR layer absent) |
| A.6.2/.4/.5/.7 Terms / discipline / post-emp / remote | `isms-policy.md` SoA | Better Auth session/event logging | PARTIAL |
| A.6.3 Awareness/training | — | — | GAP — no awareness program/records (D2). |
| A.6.6 NDAs | — | — | GAP |
| A.6.8 Event reporting | `isms-policy.md` SoA | Lifecycle events → tamper-evident log | PARTIAL — no named reporting function |

### A.7 — Physical Controls (14) — ALL GAP

No application-layer expression possible. `isms-policy.md` records A.7.* as PARTIAL (cloud provider responsibility) / PLANNED. **Missing**: a doc acknowledging host-provider responsibility + capturing provider attestations (SOC 2 / ISO 27001 from the host) — see D2.

### A.8 — Technological Controls (34)

| Theme | Primary doc | Code evidence | Gap |
| --- | --- | --- | --- |
| A.8.2/.3/.4/.5 Privileged access / restriction / source / auth | `isms-policy.md` | RLS + RBAC + Better Auth | IMPLEMENTED (A.8.4 source-code access PARTIAL) |
| A.8.9/.10/.11 Deletion / masking | `isms-policy.md`, `rocky-erasure-retention-procedure.md` | Mask-by-default + reveal-gate (ADR-0061 D5) | IMPLEMENTED masking; deletion/erasure deferred to ADR-0061 Phase 2 |
| A.8.13 Backup | `isms-policy.md` SoA | `scripts/db-recreate.sh` | PARTIAL — no backup/restore SLA |
| A.8.15/.16 Logging / monitoring | `isms-policy.md`, `rocky-toms.md` | Lifecycle events + Result/Error Sovereignty (ADR-0007/0066) | IMPLEMENTED |
| A.8.24 Cryptography | `isms-policy.md` SoA, `rocky-toms.md`, ADR-0071 | Envelope-encryption design (off-server KEK) | **PLANNED/GAP — paused** (key custody undecided) |
| A.8.25–.28 Secure SDLC / app-sec / architecture / coding | `isms-policy.md`, `AGENTS.md` | Diamond Seal NoDrift (ADR-0011/0018/0019), Result monad | IMPLEMENTED / PARTIAL |
| A.8.20/.21/.22/.23 Networks / segregation / filtering | — | — | GAP (no network-security docs) |
| A.8.29–.34 Testing / change mgmt / config / audit-test | `isms-policy.md` SoA, `rocky-toms.md` | Zod schemas + NoDrift | PARTIAL/GAP — no change-mgmt/pen-test procedure (D2). |

---

## Deliverable 2 — Missing standards artifacts

These are Annex A themes with no (or only an incidental) standards-layer document. Each is a documentation gap the planner should schedule (mostly ADR-0067 Phase 2/3 work).

1. **Incident Response Plan (A.5.24–.27).** Only `rocky-breach-notification-procedure.md` exists, and it is scoped to GDPR Art 33–34 (72h DPA notification). There is **no ISO-style incident response plan** (classification, containment, eradication, post-incident review) referencing ADR-0007's lifecycle-event machinery. A.5.27 (learning from incidents) is wholly unaddressed.
2. **Business Continuity Plan / ICT Readiness (A.5.29/.30, A.8.13/.14).** Only `scripts/db-recreate.sh` (reproducible recreate). No BCP, no RTO/RPO, no redundancy/segregation-of-environments procedure (A.8.31). Nextra `runbooks/db-recreate` exists but is operational, not the ISO management doc.
3. **Cryptography Policy (A.8.24).** ADR-0071 designs envelope encryption (off-server KEK) but it is *paused*; `rocky-toms.md` marks crypto-at-rest GAP. There is **no cryptography policy/standard doc** stating algorithm, key-custody, rotation, and the residual-risk acceptance of the pause.
4. **Supplier / Processor Security Assessment Procedure (A.5.19–.23, A.2.2.x, A.3.10).** `rocky-dpa.md` + `rocky-processor-register.md` cover GDPR Art 28 *contracts*, but there is no ISO supplier-security assessment / cloud-security (A.5.23) procedure that would actually evaluate Better Auth et al.
5. **Awareness, Education & Training Program + Records (A.6.3, A.3.17).** `rocky-toms.md` and the gap-analysis flag training as GAP. No training material, schedule, or attestation records exist.
6. **Change Management Procedure (A.8.32) / Configuration Management register (A.8.9).** AGENTS.md + NoDrift enforce *code* change discipline, but there is no documented change-authorisation/configuration register or segregation-of-duties sign-off for changes.
7. **Legal / Regulatory Obligation Register (A.5.31).** ADR-0054 (Regulatory Compliance Framework) + RuleSet (ADR-0030) are the engine, but there is no maintained, human-readable obligation register mapping MK LPDP / AL Law 124 / GDPR articles → control → owner.
8. **Non-PII Asset Inventory (A.5.9).** `PII_FIELD_REGISTRY` is an explicit *PII* inventory (IMPLEMENTED). A.5.9's broader "information and other associated assets" inventory is only PARTIAL (DB schema known) — no enumerated non-PII asset register.
9. **Physical Controls acknowledgement (A.7.*).** No doc that (a) states physical perimeters are the hosting provider's responsibility and (b) captures the provider's ISO 27001 / SOC 2 attestation as inherited control evidence. Required for any certification claim.
10. **`compliance/` index landing page.** The folder has `_meta.ts` but **no `index.mdx`/`index.md`**. Nextra folders normally need an index; add one that orients the reader across SoA → gap → risk → TOMs → GDPR artifacts (mirrors how `Standardization/index.md` works).
11. **Albanian (AL Law 124) dedicated treatment.** ADR-0067 and the SoA name Albania as an in-scope jurisdiction, and the machine-readable `iso27001-2022-controls.md` carries `AL_LAW124` mappings, but there is **no Albanian-specific compliance doc** (unlike the extensive `MACEDONIAN_LPDP_*` family). Either document the AL mapping or explicitly scope it out.

---

## Deliverable 3 — ADRs that should cross-link into the standards layer

These ADRs reference PII / privacy / GDPR / ISO concepts but (per `rg`) do **not** link to `/compliance/` or `/Standardization/`. Adding a "Standards / Compliance" cross-reference line to each would close the loop the audit requires.

- **ADR-0062** (IMSOC/CHED-A document generation) — emits official records → A.5.33 (protection of records), A.1.4.9 (disposal). Link to `isms-policy.md` / `rocky-retention-schedule.md`.
- **ADR-0065** (Mobile/Offline regulatory gating) — enforcement of lawful processing at the edge → A.8.11 / A.1.4.5. Link to `rocky-toms.md`.
- **ADR-0073** (Mobile edge PII at the edge) — purpose-scoped sync, TTL → A.1.4.5 (minimisation), A.8.11. Link to `isms-policy.md` SoA + `rocky-toms.md`.
- **ADR-0074** (Field-role edge protocol, contact-only PII) — A.1.4.5 / A.8.11 / A.5.34. Link to `isms-policy.md`.
- **ADR-0082** (PDF/A-3 + PAdES signing) — immutable, signed records → A.5.33 (records), A.1.4.9 (disposal), A.8.24 (crypto). Link to `isms-policy.md` SoA + `rocky-retention-schedule.md`.
- **ADR-0084** (Offline-verifiable signed-QR credentials) — authenticity/integrity evidence → **should also be added to the `isms-policy.md` SoA** (reinforces A.5.28 evidence collection). Currently cited only in the gap-analysis + procurement pack.
- **ADR-0086** (ESPR DPP alignment) — product-passport data → A.5.9 (asset inventory), A.1.4.4 (accuracy). Link to `rocky-controls-inventory.md`.
- **ADR-0092** (Zone-of-alienation geofence lockdown) — automatic logical-access restriction → **should be added to the SoA** as a code-backed A.8.20/.22 (networks / segregation) control (currently orphaned — see D4).
- **ADR-0093** (Dual dashboards: vet vs state epidemiologist) — purpose/segregation of access → A.5.15/.18, A.8.3. Link to `isms-policy.md`.
- **ADR-0094** (Notification-channel routing / SMS minimization) — data minimisation in transit → A.1.4.5 / A.8.11. Link to `rocky-toms.md`.

(ADR-0071 is already well cross-linked; ADR-0061/0066/0007/0021/0022/0030/0054 are correctly referenced from the standards docs.)

---

## Deliverable 4 — Code-backed controls with NO standards doc (orphaned enforcement)

These are controls where running code enforces an Annex A objective but the control is **not represented in any SoA/standards register** — the inverse gap (enforcement without paperwork).

1. **ADR-0092 — Geofence lockdown (`packages/geo` + Movement domain).** On `LabTestCompletedEvent` the system auto-locks a geofence, restricting movement — a real *logical-access / network-segregation* control (A.8.20/.22, A.5.15). It is **not** in `isms-policy.md` SoA, `rocky-soa.md`, or the gap-analysis. Add it as IMPLEMENTED and cite the code.
2. **ADR-0084 — Signed-QR credentials (`packages/pdf`).** Ed25519-signed, offline-verifiable credentials (ear tags / passport / movement) provide cryptographic *authenticity + integrity* of records (reinforces A.5.28 evidence, touches A.8.24). Cited in the gap-analysis + procurement pack but **absent from the SoA** in `isms-policy.md`. Promote to the SoA.
3. **Better Auth `expo()` origin binding / device binding (A.8.5).** Covered in the SoA (good) but worth confirming the *code* reference is pinned (file/ADR) rather than just "packages/auth".
4. **Recommendation:** run a targeted code→control reconciliation over `packages/geo` (lockdown), `packages/pdf` (signed QR, PAdES), and the audit `event-emitter` (hash-chain) to confirm every enforceable control is present in the SoA. The SoA currently enumerates *governance* gaps far more completely than *code-enforced* controls beyond the "usual suspects" (RLS/RBAC/PII registry/mask/log).

---

## Deliverable 5 — Big-picture structure

- **Two top-level content trees** carry the standards story: `Standardization/` (the *standard itself* — raw text, machine-readable JSON-md, MK wrappers, 2013→2022 + LPDP→GDPR→27701 crosswalks) and `compliance/` (Rocky's *posture* — policy, SoA, gap, risk, TOMs, GDPR artifacts). This split is sound, but the **boundary between "standard text" and "Rocky claim" blurs** in `macEDONIAN_LPDP_*` files (MK-specific wrappers that mix both).
- **The SoA is triplicated.** `isms-policy.md` (full 158-control SoA, Adopted), `rocky-soa.md` (condensed SoA, Draft), and `iso27701-2025-gap-analysis.md` §4 (MET/PARTIAL/GAP per control) are three overlapping control-status registers with *different scopes and conflicting statuses* (see D6). There is no single canonical SoA the others reference.
- **Four parallel crosswalk representations** of the same truth: (a) `iso27001-2022-annex-a-mapping.md` (2013→2022 renumber), (b) `MACEDONIAN_LPDP_GDPR_ISO27701_CONTROLS_MATRIX.md` (LPDP→GDPR→27701→27001→SCF→impl→evidence), (c) `VALIDATED_CROSSWALK` in `packages/validators/src/compliance/gdpr-articles.ts` (code-side, GDPR↔MK↔AL↔27701), (d) the per-control `gdprMapping` / `legal_framework_mappings` inside `iso27001-2022-controls.md` + `iso27701_2025.md`. Four sources → four drift surfaces. The code-side one (`VALIDATED_CROSSWALK`) is the only machine-checked anchor, but its `iso27701` field is explicitly "populated but pending review."
- **The machine-readable standard files are enormous and boilerplate-heavy.** `iso27001-2022-controls.md` (2000 lines) and `iso27701_2025.md` (3454 lines) are dominated by repeated generic `compliance_checklist` lines (the gap-analysis itself flags this as BOILERPLATE, ~45% of `legal_framework_mappings` empty). They are intended as tooling inputs, not human reading — but they sit in the docs tree and inflate the surface.
- **MK-heavy, AL-light.** The `MACEDONIAN_LPDP_*` family is ~3.2k lines; Albania (AL Law 124), though named in-scope in ADR-0067, has no dedicated doc. Asymmetric coverage.
- **Roadmap status mismatch.** The governing roadmap ADR-0067 is **Proposed**, yet `isms-policy.md` is marked **Adopted** and its SoA asserts statuses. The "ruling" ADR hasn't been Accepted — minor governance inconsistency.
- **Guardian coverage:** `check:md-links` (now fence-aware — the earlier 8 false positives are fixed) and `check:adrs` (ADR-0033 conformance) will guard any new cross-links/docs. New docs need a `_meta.ts` entry (compliance has one; Standardization uses `index.md` + presumably `_meta.ts`). Adding ADR↔standards cross-links is safe and will be link-checked.

---

## Deliverable 6 — Contradictions & duplication (must-resolve before any conformity claim)

1. **A.5.1 status conflict (3 values).** `isms-policy.md` SoA → **PLANNED**; `rocky-soa.md` → **MET**; `iso27701-2025-gap-analysis.md` §4 → **MET (Phase 1)**. Same control, three statuses across one package.
2. **A.5.3 status conflict.** `isms-policy.md` SoA → **PLANNED**; `rocky-soa.md` → **MET**; gap-analysis → **PARTIAL**.
3. **A.5.9 status conflict.** `isms-policy.md` SoA → **IMPLEMENTED**; `rocky-soa.md` → **PARTIAL**; gap-analysis → **MET**.
4. **A.5.4 self-contradiction.** `isms-policy.md` SoA marks A.5.4 **PLANNED**, but Article 3 of the *same document* declares top-management commitment "in advance of the ink." The policy simultaneously claims and disclaims the control.
5. **Two SoAs, different scopes/statuses.** `rocky-soa.md` presents a condensed subset (e.g. it shows only selected A.5 rows in its header) with MET/PARTIAL verdicts that diverge from the full 158-control SoA inside `isms-policy.md`. No "canonical SoA" is designated; the reader cannot tell which governs.
6. **Roadmap vs policy status.** ADR-0067 (the document that "rules" the policy) is **Proposed**; `isms-policy.md` is **Adopted**. Either accept ADR-0067 or soften the policy status.
7. **Crypto overclaim.** `isms-policy.md` recitals imply enforcement including cryptography, while its own SoA (A.8.24) and `rocky-toms.md` state crypto-at-rest is **paused/GAP**. Minor but an auditor will flag.
8. **Duplicated crosswalk truth.** Four representations of the LPDP↔GDPR↔27701↔27001 mapping (see D5) with no single source of truth; the code-side `VALIDATED_CROSSWALK` is the only one machine-checked and it is still "pending review."
9. **`Standardization/index.md` title.** The folder index is titled "ISO/IEC 27701:2025" though it indexes both standards — cosmetic, but confuses navigation.

### Recommended resolution order

1. Designate **one canonical SoA** (`isms-policy.md` full table) and make `rocky-soa.md` a strict subset/view or retire it; reconcile the A.5.1/.3/.9/.4 statuses to a single verdict each.
2. Accept ADR-0067 (or relabel the policy "Draft/Proposed" to match).
3. Add the orphaned code-backed controls (ADR-0092 lockdown, ADR-0084 signed QR) to the SoA.
4. Add the missing standards artifacts (D2) as ADR-0067 Phase 2 work orders.
5. Cross-link the 10 ADRs in D3 to `/compliance/` + `/Standardization/`.
6. Add `compliance/index.mdx` landing page and reconcile the four crosswalks to `VALIDATED_CROSSWALK` as the machine-checked anchor.
