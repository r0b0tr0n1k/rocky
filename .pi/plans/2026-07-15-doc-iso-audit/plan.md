# Plan: Rewrite Nextra Docs to Follow ISO-Compatible Standardization

**Date:** 2026-07-15 · **Author:** main session (synthesized from scout audit)
**Discipline source:** `docs/iso-writing-guide.md` + `docs/iso-standard-template.md`
**Scope:** Propose which docs under `apps/docs/content/` should be rewritten to follow the
ISO/IEC editorial discipline. Execution is **not** part of this proposal — this is the analysis + prioritized list.

---

## TL;DR

- **260 files** audited. ~21 are *real* ISO/regulation text that currently **lacks the ISO skeleton** → **Tier 1 (rewrite)**.
- ~5 project docs are already ISO-ish or standards-like → **Tier 2 (formalize/adopt)**.
- 2 duplication/drift hazards must be resolved **before** any rewrite → **Tier 0 (hygiene)**.
- ~230 files (all 98 ADRs except two, how-to/runbook/reference/explanation/tutorial, doctrine/audit/research) → **Leave as-is** (Diátaxis, not ISO).

The single biggest win: the `a-*`/`b-*`/`iso*.md`/`gdrp.md` files are verbatim normative text but have **no** Foreword / Scope(1) / Normative references(2) / Terms(3) / Bibliography / TOC / normative-vs-informative labelling. They need to be **assembled under the ISO wrapper** from `docs/iso-standard-template.md`.

---

## Tier 0 — Hygiene (do first; blocks clean rewrites)

These are not rewrites but prerequisites. Resolve before Tier 1 so you don't standardize duplicated/drifting content.

| #   | Issue                                                                                                                                         | Action                                                                                    | Evidence                         |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------- |
| H1  | `compliance/MACEDONIAN_LPDP_*.md` (×6) is **byte-identical** to `Standardization/MACEDONIAN_LPDP_*.md` (×6)                                   | Pick one home (recommend `Standardization/`), delete the other, replace with a cross-link | `diff -q` → IDENTICAL            |
| H2  | `Standardization/ISO_documents/**` (18 records) **diverges** from `Standardization/documents/**` (same paths, different bytes)                | Reconcile to one source of truth; delete the stale tree                                   | SEC-002 3185 B vs 2130 B         |
| H3  | Case-variant filename confusion: `ISO27001_2022.md` (165-line 2013→2022 **mapping**) vs `iso27001_2022.md` (1991-line **full transcription**) | Rename to disambiguate: `iso27001-2022-mapping.md` vs `iso27001-2022-controls.md`         | different files, easy to confuse |
| H4  | `ISO27701_2025.md` **does not exist** (only lowercase `iso27701_2025.md`)                                                                     | Correct any references; remove the phantom uppercase name                                 | scout finding §9.5               |

---

## Tier 1 — High priority: real ISO / regulation text missing the skeleton

All of these are **verbatim normative text** (ISO 27701:2025, ISO 27001:2022, GDPR Reg (EU) 2016/679). They violate the ISO guide by lacking the mandatory structure.

**1A. Control-table fragments (the Annex A/B mirror of the standards)** — `Standardization/`

| File           | What it is                                                     | Missing (per guide §3–§8)                                                              |
| -------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `a-1.md`       | ISO 27701 A.1 (PII controllers) — `shall` ×31                  | Foreword/Scope(1)/NormRef(2)/Terms(3)/Bibliography/TOC; normative-vs-informative label |
| `a-2.md`       | ISO 27701 A.2 (PII processors) — `shall` ×7                    | same + strip project-specific "Mapped SCF controls" blocks                             |
| `a-3.md`       | ISO 27701 A.3 (both) — `shall` ×27                             | same                                                                                   |
| `a-5.md`       | ISO 27001 A.5 (organizational) — `shall` ×74                   | same; **remove emoji decoration** (`🔑📌📋🇪🇺`)                                             |
| `a-6.md`       | ISO 27001 A.6 (people) — `shall` ×16                           | same; **fix `must`→`shall`** in ✅ Compliance Checklist; remove emoji                   |
| `a-7.md`       | ISO 27001 A.7 (physical) — `shall` ×28                         | same; remove emoji                                                                     |
| `a-8.md`       | ISO 27001 A.8 (technological) — `shall` ×68                    | same; remove emoji                                                                     |
| `b-1.md`       | ISO 27701 B (guidance) — informative, 0 `shall` (tone correct) | wrap as **Annex B (informative)**; add Foreword/Scope/NormRef/Terms/Bib                |
| `b-2.md`       | ISO 27701 B (guidance 2)                                       | same                                                                                   |
| `b-3.md`       | ISO 27701 B (guidance 3)                                       | same                                                                                   |
| `table-b-1.md` | ISO 27701 Table B.1 (processor guidance)                       | same                                                                                   |

**Recommendation:** assemble the 11 fragments under **one ISO wrapper document** (or a small set) that provides Cover → Foreword → Introduction → **1 Scope** → **2 Normative references** → **3 Terms and definitions** → Annex A (normative, the `a-*` controls) → Annex B (informative, the `b-*` guidance) → Bibliography. Use `docs/iso-standard-template.md` as the scaffold. Keep clause numbers (`A.5.1`, `A.8.1`, `B.1.2.3`) — they are already stable.

**Controlled-language fixes required during Tier 1:**

