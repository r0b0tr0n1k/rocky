# Context for: ISO/IEC Directive Part 2, Annex A (Table A.1) editorial-compliance audit of Rocky docs

## Audit header

- **Repo:** `/home/goce/appz/rocky` (pnpm + Turborepo; docs at `apps/docs/content`)
- **Checklist:** ISO/IEC Directives, Part 2 (9th ed., 2021), Annex A, Table A.1 — applied to the **authored** docs only.
- **Mode:** Recon only. Nothing edited. Guardian `scripts/check-standards.mjs` currently **passes** (scanned 19 posture/standards docs, 158 SoA rows, 3 crosswalk docs — 0 violations).
- **Already covered by guardian (do NOT re-litigate):** (a) governing-ADR back-link on posture papers + standards map; (b) SoA single status token per control row; (c) crosswalk docs cite `VALIDATED_CROSSWALK`; (d) word "must" forbidden in authored posture papers + standards map. All 4 are GREEN today.

## Copyright / DO-NOT-EDIT exclusion list (extracted standard text or national law — exclude from all fix recommendations)

Explicitly named in task (verbatim / machine-extracted, MUST NOT be reworded):

- `apps/docs/content/Standardization/a-5.md`
- `apps/docs/content/Standardization/a-7.md`
- `apps/docs/content/Standardization/iso27001-2022-controls.md`
- `apps/docs/content/Standardization/iso27001-2022-annex-a-mapping.md`
- `apps/docs/content/Standardization/iso27701_2025.md`
- `apps/docs/content/Standardization/MACEDONIAN_LPDP*.md` (6 files: COMPLIANCE_GUIDE, CONTROLS_MATRIX, EXECUTIVE_SUMMARY, IMPLEMENTATION_GUIDE, QUICK_REFERENCE, HEADER_DOCUMENTATION, HEADER_IMPLEMENTATION_PLAN)
- `apps/docs/content/compliance/gdrp.md` — **NOTE:** actual path is `apps/docs/content/Standardization/gdrp.md` (350 KB, verbatim GDPR). Task path was wrong; flagged here.
- Inferred same class (verbatim standard/law, not in explicit list but flagged so planner is precise): `Standardization/a-1.md`, `a-2.md`, `a-3.md`, `a-6.md`, `a-8.md`, `b-1.md`, `b-2.md`, `b-3.md`, `table-b-1.md`, `iso-27001-2022.md`, `iso-27701-2025.md`, `GDPR_ISO27001_Implementation_Roadmap.md`, and the non-matrix `MACEDONIAN_LPDP_*_GUIDE/*.md`. These are wrappers around source-permitted excerpts (per `writing-iso-compatible-documentation.md` §12/§13) — treat as NOT-to-be-reworded.

## Authored / fixable set assessed (all other standards-layer docs)

- `apps/docs/content/compliance/*.md` posture papers: `isms-policy.md`, `index.mdx`, `iso27701-2025-gap-analysis.md`, `frontend-conformity.md`, `rocky-bcp-ict-readiness.md`, `rocky-change-mgmt-procedure.md`, `rocky-controls-inventory.md`, `rocky-cryptography-policy.md`, `rocky-incident-response-plan.md`, `rocky-internal-audit-procedure.md`, `rocky-non-pii-asset-inventory.md`, `rocky-obligation-register.md`, `rocky-physical-controls-attestation.md`, `rocky-risk-assessment.md`, `rocky-risk-treatment-plan.md`, `rocky-supplier-security-assessment.md`, `rocky-training-awareness.md`, `rocky-toms.md` (plus the LEGAL_LAW rocky-*.md — see note below).
- NOTE on LEGAL_LAW rocky-*.md (rocky-ropa, rocky-dpa, rocky-dsr-procedure, rocky-breach, rocky-privacy-notice, rocky-cookie-notice, rocky-lawful-basis-register, rocky-processor-register, rocky-dpia-health, rocky-international-transfer-assessment, rocky-erasure-retention-procedure, rocky-withdrawal-recall-procedure, rocky-retention-schedule, rocky-automated-decision-making): the guardian treats these as out-of-scope for (a)/(d) because they quote GDPR/law. The task lists `rocky-*-.md` as authored/fixable for the *other* checklist items, but their bodies reproduce GDPR articles verbatim — **only their structural shell (frontmatter, headings, scope clauses) is fixable; do NOT reword their quoted-law prose.**
- `apps/docs/content/Standardization/iso-software-engineering-standards-map.md`
- `apps/docs/content/Standardization/writing-iso-compatible-documentation.md`
- `apps/docs/content/Standardization/internal-standard-style.md`
- `apps/docs/content/ADR/0097-0105` (posture/standards ADRs) + other posture ADRs.
- `apps/docs/content/explanation/system-architecture/index.mdx`

