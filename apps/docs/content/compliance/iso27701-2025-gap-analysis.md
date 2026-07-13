# ISO 27701:2025 & ISO 27001:2022 — Compliance Gap Analysis (Rocky)

> _sniffs_ The cow is already tagged, chipped, and access-controlled. What the auditor wants
> next is the **paper** that says we meant to. Rocky built the enforcement before the policy.
> This document holds the code against the standard and names what is missing.

**Status:** Homework / engineering reference — **not legal advice.** Sourced from the machine-readable
standards dropped into `graphgrc-main/` (`iso27701_2025.json`, `iso27001.json`). The per-control
`gdprMapping` fields inside those files are machine-derived and **not yet expert-reviewed**; treat them
as leads, not authority.

---

## 0. Source Revaluation (2026-07)

The two canonical control catalogs were re-evaluated against the Real of the files
([`iso27001_2022.md`](../Standardization/iso27001_2022.md) and
[`iso27701_2025.md`](../Standardization/iso27701_2025.md)):

- **Structure — FAITHFUL.** ISO 27001:2022 ships all **93** Annex-A controls across
  A.5–A.8 with correct 2022 renumbering and `legacy_mappings` (old A.8/A.9/A.13 →
  new A.5/A.8). ISO 27701:2025 ships **115** controls across Tables A.1 (controllers),
  A.2 (processors), A.3 (shared) and B.1 (guidance). The Symbolic order is intact.
- **Legal-framework mappings — ~45% EMPTY in BOTH.** 42/93 (27001) and 52/115 (27701)
  controls carry empty `MK_LPDP` / `AL_LAW124` blocks. Some empties are _legitimate_
  (no direct national-law article), but the proportion signals incomplete enrichment.
- **`compliance_checklist` — BOILERPLATE.** Where present, the same six generic lines
  ("Procedures must be documented / implemented / reviewed …") repeat on every control,
  adding no per-control analytical value.
- **`gdprMapping` — PRESENT and useful** (esp. 27701, which carries rich GDPR articles).
- **Edition — current.** Both ISO/IEC 27001:2022 and ISO/IEC 27701:2025 are the latest
  published revisions (as of 2026); no edition caveat applies.
- **Guardian false-positive — FIXED.** `check-md-links` previously emitted 8
  `undefined-ref` warnings from Python `print(f"…")` inside fenced code — dict access
  `validation['legal_compliance']['compliance_status']` misread as a `[a][b]` reference
  link. The checker is now fence-aware; those warnings were never real broken links.

## 1. Source & Structure

| Standard | File | Shape | Controls |
| --- | --- | --- | --- |
| **ISO/IEC 27001:2022** (ISMS base) | `iso27001.json` | Annex A in 4 blocks | **93** (A.5 Org 37, A.6 People 8, A.7 Physical 14, A.8 Tech 34) |
| **ISO/IEC 27701:2025** (PIMS extension) | `iso27701_2025.json` | Tables A.1–A.3 (normative) + B.1 (guidance) | **115** (A.1 controllers 31, A.2 processors 7, A.3 both 27, B.1 guidance 50) |

Bonus: every ISO 27701:2025 control carries an inline `gdprMapping` (e.g. `A.1.2.2 -> (5)(1)(b), (32)(4)`).
That is the ISO 27701 <-> GDPR cross-walk we earlier **deferred** in `VALIDATED_CROSSWALK` (the
`iso27701?` field was left `undefined` pending review). This file is the source to populate it from —
once counsel confirms the mappings.

---

## 2. Methodology & Legend

Each control below is mapped to Rocky's _actual_ capability (from the codebase + AGENTS.md + the
ADR corpus). Status:

- **MET** — enforced by running code today.
- **PARTIAL** — partially present; needs wrapping/formalisation.
- **GAP** — absent; governance/paperwork layer, not code.

Owning Bot per RobotFarm (root AGENTS.md).

---

## 3. Executive Verdict

Rocky is **technically ahead** on the controls code can enforce: row-level security, role-based
access, an explicit PII inventory, mask-by-default with a reveal-gate, tamper-evident logging,
and typed error sovereignty. It is **behind** on the management-system layer that certification
requires: documented policies, lawful basis, consent, DPIA, RoPA, DPO, awareness training,
supplier agreements, cryptography-at-rest, a breach-notification workflow, and enforced retention/erasure.

We are the dialectical inverse of the typical failing organisation (paperwork without enforcement).
Our enforcement lacks the Imaginary commitment (the documented ISMS) and the certified Real (the audit).

---

## 4. ISO/IEC 27001:2022 — Annex A Mapping

### A.5 Organisational Controls (37)

