# Context for: ISO-compatibility audit of the Nextra docs corpus

**Date:** 2026-07-15 · **Auditor:** Scout (read-only recon)
**Scope:** Every documentation file under `apps/docs/content/` (recursively) — 260 files total.
**Purpose:** Give a planner the data to decide which docs need rewriting to follow ISO/IEC editorial discipline (per `docs/iso-writing-guide.md` + `docs/iso-standard-template.md`).

---

## 0. How to read this report

- **Genre** is one of: `ADR`, `ISO-standard-transcription`, `how-to`, `explanation`, `runbook`, `reference`, `tutorial`, `compliance-guide`, `misc`.
- **Real-ISO** = "is this verbatim ISO/IEC (or other binding normative) standard/regulation text?" (Yes for ISO 27701/27001 transcriptions + GDPR; No for everything hand-authored).
- **ISO-fit verdict**: `High` = claims to *be* or *is* normative standard/regulation text (benefits most from the ISO skeleton); `Medium` = project doc that already follows an ISO-ish house template, or is arguably standards-like (rules registry, identifier scheme, interface blueprints, ISMS policy); `Low` = Diátaxis ADR/how-to/runbook/tutorial/reference/research — not an ISO target.
- Diátaxis genres (ADR, how-to, explanation, runbook, reference, tutorial) are **explicitly NOT judged harshly** per task instructions; they get a shared genre trait-profile and a blanket Low verdict, with a few flagged exceptions.
- **Evidence snippets are quoted verbatim** so verdicts are trustable.

## 1. Reference material the planner will use

- `docs/iso-writing-guide.md` — the editorial discipline (clauses 1/2/3 mandatory & ordered; Foreword/Intro informative; `shall`/`should`/`may`/`can`; normative vs informative annexes; bibliography; amendment mechanics).
- `docs/iso-standard-template.md` — fill-in skeleton (`# [Subject] — [Aspect] — Part N`, Foreword/Introduction/1 Scope/2 Normative references/3 Terms and definitions/…/Annex A (normative)/Bibliography).
- A house implementation of that discipline already exists inside the corpus: `Standardization/documents/**` (GOV/SEC/HR/TEL/DOC series) with multilingual frontmatter + numbered clauses (`## 1. Purpose`, `## 2. Scope`) + `shall`. That is the de-facto internal standard to converge on.

## 2. Corpus size & shape (260 files)

- ADR: 98 (ADR-0001…0096 + ADR-TEMPLATE + INDEX)
- Standardization: 94 (root transcriptions + `documents/` tree + `ISO_documents/` tree)
- compliance: 30
- how-to: 12 · runbooks: 7 · reference: 5 · explanation: 1 · tutorials: 1
- root-loose `.md`/`.mdx`: ~12 (offline-architecture, diamond-seal-audit, result-monad-*, router-design, router-patterns, TESTING_DOCTRINE, regulatory-*, workorder, animal-id-and-espr-dpp, get-started, index)

## 3. Diátaxis genre structural profiles (shared — applies to all bulk files)

These genres follow ADR-0033 / ADR-0052 (Diátaxis), NOT ISO. Shared trait profile:

| Genre             | Numbered clauses (1./2./3.)                                              | Scope clause         | Normative refs | Terms & defs | Normative/informative label | Modal verbs (shall…)         | Stable clause #     | Annexes | Bibliography | TOC/anchors              |
| ----------------- | ------------------------------------------------------------------------ | -------------------- | -------------- | ------------ | --------------------------- | ---------------------------- | ------------------- | ------- | ------------ | ------------------------ |
| ADR (n=98)        | No (uses `## Context/Decision/Consequences/Implementation/Verification`) | 1/98 (ADR-0031 only) | 0              | 0            | No                          | 1/98 uses `shall` (ADR-0085) | No (ADR-NNNN slugs) | 0       | 0            | Partial (internal links) |
| how-to (n=12)     | No                                                                       | No                   | No             | No           | No                          | Rare                         | No                  | No      | No           | Yes (Nextra)             |
| runbook (n=7)     | No                                                                       | No                   | No             | No           | No                          | No                           | No                  | No      | No           | Yes                      |
| reference (n=5)   | No (catalog tables)                                                      | No                   | No             | No           | No                          | No                           | n/a (catalog)       | No      | No           | Yes                      |
| explanation (n=1) | No                                                                       | No                   | No             | No           | No                          | No                           | No                  | No      | No           | Yes                      |
| tutorial (n=1)    | No                                                                       | No                   | No             | No           | No                          | No                           | No                  | No      | No           | Yes                      |