## Per-checklist-item assessment (authored docs only)

| # | Checklist item (Part 2 clause) | Status on authored docs | Evidence (file:line) | Guardian-covered? | Fixable? |
|---|---|---|---|---|---|
| 1 | Structure / subdivision (6,22) | PARTIAL | ADRs 0097–0105 + many posture papers lack `title:` frontmatter (use H1 only); `frontend-conformity.md`, `rocky-controls-inventory.md`, `iso27701-2025-gap-analysis.md` use `document_title:` not `title:` (vs house rule 5 in `internal-standard-style.md`) | N | Y |
| 2 | Plain language (4,5) | PARTIAL | `iso27701-2025-gap-analysis.md:2` opens with informal Žižek-mode voice "*sniffs* The cow is already tagged…" — not ISO-compatible plain language | N | Y |
| 3 | Title ≤3 elements, general→particular (11) | COMPLIANT (with caveat) | All authored H1s ≤3 elements; `iso27701-2025-gap-analysis.md` H1 = 3 elements (OK). Caveat: ADR H1s long but ADRs are decision records, not ISO deliverables; ADRs lack `title:` frontmatter | N | Y |
| 4 | Foreword (12) | COMPLIANT by absence | No authored doc carries a Foreword; none are revisions needing a revision statement | N | N/A |
| 5 | Introduction informative, no "shall" (13) | NON-COMPLIANT | `iso-software-engineering-standards-map.md:17` — "It **shall** be read alongside…" (shall in Introduction) | N (guardian bans only "must") | Y |
| 6 | Scope = facts only (14) | NON-COMPLIANT | `rocky-supplier-security-assessment.md:28` "This procedure specifies how Rocky **shall** identify…" (shall/requirement in Scope/`## 1. Purpose`); `rocky-non-pii-asset-inventory.md:40-41` "This document **shall** not duplicate… it **shall** reference it." (shall in Scope) | N | Y |
| 7 | Normative references cited (15) | PARTIAL | `isms-policy.md:26` has a "Normative references" clause; other posture papers cite ADRs/standards inline but lack a formal Normative-references clause | N | Y |
| 8 | Terms & definitions (16) | PARTIAL | `isms-policy.md:33` has "Terms and definitions"; most posture papers define terms inline, not in a dedicated clause | N | Y |
| 9 | Figures numbered + titled + cross-referenced (28) | PARTIAL | `iso-software-engineering-standards-map.md:72` **Figure 1** is numbered+titled but NEVER cross-referenced in body ("see Figure 1" absent). Counter-example compliant: `explanation/system-architecture/index.mdx` numbers+captions+cites every Figure 1–7 | N | Y |
| 10 | Tables numbered + titled + cross-referenced (29) | NON-COMPLIANT | `frontend-conformity.md` tables (≈line 36 "How this fits", line 72 "Control mapping") are unnumbered + uncited; `iso-software-engineering-standards-map.md:38` "Standards map" table unnumbered + uncited; `isms-policy.md:281,317,329` Tables A.1–A.3 never cited as "see Table A.x" in body; `iso27701-2025-gap-analysis.md:127,146,152` Tables A.1–A.3 uncited | N | Y |
| 11 | Annexes referenced + status correct (20) | COMPLIANT by absence | No authored doc uses annexes; none left unreferenced | N | N/A |
| 12 | Bibliography consistent/complete (21) | COMPLIANT | `isms-policy.md:361` and `iso-software-engineering-standards-map.md:90` have formatted bibliographies; no entry also appears as a normative reference | N (guardian (c) covers crosswalk only) | Y |
| 13 | Drafting of provisions (4,7): no shall/should/may in Foreword/Scope/notes/examples; no shall in Intro; "must" only for external constraints | NON-COMPLIANT (shall-in-Scope/Intro) + COMPLIANT ("must" absent) | Violations: same as items 5 & 6. "must" rule: GREEN via guardian (d). House rule bans "must" entirely — aligns with (not conflicts with) ISO, since ISO permits "must" *only* for external constraints and our docs state external constraints as facts. No "shall" found in any Foreword (none exist) | (d) covers "must" only | Y |
| 14 | Potential legal problems (30–32) | COMPLIANT | Authored docs cite standards by identifier (facts) and quote public-domain law (GDPR/MK LPDP); no new copyrighted-expression reproduction. Verbatim-law files are in the DO-NOT-EDIT set | N | N/A |
| 15 | Conformity assessment (33) | PARTIAL | Posture papers correctly disclaim certification (`frontend-conformity.md` "NOT … conformity assessment … NO claim of certification"; `iso27701-2025-gap-analysis.md` "not legal advice"). `frontend-conformity.md` *title* says "Conformity Posture" — verify it is never read as a conformity *assessment* claim | N | Y |
| 16 | Cross-references correct (10) | PARTIAL | `writing-iso-compatible-documentation.md:408` broken anchor `[§6.1](#61-modal-verbs--fixed-meanings)` — double hyphen; correct slug for heading `### 6.1 Modal verbs — fixed meanings` (line 151) is `#61-modal-verbs-fixed-meanings` (single hyphen). All relative `.md`/`.mdx` file links resolve | N (guardian (a) covers ADR back-links only) | Y |
| 17 | Common problems / Annex B (decimal comma, variable symbols) | COMPLIANT | No variable-quantity symbol misuse observed; decimal convention not systematically enforced but no defect found | N | N/A |