| Clause | Requirement | Rocky | Status |
| --- | --- | --- | --- |
| A.5.1 | Policies for information security | `isms-policy.md` (ROCKY-ISMS-001, Adopted v1.0) | **MET** (Phase 1) |
| A.5.2 / A.5.3 | Roles & segregation of duties | RBAC + Principal + Policy engine exist technically; no documented InfoSec org | **PARTIAL** |
| A.5.4 | Management responsibilities | No top-management ISMS commitment statement | **GAP** |
| A.5.9 / A.5.12 / A.5.13 | Inventory / classification / labelling | `PII_FIELD_REGISTRY` is an explicit PII inventory + category (`direct/indirect/derived`) | **MET** (rare) |
| A.5.15 / A.5.16 / A.5.17 / A.5.18 | Access control / identity / auth info / access rights | RLS via pgPolicy + Better Auth + RBAC | **MET** |
| A.5.19 / A.5.20 / A.5.21 / A.5.22 / A.5.23 | Supplier relationships / cloud | Better Auth is a SaaS vendor; no formal security assessment or agreement | **PARTIAL** |
| A.5.24 / A.5.25 / A.5.26 / A.5.27 | Incident planning / assessment / response / learning | Audit via lifecycle events (ADR-0007); no formal breach-to-authority workflow | **PARTIAL** |
| A.5.28 | Collection of evidence | Tamper-evident access log (ADR-0061 reveal-gate) | **MET** |
| A.5.31 | Legal, statutory, regulatory | Regulatory framework (ADR-0054) + RuleSet (ADR-0030); not a maintained obligation register | **PARTIAL** |
| A.5.33 / A.5.34 | Protection of records / Privacy & PII | Registry + masking + audit log; no approved PII-protection _policy_ | **PARTIAL** |
| A.5.35 | Independent review | None | **GAP** |
| A.5.37 | Documented operating procedures | AGENTS.md + Diamond Seal doctrine; not packaged as ISMS procedures | **PARTIAL** |

### A.6 People Controls (8)

| Clause | Requirement | Rocky | Status |
| --- | --- | --- | --- |
| A.6.1 | Screening | HR layer absent | **GAP** |
| A.6.3 | Awareness, education, training | None for PII | **GAP** |
| A.6.6 | NDAs / confidentiality | None | **GAP** |
| A.6.2 / A.6.4 / A.6.5 / A.6.7 / A.6.8 | Terms / discipline / post-employment / remote / event reporting | Partial via Better Auth session/event logging | **PARTIAL** |

### A.7 Physical Controls (14)

All physical perimeters, entry, offices, monitoring, equipment, secure disposal — **GAP** (org-level;
required for certification, not expressible in application code).

### A.8 Technological Controls (34)

| Clause | Requirement | Rocky | Status |
| --- | --- | --- | --- |
| A.8.2 / A.8.3 / A.8.4 / A.8.5 | Privileged access / access restriction / source-code access / secure auth | RLS + RBAC + Better Auth | **MET** |
| A.8.11 | Data masking | Mask-by-default + reveal-gate (ADR-0061 D5) | **MET** |
| A.8.15 / A.8.16 | Logging / monitoring | Audit lifecycle events + Result error sovereignty (ADR-0066) | **MET** |
| A.8.24 | Use of cryptography | Crypto-at-rest **paused** (key custody unsettled) | **GAP** (deferred by decision) |
| A.8.25 / A.8.26 / A.8.27 / A.8.28 | Secure SDLC / app-sec requirements / architecture / coding | Diamond Seal (NoDrift) + AGENTS code doctrine | **PARTIAL** |
| A.8.10 | Information deletion | Retention in RuleSet D10 planned, not enforced | **PARTIAL** |
| A.8.13 | Backup | DB recreate scripts; not formalised as ISMS control | **PARTIAL** |

---

## 5. ISO/IEC 27701:2025 — PIMS Mapping (the GDPR-adjacent layer)

### Table A.1 — Controls for PII **controllers** (31)