ADR template proof (`ADR/ADR-TEMPLATE.md`): `## Context` → `## Decision` → `## Consequences` (`### Positive/Negative/Neutral`) → `## Implementation` → `## Verification` → `## Anti-Patterns` → `## Related ADRs`. No Scope/NormRef/Terms/Annex/Bibliography.

**Bulk verdict:** All Diátaxis files = **Low** ISO-fit. They are decisions/guides, deliberately not standards.

---

## 4. DETAILED AUDIT — Standardization/ root transcriptions (genre: ISO-standard-transcription)

These are the files that *claim* to be ISO text. All are Real-ISO = Yes (derivative of ISO 27701:2025 / ISO 27001:2022 / GDPR), **except** `ISO27001_2022.md` (a 2013→2022 mapping table, project doc) and `gdrp.md` (real GDPR = EU regulation, not ISO/IEC).

### 4.1 Control-table fragments (Annex A / Annex B of the standards)

| File                           | Title (verbatim H1)                                                                                   | Real-ISO        | Frontmatter | Traits (evidence)                                                                                                                                                                                                                                                                               | Lines/Bytes  | ISO-fit  |
| ------------------------------ | ----------------------------------------------------------------------------------------------------- | --------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | -------- |
| `Standardization/a-1.md`       | `ISO 27701:2025 - Table A.1 - Control objectives and controls for PII controllers`                    | Yes (27701 A.1) | No          | Numbered annex subclauses `## A.1.2.2`; Scope=No; NormRef=No; Terms=No; normative/informative label=No; modal `shall` (31×, e.g. *"The organization shall identify and document the specific purposes…"*); stable #=Yes (A.x.y); Annex=No (it IS annex content); Bib=No; TOC=No (just headings) | 438 / 37742  | **High** |
| `Standardization/a-2.md`       | `ISO 27701:2025 - Table A.2 - Control objectives and controls for PII processors`                     | Yes (27701 A.2) | No          | `## A.2.2.2`…; `shall` 7×; GDPR Mapping + "Mapped SCF controls" sections (project-specific); no Scope/NormRef/Terms/Annex/Bib                                                                                                                                                                   | 110 / 7006   | **High** |
| `Standardization/a-3.md`       | `ISO 27701:2025 - Table A.3 - Control objectives and controls for PII controllers and PII processors` | Yes (27701 A.3) | No          | `## A.3.5`…; `shall` 27×; Implementation Guidance + GDPR Mapping blocks                                                                                                                                                                                                                         | 411 / 29527  | **High** |
| `Standardization/a-5.md`       | `ISO 27001 - A.5 - Organizational Controls`                                                           | Yes (27001 A.5) | No          | `## A.5.1`…; `shall` 74×; adds emoji `🔑 Keywords`/`📌 Key Points`/`📋 Legacy Control Mappings`/`🇪🇺 GDPR Mapping` (decorative, non-ISO)                                                                                                                                                             | 1064 / 32296 | **High** |
| `Standardization/a-6.md`       | `ISO 27001 - A.6 - People Controls`                                                                   | Yes (27001 A.6) | No          | `## A.6.1`…; `shall` 16×; emoji blocks + `✅ Compliance Checklist` using `must` (*"Security measures must be appropriate to risks"*) — **violates** ISO controlled-language rule (use `shall`, not `must`)                                                                                       | 234 / 8150   | **High** |
| `Standardization/a-7.md`       | `ISO 27001 - A.7 - Physical Controls`                                                                 | Yes (27001 A.7) | No          | `## A.7.1`…; `shall` 28×; emoji blocks                                                                                                                                                                                                                                                          | 343 / 9315   | **High** |
| `Standardization/a-8.md`       | `ISO 27001 - A.8 - Technological Controls`                                                            | Yes (27001 A.8) | No          | `## A.8.1`…; `shall` 68×; emoji blocks                                                                                                                                                                                                                                                          | 906 / 24035  | **High** |
| `Standardization/b-1.md`       | `ISO 27701:2025 - Implementation Guidance (B Sections) - Annex 1`                                     | Yes (27701 B)   | No          | `## B.1.2.3`…; Scope=No; `shall`=0 (guidance uses `should`/`can` — correct informative tone); Annex heading present; no NormRef/Terms/Bib                                                                                                                                                       | 127 / 22846  | **High** |
| `Standardization/b-2.md`       | `ISO 27701:2025 - Implementation Guidance (B Sections) - Annex 2`                                     | Yes (27701 B)   | No          | `## B.x` informative guidance; no `shall`                                                                                                                                                                                                                                                       | 27 / 2827    | **High** |
| `Standardization/b-3.md`       | `ISO 27701:2025 - Implementation Guidance (B Sections) - Annex 3`                                     | Yes (27701 B)   | No          | `## B.3.5`…; no `shall` (informative)                                                                                                                                                                                                                                                           | 102 / 15368  | **High** |
| `Standardization/table-b-1.md` | `ISO 27701:2025 - Table B.1 - Implementation Guidance for PII Processors`                             | Yes (27701 B.1) | No          | `## B.1.2.3`…; no `shall`; pure guidance table                                                                                                                                                                                                                                                  | 285 / 23773  | **High** |