## TOP concrete, fixable non-compliances (exact file:line + specific fix)

1. **`compliance/rocky-supplier-security-assessment.md:28`** — Scope (`## 1. Purpose`) contains "This procedure specifies how Rocky **shall** identify, assess and monitor…". Fix: rephrase Scope as fact — "This procedure identifies, assesses and monitors the information-security posture of suppliers and processors…"; move any normative obligation into the procedure body, not Scope.
2. **`compliance/rocky-non-pii-asset-inventory.md:40-41`** — Scope contains "This document **shall** not duplicate that register; it **shall** reference it." Fix: "This document does not duplicate that register; it references it." (remove all "shall" from Scope).
3. **`Standardization/iso-software-engineering-standards-map.md:17`** — Introduction: "It **shall** be read alongside…". Fix: "It is read alongside…" / "Read it alongside…" (remove "shall" from Introduction per Clause 13).
4. **`Standardization/iso-software-engineering-standards-map.md:38,72`** — "Standards map" table is unnumbered + uncited; **Figure 1** (line 72) is never cited in body. Fix: label the table "Table 1 — Standards map" and add a "see Table 1" pointer from Scope/Introduction; add a "see Figure 1" reference in the body text (e.g. Introduction or Standards map section).
5. **`compliance/frontend-conformity.md`** — two tables (≈line 36 "How this fits"; line 72 "Control mapping") are unnumbered + uncited. Fix: number "Table 1"/"Table 2" with concise titles and add "see Table N" references in the body. Also add `title:` + `sidebarTitle:` frontmatter (currently uses `document_title:` — violates house rule 5).
6. **`compliance/iso27701-2025-gap-analysis.md:127,146,152`** — Tables A.1–A.3 never cited as "see Table A.x" in body. Fix: add cross-references in the surrounding prose. Also add `title:` frontmatter (currently H1-only) and remove the informal opening at line 2 ("*sniffs* The cow…") to meet plain-language (item 2).
7. **`compliance/isms-policy.md:281,317,329`** — SoA Tables A.1–A.3 are defined but never cited as "see Table A.x" in the Article 4 body. Fix: add "see Table A.1" cross-references in Article 4 narrative.
8. **`Standardization/writing-iso-compatible-documentation.md:408`** — broken anchor `#61-modal-verbs--fixed-meanings` (double hyphen). Fix: change to `#61-modal-verbs-fixed-meanings` to match heading `### 6.1 Modal verbs — fixed meanings` (line 151).
9. **ADR `0097`–`0105` (and other posture ADRs)** — no `title:` frontmatter (H1 only). Fix: add `title:` + `sidebarTitle:` per house rule 5 (`internal-standard-style.md`) so the Title checklist item (3) and structure item (1) are mechanically satisfiable. Note: ADR `## Decision` "shall" usage (e.g. `ADR/0097:31-32`) is correct ADR house style (ADR-0033), NOT a violation — do not strip.
10. **`compliance/frontend-conformity.md`, `compliance/rocky-controls-inventory.md`, `compliance/iso27701-2025-gap-analysis.md`** — use `document_title:` instead of `title:` frontmatter. Fix: normalize to `title:` + `sidebarTitle:` across all posture papers for consistency (item 1/3).
11. **`compliance/iso27701-2025-gap-analysis.md:2`** — informal Žižek-mode voice in a posture/reference doc. Fix: rewrite opener in neutral, ISO-compatible plain language (item 2).
12. **`compliance/frontend-conformity.md` status vocabulary** — control-mapping table uses non-standard token `N/A (exempt — ROCKY-COOK-001)` (line ≈83, F-03) which is neither IMPLEMENTED/PARTIAL/PLANNED. Not caught by guardian (b) (that only guards `isms-policy.md` SoA). Fix: align token vocabulary or document the exempt state distinctly so it is not confused with the SoA status scheme (item 10/consistency).

