---
title: Legal & Regulatory Obligation Register
sidebarTitle: Obligation Register
---

# Legal & Regulatory Obligation Register — ROCKY-OBL-001

> The cow is tagged, chipped, and traced; the law that demands it is older than the
> code. This register enumerates the legal and regulatory obligations Rocky is
> subject to, maps each to the control that gives it effect, and names the owner
> accountable for conformance. It is the human-readable obligation layer that sits
> beneath the canonical Statement of Applicability
> ([`isms-policy.md`](./isms-policy.md), ROCKY-ISMS-001).

| Document field | Value |
| --- | --- |
| **Title** | Legal & Regulatory Obligation Register |
| **Reference** | ROCKY-OBL-001 |
| **Version** | 1.0 (Phase 1 — harvest of in-scope obligations) |
| **Status** | Draft |
| **Owner** | Architecture Review (Docs Bot), co-owned with the domain Bots that implement each obligation |
| **Classification** | Internal — Reference |
| **Next review** | Annually, or on material change to any in-scope instrument |
| **Related** | ADR-0054 (Regulatory Compliance Framework); ADR-0067 (ISMS Roadmap); [`isms-policy.md`](./isms-policy.md); [`VALIDATED_CROSSWALK`](../../../../packages/validators/src/compliance/gdpr-articles.ts) |

## Scope

This register covers the legal and regulatory instruments in scope for Rocky's
conformity claim:

- **Regulation (EU) 2016/429** (the Animal Health Law, "AHL") — the veterinary /
  animal-traceability baseline for identification, registration, movement and
  disease control.
- **Regulation (EU) 2016/679** (GDPR) — the personal-data protection baseline.
- **Law on Personal Data Protection of the Republic of North Macedonia** ("MK LPDP")
  — the in-scope local transposition of the GDPR-equivalent regime.

> **Out of scope.** Albanian Law 124 is **not** included in this register. It was
> carried into this repository from a separate project and is explicitly out of scope
> for Rocky's conformity claim (plan §3.3). The `alLaw124` field in
> [`VALIDATED_CROSSWALK`](../../../../packages/validators/src/compliance/gdpr-articles.ts)
> is retained for future use only; this register uses **only** the `gdpr` and
> `mkLpdp` legs of that crosswalk.

## Machine anchor

The GDPR ↔ MK LPDP article pairs in this register reuse the validated rows of
[`VALIDATED_CROSSWALK`](../../../../packages/validators/src/compliance/gdpr-articles.ts)
(the single machine-checked crosswalk in `packages/validators/src/compliance/gdpr-articles.ts`)
as their engineering anchor. That crosswalk's `iso27701` column is machine-derived and
**pending expert review**; it is a lead, not authority, and counsel review gates any
conformity claim built upon it.

## Obligation register

The register records, for each in-scope instrument, the obligation, the Rocky control
that gives it effect, the accountable owner, and the review cadence. Status reflects
whether the obligation is currently met by running code or remains a governance-layer
action.

