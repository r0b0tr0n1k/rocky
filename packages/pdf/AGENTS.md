# PDF / Document Generation — PDF Bot

**Scope:** `packages/pdf/` — document generation framework; PDF/A-3 hybrid output (Typst render → `@cantoo/pdf-lib` wrap) + PAdES signing (HSM / local p12) + QR (ear tags)
**Status:** Active. Phase 1 (YAML/XML intermediate) + Phase 2 (sign stage) + PDF/A-3 wrap + PAdES seal + **PAdES-LTV** (RFC 3161 timestamp + archived revocation) + standalone QR all implemented per **ADR-0082**. `format: "pdf"` returns a signed PDF/A-3 hybrid; `check:pdfa` is the conformance gate.

## Overview

The `@rocky/pdf` package provides a **pluggable document generation framework**. Documents flow through a pipeline:

```
Template.fetchData(refId) → Template.mapToModel(data) → YamlSerializer.serialize(model) → YAML string
                                                              ↓ (pdf)
                                   Typst render → PDF/A-3 wrap → PAdES seal → signed PDF/A-3
```

The YAML/XML intermediate is the canonical, stable API (ADR-0009). For `format: "pdf"` the same model is rendered by Typst, wrapped into a **PDF/A-3 hybrid container** (source YAML embedded as an associated file + XMP `pdfaid:part=3` + sRGB OutputIntent), then sealed with a **PAdES** signature (ETSI EN 319 142). The key never resides on the generation server — the production signer (`HsmSigner`) delegates the seal to an air-gapped HSM appliance.

## Architecture

```
DocumentRouter (tRPC)
  → DocumentService.generate()
    → DocumentRegistry.get(type) → DocumentTemplate
      → fetchData(refId) — domain data fetch
      → mapToModel(data) — pure mapping to YAML model
    → format "yaml" | "xml" → serializeToYaml / serializeToXml → text
    → format "pdf":
        → renderTypst(model)              # Typst WASM visual
        → wrapPdfA3(visual, attachments)   # @cantoo/pdf-lib → PDF/A-3 hybrid
        → signer.sign(pdfa3)               # PAdES (NoOp | Pkcs12 | Hsm)
            → Pkcs12/Hsm may append LTV:    # RFC 3161 sig-timestamp + OCSP/CRL
              signatureTimeStampToken / revocationInfoArchival (unsigned attrs)
  → DocumentResponse { content, documentType, modelVersion, ... }
```

### Key Components

| File | Purpose |
|------|---------|
| `src/engine/document-template.ts` | `DocumentTemplate` interface + `BaseDocumentTemplate` abstract class |
| `src/engine/document-registry.ts` | Singleton `DocumentRegistry` — maps type string → template |
| `src/engine/yaml-serializer.ts` | `serializeToYaml` / `serializeToXml` (`js-yaml`); `DocumentFormat` incl. `"pdf"` |
| `src/engine/typst-renderer.ts` | `renderTypst()` — Typst WASM render (prebuilt `@myriaddreamin/typst.ts`) |
| `src/engine/typst-document.template.ts` | Generic `.typ` + `buildDocumentModelInputs()` (JSON → Typst `sys.inputs`) |
| `src/engine/qr.ts` | `generateQrPng` / `generateQrSvg` — standalone QR artifact for ear-tag printing (pure-JS `qrcode`) |
| `src/engine/pdfa3.ts` | `wrapPdfA3()` — PDF/A-3 hybrid wrap (embed source, XMP `pdfaid:part=3`, sRGB OutputIntent) |
| `src/sign/pdf-signer.ts` | `PdfSigner` interface (the universal sign stage) |
| `src/sign/noop-signer.ts` | `NoOpSigner` — unsigned (dev / deterministic tests) |
| `src/sign/pkcs12-signer.ts` | `Pkcs12Signer` — local/dev PAdES via forge + `@cantoo/pdf-lib` byte-range; optional LTV (TSA + revocation) |
| `src/sign/hsm-signer.ts` | `HsmSigner` — delegates the seal (incl. LTV) to an air-gapped HSM appliance (SSRF-guarded) |
| `src/sign/timestamp.ts` | `TimestampAuthority` (RFC 3161) — `HttpTsaClient` (prod, SSRF-guarded) + `FakeTimestampAuthority` (local/dev) |
| `src/sign/pades-cms.ts` | `buildPadesCms` (forge detached PAdES CMS + unsigned-attr surgery) + `prepareSignature` / `embedCms` (byte-range) + `extractSignature` (verify read-back) |
| `src/templates/*.template.ts` | Document types (inspection form, passport, movement, ear-tag, …) |
| `src/services/document.service.ts` | `DocumentService` — orchestrates registry + template + render + wrap + seal |
| `src/errors/document.errors.ts` | 5 error codes + `documentErr()` factory |
| `scripts/verify-pdfa.mts` | Emits a signed sample + runs `verapdf` when installed (conformance gate) |
| `src/credential/credential.ts` | `signCredential` / `verifyCredential` — offline-verifiable Ed25519+CBOR signed QR (ADR-0084); `decodeEnvelope` / `encodeEnvelope` / `generateKeyPair` |

