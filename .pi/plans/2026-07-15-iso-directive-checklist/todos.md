# Todos — ISO/IEC Directive Part 2 Annex A editorial remediation

Tag: iso-directive-checklist

- [x] **T01** Fix `shall` in Introduction — `Standardization/iso-software-engineering-standards-map.md:17`
  - Owner: Docs Bot | Files: `Standardization/iso-software-engineering-standards-map.md`
  - Fix: "It **shall** be read alongside…" → "It is read alongside…" (remove requirement verb from Introduction, Clause 13).
  - Commit: `docs: fix shall-in-introduction (Directive Part 2 A.1/13)`

- [x] **T02** Fix `shall` in Scope (×3) — `rocky-supplier-security-assessment.md:28`, `rocky-non-pii-asset-inventory.md:40-41`
  - Owner: Docs Bot | Files: `compliance/rocky-supplier-security-assessment.md`, `compliance/rocky-non-pii-asset-inventory.md`
  - Fix: rewrite Scope/`## 1. Purpose`/`## 2. Scope` as statements of fact (drop `shall`); keep `shall` in procedure bodies (§5–6) where correct.
  - Commit: `docs: scope = facts only (Directive Part 2 A.6/14)`

- [x] **T03** Number + cross-reference tables/figures in 4 docs
  - Owner: Docs Bot | Files: `Standardization/iso-software-engineering-standards-map.md`, `compliance/frontend-conformity.md`, `compliance/isms-policy.md`, `compliance/iso27701-2025-gap-analysis.md`
  - Fix:
    - standards-map: label "Standards map" table → `Table 1 — Standards map`; add "see Table 1" from Scope/Intro; add "see Figure 1" reference in body for Figure 1 (:72).
    - frontend-conformity.md: number both tables (`Table 1`/`Table 2`) with concise titles; add "see Table N" in body.
    - isms-policy.md: add "see Table A.1/A.2/A.3" in Article 4 narrative (:140) for tables at :281/:317/:329.
    - iso27701-2025-gap-analysis.md: add "see Table A.1/A.2/A.3" for tables at :124/:145/:154.
  - Commit: `docs: number + cross-reference tables/figures (Directive Part 2 A.9/10, Cl 28/29)`

- [x] **T04** Fix broken same-file anchor — `Standardization/writing-iso-compatible-documentation.md:408`
  - Owner: Docs Bot | Files: `Standardization/writing-iso-compatible-documentation.md`
  - Fix: `#61-modal-verbs--fixed-meanings` (double hyphen) → `#61-modal-verbs-fixed-meanings` (matches heading slug at :151).
  - Commit: `docs: fix broken anchor (Directive Part 2 A.16, Cl 10)`

- [x] **T05** Frontmatter normalization (house rule 5: `title:` + `sidebarTitle:`)
  - Owner: Docs Bot | Files: `compliance/frontend-conformity.md`, `compliance/rocky-controls-inventory.md`, `compliance/iso27701-2025-gap-analysis.md` (document_title: → title:+sidebarTitle:); ADRs `0097`–`0105` (add title:+sidebarTitle: to H1-only).
  - Fix: convert `document_title:` to `title:` + `sidebarTitle:`; add frontmatter to the 9 ADRs.
  - Commit: `docs: normalize frontmatter to title:+sidebarTitle: (house rule 5)`

- [x] **T06** F-03 exempt token + legend — `compliance/frontend-conformity.md`
  - Owner: Docs Bot | Files: `compliance/frontend-conformity.md`
  - Fix: change `N/A (exempt — ROCKY-COOK-001)` → `EXEMPT`; add a legend line defining `EXEMPT` as "control not applicable / exempt per cited paper, outside the SoA IMPLEMENTED/PARTIAL/PLANNED scheme."
  - Commit: `docs: F-03 EXEMPT token + legend (consistency with SoA vocab)`

- [x] **T07** Extend `scripts/check-standards.mjs` with 4 new checks (scoped to the existing posture/standards scan set)
  - Owner: Docs Bot + API Bot | Files: `scripts/check-standards.mjs`
  - Checks: (i) ban `shall/should/may` in Introduction + Scope regions; (ii) every `Table N`/`Figure N` caption cross-referenced from body text (`see Table/Figure N`); (iii) require `title:`+`sidebarTitle:` frontmatter; (iv) validate same-file `#anchor` links resolve to a heading slug.
  - Wire into `ci:checks` (already placed after `check:md-links`). Re-run → GREEN.
  - Commit: `ci: extend check-standards (4 Directive Part 2 Annex A checks)`

- [x] **T08** Reviewer pass + final guardian re-run
  - Owner: Reviewer | Checks: `pnpm check:adrs`, `pnpm check:md-links`, `pnpm check:standards` all GREEN; reviewer P0/P1 = 0.
  - Commit: (none — verification only)

## Deviations from the original plan (executed)

- **T02 supplier `shall`:** the scout mis-located it — `rocky-supplier-security-assessment.md`
  has NO `shall` in its Scope; its `shall`s (lines 56/68/69) are in the procedure *body* where
  they are correct. Only `rocky-non-pii-asset-inventory.md` Scope needed the fix.
- **T05 ADR frontmatter: DROPPED.** All 105 ADRs are H1 + ADR-0033 header-table (zero use YAML
  `title:`/`sidebarTitle:` frontmatter). Adding it to only ADRs 0097–0105 would be inconsistent
  churn; ADRs are governed by `check:adrs`, not house-rule-5 frontmatter. Scope A (focused) means
  only the 3 posture papers were normalized.
- **Decision #3 (Žižek opener):** KEPT per user approval — `iso27701-2025-gap-analysis.md:2`
  opener left as-is (deliberate house style).
