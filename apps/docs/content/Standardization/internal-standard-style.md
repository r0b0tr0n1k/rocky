---
title: Internal Standard Style
sidebarTitle: Internal Standard Style
---

# Internal Standard Style

This page documents the house style that standards-like documents in this repo follow, so new
docs converge instead of drifting. It is **not** Diátaxis — how-to / runbook / reference /
tutorial / explanation docs and ADRs follow ADR-0033 and ADR-0052 instead.

## When to use this style

Use it for documents that read as a *standard*, *policy*, or *interface blueprint*:

- Transcriptions of external standards → `Standardization/` (e.g. `iso-27701-2025`, `iso-27001-2022`).
- Internal control / policy records → `Standardization/documents/**` (the convergence target; see `GOV-001_Supplier Security Policy.md`).
- Project blueprints that read as interface standards → `router-design.md`, `router-patterns.md`, `compliance/isms-policy.md`.

## House rules

1. **Numbered clauses** for the skeleton: `## 1. Purpose` / `## 2. Scope` / `## 3. Terms and definitions` / `## 4. Normative references`. Regulation-style docs (GDPR, `isms-policy`) may use `Recitals` / `Article N` numbering instead.
2. **Controlled language**: `shall` (requirement), `should` (recommendation), `may` / `can` (permission / possibility). Never `must` for obligations.
3. **Annexes** are tagged `(normative)` or `(informative)`.
4. **Bibliography** lists the referenced standards with titles.
5. **Frontmatter** (`title:` + `sidebarTitle:`) on every page.

## Canonical examples

- `Standardization/iso-27701-2025.md` — full ISO/IEC wrapper skeleton.
- `Standardization/documents/governance/policies/GOV-001_Supplier Security Policy.md` — internal policy house style.
- `compliance/isms-policy.md` — regulation-style (Recitals / Articles) house policy.
- `how-to/writing-technical-documents.mdx` — applying the house style to internal engineering docs (RFC / ADR / Design Doc).