## Sign Stage + PAdES-LTV (ADR-0082 §2–§3)

Every emitted PDF/A-3 is sealed by a `PdfSigner`. The server never holds key material:

- `Pkcs12Signer` — local/dev: builds a detached PAdES CMS with forge (signed/authenticated attributes), embeds it via the `/ByteRange` placeholder (bypassing `node-signpdf`'s own `sign`), and — optionally — appends **LTV unsigned attributes** by ASN.1 surgery (forge cannot emit `unsignedAttrs`):
  - `signatureTimeStampToken` (OID `1.2.840.113549.1.9.16.2.14`) — RFC 3161 timestamp from a `TimestampAuthority`;
  - `revocationInfoArchival` (OID `1.2.840.113549.1.9.16.2.24`) — archived OCSP/CRL.
- `HsmSigner` — production: POSTs the unsigned PDF/A-3 to an air-gapped HSM appliance over an authenticated `https://` channel and receives the signed (LTV) bytes. Endpoint is https-only and (optionally) host-allowlisted — SSRF guard.
- `NoOpSigner` — default; keeps non-prod deterministic. **Production egress must wire `HsmSigner`/`Pkcs12Signer` so no unsigned PDF leaves the system.**

`DocumentService.useSigner(signer)` selects the active signer (call at bootstrap for production). For LTV via `Pkcs12Signer` pass `timestampAuthority: new HttpTsaClient(url, [host])`; the HSM appliance adds LTV for the production path.

### Timestamp authority (RFC 3161)

- `HttpTsaClient` — production: builds a `TimeStampReq` and POSTs it to the TSA over `https://` (SSRF-guarded like `HsmSigner`).
- `FakeTimestampAuthority` — local/dev: mints a self-signed `TimeStampToken` with forge so the full unsigned-attribute pipeline is exercised without a network. Tests use it.

## Offline signed-QR credential (ADR-0084)

Sibling of the PAdES `PdfSigner` — same trust root, but a **self-contained signed payload
QR** verifiable offline against the pinned public key (no server call). **Phase 1 is
implemented** (the Phase-0 spike validated the primitive): `CredentialService`
(`src/services/credential.service.ts`) signs with a configured Ed25519 key and verifies
against the pinned pubkey; `document.credential` + `document.verifyCredential` tRPC
procedures expose it; passport/movement/inspection-form templates implement `mapToCredential`,
and the signed QR is embedded on the PDF via `embedQrPng` (ADR-0084 §7) before the PAdES
seal. The QR lands at **version 13 / 69×69 modules** — dense enough that the barn
print-scan is the real gate (see `credential.test.ts` + `credential.service.test.ts`).

**Phase 2 (WO-155) in progress:** the `ear-tag` document type now implements
`mapToCredential`, so `document.credential({ type: "ear-tag", refId })` issues a
self-contained signed credential for a tag (subject = tag id; farm + species resolved from
the applied animal). Remaining Phase 2 = credential **status-list publisher** (from
passport/movement revocation states) + **GS1 GLN** operator/facility IDs (ADR-0087) +
**EUDR DDS** linkage (ADR-0063).

- `credential.ts` — `signCredential` (Ed25519 over canonical CBOR payload, base64url
  envelope) / `verifyCredential` (checks sig + `exp`; caller still checks the credential
  **status list**). Pure JS, no Node builtins → same code signs server-side and verifies in
  `@rocky/mob` (RN parity by construction via `@noble/curves`; a real RN run is a CI step).
- `credential.service.ts` — `CredentialService`: `generate` (template `mapToCredential` →
  `CredentialSeed` → `CredentialPayload` → sign → envelope + QR data URL/PNG) and `verify`
  (raw envelope vs pinned key). Configured at bootstrap via `useKeyConfig`.
- `engine/pdf-embed.ts` — `embedQrPng` stamps the credential QR onto a PDF page (image
  XObject) for the on-document QR.
- Canonical CBOR (RFC 8949 §4.2) is pinned by a **golden-byte test** that fails the build
  on encoding drift.
- Key rotation = opportunistic sync + grace window; **credential status list** (domain
  state) is distinct from X.509 **cert revocation** (OCSP/CRL). See ADR-0084.

## Verify (read-back) & Web UI (ADR-0082 §Operations)

A seal is only useful if it can be read back. `DocumentService.verify({ type, refId })`
re-derives the document and calls `extractSignature(pdf)` (in `src/sign/pades-cms.ts`) to
recover the PAdES facts → `DocumentVerifyResult` (`valid`, `signerSubject`, `serialNumber`,
`algorithm`, `signedAt`, `hasTimestamp`, `timestampedAt`, `hasRevocation`). The API exposes
this as `document.verify` (`@Query`, authenticated); the web admin adds `/verify` (enter
type+refId or scan the doc QR → `/verify?type=&refId=`) and a signature panel + PDF
preview on `/documents`, plus a "Generate PDF" kebab action on inspection rows.

**Signer bootstrap (`apps/api/src/pdf/signer-bootstrap.ts`).** At API startup `onModuleInit`
calls `useSigner(createConfiguredSigner())`. Precedence: `ROCKY_HSM_URL` → `ROCKY_P12_PATH`
→ `NoOpSigner` (warns). An interim self-signed dev cert in `apps/api/keys/` (git-ignored)
lets local/dev sign now; production swaps to the qualified cert + HSM via env only.
See `runbooks/sign-pdf-documents`.

## Interface

```typescript
interface DocumentTemplate<TData, TModel> {
  readonly type: string;        // e.g. 'passport'
  readonly modelPath: string;   // e.g. 'models/passport.yaml'
  readonly name: string;        // e.g. 'Cattle Passport'
  readonly modelVersion: string;
  readonly availableFormats: DocumentFormat[];

  fetchData(refId: string): Promise<Result<TData, DocumentError>>;
  mapToModel(data: TData): TModel | Promise<TModel>;
}
```

## Adding a New Document Type

1. Create `src/templates/foo.template.ts` extending `BaseDocumentTemplate<TData, TModel>`
2. Implement `type`, `modelPath`, `name`, `modelVersion`, `fetchData`, `mapToModel`
3. Register in `apps/api/src/app.module.ts` via `DocumentRegistryProvider.onModuleInit()`
4. No router changes needed — `document.generate({ type: "foo", ... })` works automatically

**Template design rules:**

- Plain classes, no `@Injectable()` or `@Inject()` — instantiated via `useFactory` in AppModule
- Constructor receives domain repositories/services it needs
- `mapToModel` may be async (returns `Promise<TModel>`)
- `fetchData` returns `Result<TData, DocumentError>` — use `err()` for missing data, never throw
- `mapToModel` throws on domain errors (they bubble through DocumentService)

## NestJS Wiring (app.module.ts)

```typescript
DocumentRegistryProvider — implements OnModuleInit, registers all templates
PdfModule — provides DocumentService
Templates — provided via useFactory with injected repos/services:
  InspectionFormTemplate ← InspectionService
  PassportTemplate ← PassportRepository, AnimalRepository, FarmRepository, MovementRepository, HealthRepository
  MovementTemplate ← MovementRepository, AnimalRepository, FarmRepository
  EarTagTemplate ← EarTagRepository, AnimalRepository, FarmRepository
```

## Error Codes

| Code | When |
|------|------|
| `TEMPLATE_NOT_FOUND` | No template registered for the requested type |
| `UNSUPPORTED_FORMAT` | Requested format not in template.availableFormats |
| `FETCH_FAILED` | Template's fetchData() failed (entity not found, etc.) |
| `VALIDATION_FAILED` | Model output doesn't match YAML schema (future) |
| `SERIALIZATION_FAILED` | YAML serialization failed |

## Dependencies

- `@rocky/domains-inspection` — InspectionService for form data
- `@rocky/domains-passport` — PassportRepository
- `@rocky/domains-animal` — AnimalRepository
- `@rocky/domains-eartag` — EarTagRepository (ear-tag credential, ADR-0084 Phase 2)
- `@rocky/domains-movement` — MovementRepository
- `@rocky/domains-farm` — FarmRepository
- `@rocky/domains-health` — HealthRepository (vaccination history for passports)
- `@rocky/database` — Drizzle types
- `js-yaml` — YAML serialization

## Remaining Work

1. **PDF templates** — visual layout for each document type (inspection form, passport, movement declaration)
2. **XML output format** — extend `YamlSerializer` to support XML alongside YAML
3. **Model validation** — validate `mapToModel()` output against the YAML model schema before serialization
4. **Additional document types** — birth certificate, death certificate, import/export certificate
5. **Invoice doc type** — Phase 4 per ADR-0082 (gated on billing landing)
6. **On-document QR** — **done** via `embedQrPng` (ADR-0084 §7): the signed QR embeds as a
   PDF image XObject after the Typst render, before the PAdES seal.
7. **Phase 2 (WO-155) remaining** — credential status-list publisher from passport/movement
   revocation states + "last synced" UI (ADR-0084 §4); GS1 GLN operator/facility IDs
   (ADR-0087); EUDR DDS emits/references the signed QR (ADR-0063).

## QR Codes (ear-tag linkage)

- **Standalone artifact** — `src/engine/qr.ts` (`generateQrPng` / `generateQrSvg`, pure-JS `qrcode`) produces a QR for printing onto ear tags / labels. Fully implemented + tested.
- **On-document QR** — embedding a QR inside the Typst visual is **blocked by the prebuilt WASM sandbox**: the bundled Typst has no native `qrcode()` (added in 0.12) and its `image()` cannot read injected vfs files (project-root access check). The hook (`buildDocumentModelInputs` + template) is removed to avoid dead code; revisit if the WASM is upgraded or fonts are vendored locally.

## Conformance Gate (ADR-0082 §3)

`pnpm check:pdfa` runs the PDF/A-3 + PAdES + **LTV** structural tests (which assert `/EmbeddedFile`, `/AF`, `pdfaid:part=3`, `OutputIntent`, `/Sig` + `/ByteRange`, and — when a TSA is configured — the `signatureTimeStampToken` / `revocationInfoArchival` unsigned attributes). `pnpm verify:pdfa` emits a real signed sample and, if `verapdf` is installed in CI, validates it is actually PDF/A-3 **and** signed (the NoDrift guillotine: *reject unsigned / non-A PDFs*).

## Context Boundaries

| Bot | Reads | Writes |
|-----|-------|--------|
| **PDF Bot** | `packages/pdf/` | Engine, templates, module |
| **Inspection Bot** | Provides `InspectionService` to InspectionFormTemplate | |
| **Passport Bot** | Provides repos to PassportTemplate | |
| **Movement Bot** | Provides repos to MovementTemplate | |
| **Validation Bot** | `packages/validators/src/api/document.api.ts` | Request/response schemas |
| **API Bot** | `apps/api/src/routers/document.router.ts` | tRPC router, AppModule wiring |