| Ref | Requirement | Rocky | Status |
| --- | --- | --- | --- |
| A.1.2.2 | Identify & document purpose | Reveal-gate captures `purpose`; no documented purpose register | **PARTIAL** |
| A.1.2.3 | Identify lawful basis | None recorded per processing | **GAP** |
| A.1.2.4 / .5 / .6 | Consent (when/how/obtain/record) | No consent management | **GAP** |
| A.1.2.5 | Privacy impact assessment | Maps to GDPR Art.35 (crosswalk); not implemented | **GAP** |
| A.1.2.7 | Contracts with PII processors | Better Auth SaaS; no DPA | **GAP** |
| A.1.2.9 | Records related to processing | Audit log exists; explicit RoPA register not formalised | **PARTIAL** |
| A.1.3.3 / .4 | Determine & provide info to principals | Registry + docs; no subject-facing notice workflow | **PARTIAL** |
| A.1.3.5 / .6 | Modify/withdraw consent; object | None | **GAP** |
| A.1.3.7 | Access, correction or erasure | Erasure **deferred** (ADR-0061, Phase 2); access via registry partial | **PARTIAL** |
| A.1.3.11 | Automated decision-making | Health/risk AI not yet; no Article-22 workflow | **GAP** |
| A.1.4.2 / .3 / .4 / .5 | Limit collection / processing / accuracy / minimisation | Masking enforces minimisation; accuracy not guaranteed | **PARTIAL** |
| A.1.4.6 | De-identification & deletion at end of processing | Erasure deferred | **GAP** |
| A.1.4.8 / .9 | Retention / disposal | RuleSet D10 retention planned; not enforced/disposal workflow | **PARTIAL** |
| A.1.5.2 / .3 / .4 / .5 | Transfer basis / countries / transfer & disclosure records | Domestic (MK/AL) data; crosswalk maps Art.44; no transfer mechanism | **GAP** |

### Table A.2 — Controls for PII **processors** (7)

Customer agreement, org purposes, marketing use, infringing instruction, customer obligations, records,
comply with principal obligations — **GAP** (Rocky is a _controller_; processor agreements with
Better Auth et al. not formalised).

### Table A.3 — Controls for controllers **and** processors (27)

| Ref | Requirement | Rocky | Status |
| --- | --- | --- | --- |
| A.3.5 / .6 | Classification / labelling of information | `PII_FIELD_REGISTRY` categories | **MET** |
| A.3.8 / .9 | Identity management / access rights | RLS + RBAC | **MET** |
| A.3.10 | Info-sec within supplier agreements | Partial (Better Auth) | **PARTIAL** |
| A.3.11 / .12 | Incident planning / response | Audit events; no formal breach workflow | **PARTIAL** |
| A.3.13 | Legal/statutory/regulatory | ADR-0054 framework | **PARTIAL** |
| A.3.14 | Protection of records | Tamper-evident log | **MET** |
| A.3.15 | Independent review | None | **GAP** |
| A.3.16 | Compliance with policies | AGENTS doctrine | **PARTIAL** |
| A.3.17 | Awareness, education, training | None | **GAP** |
| A.3.18 | NDAs / confidentiality | None | **GAP** |
| A.3.19 / .20 / .21 / .22 | Clear desk / media / disposal / endpoints | Org-layer | **GAP** |
| A.3.23 / .24 / .25 / .26 | Auth / backup / logging / cryptography | RLS+RBAC / scripts / audit / **crypto GAP** | **PARTIAL** |
| A.3.27 / .28 / .29 / .30 | SDLC / app-sec / architecture / outsourcing | Diamond Seal | **PARTIAL** |

> **B.1 (Implementation Guidance, 50 controls)** is non-normative guidance mirroring A.1–A.3.
> Use it when closing the GAPs above; it is not separately scored.

---

## 6. Consolidated GAP Register (actionable)

| # | Control(s) | Gap | Recommended action | Owning Bot | Phase |
| --- | --- | --- | --- | --- | --- |
| G1 | A.5.1 / A.5.4 / A.5.34 | No ISMS policy / leadership commitment / PII-protection policy | **DONE** — `isms-policy.md` Adopted v1.0 (ROCKY-ISMS-001); A.5.1 MET | Docs Bot | 2 |
| G2 | A.1.2.3 / A.1.2.7 / A.2.* | No lawful basis register, processor DPAs | Legal register + Better Auth DPA | Auth/Legal | 2 |
| G3 | A.1.2.5 / A.1.3.11 | No DPIA / automated-decision workflow | DPIA template wired to high-risk ops (health/risk) | Health/Inspection Bot | 2 |
| G4 | A.1.3.7 / A.1.4.6 / A.1.4.8 | Erasure + retention not enforced | Implement ADR-0061 Phase 2 (crypto-shred + retention cron) | Validators/DB Bot | 2 |
| G5 | A.8.24 / A.3.26 | Crypto-at-rest unsettled | Resolve key custody (off-server KEK); envelope encryption | DB/Execution Bot | 2 |
| G6 | A.1.2.9 / A.5.33 | No explicit RoPA register | Derive RoPA from `PII_FIELD_REGISTRY` + audit log | Validators Bot | 2 |
| G7 | A.5.19–.23 / A.3.10 | No supplier security assessment | Vendor register + Better Auth assessment | Auth Bot | 2 |
| G8 | A.5.35 / A.3.15 | No independent review | Schedule periodic ISMS audit | Docs Bot | 3 |
| G9 | A.6.1 / A.6.3 / A.6.6 / A.3.17 | No screening / training / NDAs | Awareness programme + NDAs | HR/Org | 2 |
| G10 | A.5.24–.27 / A.3.11–.12 | No formal breach workflow | Breach-notification workflow (authority + principals) | Inspection/System Bot | 2 |
| G11 | A.7.* | Physical controls absent | Facility/securty policy (cert scope) | Org | 3 |
| G12 | A.1.5.* | International-transfer mechanism | If cross-border, add Art.44 safeguards | Legal | 3 |