- `a-6.md`: `"Security measures must be appropriate to risks"` → `shall` (guide §6.1).
- `a-5/a-6/a-7/a-8.md`: remove decorative emoji (`🔑 📌 📋 🇪🇺 ✅`) — non-ISO styling (guide §6.4, §7).

**1B. Full transcriptions in data form** — `Standardization/`

| File               | Issue                                                                                      | Action                                                                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `iso27001_2022.md` | `# iso27001_2022.json` — machine-readable dump of all controls (`shall` inside `summary:`) | Choose **one canonical form** (prose `a-*`/`b-*` OR data). Recommend: keep data as the machine source, generate the prose wrapper from it. Do not maintain both by hand. |
| `iso27701_2025.md` | `# iso27701_2025.json` — same (`shall` ×131)                                               | same                                                                                                                                                                     |

**1C. GDPR regulation** — `Standardization/gdrp.md`

| File      | Issue                                                                                                 | Action                                                                                                                                                                                                |
| --------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gdrp.md` | Verbatim GDPR Reg (EU) 2016/679; **no H1 / no frontmatter**; 348 KB; Article numbering already stable | Add a title + ISO-style nav wrapper (Foreword/Scope/NormRef/Terms/Bibliography); its Recitals+Articles structure already qualifies as deterministic. Keep as a distinct "regulation" type (guide §2). |

---

## Tier 2 — Medium: adopt / formalize the ISO-ish house style

These are **not** verbatim standards but already follow an ISO-ish pattern (numbered clauses + Scope). Formalize them as the repo's internal "standard" style rather than full rewrites.

| File / set                                                                | Why it's a candidate                                                                                               | Action                                                                                                                                                                                |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Standardization/documents/**` (GOV/SEC/HR/TEL/DOC policies & procedures) | Already use multilingual frontmatter + `## 1. Purpose` / `## 2. Scope` + `shall` — the de-facto internal standard  | Adopt as the canonical **internal** style: add `## 3. Terms and definitions`, `## 4. Normative references`, normative/informative labels, Bibliography where missing (guide §5.3, §8) |
| `compliance/isms-policy.md`                                               | Largest ISMS/PIMS policy (340 lines); most standard-like                                                           | Give it the `documents/**` house skeleton (Purpose/Scope/Terms/NormRef)                                                                                                               |
| `router-design.md`                                                        | "Canonical blueprint for tRPC routers — the 'what right looks like'" — reads as an internal interface **standard** | Add Scope(1)/NormRef(2)/Terms(3); label normative vs informative sections                                                                                                             |
| `router-patterns.md`                                                      | Pattern/anti-pattern catalogue (internal spec)                                                                     | same treatment                                                                                                                                                                        |
| `ADR/0085-traceability-rules-engine.md`                                   | Models EU Reg 2021/520 Articles as a **toggleable rule registry**; uses `shall`                                    | Optionally **also publish** as an ISO-style rule document under `Standardization/` (keep the ADR as the decision record)                                                              |
| `ADR/0087-espr-art12-operator-facility-identifier-scheme.md`              | Directly cites ISO/IEC 15459 / GS1 GLN (identifier scheme = standards-like)                                        | same: optionally publish an ISO-style identifier-scheme doc                                                                                                                           |

---

## Tier 3 — Leave as-is (Low)

Explicitly **not** ISO targets (Diátaxis genres, not standards):

- All 98 ADRs except ADR-0085 / ADR-0087 (they use Context/Decision/Consequences per ADR-0033).
- All `how-to/`, `runbooks/`, `reference/`, `explanation/`, `tutorials/` (Diátaxis).
- `result-monad-and-error-sovereignty.md`, `diamond-seal-audit.md`, `offline-architecture.md`, `TESTING_DOCTRINE.md`, `regulatory-*.md`, `workorder.md`, `animal-id-and-espr-dpp.mdx`, `get-started.mdx`, `index.mdx`.
- `Standardization/index.md` (landing), `Standardization/writing-iso-compatible-documentation.md` (this guide itself — teaches ISO, don't rewrite as a standard).
- `compliance/rocky-*` operating artifacts (DPA/RoPA/SoA/TOMs/notices) — Rocky-specific management-system docs; keep as compliance genre, cross-link to `Standardization/` instead of rewriting.

---

## Recommended sequencing

1. **Tier 0** (H1–H4) — de-duplicate & rename. ~1 pass, no content rewrite.
2. **Tier 1A** — build the ISO wrapper doc for the 11 `a-*`/`b-*` fragments + controlled-language fixes (`must`→`shall`, strip emoji). Highest reader value.
3. **Tier 1B** — decide canonical form for `iso27001_2022.md` / `iso27701_2025.md` (data vs prose); generate, don't hand-maintain both.
4. **Tier 1C** — add title + nav wrapper to `gdrp.md`.
5. **Tier 2** — formalize `documents/**` as the internal house style; apply to `isms-policy.md`, `router-design.md`, `router-patterns.md`; optionally publish ADR-0085/0087 as ISO-style rule docs.

---

## Open questions for the user (before execution)

1. **Canonical form for the standards**: one assembled wrapper doc per standard (27701, 27001) vs. per-file wrappers? (I recommend assembled wrappers.)
2. **Data vs prose**: keep `iso*.md` JSON dumps as the source of truth and generate prose, or retire the dumps?
3. **GDPR**: wrap in-place (add title + nav) vs. leave as a regulation-type doc with minimal wrapper?
4. **Duplication homes**: confirm `Standardization/` is the single home for the `MACEDONIAN_LPDP_*` set and the `documents/` tree (delete `ISO_documents/`).