**Common gaps across all control fragments:** No cover/Foreword/Introduction, no Clause 1 Scope / Clause 2 Normative references / Clause 3 Terms and definitions, no Bibliography, no TOC, no normative-vs-informative labelling of the file itself (though B sections are correctly informative in tone). They are *fragments* of the standard, not wrappers. Verdict: **High** (they ARE standard text and would benefit from being assembled under the ISO skeleton with a Scope/NormRef/Terms/Bibliography wrapper and an index).

### 4.2 Structured-data transcriptions

| File                               | Title                                                                      | Real-ISO         | Frontmatter | Traits                                                                                                                                                                                                        | Lines/Bytes   | ISO-fit                                                                |
| ---------------------------------- | -------------------------------------------------------------------------- | ---------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------- |
| `Standardization/iso27001_2022.md` | `# iso27001_2022.json` (YAML list of `domains→controls→ref/title/summary`) | Yes (27001:2022) | No          | Not prose — a machine-readable dump. `shall` appears inside `summary:` fields (*"Information security policy … shall be defined…"*). No clauses/Scope/NormRef/Terms/Annex/Bib. Navigable only by `ref:` keys. | 1991 / 86040  | **High** (real standard content, but format is data, not ISO document) |
| `Standardization/iso27701_2025.md` | `# iso27701_2025.json` (same structure)                                    | Yes (27701:2025) | No          | Same as above; `shall` 131× in summaries.                                                                                                                                                                     | 3445 / 213291 | **High**                                                               |

> Note: these two are the *only* full-control transcriptions; the `a-*.md`/`b-*.md` files are the human-readable mirror. Planner should decide one canonical form (prose vs data) — currently duplicated as both.

### 4.3 Mapping / project docs masquerading as standard

| File                                                      | Title                                                                         | Real-ISO                               | Frontmatter | Traits                                                                                                                                                                                             | Lines/Bytes            | ISO-fit                                                                                                          |
| --------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `Standardization/ISO27001_2022.md`                        | `ISO 27001: 2022 Annex A Controls Mapping`                                    | **No** (project mapping 2013→2022)     | No          | A big comparison **table** (`                                                                                                                                                                      | ISO 27001:2013 Control | …                                                                                                                | ISO 27001:2022 Control | … | `). No Scope/NormRef/Terms/Annex/Bib. | 165 / 30690 | **Medium** (project artifact, not standard text) |
| `Standardization/gdrp.md`                                 | *first line:* `General Data Protection Regulation (GDPR) - full text` (no H1) | **Yes but EU regulation, not ISO/IEC** | No          | Verbatim REGULATION (EU) 2016/679. Has its own Recitals + Articles structure (stable numbering already). `shall`/obligations throughout. No ISO Foreword/Scope/NormRef/Terms/Bibliography wrapper. | 1823 / 348403          | **High** (normative legal text; benefits from stable-nav assertion, but its Article numbering already qualifies) |
| `Standardization/GDPR_ISO27001_Implementation_Roadmap.md` | `GDPR and ISO 27001 Compliance Implementation Roadmap`                        | No (project roadmap)                   | No          | Has `Version/Date/Owner/Classification` header block; prose roadmap. No ISO clauses.                                                                                                               | 698 / 34760            | **Low/Medium**                                                                                                   |
| `Standardization/index.md`                                | `ISO/IEC 27701:2025 - Privacy Information Management System`                  | No (landing/index)                     | No          | 6-line index linking to a-1/a-2/a-3/table-b-1.                                                                                                                                                     | 6 / 943                | **Low**                                                                                                          |