---

## 7. Phased Roadmap

- **Phase 1 — Harvest the code we already have (weeks, not months).** Document the ISMS _around_
  the enforcement that exists: RLS, RBAC, `PII_FIELD_REGISTRY`, mask/reveal-gate, tamper-evident
  log, Result sovereignty, Diamond Seal. These already satisfy A.5.9/.12/.13, A.5.15–.18, A.5.28,
  A.8.2–.5/.11/.15/.16, A.3.5/.6/.8/.9/.14/.23–.26, A.3.27–.30. Write the procedures that
  _describe_ this reality. Lowest cost, highest visible gain.
- **Phase 2 — The governance layer (the real work).** G1–G10: policies, lawful basis, DPIA,
  RoPA, DPO, training, supplier agreements, crypto-at-rest, breach workflow, enforced retention/erasure.
  This is where ADR-0061 Phase 2, ADR-0066, and the `VALIDATED_CROSSWALK` compliance module
  earn their keep.
- **Phase 3 — Certification.** G8/G11/G12: independent audit, physical controls, transfer
  safeguards. Engage counsel competent in both technology and data-protection law to confirm the
  machine-derived `gdprMapping` leads before any claim of conformity.

---

## 8. Tie to the ADR Corpus & Compliance Module

- **ADR-0061** (GDPR erasure/retention) — closes G4; its Phase 2 is the PIMS A.1.3.7 / A.1.4.6 / A.1.4.8 work.
- **ADR-0066** (Error Sovereignty / Result) — backs A.8.15 / A.8.16 logging + A.5.28 evidence.
- **ADR-0030** (RuleSet) — retention params (D10) are the hook for A.1.4.8 enforcement.
- **ADR-0054** (Regulatory Compliance Framework) — the A.5.31 / A.3.13 legal-requirement spine.
- **`packages/validators/src/compliance/gdpr-articles.ts`** — `VALIDATED_CROSSWALK` already maps the 15
  validated GDPR <-> MK LPDP <-> AL Law 124 equivalences. The per-control `gdprMapping` inside
  `iso27701_2025.json` is the richer source to populate the deferred `iso27701?` field — **once
  reviewed by counsel**. That single edit would give every PIMS control its GDPR article anchor.
- **ADR-0083** (Deployment Topology — Docker Compose, External DB & Cloudflare Access) — the
  runtime scaffolding (Cloudflare Access MFA / Service Token, tunnel-only ingress, non-root images,
  secrets handling, external Postgres + RLS) is logged as Phase-1 evidence in §10 of this register.
- **ADR-0082** (PDF/A-3 Hybrid Container + PAdES Signing) — every emitted document is a cryptographically
signed, archive-grade artifact; the enforcement hook for A.3.27–.30 and a strong audit-story asset (§10.2).
- **ADR-0084** (Offline-verifiable Signed QR Credentials) — self-contained Ed25519-signed QR (EU DCC /
mDL / W3C VC paradigm) for offline gate verification; sibling to the PAdES seal, reuses the same HSM
key custody. Enforcement hook for GDPR Art 5(1)(f)/32 (§11.3).

---

## 10. Runtime / Deployment Controls (evidence added 2026-07-12)

The deployment scaffolding built for the VM (Docker Compose + Cloudflare Access / DockFlare +
external Postgres) is itself a set of _technological controls_ that map onto Annex A / PIMS. These are
recorded here as **Phase-1 evidence** (they describe controls already running) and feed the SoA
(`rocky-soa.md`). Clause mappings are engineering leads — counsel must still confirm (see §9).

### 10.1 Control → clause map

| Control (evidence) | ISO/IEC 27001:2022 | ISO/IEC 27701:2025 | Status | Source |
| --- | --- | --- | --- | --- |
| Cloudflare Access: Zero-Trust + TOTP on `web`/`docs`; Service Token + authenticated group on `api` (mobile clears the shield as a machine) | A.5.15, A.5.16, A.5.17, A.5.18, A.8.5 | A.3.5, A.3.6, A.3.8 | MET | ADR-0083; `fc0cfa9`, `da963e1` |
| Tunnel-only ingress, no published ports; `cloudflare-net` segregation | A.8.20, A.8.22 | A.3.13 | MET | ADR-0083; `docker-compose.yml` |
| Non-root runtime containers; minimal multi-stage images (`api` on `node:24-alpine`, `web`/`docs` on `node:24-slim`) | A.8.9, A.8.10, A.8.19 | — | MET | `9ba4e31` |
| Secrets: gitignored `.env` (dev, `chmod 600`) + encrypted VM disk; Cloudflare Secrets Store + fetch init container (prod, deferred) | A.8.24, A.5.32, A.5.33 | A.3.26 | MET (dev) / Open (prod) | ADR-0083; WO-145 |
| External Postgres/PostGIS + Row-Level Security (`pgPolicy`) enforced at the DB | A.5.12, A.5.15–.18, A.5.33 | A.3.14 | MET | `f103c25`; ADR-0003 (Execution RLS stage), ADR-0007 (audit) |
| Documented deployment topology + frontend↔backend boundary | A.5.8, A.5.10 | A.3.13 | MET | ADR-0083 |

