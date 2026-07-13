# ADR-0087: ESPR Art 12 Operator/Facility Identifier Scheme (ISO/IEC 15459 / GS1 GLN)

> ADR-0084's signed-QR credential already carries `farmId` / `subject` as **opaque Rocky IDs**,
> and ADR-0086 maps that QR to the ESPR **data carrier** (Art 2(29)) + **unique product
> identifier** (Art 2(30)). But ESPR Art 12 separately requires **unique operator IDs**
> (Art 2(31)) and **unique facility IDs** (Art 2(33)) that comply with **ISO/IEC 15459**
> (Annex III) *or an equivalent international standard*. ADR-0084 does **not** specify that
> shape. This ADR pins the operator/facility fields to the **GS1** equivalent so Rocky can
> *feed* downstream animal-derived-product DPPs (leather 4203, footwear 6401–6405, meat) whose
> operators need 15459/GS1-shaped IDs. It closes the last open item in the ESPR mapping
> (ADR-0086 §Decision: Art 12 = PARTIAL).

| Key | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-13 |
| **Author** | Architecture Review (user directive: pin operator/facility IDs to ISO/IEC 15459 / GS1 GLN) |
| **Supersedes** | None |
| **Superseded** | None |
| **Related** | ADR-0086 (ESPR DPP alignment) · ADR-0084 (signed QR carrier) · ADR-0082 (PAdES seal) · ADR-0054 (Regulatory Framework) · ADR-0063 (EUDR DDS) · WO-155 (Phase 2) · parent regulation `docs/reference/OJ_L_202401781_EN_TXT.pdf` |

## Context

ESPR Art 12 requires, for products in scope, **unique operator identifiers** (Art 2(31)) and
**unique facility identifiers** (Art 2(33)) that comply with the standards in Annex III — i.e.
**ISO/IEC 15459-1…6** — *"or equivalent European or international standards until the references
of harmonised standards are published"* (Art 10(1)(c)). Art 12(2)(b) also permits an economic
operator to **create its own unique identifiers without relying on an issuing agency**, subject
to Commission rules.

The **Real** today (verified against the source docs, not assumed):

1. **The ISO/IEC 15459 scheme is a hierarchical uniqueness model.** A Registration Authority
   (AIM Global since 2014) accredits **Issuing Agencies** (IAC); an IA issues a **Company
   Identification Number (CIN)** to a company; the company then labels anything — products *and*
   **"locations, papers, facilities"** — as `<ASC DI><IAC,CIN><REFERENCE>`
   (`docs/reference/04_Quick_Guide_UniqueLabeling.by_.ISOIEC15459-r220823-neu.pdf`; confirmed by
   the national adoption `docs/reference/4293749249.pdf` = ГОСТ ISO/IEC 15459-1—2016, and the
   structured record `docs/reference/iso-iec-15459-1-2014.yaml`).
2. **GS1 is the convergent "equivalent standard" path for the EU DPP.** GS1's white paper
   (`docs/reference/GS1-Enabling-DPP-White-Paper-1.pdf`) positions GS1 as *"an ISO/IEC 15459-compliant
   Issuing Agency"*: **GS1 company prefix** (operator), **GLN** (Global Location Number = facility),
   **GTIN** (product/item), **GS1 Digital Link** (the DPP web link / Art 14 portal locator). The
   routing rule is explicit: ISO/IEC 15459 identifiers beginning with a digit are GS1's namespace;
   other leading characters are alternative IAs. See also the GS1 coding guide
   (`docs/reference/4293733052.pdf`, CIN/IAC/Application Identifiers).
3. **A worked DPP precedent exists.** GS1 Europe's "Battery Passport"
   (`docs/reference/Identification-and-labelling-of-industrial-and-electrical-vehicle-batteries-1.pdf`)
   builds a DPP on ISO/IEC 15459 + GLN/GTIN — batteries *are* in ESPR scope (Art 13), so it is the
   closest analog to how Rocky would feed a downstream animal-derived-product DPP.
4. **Rocky already holds the entities.** `farm_subjects` (operator) + the geo polygon (facility)
   are the source of truth; only their *encoding* needs to be 15459/GS1-shaped. ADR-0084's
   `CredentialSeed` (`subject + farm + species`) already names `farm` as a credential field.

### Scope reality (critical caveat — same as ADR-0086)

**Live animals are OUT of ESPR scope** (Art 1(2)(e)); cattle are not an ESPR-obligated product.
So Rocky has **no Art 12 conformity obligation for cattle**. This ADR is justified **only** by the
*feeder* role: downstream **animal-derived products** (leather apparel 4203, footwear 6401–6405,
meat) will require DPPs under future delegated acts (working plan, Art 18(5)), and those operators
need Rocky's operator/facility IDs in a standard shape. It is **preemptive alignment + feeder
readiness**, gated by WO-155 — not a current legal duty.

