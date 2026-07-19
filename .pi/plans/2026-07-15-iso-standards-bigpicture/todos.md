# Execution Todos — ISO Standards Layer Coherence & Governance (CORRECTED)

**Plan:** `.pi/plans/2026-07-15-iso-standards-bigpicture/plan.md`
**Tag:** `iso-standards-bigpicture`
**IMPORTANT:** This supersedes the stale 16:20 draft. ADRs 0096–0104 and the companion docs
(incident-response, bcp, training, non-pii-inventory, physical, crypto, obligation-register)
ALREADY EXIST — do NOT recreate them. Only the tasks below remain. Run
`pnpm check:adrs && pnpm check:md-links` after every doc/ADR edit. No Nextra TSDoc under Turbopack
(plain MDX only).

---

## T-A — Retire the 2nd SoA (`rocky-soa.md`)

- Files: delete `apps/docs/content/compliance/rocky-soa.md`; edit `apps/docs/content/compliance/_meta.ts` (remove its entry); `apps/docs/content/compliance/iso27701-2025-gap-analysis.md` §4.
- Do: `rg -l "rocky-soa" apps/docs` → repoint each link to `isms-policy.md`. Delete the file. Remove its `_meta.ts` entry. In gap-analysis §4, replace the independent MET/PARTIAL/GAP verdicts with a provenance note: "Status column sourced from ROCKY-ISMS-001 (isms-policy.md) on 2026-07-15; canonical verdicts live there."
- Anti-patterns: do NOT keep `rocky-soa.md` as a "view" (re-opens drift); do NOT leave dangling links.
- Acceptance: no `rocky-soa.md`; zero `rocky-soa` refs in `apps/docs`; `_meta.ts` valid TS; gap-analysis §4 no longer asserts independent verdicts.
- Commit: `docs(compliance): retire duplicate rocky-soa.md; point links to canonical isms-policy`

## T-B — Accept ADR-0067 + crypto-pause risk-accepted gap

- Files: `apps/docs/content/ADR/0067-isms-posture-iso27001-27701-roadmap.md`; `apps/docs/content/compliance/isms-policy.md` (A.8.24 row).
- Do: set `| **Status** | Proposed |` → `Accepted`; add `Date` + `Author`. Confirm A.8.24 row names crypto-pause **owner + review date** (ROCKY-CRYPTO-001 / ADR-0071). Run `pnpm check:adrs`.
- Anti-patterns: do NOT silently flip status without the crypto-gap note; do NOT build crypto (out of scope).
- Acceptance: ADR-0067 Status=Accepted; `check:adrs` passes; A.8.24 names owner + review date.
- Commit: `docs(adr): accept ADR-0067; record crypto-at-rest pause as risk-accepted gap`

## T-C — Write supplier/processor security assessment (ADR-0098)

- Files: `apps/docs/content/compliance/rocky-supplier-assessment.md` (NEW) + `compliance/_meta.ts`.
- Do: ROCKY-SUP-001. A.5.19–.23 / A.2.2 / A.3.10. Cloud/supplier security assessment + processor eval (Better Auth et al.). Cite `rocky-dpa.md` + `rocky-processor-register.md` (Art 28 contracts) — do NOT duplicate them. `Related` → ADR-0098, ADR-0067, isms-policy.md. Controlled language (`shall`); no `must`.
- Anti-patterns: do NOT recreate the DPA; do NOT assess suppliers not onboarded.
- Acceptance: covers A.5.19–.23; cites ADR-0098 + existing DPA/processor-register; `check:standards (a)` passes (doc has ADR back-link).
- Commit: `docs(compliance): add supplier/processor security assessment (A.5.19–.23)`

## T-D — Write change & configuration management procedure (ADR-0102)

- Files: `apps/docs/content/compliance/rocky-change-config-mgmt.md` (NEW) + `compliance/_meta.ts`.
- Do: ROCKY-CM-001. A.8.32 / A.8.9. Change authorisation, config register, SoD sign-off. Reference NoDrift (ADR-0018/0019) + AGENTS.md RobotFarm as the enforcing mechanism. `Related` → ADR-0102, ADR-0018, ADR-0019, ADR-0067, isms-policy.md.
- Anti-patterns: do NOT describe NoDrift CI as "the procedure" (it is the mechanism); state the register as a to-be-created artifact.
- Acceptance: covers A.8.32 + A.8.9; references NoDrift; `check:standards (a)` passes.
- Commit: `docs(compliance): add change & configuration management procedure (A.8.32)`

## T-E — Resolve AL Law 124

