# ADR Reconciliation Plan — Flip 17 Proposed → Accepted, Keep 9 Proposed

**Date:** 2026-07-19
**Status:** Draft (awaiting execution)
**Directory:** /home/goce/appz/rocky
**Scope:** 26 ADRs currently carrying `Status = Proposed` under `apps/docs/content/ADR/`

---

## Goal

Reconcile the ADR ledger against delivered code & governance artifacts. Of 26 Proposed ADRs, flip the
17 that are implemented (or whose mandated governance artifact exists) to **Accepted**, and leave the 9
that are still partial / roadmap-only as **Proposed**. No ADR content changes — only the single
`Status` header cell.

### ADR-0033 status convention note

ADR-0033 ("Frontend & Mobile Architecture-Decision Standard") defines the canonical header table that
every ADR must carry: `Status | Date | Author | Supersedes | Superseded`. The only sanctioned
`Status` values (enforced by `scripts/check-adrs.mjs:18` `VALID_STATUS`) are
`Proposed | Accepted | Deprecated | Superseded`. `Proposed → Accepted` is therefore a legitimate,
in-place status transition — it does **not** require a new ADR, a Supersedes/Superseded pair, or any
body rewrite. The header table must remain structurally valid (same five keys, same pipe-delimited
row) so `pnpm check:adrs` stays green.

---

## 11 Clusters

| Cluster | Member ADRs | Shared theme |
| --- | --- | --- |
| **C1** Web UI Tier Surface Parity | 0056, 0057, 0058, 0059, 0060 | Admin Bot web parity pages + shared component/feedback contract (ADR-0055 program) |
| **C2** GDPR / ISMS Compliance Lineage | 0061, 0068, 0069, 0070, 0071, 0072, 0073, 0074, 0075 | Privacy controls (erasure, crypto, edge PII) + governance registers (lawful-basis, DPIA, RoPA, breach, processor) |
| **C3** Result-Monad Error Sovereignty | 0066 | Domain↔transport boundary: `Result<T,E>` return type, `TRPCError` only at routers |
| **C4** Geo Spatial Service | 0078 | Extract `packages/geo` cross-cutting package from IoT domain |
| **C5** Validation Doctrine — Accept-and-Flag | 0081 | Two-tier validation: hard-reject invariants vs accept+flag plausibility |
| **C6** Health/Disease Domain Expansion | 0089, 0090, 0091, 0095 | Vet & sanitary module growth: disease master data, sanitary inspections, lab chain-of-custody, AHL reference/events |
| **C7** Dual Dashboards | 0093 | Role-differentiated web views: private vet vs state epidemiologist |
| **C8** Docker Multi-Stage Build | 0096 | Reproducible container builds (deps→build→runtime), pinned pnpm, portable config |
| **C9** State Vet Capability | 0106 | Region-bounded `STATE_VET` role + `state_vets` registry + tours + section-selectable PDF |
| **C10** PDF Template System | 0107 | Typed document catalog + threadable `sections` + parallel test suite over existing engine |
| **C11** Mobile Regulatory Gating | 0065 | Shared regulatory predicate mirrored on device (server decides, device pre-checks) |

Counts: C1=5, C2=9, C3=1, C4=1, C5=1, C6=4, C7=1, C8=1, C9=1, C10=1, C11=1 → **26**.

---

## Master Done-vs-Not-Done Grid (all 26)

Evidence citations are taken verbatim from the scout context
(`.pi/plans/2026-07-19-adr-reconcile/scout-context.md`). Verdict legend:
**Done** = implemented in code or mandated governance artifact exists;
**Partial** = core decision partly built (config/primitive only, not wired);
**Not-done** = roadmap/spec only, no code evidence.

