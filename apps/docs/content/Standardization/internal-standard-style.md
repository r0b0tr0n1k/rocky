---
title: Internal Standard Style
sidebarTitle: Internal Standard Style
---

# Internal Standard Style

This page documents the house style that standards-like documents in this repo follow, so new
docs converge instead of drifting. It is **not** Diátaxis — how-to / runbook / reference /
tutorial / explanation docs and ADRs follow ADR-0033 and ADR-0052 instead.

## Why this style

This is not documentation cosmetics. Documents we present in **government tenders and public-sector bids** are read by evaluators who judge rigour from the page itself. A consistent, ISO-grade editorial discipline — fixed verbal forms, normative/informative labelling, numbered clauses, a bibliography — is *legible evidence* of that rigour. When our proposals, conformance statements, and standards transcriptions all read to the same high bar, the discipline becomes part of the offer. The authority for that bar is **ISO/IEC Directives, Part 2** (see the link above); paywalled ISO texts are read and followed, but never committed to this repo — we cite free or official sources (the Part 2 URL, or legitimately published national adoptions such as GOST R ISO/IEC) instead.

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
- [ISO/IEC Directives, Part 2](https://www.iso.org/sites/directives/current/part2/index.xhtml) — the authoritative editorial rulebook (9th ed., 2021); this house style conforms to it (verbal forms, normative/informative labelling).