| # | Instrument | Obligation (articles) | Rocky control / evidence | Owner | Status | Review |
| --- | --- | --- | --- | --- | --- | --- |
| OBL-01 | AHL Reg 2016/429 | Registration of holdings & keepers (Art 14, 15) | Farm + keeper registry (`packages/domains/farm`); `PII_FIELD_REGISTRY`; A.5.9 | Farm Bot | IMPLEMENTED | Annual |
| OBL-02 | AHL Reg 2016/429 | Individual animal identification (Art 15) | Ear-tag domain (`packages/domains/eartag`); A.5.9, A.8.20 | EarTag Bot | IMPLEMENTED | Annual |
| OBL-03 | AHL Reg 2016/429 | Traceability of movements (Art 109, 116) | Movement domain (`packages/domains/movement`); geofence lockdown (ADR-0092); A.8.20, A.8.22 | Movement Bot | IMPLEMENTED | Annual |
| OBL-04 | AHL Reg 2016/429 | Disease-control measures (Art 129) | Disease-zone declaration (`packages/geo`); A.8.20, A.8.22 | Geo Bot / Inspection Bot | IMPLEMENTED | On outbreak |
| OBL-05 | GDPR | Principles of processing (Art 5) | `PII_FIELD_REGISTRY`; mask-by-default + reveal-gate (ADR-0061); A.5.33, A.5.34 | Validators Bot | PARTIAL | Annual |
| OBL-06 | GDPR | Lawfulness of processing (Art 6) | Lawful-basis register (ROCKY-LBR-001); A.5.31 | Validators Bot | PARTIAL | Annual |
| OBL-07 | GDPR | Special-category & transparent information (Art 9, 13, 14) | Privacy notice; A.5.34 | Validators Bot | PARTIAL | Annual |
| OBL-08 | GDPR | Data-subject rights (Art 15–22) | DSR procedure (ROCKY-DSR-001); erasure/retention (ROCKY-ERP-001); A.8.10, A.8.11 | Validators Bot | PARTIAL | Annual |
| OBL-09 | GDPR | Privacy by design & default (Art 25) | Signed-QR credentials (ADR-0084); A.5.28, A.8.24 | PDF Bot | PARTIAL | Annual |
| OBL-10 | GDPR | Records of processing (Art 30) | RoPA (ROCKY-ROPA-001); tamper-evident log (ADR-0007); A.5.28 | Validators Bot | IMPLEMENTED | Annual |
| OBL-11 | GDPR | Security of processing (Art 32) | RLS + RBAC/PolicyEngine (ADR-0022); A.5.15, A.8.15, A.8.24 (at rest — risk-accepted gap, ADR-0071) | Authorization Bot | PARTIAL | Annual |
| OBL-12 | GDPR | Breach notification (Art 33, 34) | Breach procedure (ROCKY-BRCH-001); A.5.28 | Validators Bot | PARTIAL | Annual |
| OBL-13 | GDPR | DPIA for high risk (Art 35) | DPIA — Health (ROCKY-DPIA-001); A.5.28 | Validators Bot | PARTIAL | Annual |
| OBL-14 | MK LPDP | Principles & lawfulness (Art 9, 10) | `PII_FIELD_REGISTRY`; lawful-basis register; A.5.33, A.5.34 | Validators Bot | PARTIAL | Annual |
| OBL-15 | MK LPDP | Information & access (Art 17, 19, 21) | Privacy notice; DSR procedure; A.5.34 | Validators Bot | PARTIAL | Annual |
| OBL-16 | MK LPDP | Privacy by design (Art 29) | Signed-QR credentials (ADR-0084); A.5.28, A.8.24 | PDF Bot | PARTIAL | Annual |
| OBL-17 | MK LPDP | Processor obligations (Art 32) | DPA (ROCKY-PROC-001); processor register; A.2.2.x, A.3.13 | Validators Bot | PARTIAL | Annual |
| OBL-18 | MK LPDP | Records of processing (Art 34) | RoPA (ROCKY-ROPA-001); A.5.28 | Validators Bot | IMPLEMENTED | Annual |
| OBL-19 | MK LPDP | Security of processing (Art 36) | RLS + RBAC/PolicyEngine (ADR-0022); A.5.15, A.8.15 | Authorization Bot | PARTIAL | Annual |
| OBL-20 | MK LPDP | Breach & DPIA (Art 37, 39) | Breach procedure; DPIA — Health; A.5.28 | Validators Bot | PARTIAL | Annual |
| OBL-21 | MK LPDP | International transfers (Art 48) | Transfer assessment (ROCKY-XFER-001); A.1.5.2 | Validators Bot | PARTIAL | Annual |

## Status vocabulary

Each row uses exactly one status token:

- **IMPLEMENTED** — the obligation is met by running code today.
- **PARTIAL** — present and partly wrapped, with governance-layer actions remaining.
- **PLANNED** — governance-layer action only (no code enforcement yet).

## Bibliography

- Regulation (EU) 2016/429 of the European Parliament and of the Council of 11 March 2016
  on transmissible animal diseases and amending and repealing certain animal health
  legislation ("Animal Health Law").
- Regulation (EU) 2016/679 (General Data Protection Regulation).
- Law on Personal Data Protection of the Republic of North Macedonia (Official Gazette
  of RM No. 42/2020) — "MK LPDP".
- ISO/IEC 27001:2022 — Information security management systems — Requirements.
- ISO/IEC 27701:2025 — Extension for privacy information management.
- ADR-0054 — Regulatory Compliance Framework.
- ADR-0067 — ISMS Posture & ISO 27001 / ISO 27701:2025 Alignment Roadmap.
- [`isms-policy.md`](./isms-policy.md) (ROCKY-ISMS-001) — the canonical Statement of Applicability.
- [`VALIDATED_CROSSWALK`](../../../../packages/validators/src/compliance/gdpr-articles.ts)
  — the machine-checked GDPR ↔ MK LPDP ↔ AL Law 124 ↔ ISO/IEC 27701:2025 crosswalk.

## Related

- ADR-0054 — Regulatory Compliance Framework (the engine governance).
- ADR-0067 — ISMS Posture & ISO 27001 / ISO 27701:2025 Alignment Roadmap.
- [`isms-policy.md`](./isms-policy.md) — the canonical Statement of Applicability this
  register feeds.
- [`VALIDATED_CROSSWALK`](../../../../packages/validators/src/compliance/gdpr-articles.ts)
  — the machine-checked crosswalk used as the article-pair anchor.