### 10.2 Cryptographic document feature (the "brag")

`ADR-0082 — PDF/A-3 Hybrid Container + PAdES Signing` makes every emitted document
(passports, movements, inspections, CHED) a **cryptographically signed, archive-grade artifact**:

- **PAdES signing** (per-document digital signature) → A.8.24 (use of cryptography),
  A.3.27–.30 (evidence collection / integrity / non-repudiation).
- **PDF/A-3 hybrid container** (embedded machine-readable source + human-readable render,
  long-term archival format) → A.8.3 (retention), A.1.4.8 (PII retention), A.3.14 (integrity).
- **Tamper-evident, verifiable by veraPDF/CI** → A.5.28 (info-sec event evidence), A.8.15/.16.

Status: **designed / in progress (WO-050)** — the signature + archival container is the enforcement
hook for A.3.27–.30 and a strong auditor story (signed, archive-grade, machine-verifiable documents).
This is exactly the kind of _enforcement-ahead-of-paperwork_ asset ADR-0067 celebrates.

### 10.3 Notes

- These are engineering controls; they support the SoA but do **not** by themselves constitute
  certification. Phase 2 (governance) + Phase 3 (audit, counsel) still required (§7).
- The `api` image is Alpine (NestJS pure-JS; typst renders via WASM). `web`/`docs` stay glibc
  `slim` (Next.js `@parcel/watcher` has no musl prebuild). Documented in ADR-0083 Thin-image note.

---

---

## 11. EU Regulatory Conformance (evidence added 2026-07-12)

Rocky's legal spine is **EU-first**: GDPR (Reg. (EU) 2016/679) is the backbone, with the sector
regulations **EUDR (Reg. (EU) 2023/1115)** and **AHL (Reg. (EU) 2016/429)**, and national
transpositions **MK LPDP** (North Macedonia) + **AL Law 124** (Albania). `VALIDATED_CROSSWALK`
(`packages/validators/src/compliance/gdpr-articles.ts`) ties all four together. This is the _binding_
layer — ISO/IEC 27701 (§10) is voluntary and sits on top (per WO-141).

### 11.1 EU regulation → ADR map

| EU regulation | Subject | ADRs | Status |
| --- | --- | --- | --- |
| GDPR (Reg. (EU) 2016/679) | Data protection | 0061, 0068–0075, 0081, 0073/0074 | Enforcement MET; governance Phase 2 |
| EUDR (Reg. (EU) 2023/1115) | Deforestation due-diligence | 0063, 0079 (forest overlay, WO-143) | Done |
| AHL (Reg. (EU) 2016/429) | Animal health; disease zones + TRACES NT export (CHED-A/IMSOC) | 0064 (WO-119), 0062 (WO-121) | Done |
| ISO/IEC 27701:2025 | Voluntary PIMS (not EU law) | 0067 | Roadmap (§10) |

### 11.2 GDPR article → enforcement evidence

| GDPR article | Requirement | Control / evidence | Status |
| --- | --- | --- | --- |
| Art 5(1)(f) | Integrity & confidentiality | RLS + RBAC (0006); mask/reveal-gate (0061); signed QR (0084) | MET |
| Art 5(2) | Accountability | Tamper-evident audit log (0007/0066); **PAdES-LTV seal + RFC 3161 timestamp (0082)** — issuance date provable in court | MET |
| Art 6 / 0081 | Lawful basis | Lawful-basis register (0068) | Phase 2 |
| Art 30 | Records of processing | RoPA derived from `PII_FIELD_REGISTRY` (0070); signed documents are the record (0082) | Phase 2 / partial |
| Art 32 | Security of processing | Crypto-at-rest (0071); Cloudflare Access (0083); **PAdES + offline signed QR (0082/0084)** | MET (design) |
| Art 33–34 | Breach notification | Breach-notification workflow (0072) | Phase 2 |

### 11.3 Cryptographic document evidence (the "brag" for EU auditors)

Two complementary, court-grade features make every emitted artifact provable:

- **ADR-0082 — PDF/A-3 Hybrid Container + PAdES Signing (Accepted).** Every document (passport,
  movement, inspection, CHED) carries a **PAdES-LTV seal (ETSI EN 319 142)** plus an **RFC 3161
  timestamp** — issuance date is _mathematically provable in court_. Key custody via an air-gapped
  `HsmSigner`; the public key is the trust anchor. → GDPR Art 5(2)/32; ISO A.8.24 / A.3.27–.30.
- **ADR-0084 — Offline-verifiable Signed QR Credentials (Proposed).** A self-contained signed-payload
  QR (payload → hash → **Ed25519** sign → CBOR + base64url → QR) as a sibling to the PAdES seal, for
  gates with no signal (farm yard, market, slaughterhouse, border). Follows the proven EU paradigm —
  **EU DCC, mDL / ISO 18013-5, W3C VC** — and reuses the _same_ HSM key custody as 0082. → GDPR
  Art 5(1)(f)/32; demonstrable alignment with EU credential standards.

These close the _"who issued this, and when, provably"_ question for both online and offline EU
verification, and are exactly the enforcement-ahead-of-paperwork assets ADR-0067 celebrates.

### 11.4 Notes

- **WO-141:** GDPR is _law_; ISO 27701 is _voluntary_. Do not architect mandatory compliance to the
  standard — the binding obligations are GDPR/EUDR/AHL, and they are narrower.
- Governance layer (lawful basis, DPIA, RoPA, DPO, breach, retention/erasure) is **Phase 2 / deferred**
  (ADR-0067) — that is the actual EU-legal gap, not the code.
- `VALIDATED_CROSSWALK` GDPR→ISO legs are machine-derived + unverified; counsel must review before any
  conformity claim. **ART_37 (DPO) and ART_82 (liability) are intentionally absent** (no normative
  mapping) — not fabricated.

### 11.5 Phase-2 governance evidence pack (procurement)

The enforcement-ahead code is the demonstrable 80%; the governance paperwork that converts it into
a German/EU B2B signature is assembled in **`eu-b2b-procurement-pack.md`** — the DPA
(`rocky-dpa.md`, Art 28), RoPA, DPIA, lawful-basis register, TOMs and breach SLA, mapped to
ADR-0075 / 0068–0070 / 0072. Status: Draft (Phase 2, ADR-0067). Certification (Phase 3) is the
tender-winner, not the floor.

---

## 12. EU General Food Law (Reg 178/2002) — traceability & withdrawal (evidence added 2026-07-12)

Reg. (EC) 178/2002 is the **foundational General Food Law** — the legal bedrock of Rocky's
core domain (food-producing-animal traceability), more directly than GDPR. Its principles are
_exactly_ what Rocky implements; they are already **VERIFIED** in ADR-0054's Evidence Register
(R6 — Art 18 one-step-back/forward). This section documents that existing, verified spine and
names the implementing children.

### 12.1 Article → domain / ADR map

| Reg 178/2002 article | Requirement | Rocky coverage | Status |
| --- | --- | --- | --- |
| Art 18 — Traceability | Track food/feed/animals one step back + forward | Lineage Graph (`movements` + `animal_parents`), ADR-0054 R6; bovine rules via ADR-0085 (Implementing Reg (EU) 2021/520) | MET (VERIFIED) |
| Art 19 — Withdrawal/recall | Withdraw unsafe food; inform authority + consumers | Passport `SEIZED`, Movement death, Health flags, Notification; first-class procedure `rocky-withdrawal-recall-procedure.md` | Partial → procedure drafted |
| Art 17 — Operator responsibility | Food-business operator ensures compliance | Farm keeper mgmt + `farm_subjects` RBAC (operator = farmer/authority) | MET (tooling) |
| Art 14 / 15 — Food/feed safety | Unsafe if injurious/unfit | Health (vaccination/treatment/disease), Inspection, Passport seizure | MET |

### 12.2 Implementing children (the chain)

Reg 178 Art 18 → operationalised by:

- **Commission Implementing Reg (EU) 2021/520** (bovine/terrestrial traceability) — ADR-0085
  (transmission window, tag-before-move, dual-code, numeric code), toggleable per jurisdiction.
- **AHL Reg (EU) 2016/429** (animal health) — disease zones (ADR-0064).
- **TRACES NT** export (CHED-A / IMSOC) — ADR-0062 (the EU animal-movement/traceability system).
- **EUDR Reg (EU) 2023/1115** (deforestation due-diligence) — ADR-0063 (cattle supply chain).

### 12.3 Notes

- This is **documentation of existing, verified capability**, not new engineering (ADR-0054 R6
  already VERIFIED Art 18). The only net-new artifact here is the **withdrawal/recall procedure**
  (Art 19), previously distributed and unnamed.