## Decision

**Adopt GS1 as the equivalent international standard for ESPR Art 12 operator/facility identifiers.**
The signed-QR credential (ADR-0084) SHALL carry these fields in GS1 shape; the existing
`farm_subjects` / geo data is **re-encoded, not re-keyed**.

| ESPR Art 12 role | GS1 key | Rocky source | Encoding rule |
| --- | --- | --- | --- |
| **Operator ID** (Art 2(31)) | GS1 **company prefix** held by the national veterinary authority, expressed as a **GLN** for the authority; each farm carries the operator ID under that prefix | `farm_subjects` (keeper / farm operator) | GS1 key with check digit; farms = child GLNs or items under the authority prefix |
| **Facility ID** (Art 2(33)) | **GLN** (Global Location Number) per holding/site | geo polygon (holding boundary) | One GLN per holding; geo polygon is the spatial representation, GLN is the identifier |
| **Item/Product ID** (future, for downstream DPP) | **GTIN** + serial | animal / ear tag | Only when feeding a downstream leather/meat DPP |
| **DPP web link** (Art 14) | **GS1 Digital Link** URI | `document.credential` QR (ADR-0084) | Reuses the existing signed-QR carrier; the QR *is* the data carrier (Art 2(29)) |

**Rejected alternative — keep opaque Rocky IDs.** ADR-0084's `farmId` as a bare UUID satisfies
Rocky's own gates but blocks the only reason Art 12 matters here: feeding a downstream DPP whose
operator must reference a standards-based operator/facility ID. Rejected.

**Permitted but not chosen — self-issue a CIN under a national veterinary-authority IAC**
(Art 12(2)(b)). Viable and avoids GS1 membership, but forks from the EU DPP ecosystem that is
converging on GS1 (white paper) and forces Rocky to behave as an issuing agency. GS1 is chosen as
the lower-friction, interoperable path; the self-issued CIN namespace remains the documented
fallback if the authority cannot obtain a GS1 prefix.

## Options Evaluated

### A — GS1 GLN + company prefix (CHOSEN)

Reuses the convergent EU DPP ecosystem; GLN is purpose-built for facilities/locations; no new
issuing agency; the QR carrier (ADR-0084) is unchanged — only the *values* of `operatorId` /
`facilityId` become GS1-shaped.

### B — Self-issue CIN under a national veterinary-authority IAC (Art 12(2)(b))

No GS1 cost; full national control. But diverges from the EU DPP mainstream, requires Rocky (or the
authority) to operate as an issuing agency, and complicates downstream operator uptake.

### C — Keep opaque Rocky IDs (status quo)

Simplest; suffices for Rocky's own gates. Rejected because it defeats the sole purpose of the Art 12
work: enabling Rocky to feed downstream animal-derived-product DPPs.

## Consequences

### Positive

- **Closes the last PARTIAL in the ESPR mapping** (ADR-0086 Art 12 = PARTIAL → MET for the feeder role).
- **Interoperable with the EU DPP ecosystem** — the same GLN/GTIN a leather/meat operator needs.
- **No new issuing agency, no change to ADR-0084 crypto** — only `operatorId` / `facilityId` values are re-encoded.
- **Reuses the existing signed-QR carrier** as the Art 2(29) data carrier and the Art 14 portal locator (GS1 Digital Link).

### Negative / Cost

- **GS1 membership/cost** falls on the national veterinary authority (or its operator), not Rocky directly.
- **Mapping work:** assign a GLN per holding (geo → GLN) and an operator GLN per farm (`farm_subjects` → GLN); backfill existing data.
- **Cattle remain out of ESPR scope** — this investment pays off only when Rocky feeds a downstream animal-derived-product DPP (WO-155 Phase 2), so do not over-prioritise ahead of that trigger.

### Neutral

- Does not alter ADR-0084's signature/encoding; the credential stays Ed25519 + canonical CBOR.
- Does not make cattle an ESPR-conformity subject; the obligation stays with downstream product operators.

## Implementation (Plan)

**Owning Bot:** PDF Bot (`packages/pdf` — `CredentialService` schema) + Database Bot (`packages/database` — `farm_subjects` / geo ID mapping). RobotFarm pass: add a sub-section to `apps/docs/AGENTS.md` (done in 0086 pass) and a WO-155 Phase 2 line; flip to Accepted after the mapping spike.

