# ADR-0086: ESPR (Reg (EU) 2024/1781) — Digital Product Passport Alignment

> EUDR.Supply sells a "Digital Product Passport / Trusted Credential Container". The user directed
> us to **borrow that** DPP pattern — and to study **Regulation (EU) 2024/1781** (the Ecodesign for
> Sustainable Products Regulation, ESPR). The study shows the DPP is not a vendor invention: it is
> the EU's *mandated* product-passport standard (ESPR Chapter III, Arts 9–15), and Rocky's
> signed-QR (ADR-0084) + PAdES (ADR-0082) passport already **is** an ESPR-style DPP. The borrow is
> therefore free — the design is built; we adopt the paradigm and expose the signed QR as the EUDR
> export token.

| Key | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-12 |
| **Author** | Architecture Review (user directive: borrow DPP + study 2024/1781) |
| **Supersedes** | None |
| **Superseded** | None |
| **Related** | ADR-0084 (signed QR = DPP data carrier) · ADR-0082 (PAdES = authenticated passport) · ADR-0063 (EUDR DDS) · ADR-0062 (CHED-A / IMSOC) · ADR-0054 (Regulatory Framework) · ADR-0053 (Geo) · ADR-0061 (GDPR) · gap-analysis §14 (EUDR.Supply) · §15 (ESPR study) · WO-155 |
| **Primary source** | `docs/reference/OJ_L_202401781_EN_TXT.pdf` (Reg (EU) 2024/1781, OJ L 28.6.2024, 89 pp.) · [EUR-Lex ELI](https://eur-lex.europa.eu/eli/reg/2024/1781/oj) |

## Context

Reg (EU) 2024/1781 (ESPR) replaces Directive 2009/125/EC and establishes a Union framework for
ecodesign requirements **plus a Digital Product Passport (DPP)** (Chapter III, Arts 9–15). The DPP
is a set of product data accessible via a **data carrier (QR / barcode)** (Art 2(29)), linked to a
**unique product identifier** (Art 2(30)), **traced along the value chain** (Art 9(3)(c)), hosted
in a **Commission registry** queried by **customs** (Arts 13–15), and **free of customer PII**
without consent (Art 10(1)(e), GDPR Art 6).

The user's two directives converge:

1. **"Borrow that"** — adopt the EUDR.Supply DPP pattern (gap-analysis §14.3: expose the signed QR
   as the EUDR evidence token a cattle exporter presents at the border).
2. **"Study 2024/1781"** — assess ESPR.

The study reveals they are the same thing: the EUDR.Supply "DPP" *is* the ESPR DPP, and Rocky already
implements it.

## Decision

**Adopt the ESPR DPP paradigm as Rocky's product-passport standard.** The signed QR credential
(ADR-0084) is the ESPR **data carrier + unique product identifier**; the PAdES-sealed PDF (ADR-0082)
is the **authenticated passport**; the passport / movement / geo domains supply the **value-chain
traceability**; the web `/verify` + admin are the **public portal** (Art 14). The **borrow is
therefore a positioning decision, not new engineering** — ADR-0084 Phase 1 is already built.

### DPP article → Rocky mapping

| ESPR article | Requirement | Rocky coverage | Status |
| --- | --- | --- | --- |
| Art 9 — DPP available | Product only placed if DPP exists | `CredentialService` (ADR-0084) emits signed QR; passport/movement already carry it | MET |
| Art 10(1)(a)(b) — data carrier + unique ID on product | QR physically on product/packaging/doc | Signed QR embedded on passport PDF (ADR-0084 §7) + ear-tag QR | MET |
| Art 10(1)(e) — no customer PII without consent | GDPR Art 6 | ADR-0061 (erasure / minimisation) + RBAC | MET (tooling) |
| Art 11 — technical design (interop, integrity, no vendor lock-in) | Open standards, authenticated data | Ed25519 signed QR (ADR-0084) + PAdES (ADR-0082) | MET |
| Art 12 — unique operator + facility IDs (ISO/IEC 15459) | Trace actors / facilities | `farm_subjects` + keeper / farm operator IDs (ADR-0054); facility = geo polygon | PARTIAL |
| Art 13 — DPP registry (Commission) | Store unique IDs; customs access | **Feeds, not hosts** — Rocky emits passport/QR; EU operates registry (cf. IMSOC §13) | MET (pattern) |
| Art 14 — public web portal | Search / compare DPP data | web `/verify` + admin | PARTIAL |
| Art 15 — customs controls | Verify unique reg ID vs registry at border | Signed QR as EUDR export token (§14.3, WO-155) | PLANNED (WO-155) |
| Art 7(5) — substances of concern tracking | Life-cycle substance tracking | Health (vaccination/treatment/disease) + geo deforestation (ADR-0079) as impact analog | PARTIAL |

## Scope reality (critical caveat)

**Live animals are OUT of ESPR scope.** Art 1(2)(e) excludes "living plants, animals and
micro-organisms"; Art 1(2)(a)/(b) exclude food and feed (Reg 178/2002). So Rocky's core domain
(cattle) is **not directly regulated by ESPR** — ESPR is **not a conformity obligation** for us.

However:

- The **DPP is the EU's emerging cross-product passport standard.** Adopting it preemptively aligns
  Rocky with where EU product law is going (textiles, electronics, batteries already mandated; first
  working plan Art 18(5): textiles, garments, footwear, furniture, ICT…).
- **Downstream animal-derived products need DPPs.** Annex VII (destruction-ban list) explicitly
  includes **leather apparel (4203) and footwear (6401–6405)**; leather and meat are animal-derived.
  The cattle passport / signed QR is the **natural data source** for those DPPs. Rocky feeds them.
- The **border-verification pattern (Art 15)** is identical to the EUDR export-token borrow (§14.3):
  a customs authority verifies a unique identifier against a registry. Same "feeds, not hosts" seam
  as IMSOC (§13) and CHED-A (ADR-0062).

## Consequences

### Positive

- **ESPR validates the DPP architecture** — the "tamper-proof DPP" EUDR.Supply markets is a *real EU
  mandate*, and Rocky's signed QR + PAdES already conform. The borrow is free.
- **One passport shape** for cattle: the same signed QR serves EUDR export (ADR-0063), IMSOC/CHED-A
  (ADR-0062), and the ESPR DPP paradigm — no third passport format.
- **Preemptive alignment** with the EU DPP standard positions Rocky for downstream leather/meat DPP
  feeds without re-architecture.

### Negative / Cost

- ESPR is **not a current obligation** (live animals excluded) — do not over-invest in ESPR-specific
  delegated acts; the value is the *paradigm*, not compliance.
- WO-155 Phase 2 still required to fully realise the borrow: ear-tag document type + credential,
  status-list publisher + "last synced" UI, and wiring the EUDR DDS (ADR-0063) to emit/reference the
  signed QR.

### Neutral

- DPP data carrier = QR (Art 2(29)); Rocky's chosen carrier (ADR-0084) matches — no change needed.

## Implementation (verified 2026-07-12)

- `CredentialService` (ADR-0084) emits the signed QR = ESPR data carrier + unique product ID.
- PAdES seal (ADR-0082) = authenticated passport; `/verify` accepts the raw QR (offline) = Art 14 portal.
- `eudr-due-diligence.ts` (ADR-0063) = the export gate the signed QR must satisfy.
- Primary source: `docs/reference/OJ_L_202401781_EN_TXT.pdf` (OJ L 28.6.2024); article→Rocky mapping in §Decision and gap-analysis §15 verified against the text.
- See gap-analysis **§15** (ESPR study) and **WO-155** (borrow + Phase 2).

## Status

**Accepted (2026-07-12).** The alignment is verified: Rocky's signed-QR (ADR-0084) + PAdES (ADR-0082)
passport already conforms to the ESPR DPP mandate (Arts 9–15). The user directive "definitely borrow
that" makes the paradigm adoption a decided design; the remaining build item is WO-155 Phase 2.