- Liability stays with the **food business operator** (Art 17/21); Rocky is the enabler/processor.
  Scope excludes private domestic use (Art 1(3)); commercial farms/authorities + EU-export (Art 11/12)
  are in.
- Procedures are Draft (Phase 2, ADR-0067). Clause mappings are engineering leads — counsel review
  before any conformity claim (§9).

---

## 13. EU IMSOC Regulation (Reg (EU) 2019/1715) — official-controls IT backbone (evidence added 2026-07-12)

Commission Implementing Reg (EU) 2019/1715 is the **IMSOC Regulation** — the IT/operational
backbone for EU official controls. It implements the **RASFF** (Art 50 of Reg 178/2002, §12), the
eofficial-controls regime (Reg (EU) 2017/625), **AHL** (Reg (EU) 2016/429 — ADIS), and plant health
(Reg (EU) 2016/2031 — EUROPHYT). Its four components are **iRASFF, ADIS, EUROPHYT, TRACES**. Rocky
does not _host_ IMSOC (that is the competent authority's system) but **feeds** it: it emits CHED-A
for TRACES NT, raises the signals that become iRASFF alerts, and signs documents to IMSOC-grade
standards. ADR-0062 already implements CHED-A generation to Accepted status.

### 13.1 Article → domain / ADR map

| IMSOC 2019/1715 article | Requirement | Rocky coverage | Status |
| --- | --- | --- | --- |
| Art 40/41 — CHED-A + electronic format | Common Health Entry Document for animals; electronic CHED signed/sealed | ADR-0062 (CHED-A generation, TRACES NT XML, precondition guillotine) + Movement/Passport | MET (ADR-0062 Accepted) |
| Art 38–42 — e-signature / e-seal / e-timestamp | Advanced/qualified e-signature + e-seal + qualified e-timestamp | ADR-0082 (PAdES-LTV + RFC 3161) + ADR-0084 (offline signed QR) | MET (design) |
| Art 17/20/22 — iRASFF alerts | Alert within 48h, border-rejection, follow-up | Inspection (risk analysis, flagFarmForInspection) + Health (notifiable disease → flag) + ROCKY-WDRW-001 (withdrawal/recall) | Partial (alert signals distributed; recall procedure drafted) |
| Art 10/11 — Data protection | Personal data per GDPR 2016/679 + Dir 2016/680 + Reg 2018/1725; joint controllership; 3rd-country partial access excludes PII | ADR-0061 (GDPR) + rocky-dpa.md (Art 28 DPA) + rocky-international-transfer-assessment.md + ADR-0062 D7/D8 (CHED GDPR dialectic) | MET (tooling) / Phase 2 |
| Art 26/29a/34/42 — Storage | Personal data max 10 years | Archive/Retention (ADR-0061, rocky-retention-schedule.md) | MET (design) |
| Art 28/46 — Contingency | Offline templates ("produced during contingency") | ADR-0084 (offline verifiable signed QR at no-signal gates) | MET (design) |

### 13.2 Notes

- **The signing stack is IMSOC-grade.** IMSOC demands advanced/qualified e-signature + e-seal +
  qualified e-timestamp (Art 38–42). ADR-0082 (PAdES-LTV seal + RFC 3161 timestamp) and ADR-0084
  (offline Ed25519 signed QR) are exactly that — the cryptographic document features are not just
  GDPR Art 5(2)/32 evidence (§11.3) but **IMSOC-compliant signature mechanisms**.
- **Rocky feeds, not hosts, IMSOC.** It emits CHED-A (ADR-0062) and raises alert signals
  (Inspection/Health) that the competent authority submits to iRASFF/TRACES; it does not operate the
  RASFF/ADIS/EUROPHYT networks itself.
- Already well-referenced in the corpus: ADR-0054 (R9), ADR-0061, ADR-0062, and
  `regulatory-verification-report.md` all cite 2019/1715. This section consolidates it into the
  evidence spine.
- Procedures are Draft (Phase 2, ADR-0067); clause mappings engineering leads — counsel review (§9).

---

## 14. EUDR (Reg (EU) 2023/1115) — feature parity vs EUDR.Supply (evidence added 2026-07-12)

Commission Reg (EU) 2023/1115 (EUDR) demands proof that cattle (CN 0102) originate from land
**not deforested after 2020-12-31**, with a Due-Diligence Statement (DDS) and a cutoff-enforced
export gate. A commercial comparator — **EUDR.Supply** (Morpheus.Network / Confidios Digital
Product Passports) — sells a _horizontal_ EUDR SaaS (cattle + soy + cocoa + coffee + palm + wood)
with a "tamper-proof Digital Product Passport" and "Trusted Credential Containers". This section
scores Rocky against that comparator and records the **verified** build status (WO-154).

### 14.1 Capability scorecard (Rocky vs EUDR.Supply)

| EUDR.Supply claim | Rocky | Evidence |
| --- | --- | --- |
| Deforestation monitoring (satellite, time-stamped) | MET (partial) | `packages/geo/src/services/deforestation.service.ts` + **ADR-0079** (deforestation raster overlay, swappable map-provider seam) + geo/PostGIS/LPIS/INSPIRE (**ADR-0053**) |
| Automated Due-Diligence Statement + block EU export | MET | `packages/domains/movement/src/services/eudr-due-diligence.ts` + **ADR-0063** (Accepted): Slaughter DDS overlays every pasture vs the 2020-12-31 cutoff and **blocks EU export if breached** |
| Supply-chain mapping to origin | MET (cattle) | Lineage Graph, **ADR-0054 R6** (VERIFIED), **ADR-0085** |
| Digital Product Passport / tamper-proof | MET — stronger | **ADR-0082** (PAdES-LTV + RFC 3161) + **ADR-0084** (signed offline QR = DPP-lite) |
| Trusted Credential Container / time-stamped proof | MET | PAdES seal + signed-QR `iat`/`exp` + tamper-evident audit |
| Post-gate traceability (after EU entry) | MET | Movement tracking + offline signed QR verifiable at any gate |
| Risk assessment | PARTIAL | Inspection risk analysis (ADR-0028), disease zones (ADR-0064), geo deforestation overlay; EUDR-specific deforestation _scoring_ partial |
| Supplier management (commodity certs) | PARTIAL | Farm/keeper mgmt (`farm_subjects`); commodity-trader cert mgmt not built |
| Self-sovereign / granular data permissioning | GAP | RBAC only; no SSI / selective-disclosure |
| Commodity scope (soy/cocoa/coffee/palm/wood) | GAP (by design) | Cattle-only (CN 0102); the _feed-commodity_ leg is not traced |
| Automated submission to EU EUDR / TRACES system | PARTIAL | Generate CHED-A + DDS (ADR-0062/0063); submission is the competent authority's role (Rocky feeds, not hosts — §13) |

### 14.2 Positioning — vertical vs horizontal

Rocky is a **vertical livestock solution**; EUDR.Supply is a **horizontal commodity SaaS**. The
cattle leg of EUDR (CN 0102) is **fully covered** by Rocky with **court-grade proof** — EUDR.Supply
_markets_ "tamper-proof DPP / trusted credential container", but Rocky actually implements
PAdES-LTV + RFC 3161 + Ed25519 signed QR (ADR-0082/0084), which is verifiable in court, not just
asserted. The real gaps are **not** the cattle leg:

1. **Scope** — the feed-commodity supply chain (soy fed to cattle, etc.) is out of domain. Design
   choice, not a defect; a future integration could feed the same DDS.
2. **Self-sovereign permissioning** — their SSI-style "permissioned sharing with unknown partners"
   is not built; Rocky has RBAC, not data-level selective disclosure.
3. **EU-system submission** — we _emit_ CHED-A + DDS; we do not operate TRACES / the EUDR
   Information System (the authority's system — same "feeds, not hosts" boundary as §13).

### 14.3 The one borrowable item

Expose the **signed QR (ADR-0084) as the EUDR evidence token** a cattle exporter presents at the
border — the DDS + pasture verdict travel with the animal, verifiable offline by any inspector.
ADR-0084 already makes this possible; it is the natural bridge from "we comply" to "here is the
proof".

### 14.4 Notes

- **Documentation of existing, verified capability** (ADR-0063 Accepted; `eudr-due-diligence.ts`,
  `deforestation.service.ts`, `eudr.api.ts` all present in code). The DDS enforcement (export block)
  and the deforestation overlay are **built**, not aspirational.
- EUDR fits the **regulatory spine**: Reg 178/2002 Art 18 traceability (§12) → EUDR due-diligence
  (ADR-0063) → CHED-A / TRACES (ADR-0062) → IMSOC (§13). The "deforestation monitoring" claim is
  resolved by ADR-0079 (raster overlay seam), which supersedes ADR-0063's original "no raster"
  assumption.
- Clause mappings are engineering leads — counsel review before any conformity claim (§9).
- Work order: **WO-154**.

---

## 9. Homework Disclaimer

This is engineering self-education, not legal advice. The standards were read from `graphgrc-main/`
JSON exports of uncertain provenance (the generator there will not even build on this machine, and its
local `scf*.json` / `gdpr.json` are orphaned by its own code). The `gdprMapping` and
`legal_framework_mappings` fields are machine-derived and only partially validated upstream. Before any
conformity claim, a lawyer who speaks both technology and data-protection law must review the mappings.
Until then: we have done the homework; we have not hired the examiner.