- Files: `apps/docs/content/ADR/0067-isms-posture-iso27001-27701-roadmap.md` + `apps/docs/content/compliance/isms-policy.md` recitals (or `compliance/ALBANIAN_LPDP.md` if user prefers a doc).
- Do: record an explicit, justified decision. Default = **out of scope**: add a short paragraph to ADR-0067 + isms-policy recitals stating AL Law 124 was carried from a separate project, is NOT part of Rocky's conformity claim, MK LPDP (MACEDONIAN_LPDP.md) is the in-scope jurisdiction, and the `alLaw124` code field is retained for future use only.
- Anti-patterns: do NOT balloon AL into a 3k-line MK clone; do NOT assert AL compliance without counsel.
- Acceptance: explicit recorded AL decision; `check:md-links` green.
- Commit: `docs(compliance): record Albanian Law 124 as out of scope`

## T-F — Cross-link 10 ADRs → standards layer

- Files: 10 ADR files (0062,0065,0073,0074,0082,0084,0086,0092,0093,0094) + target docs.
- Do: add a `## Standards / Compliance` line in each ADR's `Related ADRs` section citing the relevant `/compliance/` + `/Standardization/` docs + SoA control IDs (per plan §T-F mapping: 0062/0082→isms-policy+rocky-retention-schedule; 0065/0073/0074/0094→isms-policy+rocky-toms; 0084→isms-policy+rocky-toms; 0086→rocky-controls-inventory; 0092/0093→isms-policy). Add matching back-links in target docs' `Related`.
- Anti-patterns: do NOT modify ADR *decisions* (only add cross-reference lines); do NOT break ADR-0033 header format.
- Acceptance: all 10 ADRs carry a Standards/Compliance line; target docs back-link; `check:adrs` + `check:md-links` pass.
- Commit: `docs(adr): cross-link 10 ADRs to compliance/ + Standardization/`

## T-G — Crosswalk consolidation → VALIDATED_CROSSWALK

- Files: `MACEDONIAN_LPDP_GDPR_ISO27701_CONTROLS_MATRIX.md`, `iso27001-2022-controls.md`, `iso27701_2025.md`, `iso27701-2025-gap-analysis.md`; code comment in `packages/validators/src/compliance/gdpr-articles.ts`.
- Do: ensure each crosswalk doc with GDPR/LPDP/AL content cites `VALIDATED_CROSSWALK` (by symbol + path `packages/validators/src/compliance/gdpr-articles.ts`) as the single source of truth. Keep `iso27001-2022-annex-a-mapping.md` (pure 2013→2022 renumber, no GDPR content — no citation needed). Add a prose note that `VALIDATED_CROSSWALK.iso27701` is "pending expert review" (lead, not authority).
- Anti-patterns: do NOT create a 5th crosswalk; do NOT treat `iso27701` field as verified.
- Acceptance: every crosswalk doc with GDPR/LPDP/AL content cites VALIDATED_CROSSWALK; `check:standards (c)` passes.
- Commit: `docs(standardization): anchor crosswalks to VALIDATED_CROSSWALK`

## T-H — Fix Standardization/index.md title

- Files: `apps/docs/content/Standardization/index.md`.
- Do: change the title from "ISO/IEC 27701:2025" to "Rocky Standards & Compliance" (it indexes both ISO 27001 + 27701).
- Anti-patterns: do NOT change the file's link structure.
- Acceptance: title reflects both standards; `check:md-links` green.
- Commit: `docs(standardization): fix index title to cover both ISO 27001 + 27701`

## T-I — Add `check:standards` guardian + wire ci:checks

- Files: `scripts/check-standards.mjs` (NEW) + root `package.json` (`scripts` + `ci:checks`).
- Do: ESM, zero deps, `process.exit(1)` on failure (code in plan §T-I). Add `"check:standards": "node scripts/check-standards.mjs"` to `scripts`; insert `pnpm check:standards &&` into `ci:checks` after `pnpm check:agents &&` (before `pnpm check:pdfa`). Follow sibling guardian style (`scripts/check-adrs.mjs`).
- Anti-patterns: do NOT add npm deps; do NOT make it exit 0 unconditionally; do NOT use `console.log` for failures.
- Acceptance: script runs; fails on pre-remediation tree (proves it gates) and passes once T-A–T-H land; `pnpm ci:checks` includes it.
- Commit: `feat(guardian): add check:standards and wire into ci:checks`

## T-J — Add how-to/maintain-standards-layer.mdx

- Files: `apps/docs/content/how-to/maintain-standards-layer.mdx` (NEW) + `how-to/_meta.ts`.
- Do: plain MDX (no TSDoc). Documents: the canonical-SoA rule (no 2nd SoA), the Standardization style guides (`internal-standard-style.md`, `writing-iso-compatible-documentation.md`), the `check:standards` guardian + how to run it, how to add a new standards doc/ADR and cross-link it, and the AL out-of-scope decision. Governed by ADR-0052 (how-to genre) + ADR-0067.
- Anti-patterns: do NOT add TSDoc annotations (breaks `next build`); do NOT duplicate ADR content.
- Acceptance: `pnpm --filter docs build` succeeds; `check:md-links` passes.
- Commit: `docs(how-to): add maintain-standards-layer guide`