| ADR# | Title | Cluster | Code evidence (file:line) | Verdict | Action |
| --- | --- | --- | --- | --- | --- |
| 0056 | Web UI Tier 0 (Presence) | C1 | `apps/web/app/(admin)/vs-contracts/page.tsx` (`trpc.vsContract.create.mutationOptions`), `vs-assignments/`, `farm-books/`, `sync/` present; `sync/page.tsx` → `trpc.sync.syncDownload.queryOptions` | Done | **Flip** |
| 0057 | Web UI Tier 1 Lifecycle | C1 | `apps/web/app/(admin)/ear-tags/`, `health/`, `passports/` exist; `components/shared/stepper.tsx` + `timeline.tsx` | Done | **Flip** |
| 0058 | Web UI Tier 1 Operational | C1 | `apps/web/app/(admin)/` contains `corrections/`, `iot/`, `notifications/`, `rbac/`, `system-parameters/`, `documents/` | Done | **Flip** |
| 0059 | Web UI Tier 2 Deepen | C1 | `apps/web/app/(admin)/` contains `archive/`, `devices/`, `inspections/`, `movements/`, `organizations/` | Done | **Flip** |
| 0060 | Component & Feedback Map | C1 | `apps/web/components/shared/timeline.tsx` + `stepper.tsx` built (2/3 required primitives); Map deferred per ADR-0031 | Done | **Flip** |
| 0061 | GDPR Right-to-be-Forgotten | C2 | Only tri-state config gates in `packages/validators/src/compliance/compliance-options.ts` (`physicallyDeleteOnErasure: false`); no crypto-shred/unlink; `isms-policy.md` marks erasure "PARTIAL / deferred" | Not-done | **Keep** |
| 0065 | Mobile Regulatory Gating | C11 | Server predicates exist: `packages/domains/movement/src/services/eudr-due-diligence.ts:47` `runEudrDueDiligence`, `packages/geo/src/services/disease-zone.service.ts:73` `runDiseaseZoneCheck`; but no `regulatory/` dir, no `evaluateMovementRegulatory`, no device mirror | Partial | **Keep** |
| 0066 | Error Sovereignty (Result) | C3 | 404 `ok()/err()/Result/unwrap()` matches in `packages/domains/*/services/*.service.ts`; `packages/domains/sync/src/services/sync.service.ts:10` "Returns neverthrow `Result<T, Error>`; routers map `E` to `TRPCError`" | Done | **Flip** |
| 0068 | Lawful Basis Register | C2 | `apps/docs/content/compliance/rocky-lawful-basis-register.md` exists (the mandated governance artifact) | Done | **Flip** |
| 0069 | DPIA Template | C2 | `apps/docs/content/compliance/rocky-dpia-health.md` exists | Done | **Flip** |
| 0070 | RoPA Derived | C2 | `apps/docs/content/compliance/rocky-ropa.md` exists; `VALIDATED_CROSSWALK` in `packages/validators/src/compliance/gdpr-articles.ts` | Done | **Flip** |
| 0071 | Envelope Encryption | C2 | `rg` for `envelopeEncryption\|DataEncryptionKey\|encryptAtRest\|AesGcm` across `packages/ apps/` → no hits; only ADR text + a config flag | Not-done | **Keep** |
| 0072 | Breach Notification Workflow | C2 | `apps/docs/content/compliance/rocky-breach-notification-procedure.md` exists (state machine `DETECTED→…→CLOSED`) | Done | **Flip** |
| 0073 | Mobile Edge Compliance (PII) | C2 | `apps/mob/lib/offline/pii.ts` + `components/PiiText.tsx` + `lib/offline/pii.test.ts` exist (measure 1, tested); `rg "PiiText\|redactRecord" apps/mob/app` → no adoption in screens | Partial | **Keep** |
| 0074 | Field-Role Edge Protocol | C2 | `EdgeDataPolicy` appears only inside `0074-*.md` (+ a mention in `apps/mob/AGENTS.md`); `rg` for `EdgeDataPolicy\|piiResidency\|syncScope` in code → no hits | Not-done | **Keep** |
| 0075 | Processor/Subprocessor Mgmt | C2 | `apps/docs/content/compliance/rocky-processor-register.md` exists (register + DPA library) | Done | **Flip** |
| 0078 | Geo Spatial Service | C4 | `packages/geo/` with `AGENTS.md`, `src/services/geo.service.ts:13` `GeoService`, `src/repositories/geo.repository.ts:21/:43`; router registered `apps/api/src/app.module.ts:91/:566` | Done | **Flip** |
| 0081 | Accept-and-Flag Validation | C5 | `packages/validators/src/compliance/compliance-options.ts:83` "Default posture: EVERY option UNDECIDED => accept-and-flag"; `:13` doctrine note; tri-state `complianceOptionsSchema`; validators reference stance | Partial | **Keep** |
| 0089 | Disease Master Data (AHL+WOAH) | C6 | `packages/database/src/schema/hd/diseases.ts:20` `diseaseCategoryPgEnum`, `:22/:25` `woahCode`/`euAnnexRef`/`controlMeasures`/`listedDisease`/`legalBasis` | Done | **Flip** |
| 0090 | Sanitary Inspections | C6 | `packages/database/src/schema/an/sanitary-inspections.ts:33/:34` `anteMortemDecision`/`postMortemDecision` enums, `:38` ABP disposition; migration creates `sanitary_inspections` w/ FKs | Done | **Flip** |
| 0091 | Lab Test Chain-of-Custody | C6 | `packages/database/src/schema/hd/lab-tests.ts:47` `sampleStatus` enum; `packages/domains/health/src/services/health.service.ts:358` emits `lab_test.completed` OutboxEvent | Done | **Flip** |
| 0093 | Dual Dashboards (Vet vs Epi) | C7 | Only generic `apps/web/app/(admin)/dashboard/page.tsx` + `components/dashboard/analytics`; `rg` for `Epidemiologist\|VetDashboard\|StateEpidemiologist` → no hits | Not-done | **Keep** |
| 0095 | AHL Disease Reference & Events | C6 | `packages/database/src/schema/hd/` → `species-groups.ts`, `disease-events.ts`, `disease-species-applicability.ts`, `disease-event-procedures.ts`; seed `packages/database/src/seed/ahl-reference.ts` (~75 diseases) | Done | **Flip** |
| 0096 | Docker Multi-Stage Build | C8 | `apps/api/Dockerfile`, `apps/web/Dockerfile`, `apps/docs/Dockerfile` each `toolchain→workspace→build→production` (api uses distroless nonroot); `apps/api/Dockerfile:17` `pnpm install --offline --frozen-lockfile`; `apps/web/next.config.ts:21/:42` `findMonorepoRoot` | Done | **Flip** |
| 0106 | State Vet Capability | C9 | `rg` for `STATE_VET\|state_vets\|StateVet\|stateVet` across `packages/database/src/constants/user-role.ts` and `packages/` → no matches; no role, no registry, no tours | Not-done | **Keep** |
| 0107 | PDF Template System | C10 | Engine exists (`packages/pdf/src/engine/document-registry.ts`, `document-template.ts`); but Pillars A–D absent: `rg` for `DOCUMENT_TYPES\|documentTypeEnum\|getManifest\|sections\?:` → no hits; no typed catalog / sections threading / `trpc.document.catalog` | Not-done | **Keep** |

