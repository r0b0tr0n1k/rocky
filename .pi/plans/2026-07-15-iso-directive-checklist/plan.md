# ISO/IEC Directive Part 2, Annex A (Table A.1) — Editorial Compliance Remediation

> Curated, judgment-based pass over the **authored** standards layer. Fix the
> high-value, clearly-fixable non-compliances; do not churn docs that are fine;
> do **not** reword verbatim ISO/IEC standard text or national law (copyright).

## Scope

- **In:** `apps/docs/content/{Standardization,compliance,ADR,explanation}` authored docs.
- **Out (DO NOT EDIT):** `a-1..a-8`, `b-1..b-3`, `table-b-1`, `iso-27001-2022*.md`,
  `iso27701_2025.md`, `MACEDONIAN_LPDP*.md`, `Standardization/gdrp.md` (verbatim GDPR),
  and the quoted-law bodies of the `LEGAL_LAW` `rocky-*.md`. Only their structural
  shell is touchable.
- **Already covered by `scripts/check-standards.mjs` (GREEN, do not re-litigate):**
  ADR back-link, SoA single-status, crosswalk `VALIDATED_CROSSWALK`, no `must`.

## Decisions (recommended synthesis)

1. **Scope (A) — focused top-fixes.** No broad sweep; surgical edits only.
2. **Extend the guardian** with 4 new checks (mechanical regression prevention,
   consistent with prior work) — see T07.
3. **Žižek-mode opener** (`iso27701-2025-gap-analysis.md:2`): **KEEP** by default
   (deliberate house style per AGENTS.md) — flagged for user confirmation at review;
   not stripped unless the user says so.
4. **F-03 status token** (`frontend-conformity.md`): document the exempt state
   **distinctly** as `EXEMPT` + a legend entry, kept out of the SoA
   `IMPLEMENTED/PARTIAL/PLANNED` vocabulary.

## The 4 hard non-compliances (authored, fixable)

- H1 `iso-software-engineering-standards-map.md:17` — `shall` in **Introduction**.
- H2 `rocky-supplier-security-assessment.md:28` — `shall` in **Scope** (`## 1. Purpose`).
- H3 `rocky-non-pii-asset-inventory.md:40-41` — `shall` ×2 in **Scope**.
- H4 Table/figure cross-ref gaps in 4 docs (0 existing `see Table/Figure` refs):
  standards-map Figure 1 + "Standards map" table; `frontend-conformity.md` both
  tables; `isms-policy.md` Tables A.1–A.3; `iso27701-2025-gap-analysis.md` Tables A.1–A.3.

## Additional fixes

- B1 Broken anchor `writing-iso-compatible-documentation.md:408`
  `#61-modal-verbs--fixed-meanings` → `#61-modal-verbs-fixed-meanings`.
- B2 Frontmatter drift: `frontend-conformity.md`, `rocky-controls-inventory.md`,
  `iso27701-2025-gap-analysis.md` use `document_title:` → normalize to
  `title:` + `sidebarTitle:` (house rule 5). Add `title:`+`sidebarTitle:` to
  ADRs 0097–0105 (H1-only) for consistency.

## Sequence

```
T01..T06  manual edits (H1-H4, B1, B2, F-03 token)  -> commit(s)
T07       extend check-standards.mjs (4 checks) + wire ci:checks -> commit
T08       re-run guardians (adrs/md-links/standards) + reviewer pass
```

Manual fixes land **before** the guardian extension so the extended guardian
passes on first run (no regressions introduced by the new checks).

## DoD

- All 4 hard items + B1 + B2 + F-03 token fixed; `check:standards` GREEN with the
  4 new checks active; `check:adrs` / `check:md-links` GREEN; reviewer P0/P1=0.