- **Phase 0 — allocate + map (the actual build):**
  1. Obtain a **GS1 company prefix** for the national veterinary authority; allocate a **GLN** per holding (geo polygon) and an **operator GLN** per farm (`farm_subjects`).
  2. Extend `CredentialSeed` / `mapToCredential` (ADR-0084) with typed `operatorId` and `facilityId` fields, both **GS1 keys (GLN) with check digit**; populate from `farm_subjects` / geo (no re-keying of the source rows).
  3. Assert the GLN format in a unit test (13-digit GS1 key + check digit) — NoDrift guillotine.
- **Phase 1 — verify against source:** confirm the encoded IDs parse under the GS1 white-paper routing rule (digit-leading = GS1 namespace) and match the Battery Passport precedent (`docs/reference/Identification-and-labelling-of-industrial-and-electrical-vehicle-batteries-1.pdf`).
- **Fallback:** if no GS1 prefix is obtainable, implement Option B (self-issued CIN under a veterinary-authority IAC) — same `operatorId` / `facilityId` fields, different namespace.

## Verification (Definition of Done)

```bash
# 1. ADR exists in the canonical set and cites ADR-0084/0086 + the six source docs
ls apps/docs/content/ADR/0087-espr-art12-operator-facility-identifier-scheme.md
rg -n "ADR-0084|ADR-0086|docs/reference" apps/docs/content/ADR/0087-espr-art12-operator-facility-identifier-scheme.md

# 2. Credential schema carries typed operatorId / facilityId as GS1 keys
rg -n "operatorId|facilityId|GLN" packages/pdf/src

# 3. GLN format is enforced by a NoDrift test (13-digit GS1 key + check digit)
rg -n "GLN|check digit|gs1" packages/pdf/src

# 4. Source data maps without re-keying
rg -n "farm_subjects|geo" packages/database/src
```

## Anti-Patterns (do not repeat)

1. **Inventing a third ID format** — GS1 GLN (or the documented CIN fallback) only; no bespoke scheme.
2. **Re-keying `farm_subjects` / geo** — re-encode to GLN, keep the source rows as the system of record.
3. **Treating this as a cattle ESPR obligation** — cattle are out of scope (Art 1(2)(e)); this is feeder readiness for downstream animal-derived-product DPPs, gated by WO-155.
4. **Changing ADR-0084's crypto** — the carrier/signature is unchanged; only identifier *values* shift.

## Status

**Accepted (2026-07-13)** by user directive. The decision is made; implementation is the WO-155
Phase 2 identifier sub-task. The signed-QR carrier (ADR-0084) and PAdES seal (ADR-0082) are
unchanged — only the operator/facility identifier *shape* is pinned to GS1, closing the last PARTIAL
in the ESPR mapping (ADR-0086 Art 12).

## Sources

- `docs/reference/OJ_L_202401781_EN_TXT.pdf` — Reg (EU) 2024/1781 (ESPR), OJ L 28.6.2024, Art 1(2)(e), Art 2(29)–(33), Art 10(1)(c), Art 12, Annex III, Art 18(5).
- `docs/reference/04_Quick_Guide_UniqueLabeling.by_.ISOIEC15459-r220823-neu.pdf` — ISO/IEC 15459 CIN/IAC hierarchy; covers locations/facilities.
- `docs/reference/4293749249.pdf` — ГОСТ ISO/IEC 15459-1—2016 (national adoption of 15459-1:2014).
- `docs/reference/iso-iec-15459-1-2014.yaml` — machine-readable ISO/IEC 15459-1:2014 metadata.
- `docs/reference/GS1-Enabling-DPP-White-Paper-1.pdf` — GS1 white paper: DPP via ISO/IEC 15459 identifiers + GS1 Digital Link.
- `docs/reference/4293733052.pdf` — GS1 coding guide (CIN / IAC / Application Identifiers).
- `docs/reference/Identification-and-labelling-of-industrial-and-electrical-vehicle-batteries-1.pdf` — GS1 "Battery Passport" worked DPP precedent.

## Related ADRs

- **ADR-0086** — ESPR DPP alignment (this ADR closes its Art 12 PARTIAL).
- **ADR-0084** — signed-QR carrier (this ADR pins the operator/facility *values* inside it).
- **ADR-0082** — PDF/A-3 + PAdES seal (unchanged).
- **ADR-0054** — Regulatory Framework (operator/facility source data).
- **ADR-0063** — EUDR DDS (the export gate the credential satisfies).
- **Explanation** — [Animal-ID ↔ ESPR DPP](/animal-id-and-espr-dpp) (ear tag / signed QR / registry layering vs the DPP model).