**Flip (17):** 0056, 0057, 0058, 0059, 0060, 0066, 0068, 0069, 0070, 0072, 0075, 0078, 0089, 0090, 0091, 0095, 0096
**Keep Proposed (9):** 0061, 0065, 0071, 0073, 0074, 0081, 0093, 0106, 0107

---

## Exact Edit Spec

### Operation

Open each **FLIP** ADR and replace the `Status` header-cell value `Proposed` with `Accepted`.
The **KEEP** ADRs receive **no edit** of any kind.

### Format / padding caveat (read this before editing)

The status row is **not** column-fixed. Observed in the actual files:

- Single-space form: `| **Status** | Proposed |`
- Padded form (column-aligned): `| **Status**     | Proposed            |`

Both forms occur in the 26 (e.g. 0066/0095 use padding; 0056/0068 do not). **Therefore the worker
must match the literal `Proposed` token that follows `**Status**` — never a fixed column width.** Do
not hand-edit by assuming `| **Status** | Proposed |` (single space); on padded files that literal
string is absent and the edit would silently no-op.

**Worker rule:** for every target file, first `read` the header (lines ~1–12) and confirm the exact
status-line text before applying the edit. Apply the replacement only to the `| **Status** … |`
header row, not to any body table that happens to reference "Status"/"Proposed".

### Filesystem paths (relative to repo root)

