---
title: How to Write ISO-Compatible Documentation
sidebarTitle: Writing ISO Docs
---

# How to Write ISO-Compatible Documentation

A practical, reusable handbook for drafting standards-style documents that follow the
ISO/IEC Directives (editorial rules in **Part 2**, procedures in **Part 1**). It is
synthesized from the official ISO material in `docs/old/iso/` — in particular the
*How to write standards* guide, the *Rice model document* (ISO 17301-1:2023), and the
*Model Amendment* (ISO 17301-1:2023/Amd.1:2023).

> This is a working guide, not a substitute for the ISO/IEC Directives. When in doubt,
> the Directives and your committee's editorial rules win.

A copy-paste **fill-in skeleton** lives at `docs/iso-standard-template.md`.

---

## 1. What "ISO-compatible" means

An ISO-compatible document obeys a small set of structural and editorial conventions so
that any reader, in any language, can navigate it the same way. The conventions cover:

1. **A fixed front-to-back structure** (cover → foreword → introduction → numbered clauses → annexes → bibliography).
2. **Normative vs informative** labelling of every element (what *must* be followed vs what is *background/explanation*).
3. **Controlled language** — modal verbs with precise meaning, defined terms, no ambiguity.
4. **Deterministic referencing** — dated/undated normative references, a curated bibliography.
5. **Amendability** — the document is built so that future changes are expressible as targeted patches.

You do **not** need ISO's permission to write in this style. Internal specs, platform
standards, API contracts, and policy documents all benefit from the same discipline.

---

This discipline is strategic, not cosmetic: in **government tenders** the editorial rigour of the documents we present is itself evaluated, so ISO-grade consistency must be visibly present in every proposal and conformance statement we submit.

## 2. Choose the document type first

ISO publishes several deliverable types. Pick the one that matches your intent — the
structure differs slightly between them.

| Type | Use when |
|------|----------|
| **International Standard (IS)** | You have a settled, consensus-backed specification others must implement. |
| **Technical Specification (TS)** | The technology is immature or not yet consensus-stable; you want a trial document. |
| **Technical Report (TR)** | You are publishing data, surveys, or background — *not* requirements. |
| **Publicly Available Specification (PAS)** | Fast-track from an external body; not yet full consensus. |
| **Guide** | You are explaining *how* to do something, not prescribing requirements. |
| **Amendment (Amd.)** | You are changing an existing IS in place (see §9). |
| **Technical Corrigendum (Cor.)** | You are fixing a *technical* error in a published IS (typos/figures), not changing intent. |

The **Rice model** is an IS. The **second PDF** is an **Amd.** to that IS. Keep the type
visible in the header (e.g. `ISO 17301-1:2023/Amd.1:2023(E)`).

---

## 3. The mandatory skeleton

Every IS follows the same backbone. Build your document to this outline before writing a
word of content:

```
Cover page
Copyright statement            (auto-generated; do not author)
Table of contents              (auto-generated; do not author)
Foreword                       (informative — template + committee text)
Introduction                   (informative — OPTIONAL)
1.  Scope                      (normative — MANDATORY)
2.  Normative references       (normative — MANDATORY)
3.  Terms and definitions      (normative — MANDATORY)
4.  …                          (normative — your requirements)
N.  …                          (normative — your requirements)
Annex A  (normative)
Annex B  (informative)
…
Bibliography                   (informative)
ICS / price / page count       (colophon)
```

Key rules:

- **Clauses 1, 2, 3 are mandatory** and always in that order.
- **The Foreword and Introduction are never normative.** They explain *why*, never *what must be done*.
- **Annexes after the last clause; Bibliography after the last annex.**
- **A new annex must be cited from the body** (see §8).

---

## 4. Front matter: cover, foreword, introduction

### 4.1 Cover page

- **Title = at most three elements**, joined by em dashes (` — `):
  `Cereals and pulses — Specification and test methods — Part 1: Rice`
- Show the **reference number**, **edition**, and **date** prominently.
- Show the **ICS** (classification) code.

### 4.2 Foreword

The Foreword is a *fixed template* plus a short committee-specific paragraph:

- Boilerplate on ISO, IEC collaboration, the WTO/TBT note, patent caveat, voluntary nature.
- **One** paragraph naming the responsible committee (e.g. "Prepared by Technical Committee
  ISO/TC 34, Food products, Subcommittee SC 4, Cereals and pulses").
- A note on feedback routing (national member body).
- **Do not** put requirements here.

### 4.3 Introduction (optional, informative)

Use it for context that helps the reader but is not itself a requirement:

- Background (e.g. why moisture limits matter, what storage losses look like).
- Relationship to other standards.
- It may contain **figures and notes** but never **shall** statements.

---

## 5. The normative core: clauses 1–3

### 5.1 Scope (Clause 1)

Answer two questions in order:

1. **What this document specifies** (and the methods it defines).
2. **What it explicitly does *not* cover** ("This document does not apply to cooked rice products.").

Keep Scope to one short paragraph plus a "does not cover" sentence.

### 5.2 Normative references (Clause 2)

- List only documents **you cite normatively** (i.e. the reader must consult them to implement your spec).
- Use **dated references** when a specific edition matters: `ISO 8351-1:1994`.
- Use **undated references** only when any edition is acceptable: `ISO 712`.
- Be consistent: if you cite `ISO 8351-2:1994` in Clause 8, Clause 2 must say the same.

### 5.3 Terms and definitions (Clause 3)

- Define every special term **before** you use it.
- Number them `3.1`, `3.2`, … and give a **short definitional sentence**, not a essay.
- Mark terms sourced from other documents ("For the purposes of this document, …").
- Only define what you actually use; do not pad with dictionary entries.

---

## 6. Controlled language

This is the heart of ISO discipline. Enforce it editorially.

### 6.1 Modal verbs — fixed meanings

| Verb | Meaning |
|------|---------|
| **shall** | Requirement — mandatory. |
| **should** | Recommendation — advised but not mandatory. |
| **may** | Permission — allowed. |
| **can** | Statement of possibility / capability. |

Never use "must", "will", "ought", or "is required to" for requirements — use **shall**.

### 6.2 Notes

- A **NOTE** is **informative** by default (explanatory, never adds a requirement).
- Number sequential notes: `NOTE 1`, `NOTE 2`, … when more than one appears.
- A note that *does* carry a requirement must be explicitly marked **normative** and placed in the body, not as a NOTE.

### 6.3 Defined-term hygiene

- Use a term **exactly as defined**; do not reuse a common word with a special meaning without defining it in Clause 3.
- Prefer one term per concept. Synonyms in the same document are a defect.

### 6.4 Sentences

- One requirement per sentence where possible.
- Avoid "etc.", "and/or", vague quantifiers ("some", "several").
- Write for translation: simple subject–verb–object, minimal idiom.

---

## 7. Tables, figures, and annexes

### 7.1 Tables

- Numbered sequentially with a **title**: `Table 1 — Maximum permissible mass fraction of defects`.
- Put the **unit** in the column/row header, not in every cell.
- Use decimals with a comma per ISO typographic convention (`0,3`), or be consistent with your locale rules.
- A clause may *reference* a table ("see Table 1") but the table itself lives where it is first cited.

### 7.2 Figures

- Numbered with a **title and a key**: `Figure A.1 — Conical (Boerner-type) divider` with `Key: 1 funnel, 2 collection boxes`.
- Figures can appear in clauses **or** annexes.

### 7.3 Annexes

| Label | Type | Use |
|-------|------|-----|
| **Annex A** | normative | Procedures/requirements too detailed for the clause body. |
| **Annex B, C, D…** | informative | Examples, background methods, precision data. |

- Annex letters run **A, B, C, …** in order of first citation.
- Mark each: `(normative)` or `(informative)` right under the title.
- A normative annex **adds requirements**; an informative annex **never** does.
- **If you add an annex, cite it from the body** (e.g. "Annex E gives recommendations relating to storage and transport conditions.").

---

## 8. Bibliography

- List **only documents actually cited** in the standard (informatively or normatively).
- Number entries `[1]`, `[2]`, … and cite them inline as `[14]`.
- Distinguish standards from papers/books with proper formatting (see the Rice model's 15-entry bibliography for the exact style).
- Keep the bibliography **after the last annex, before the colophon**.

---

## 9. Amendments and corrigenda (maintaining the document)

Standards live for years. Changes are expressed as **targeted patches**, not rewrites.

### 9.1 Anatomy of an Amendment

An Amendment:

- **Has no** table of contents, introduction, or scope of its own.
- Names the **parent document** and the **focus** in its title.
- Targets elements by precise path: clause number, subclause, table, figure, note, or annex.
- Uses only four verbs: **replace**, **add**, **delete**, **designate**.

### 9.2 Worked examples (from the Rice model Amendment 1)

| Target | Operation | Detail |
|--------|-----------|--------|
| Introduction, ¶3 | **replace** | `"5 %"` → `"10 %"` and `"30 %"` → `"40 %"` |
| Clause 2 | **replace** | `ISO 8351-2` → `ISO 8351-2:1994` |
| 4.2.1 | **designate** + **add** | existing NOTE becomes NOTE 1; new NOTE 2 added |
| 4.2.2, Table 1 (Paddy × milled rice) | **replace** | `0,3` → `0,5` |
| Clause 8, ¶2 | **replace** | update bag-standard clause references to `Clause 3` |
| Clause 8 (end) | **add** | new paragraph citing Annex E |
| Clause 9, first sentence | **replace** | simplify marking requirement |
| A.2.1 | **replace** | add riffle-type divider (Figure A.2) |
| Figure A.1 | **replace** | split into two figures (conical + riffle) |
| New Annex E | **add** | storage/transport recommendations (informative) |

### 9.3 Rules for amendments

1. **Locate precisely.** Always give the clause/subclause/table/figure path.
2. **Show before → after.** Quote the exact old text and the exact new text.
3. **Keep cross-references consistent.** If you add Annex E, you must also patch the body to cite it.
4. **Preserve reference dates.** If Clause 8 cites `ISO 8351-2:1994`, Clause 2 must too.
5. **Never silently relax without recording it.** A tolerance change (0,3 → 0,5) is a substantive edit — make it explicit.

### 9.4 Corrigenda vs Amendments

- **Corrigendum**: fixes a technical error (wrong figure, broken formula) **without changing intent**.
- **Amendment**: changes the substance (new requirement, relaxed limit, added annex).

---

## 10. Pre-publication checklist

This checklist is an **attributed adaptation** of **ISO/IEC Directives, Part 2, Annex A (informative) — *Checklist for writers and editors of documents***, Table A.1. It is restructured and condensed for this repo and does **not** reproduce the copyrighted table. The authoritative exhaustive version is Table A.1 at the official Part 2 URL (<https://www.iso.org/sites/directives/current/part2/index.xhtml>). The [ISO/IEC software-engineering standards map](https://gist.github.com/michele-tn/3dbb072e663194d2c6392043daf327c4) (michele-tn) is a useful wider landscape for crosswalking controls.

Run every document against these before publishing. Each group cites the relevant Part 2 clause.

**Structure** (Clauses 6, 22)

- [ ] Top-level structure is logical; subdivision is consistent.
- [ ] No hanging paragraphs (an orphan line left after a list/table with no lead-in).

**Plain language** (Clauses 4, 5)

- [ ] Text is clear and concise; sentences are short (check punctuation).

**Title** (Clause 11)

- [ ] Runs general → particular and does not unintentionally narrow scope.
- [ ] Has ≤3 elements, em-dash joined; multi-part titles are aligned.

**Foreword** (Clause 12)

- [ ] If a revision: includes a revision statement (amendments, corrigenda) and a list of changes vs the previous edition.
- [ ] Any co-drafting organizations are acknowledged.
- [ ] No `shall`/`should`/`may` (the Foreword is informative).

**Introduction** (Clause 13)

- [ ] Purely informative; describes content / why the document is needed.
- [ ] No `shall` and no requirements of any kind.

**Scope** (Clause 14)

- [ ] States what the document does and where it applies; contains statements of fact only.

**Normative references** (Clause 15)

- [ ] Every listed reference is cited in the text such that its content forms a requirement.
- [ ] Dated/undated usage is consistent with body citations; prefer ISO/IEC sources; references are publicly available.

**Terms and definitions** (Clause 16)

- [ ] Every listed term is actually used; every term used in a requirement is defined here (or in a cited normative reference) before first use.
- [ ] Terms checked against the terminology databases (Electropedia, ISO/OBP) before inventing new ones.

**Figures & tables** (Clauses 28, 29)

- [ ] Each has a concise title and correct number; figures carry a key when needed; all are cross-referenced from the text.

**Graphical symbols** (28.6.2)

- [ ] Symbols are taken from the ISO/IEC symbol databases; new ones are registered, not improvised.

**Annexes** (Clause 20)

- [ ] Every annex is referenced from the body; its status (`normative`/`informative`) is stated in the body.

**Bibliography** (Clause 21)

- [ ] Formatted consistently; entries correct and complete.
- [ ] No bibliography entry is actually a normative reference (belongs in Clause 2) and none duplicates Clause 2.

**Drafting of provisions** (Clauses 4, 7)

- [ ] `shall`/`should`/`may` do not appear in Foreword, Scope, notes, or examples.
- [ ] `may`/`can` are used correctly; **`must` is absent** (external constraints are phrased as facts, not obligations).
- [ ] No requirement specifies compliance with national/legal regulations as a document requirement.

**Potential legal problems** (Clauses 30–32)

- [ ] Copyright, trademark, and patent considerations reviewed.

**Conformity assessment** (Clause 33)

- [ ] No unintended conformity-assessment commitments introduced.

**Cross-references** (Clause 10)

- [ ] All cross-references are correct and use stable clause/annex numbers (never "above/below").

**Common problems** (Annex B)

- [ ] Symbols for variable quantities are correct and consistently formatted; a comma on the line is used as the decimal sign.

---

## 11. Why this discipline pays off (even outside ISO)

- **Deterministic navigation.** Anyone can find "the requirement for X" at a stable clause number.
- **Unambiguous obligations.** `shall` vs `should` removes "is this mandatory?" debates.
- **Clean evolution.** Amendments become small, reviewable diffs instead of full rewrites.
- **Translation-ready.** Controlled language and defined terms survive localization.
- **Auditability.** Normative/informative labels make conformance claims checkable.

---

## 12. Adopting external standards verbatim

When a standard is included **without modification**, keep the **exact ISO/IEC nomenclature** — do not paraphrase or "translate" defined terms. Part 2 permits identical text to be reproduced when a standard is adopted as-is; it is *paraphrasing* that causes terminology drift and non-conformance. The correct posture in this repo:

1. **Preserve the exact terms.** If the source says *controller*, *process owner*, or *information security risk*, use those words — not local synonyms.
2. **Attribute the source.** Mark the fragment `(normative)` / `(informative)` and cite the **source standard and year** (e.g. *ISO/IEC 27701:2025, Annex A*).
3. **Wrap, don't renumber.** Keep the original clause/annex numbering and place the verbatim text inside the ISO-compatible skeleton (Foreword → Introduction → 1 Scope → 2 Normative references → 3 Terms → … → Bibliography) so it reads as a coherent document, not a loose extract.

This is exactly the strategy behind `iso-27701-2025.md` and `iso-27001-2022.md`: their clause bodies are the verbatim control text from the source standards, adopted without change.

## 13. Copyright and compliance posture

Standards publishers assert copyright on the *text* of their standards. This repo's stance is deliberately clean and fully legal:

- **We may claim conformance.** Stating that our system is *GDPR-compliant* or *designed to ISO/IEC 27001 / 27701* is a factual claim about our own product, not a reproduction of the standard.
- **We may cite standard identifiers.** Numbers and titles such as `ISO/IEC 27001:2022` are facts, not copyrightable expression, and are referenced freely throughout these docs.
- **We do not copy the protected text.** The body of any proprietary standard (and of ISO/IEC Directives, Part 2) is never pasted into the repo. We cite the official/source URL and link informative secondary material (e.g. the standards-map gist) instead.
- **Verbatim adoption is attributed, not concealed.** Where external text is included without change (§12), it is marked and sourced — and only where the source permits identical reproduction.

One necessary distinction: **ISO/IEC standards are copyrighted (do not copy), whereas legislation such as Regulation (EU) 2016/679 (GDPR) is public-domain law and may be reproduced** — which is exactly why `gdrp.md` includes the verbatim regulation text while the ISO wrappers contain only our own skeleton around attributed, source-permitted excerpts.

This keeps the documentation perfectly legal while still letting the ISO discipline be *visible* in every deliverable.

## 14. Claims, substantiation, and verifiability

The ISO discipline applies to our *own* assertions, not only to transcribed standards. Every material claim in a tender-facing or marketing document must be:

- **Verifiable** — a third party could independently check it.
- **Substantiated** — backed by a real design fact, control, or evidence (in this repo, by the implementation it describes).
- **Free of absolute superlatives** — no "unbreakable", "impossible", "100%", or "provable in court of law".

State the *mechanism*, not the *superlative*. Conformance claims use precise qualifiers — *aligned to* / *designed to* / *certified to* — and never imply a certification we do not hold.

Worked examples (claim → defensible form):

| Casual claim | Defensible, verifiable form |
| --- | --- |
| PIMS with the same features as ISO/IEC 27701:2025 | Implements the privacy controls specified in Annex A of ISO/IEC 27701:2025 |
| Better encryption than the standard | Zero-trust architecture: cryptographic keys held in an HSM/vault within EU jurisdiction, never on the application host |
| Audit logs are unbreakable | Audit logs are tamper-evident via signed hash-chaining, enabling independent cryptographic verification of integrity |
| Mathematically provable in court of law | *(omit)* — or: integrity is cryptographically verifiable by a third party |

The posture is honest by construction: claims are written only for capabilities that are actually implemented, so the brag and the build stay aligned.

## Related guides

- [Writing Technical Documents (RFC, ADR, Design Doc)](/how-to/writing-technical-documents) — the companion standard for *internal* engineering documents (RFC / ADR / Design Doc), written in the same controlled-language register.
- [Internal Standard Style](/Standardization/internal-standard-style) — the house style that both guides follow.

## Conformance to ISO/IEC Directives, Part 2

This guide conforms to the editorial rules of **ISO/IEC Directives, Part 2** (9th edition, 2021) — the authoritative rulebook for the structure and drafting of ISO and IEC documents. In particular, the fixed verbal forms in [§6.1](#61-modal-verbs-fixed-meanings) reproduce **Part 2, Clause 7** exactly: requirement = `shall`, recommendation = `should`, permission = `may`, possibility/capability = `can`. Part 2 also confirms that **negative permissions are no longer permitted**, which is why `must` is excluded. The full official text is published at <https://www.iso.org/sites/directives/current/part2/index.xhtml>.

## Sources

- **ISO/IEC Directives, Part 2** (9th ed., 2021) — *Principles and rules for the structure and drafting of ISO and IEC documents.* The authoritative rulebook this guide conforms to. Official text: <https://www.iso.org/sites/directives/current/part2/index.xhtml>.
- [Complete ISO/IEC Standards Map for Software Engineering](https://gist.github.com/michele-tn/3dbb072e663194d2c6392043daf327c4) (michele-tn, GitHub Gist) — informative landscape of ISO/IEC software-engineering standards (27000/27001/27701, 12207/15288, 25010, 42010, 29119, 42001, …). Useful for crosswalking our controls to the wider standards ecosystem; it explains, it does not reproduce, copyrighted text.

This guide is derived from the materials in `docs/old/iso/`:

- `how-to-write-standards.pdf` and `how-to-write-standards (1).pdf` — the ISO *How to write standards* editorial guide.
- `model_document-rice_model.pdf` — the Rice model document (ISO 17301-1:2023), the canonical IS structure example.
- `rice_model_amendment.pdf` — the Model Amendment (ISO 17301-1:2023/Amd.1:2023), the canonical amendment structure example.
- Text extractions: `docs/old/iso/_extracted/*.txt`