## Explicit call-outs (per task)

- **Titles >3 elements:** none found in the authored set. `iso27701-2025-gap-analysis.md` H1 = 3 elements (compliant). ADR H1s are long but ADRs are not ISO deliverables; they should still gain `title:` frontmatter (item 9 above).
- **Tables/figures lacking a number or cross-reference:** (a) `iso-software-engineering-standards-map.md` Figure 1 (numbered, NOT cross-referenced) + "Standards map" table (unnumbered, uncited); (b) `frontend-conformity.md` both tables (unnumbered + uncited); (c) `isms-policy.md` Tables A.1–A.3 (numbered, uncited in body); (d) `iso27701-2025-gap-analysis.md` Tables A.1–A.3 (numbered, uncited). Compliant counter-example: `explanation/system-architecture/index.mdx` (Figures 1–7 all numbered + captioned + cited).
- **SCOPE clauses that sneakily contain a requirement ("shall"):** `rocky-supplier-security-assessment.md:28` (Scope/`## 1. Purpose`) and `rocky-non-pii-asset-inventory.md:40-41` (Scope). Both violate Clause 14 (Scope = statements of fact only) and Clause 13.
- **Broken / non-resolving cross-reference:** `writing-iso-compatible-documentation.md:408` anchor `#61-modal-verbs--fixed-meanings` (double hyphen; correct `#61-modal-verbs-fixed-meanings`). All relative file links resolve; no other broken anchors detected in sampled set.

## Where the guardian (`scripts/check-standards.mjs`) could be extended

The planner may prefer to *enforce* rather than *fix* some items. Candidate extensions (all zero-dep, same style as existing checks):

- **Ban `shall`/`should`/`may` in Introduction + Scope of the scanned posture set** → auto-catches items 5, 6, 13 (currently the guardian only bans "must"). Reuse the existing `stripCode` + per-line walker; add a Scope/Introduction region tracker.
- **Require every `Table N` / `Figure N` caption (and every `##`/table under a numbered heading) to be cross-referenced from body text** → auto-catches items 9 & 10. Walk for `/(Table|Figure)\s+[0-9]/` and assert a `see \1 N` occurrence elsewhere.
- **Require `title:` + `sidebarTitle:` frontmatter on every scanned doc** → auto-catches item 1/3 inconsistency (ADRs + `document_title:` papers). Trivial grep.
- **Validate same-file `#anchor` links resolve to a heading slug** → auto-catches item 16 (the `writing-iso-compatible` broken anchor). Note: `ci:checks` already runs `check:md-links`, but that guardian may not validate intra-file `#` anchors — confirm before adding to avoid duplication.
- **Optional: flag `shall` inside ADR `## Context`/`## Status` sections** only if those ADRs are intended to read as standards (currently they are decision records, so leave as-is unless the planner reclassifies them).

## Summary of remaining risk

- 4 hard non-compliances on authored docs: shall-in-Introduction (standards-map:17), shall-in-Scope ×2 (supplier:28, non-pii:40-41), and table/figure cross-reference gaps across 4 docs (items 9/10).
- Guardian is GREEN today but covers only 4 of 17 items; the 13 uncovered items are where the real editorial drift lives (frontmatter inconsistency, uncited tables/figures, one broken anchor, informal tone in one posture paper).
- All fixable items are in the authored set; the DO-NOT-EDIT extracted/law files are excluded.