```
apps/docs/content/ADR/0056-web-ui-tier0-presence.md
apps/docs/content/ADR/0057-web-ui-tier1-lifecycle.md
apps/docs/content/ADR/0058-web-ui-tier1-operational.md
apps/docs/content/ADR/0059-web-ui-tier2-deepen.md
apps/docs/content/ADR/0060-web-ui-component-feedback-map.md
apps/docs/content/ADR/0066-error-sovereignty-result.md
apps/docs/content/ADR/0068-lawful-basis-register-a-1-2-3-gdpr-art-6.md
apps/docs/content/ADR/0069-data-protection-impact-assessment-template-a-1-2-5-gdpr-art-35.md
apps/docs/content/ADR/0070-records-of-processing-activities-derived-not-stored-a-1-2-9-gdpr-art-30.md
apps/docs/content/ADR/0072-personal-data-breach-notification-workflow-a-3-11-12-gdpr-art-33-34.md
apps/docs/content/ADR/0075-processor-subprocessor-management.md
apps/docs/content/ADR/0078-geo-spatial-service.md
apps/docs/content/ADR/0089-disease-master-data-ahl-categories-woah.md
apps/docs/content/ADR/0090-sanitary-inspections-ante-post-mortem.md
apps/docs/content/ADR/0091-lab-test-chain-of-custody.md
apps/docs/content/ADR/0095-ahl-disease-reference-and-events.md
apps/docs/content/ADR/0096-docker-multi-stage-build.md
```

### Portable one-liner (validated against both padding forms)

```bash
perl -i -pe 's/(\| \*\*Status\*\* \s*\|) Proposed/${1} Accepted/' \
  apps/docs/content/ADR/<file>.md
```

- `(\| \*\*Status\*\* \s*\|)` captures the key up to and including the second pipe, absorbing any
  extra alignment spaces between `**Status**` and `|` via `\s*`.
- Replaces the trailing `Proposed` with `Accepted`; residual trailing whitespace after `Proposed` is
  left intact (harmless; `check:adrs` trims/ignores it).
- Matches single-space **and** padded headers identically.

---

## Guardian Caveat

- **`pnpm check:adrs`** (ADR-0033 conformance, `scripts/check-adrs.mjs`) **must pass** after the
  edits. It validates that the header table keeps all five required keys (`Status, Date, Author,
  Supersedes, Superseded`) and that `Status ∈ {Proposed, Accepted, Deprecated, Superseded}`. We only
  change the cell *value* (`Proposed`→`Accepted`), which is a valid enumerated value, so the header
  stays structurally valid. **Do not** alter column count, key names, or pipe layout.
- **`pnpm ci:checks`** should remain green (link checks, agent index, layer boundaries, vitest). This
  change is doc-only and touches no TS/import boundaries, so it should not affect those gates — but
  run `pnpm check:adrs` at minimum, and `pnpm ci:checks` if the environment allows.

---

## Verification

After all 17 flips are applied:

1. **Proposed count = 9 (among real ADRs).** The guardian only inspects files matching
   `^(\d{4})-.*\.md$` (`scripts/check-adrs.mjs:24`). `ADR-TEMPLATE.md` is **not** a numbered ADR and
   is intentionally left `Proposed`; a *raw* grep will still match it. Use the guard-aligned grep to
   get an exact 9:

   ```bash
   grep -rlE '^\|\s*\*\*Status\*\*\s*\| *Proposed' apps/docs/content/ADR \
     | grep -E '[0-9]{4}-'
   ```

   Expected output (exactly these 9):

   ```
   apps/docs/content/ADR/0061-gdpr-right-to-be-forgotten-plan.md
   apps/docs/content/ADR/0065-mobile-regulatory-gating.md
   apps/docs/content/ADR/0071-cryptography-at-rest-via-off-server-envelope-encryption-a-8-24-gdpr-art-32.md
   apps/docs/content/ADR/0073-mobile-edge-compliance-pii-at-the-edge.md
   apps/docs/content/ADR/0074-field-role-edge-protocol-contact-only-pii-purpose-scoped-sync-ttl-reveal-audit.md
   apps/docs/content/ADR/0081-accept-and-flag-validation-doctrine.md
   apps/docs/content/ADR/0093-dual-dashboards-vet-vs-epidemiologist.md
   apps/docs/content/ADR/0106-state-vet-capability.md
   apps/docs/content/ADR/0107-pdf-template-system.md
   ```

   > Note: the *raw* `grep -rlE '^\|\s*\*\*Status\*\*\s*\| *Proposed' apps/docs/content/ADR` returns
   > **10** — the 9 above **plus** `apps/docs/content/ADR/ADR-TEMPLATE.md`. That 10th hit is expected
   > and correct; the template is excluded from `check:adrs` and must stay `Proposed`.

2. **Run the guardian:**

   ```bash
   pnpm check:adrs
   ```

   Must exit 0 (no "Status not in {…}" or missing-key errors).

3. (Optional, if environment permits) `pnpm ci:checks` stays green.