### 4.4 The ISO writing guide itself (in-scope, but meta)

| File                                                      | Title                                                                      | Real-ISO             | Frontmatter | Notes                                                       | Lines/Bytes | ISO-fit                                                  |
| --------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------- | ----------- | ----------------------------------------------------------- | ----------- | -------------------------------------------------------- |
| `Standardization/writing-iso-compatible-documentation.md` | `How to Write ISO-Compatible Documentation` (fm: `title:`+`sidebarTitle:`) | No (it IS the guide) | **Yes**     | Genre = how-to. This is the discipline doc, not a standard. | 295 / 13043 | **Low** (it teaches ISO; don't rewrite it as a standard) |

---

## 5. DETAILED AUDIT — Standardization/documents/** (genre: compliance-guide, ISO-style ISMS templates)

These are generated ISMS/PIMS artifacts implementing ISO 27001/27701 controls. **Real-ISO = No** (hand-authored, not verbatim standard), but they are the closest thing in the repo to an *internal* ISO discipline. 66 files across `documents/` (policies/procedures/records/compliance) and a divergent `ISO_documents/` subset.

**Shared frontmatter** (verbatim from `GOV-001_Supplier Security Policy.md`):

```
---
id: rec--001
title: { en / mk / sq }      # multilingual (Macedonian + Albanian)
version / date / created / modified / type / category / cluster
legal_basis: { mk: MK_LPDP_ART_32, al: AL_LAW124_ART_28 }
iso_control: A.6.1
status / approved_by / review_date / effective_date / review_cycle
classification / retention / owner
---
```

**Shared body structure** (verbatim `GOV-001`): `## 1. Purpose` → `## 2. Scope` (*"This policy applies to: …"*) → further numbered clauses; `should`/`shall` used in body. Records (`SEC-002_Hardware Inventory.md`) use `## Document Information` instead of numbered clauses.

| Trait                                 | documents/ (policy/procedure)            | documents/ (record)                 |
| ------------------------------------- | ---------------------------------------- | ----------------------------------- |
| Numbered normative clauses (1./2./3.) | **Yes** (`## 1. Purpose`, `## 2. Scope`) | Partial (`## Document Information`) |
| Scope clause                          | **Yes**                                  | No (records are forms)              |
| Normative references                  | No                                       | No                                  |
| Terms and definitions                 | No                                       | No                                  |
| Normative vs informative label        | No (implicit)                            | No                                  |
| Modal verbs (shall/should)            | **Yes**                                  | Rare                                |
| Stable clause numbering               | Yes (1./2./3.)                           | n/a                                 |
| Annexes                               | No                                       | No                                  |
| Bibliography                          | No                                       | No                                  |
| TOC/anchors                           | Partial (Nextra)                         | Partial                             |

**Verdict:** ISO-fit = **Medium** for policies/procedures (they already follow a house ISO-ish numbered-clause + Scope template — candidate to formalize as the repo's internal "standard" style), **Low/Medium** for records (form templates). These are the natural convergence target referenced in §1.

### 5.1 Duplication gotcha — `ISO_documents/` is a DIVERGENT copy of `documents/`

`Standardization/ISO_documents/**` contains **18 record files** that overlap `Standardization/documents/**` by the same path, but `diff` shows they **DIFFER** (not identical): e.g. `documents/security/records/SEC-002_Hardware Inventory.md` = 3185 B vs `ISO_documents/security/records/SEC-002_Hardware Inventory.md` = 2130 B; frontmatter `id` same but body condensed. So there are **two drifting copies** of the same 18 records. Planner must pick one source of truth.

---

## 6. DETAILED AUDIT — compliance/ folder (genre: compliance-guide)

30 files. **Real-ISO = No** for all (Rocky-specific compliance artifacts). Two sub-groups:

**(a) `rocky-*` operating artifacts** (DPA, RoPA, SoA, TOMs, privacy/cookie notice, procedures, registers, assessments) — e.g. `rocky-soa.md` (Statement of Applicability), `rocky-toms.md` (Technical & Organizational Measures), `rocky-ropa.md`, `rocky-dpa.md`, `rocky-breach-notification-procedure.md`. These are real ISO 27001/27701-derived management-system documents but written as Rocky-specific prose (no Scope/NormRef/Terms/Annex/Bibliography; `rocky-controls-inventory.md` *has* frontmatter `title:`+`sidebarTitle:`, others do not). ISO-fit = **Low/Medium** (ISO-derived content, not ISO prose). `compliance/isms-policy.md` (340 lines, ISMS/PIMS policy for Rocky) is the largest and most standard-like → **Medium**.

**(b) `MACEDONIAN_LPDP_*` (6 files)** + `iso27701-2025-gap-analysis.md` + `eu-b2b-procurement-pack.md` — project compliance guides/analyses referencing ISO 27701/GDPR/LPDP. ISO-fit = **Low/Medium**.

**Duplication gotcha:** The 6 `MACEDONIAN_LPDP_*` files in `compliance/` are **byte-identical** (`diff -q` → IDENTICAL) to the 6 `MACEDONIAN_LPDP_*` files in `Standardization/`. Same content maintained in two folders.

| File                                                                                                                                                                                                                                                                                                                                                                                                     | Title (H1)                                                               | Real-ISO | FM      | ISO-fit                                        |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | -------- | ------- | ---------------------------------------------- |
| `compliance/isms-policy.md`                                                                                                                                                                                                                                                                                                                                                                              | `Information Security & Privacy Management System (ISMS / PIMS) — Rocky` | No       | No      | **Medium**                                     |
| `compliance/iso27701-2025-gap-analysis.md`                                                                                                                                                                                                                                                                                                                                                               | `ISO 27701:2025 & ISO 27001:2022 — Compliance Gap Analysis (Rocky)`      | No       | No      | Medium                                         |
| `compliance/eu-b2b-procurement-pack.md`                                                                                                                                                                                                                                                                                                                                                                  | `EU B2B Procurement Compliance Pack — Rocky`                             | No       | No      | Low                                            |
| `compliance/rocky-controls-inventory.md`                                                                                                                                                                                                                                                                                                                                                                 | `Rocky — As-Built Security & Privacy Controls Inventory`                 | No       | **Yes** | Low/Medium                                     |
| `compliance/rocky-soa.md`                                                                                                                                                                                                                                                                                                                                                                                | `Statement of Applicability (SoA) — Rocky`                               | No       | No      | Low/Medium                                     |
| `compliance/rocky-toms.md`                                                                                                                                                                                                                                                                                                                                                                               | `Technical & Organizational Measures (TOMs) — Rocky`                     | No       | No      | Low/Medium                                     |
| `compliance/rocky-ropa.md`                                                                                                                                                                                                                                                                                                                                                                               | `Records of Processing Activities (RoPA) — Rocky`                        | No       | No      | Low/Medium                                     |
| `compliance/rocky-dpa.md`                                                                                                                                                                                                                                                                                                                                                                                | `Data Processing Agreement (DPA) — Rocky`                                | No       | No      | Low/Medium                                     |
| `compliance/rocky-breach-notification-procedure.md`                                                                                                                                                                                                                                                                                                                                                      | `Personal Data Breach Notification Procedure — Rocky`                    | No       | No      | Low/Medium                                     |
| `compliance/rocky-lawful-basis-register.md`                                                                                                                                                                                                                                                                                                                                                              | `Lawful Basis Register — Rocky`                                          | No       | No      | Low                                            |
| `compliance/rocky-privacy-notice.md` / `rocky-cookie-notice.md`                                                                                                                                                                                                                                                                                                                                          | notices                                                                  | No       | No      | Low                                            |
| `compliance/rocky-dsr-procedure.md` / `rocky-erasure-retention-procedure.md` / `rocky-internal-audit-procedure.md` / `rocky-international-transfer-assessment.md` / `rocky-risk-assessment.md` / `rocky-risk-treatment-plan.md` / `rocky-processor-register.md` / `rocky-retention-schedule.md` / `rocky-dpia-health.md` / `rocky-automated-decision-making.md` / `rocky-withdrawal-recall-procedure.md` | various                                                                  | No       | No      | Low                                            |
| `compliance/MACEDONIAN_LPDP_*.md` (×6)                                                                                                                                                                                                                                                                                                                                                                   | `Macedonian LPDP + GDPR + ISO 27701:2025 …`                              | No       | No      | Low/Medium (identical dup of Standardization/) |

---

## 7. DETAILED AUDIT — root-loose `.md`/`.mdx` (genre: misc / explanation / reference)

| File                                    | Title (H1)                                                                      | Real-ISO | FM      | Traits & evidence                                                                                                                                                                                                 | Lines/Bytes     | ISO-fit                                   |
| --------------------------------------- | ------------------------------------------------------------------------------- | -------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ----------------------------------------- |
| `router-design.md`                      | `Router Design — Canonical Blueprint`                                           | No       | No      | Reads like an **internal interface standard**: *"This is the canonical blueprint for tRPC routers — the 'what right looks like'…"* Uses `## The Contract`, numbered sub-points; no Scope/NormRef/Terms/Annex/Bib. | 170 / 8166      | **Medium** (arguably standards-like)      |
| `router-patterns.md`                    | `Router Patterns & Anti-Patterns`                                               | No       | No      | *"The Router's only job: Receive → Validate → Hand to service → …"* Pattern/anti-pattern catalogue; no ISO clauses.                                                                                               | 1071 / 46324    | **Medium** (standards-like internal spec) |
| `result-monad-and-error-sovereignty.md` | `The Law of the Result Monad & Error Sovereignty`                               | No       | No      | "Doctrine" doc; `**Status:** Active Doctrine`; no ISO structure.                                                                                                                                                  | 375 / 16090     | Low                                       |
| `diamond-seal-audit.md`                 | `Diamond Seal / NoDrift Codebase Audit`                                         | No       | No      | Audit report w/ `**Scope:**` metadata table (not a clause); no ISO wrapper.                                                                                                                                       | 232 / 16115     | Low                                       |
| `offline-architecture.md`               | `Offline Sync Architecture (Mobile PDA)`                                        | No       | No      | `**Scope:**` metadata table; architecture write-up; no ISO clauses.                                                                                                                                               | 216 / 11992     | Low                                       |
| `regulatory-research-brief.md`          | `Regulatory Research Brief — WHAT to bring back`                                | No       | No      | Research checklist referencing ADR-0054; no ISO structure.                                                                                                                                                        | 103 / 4630      | Low                                       |
| `regulatory-verification-report.md`     | `Architectural and Legal-Technical Verification Report…`                        | No       | No      | Verification report (ADR-0054); references ISO/GDPR; no ISO wrapper.                                                                                                                                              | 154 / 8032      | Low                                       |
| `TESTING_DOCTRINE.md`                   | `Testing the Result Monad Doctrine`                                             | No       | No      | Doc-test; no ISO structure.                                                                                                                                                                                       | 48 / 3084       | Low                                       |
| `workorder.md`                          | `WORKORDER — Pending Tasks Extracted from the ADRs`                             | No       | No      | 1496-line task extract; `**Scope:**` metadata; not a standard.                                                                                                                                                    | 1496 / 124864   | Low                                       |
| `animal-id-and-espr-dpp.mdx`            | `Animal-ID and the ESPR Digital Product Passport` (fm `title:`+`sidebarTitle:`) | No       | **Yes** | Explanation (Diátaxis); maps ear tag/QR/passport to ESPR DPP.                                                                                                                                                     | 94 / 5088       | Low (explanation)                         |
| `get-started.mdx` / `index.mdx`         | landing pages (fm)                                                              | No       | **Yes** | Diátaxis landing                                                                                                                                                                                                  | 52/941, 37/1345 | Low                                       |

---

## 8. Full enumeration — ADRs + Diátaxis (blanket Low, with flagged exceptions)

All 98 ADRs share the profile in §3 (Context/Decision/Consequences/…; 0 Scope/NormRef/Terms/Annex/Bib; only `ADR-0085` uses `shall`). **Verdict = Low** for all, except:

- **`ADR/0085-traceability-rules-engine.md`** — *"Traceability Rules Engine (Implementing Reg (EU) 2021/520 as a toggleable registry)"* — uses `shall` and models Articles as a **toggleable rule registry**; arguably the most standards-like ADR (a machine-readable normative rule set). → **Medium** (candidate to also publish as an ISO-style rule document).
- **`ADR/0087-espr-art12-operator-facility-identifier-scheme.md`** — *"ESPR Art 12 Operator/Facility Identifier Scheme (ISO/IEC 15459 / GS1 GLN)"* — directly cites ISO/IEC 15459; identifier scheme is standards-like. → **Medium**.
- **`ADR/0054-regulatory-compliance-framework.md`** (13011 B), **`ADR/0067-isms-posture-iso27001-27701-roadmap.md`**, **`ADR/0068…0072`** (GDPR Art → ISO control ADRs) — reference ISO/GDPR heavily but remain ADRs (decisions). → **Low** (keep as ADRs; cross-link to Standardization/, don't rewrite as standards).
- **`ADR/0033-frontend-mobile-adr-standard.md`** — it *is* the ADR standard, but it's an ADR about ADRs. → **Low**.

how-to (12), runbooks (7), reference (5), explanation (1), tutorials (1): all **Low** per §3 profile (Diátaxis). Notable: `how-to/write-an-adr.mdx`, `how-to/run-the-guardians.mdx`, `reference/api-reference.mdx` (349 lines) — none need ISO discipline.

---

## 9. Cross-cutting findings & gotchas for the planner

1. **Two canonical forms of the same standard exist.** `iso27001_2022.md`/`iso27701_2025.md` are machine-readable data dumps; `a-*.md`/`b-*.md` are the prose mirror. Pick one (or generate one from the other).
2. **Control fragments lack the ISO wrapper.** All `a-*`/`b-*`/`table-b-1`/`iso*.md`/`gdrp.md` are verbatim normative text but have **no** Foreword/Scope(1)/Normative references(2)/Terms(3)/Bibliography, no TOC, and no normative-vs-informative file labelling. They need assembly under `docs/iso-standard-template.md`.
3. **Controlled-language violations already present.** `Standardization/a-6.md` uses `must` in `✅ Compliance Checklist` (*"Security measures must be appropriate to risks"*) — ISO rule is `shall` for requirements. Emoji decoration (`🔑 📌 📋 🇪🇺 ✅`) is non-ISO styling.
4. **Duplicated content across folders (drift risk):**
   - `compliance/MACEDONIAN_LPDP_*.md` (×6) == `Standardization/MACEDONIAN_LPDP_*.md` (×6) — byte-identical.
   - `Standardization/ISO_documents/**` (18 records) **diverges** from `Standardization/documents/**` (same paths, different bytes).
5. **Case-variant filename confusion.** `ISO27001_2022.md` (165-line mapping table) vs `iso27001_2022.md` (1991-line full transcription) are *different* files — easy to confuse. `ISO27701_2025.md` does **not** exist (only `iso27701_2025.md`); the task brief's mention of an uppercase variant is a phantom.
6. **`gdrp.md` has no H1 / no frontmatter** (starts with plain text "General Data Protection Regulation (GDPR) - full text"); 348 KB — largest doc; Nextra rendering may need a title.
7. **The repo already has an internal ISO-ish template** (`Standardization/documents/**` with multilingual frontmatter + `## 1. Purpose`/`## 2. Scope` + `shall`). Converge new standards-style docs on that, not ad hoc.
8. **Diátaxis corpus (ADR/how-to/runbook/reference/tutorial) should NOT be rewritten for ISO** — explicitly excluded by task. Only `router-design.md` + `router-patterns.md` (internal interface specs) and `ADR-0085`/`ADR-0087` are worth a standards-style pass.

## 10. Recommendation summary (who to rewrite)

- **Rewrite as ISO-standard (High priority):** `a-1,a-2,a-3,a-5,a-6,a-7,a-8,b-1,b-2,b-3,table-b-1` → assemble under one ISO wrapper; `iso27001_2022.md`+`iso27701_2025.md` → choose canonical form; `gdrp.md` → add ISO-style nav wrapper (Art numbering already stable).
- **Adopt/formalize ISO-ish template (Medium):** `Standardization/documents/**` policies/procedures; `compliance/isms-policy.md`; `router-design.md`; `router-patterns.md`; `ADR-0085`; `ADR-0087`.
- **De-duplicate:** collapse `compliance/MACEDONIAN_*` ↔ `Standardization/MACEDONIAN_*`; reconcile `ISO_documents/` ↔ `documents/`.
- **Leave as-is (Low):** all 98 ADRs (except 0085/0087), all how-to/runbook/reference/explanation/tutorial, research/verification/doctrine/audit/workorder docs.
