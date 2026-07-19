# Context for: PDF Template SYSTEM + parallel test suite (planning)

**Repo:** `/home/goce/appz/rocky` (Rocky cattle-traceability monorepo)
**Package under study:** `packages/pdf/` (PDF Bot) + its NestJS wiring in `apps/api/` + the admin web pages in `apps/web/`.
**Standards already fixed (do NOT redesign):** ADR-0082 (PDF/A-3 hybrid + PAdES-LTV seal) and ADR-0084 (offline-verifiable Ed25519+CBOR signed-QR credential). This recon covers only the **TEMPLATE LAYER + TESTS** on top.

---

## Relevant Files (exact paths + key symbols)

### Engine — `packages/pdf/src/engine/`

- `document-registry.ts` — `DocumentRegistry` singleton. `getInstance()`, `register(template)`, `get(type): Result<DocumentTemplate, DocumentError>`, `has()`, `listTypes()`, `size`. **Types map a string -> template at runtime; no Zod enum catalog exists.**
- `document-template.ts` — `DocumentTemplate` interface + `BaseDocumentTemplate` abstract class.
  - Interface members: `readonly type`, `readonly modelPath`, `readonly name`, `readonly availableFormats: DocumentFormat[]`, `readonly modelVersion`, `fetchData(refId: string): Promise<Result<TData, DocumentError>>`, `mapToModel(data): TModel | Promise<TModel>`, optional `mapToCredential?(refId: string): Promise<Result<CredentialSeed, DocumentError>>`.
  - `BaseDocumentTemplate.availableFormats` **defaults to `["yaml"]`** (templates override to add `"pdf"`/`"xml"`).
  - **No `sections` / field-selection parameter anywhere in this interface.**
- `typst-document.template.ts` — `GENERIC_DOCUMENT_TYPST`: a **single data-driven `.typ`** that reads `sys.inputs.model` (a JSON string) and renders `title` + `subtitle` + a **flat list of `{label, value}` fields**. `buildDocumentModelInputs(model, meta)` flattens the entire model object: every top-level key becomes one field; **nested objects are JSON-stringified** into the value. Comment: "Per-document-type `.typ` layouts are a future refinement."
- `typst-renderer.ts` — `renderTypst(input)` using prebuilt `@myriaddreamin/typst.ts` WASM. Bundles DejaVu fonts from `packages/pdf/assets/fonts/` (PDF/A font rule: all fonts embedded). `getCompiler()` memoizes a shared WASM compiler with an in-memory filesystem. Note: the Typst sandbox **cannot read images from its vfs** (reason the QR/logo are stamped post-render — see `pdf-embed.ts`).
- `pdfa3.ts` — `wrapPdfA3(input)` turns a *visual* PDF into a PDF/A-3 hybrid: embeds source as an associated file, writes XMP `pdfaid:part=3` (+ `>B<` conformance), adds sRGB `OutputIntent` (ICC embedded as a stream), `MarkInfo`, `StructTreeRoot`, and a deterministic SHA-512 trailer ID. **Saves with `useObjectStreams: false`** so the PAdES signer can place its `/ByteRange` placeholder via string ops. This is the structural contract asserted by the tests.
- `pdf-embed.ts` — `embedQrPng(pdf, qrPng, opts)` (ADR-0084 S7 on-document credential QR, stamped before wrap) and `embedLogoPng()` (Rocky goat brand letterhead). Both `pdf.save()` after `PDFDocument.load`.
- `yaml-serializer.ts` — `serializeToYaml`, `serializeToXml`, `isFormatSupported`, `DocumentFormat = "yaml" | "xml" | "pdf"`. YAML is the canonical intermediate (ADR-0009).
- `qr.ts` — `generateQrPng` / `generateQrSvg` / `generateQrDataUrl` (standalone QR artifacts for ear-tag printing / verify slips).

### Templates — `packages/pdf/src/templates/` (6 templates)

| Template file | `type` | `mapToCredential`? | **Test file?** |
|---|---|---|---|
| `inspection-form.template.ts` | `inspection-form` | yes | **NONE** |
| `passport.template.ts` | `passport` | yes | **NONE** |
| `movement.template.ts` | `movement` | yes | **NONE** |
| `ched.template.ts` | `ched-a` | NOT implemented | `ched.template.test.ts` |
| `eudr.template.ts` | `eudr` | injects `CredentialService` directly (embeds `credentialReference`) | `eudr.template.test.ts` |
| `ear-tag.template.ts` | `ear-tag` | yes | `ear-tag.template.test.ts` |

- **Registration (NestJS DI):** `apps/api/src/app.module.ts` L434-606 defines `useFactory` providers for each template, injecting the required repositories (e.g. `PassportTemplate` gets `PassportRepository, AnimalRepository, FarmRepository, MovementRepository, HealthRepository`; `ChedTemplate` gets 6 deps incl. `SystemService`; `EudrTemplate` gets 7 incl. `GeoRepository` + `CredentialService`). The `AppModule` constructor (L580+) injects all six templates; `onModuleInit()` (L601-606) calls `registry.register(...)` for each, then `this.documentService.useSigner(createConfiguredSigner())` and (if a key is configured) `this.credentialService.useKeyConfig(credKey)`.
- **Exports:** each template is re-exported from `packages/pdf/src/index.ts`.
- **No central "document type catalog" Zod enum.** `documentGenerateRequestSchema` (see below) declares `type: z.string()` — the registry is the *runtime* SSOT. This is a gap for the user's "form -> appropriate PDF" vision (see Gap Analysis).

### Signing — `packages/pdf/src/sign/`

- `pdf-signer.ts` — `PdfSigner` interface `{ readonly name; sign(pdf): Promise<Uint8Array> }` (the universal sign stage, ADR-0082 S2).
- `noop-signer.ts` — `NoOpSigner` (default; returns buffer unchanged -> **unsigned**; used in dev/deterministic tests only).
- `pkcs12-signer.ts` — `Pkcs12Signer` (local/dev): builds detached PAdES CMS with `forge`, embeds via `/ByteRange` placeholder, optional **LTV** via `timestampAuthority` + `revocation`.
- `hsm-signer.ts` — `HsmSigner` (production): POSTs the unsigned PDF/A-3 to an air-gapped HSM appliance; **https-only + trusted-host allowlist (SSRF guard)**; key never leaves the appliance.
- `pades-cms.ts` — `buildPadesCms`, `prepareSignature`, `embedCms`, and `extractSignature(pdf): SignatureInfo` (the verify read-back). `SignatureInfo = { valid, signerSubject, signerIssuer, serialNumber, algorithm, signedAt, hasTimestamp, timestampedAt, hasRevocation, message }`.
- `timestamp.ts` — `TimestampAuthority`, `FakeTimestampAuthority` (local/dev, mints a DER `TimeStampToken`), `HttpTsaClient` (prod, SSRF-guarded).
- `index.ts` — re-exports.
- **Signer selection at startup:** `apps/api/src/pdf/signer-bootstrap.ts` -> `createConfiguredSigner()` precedence: `ROCKY_HSM_URL` -> `ROCKY_P12_PATH` (+ optional `ROCKY_TSA_URL`, `ROCKY_P12_PASS`, `ROCKY_P12_SIGNATURE_LENGTH`) -> `NoOpSigner` (emits a `console.warn` that docs say must never egress in prod). `createConfiguredCredentialKey()` resolves the **separate** Ed25519 credential key (`ROCKY_CRED_KEY`/`ROCKY_CRED_PUBKEY`/`ROCKY_CRED_KID` or dev key file `apps/api/keys/dev-cred-ed25519.json`).

### Credential / offline QR (ADR-0084) — `packages/pdf/src/credential/`

- `credential.ts` — `CredentialSeed { sub, farmId?, species?, facilityId?, operatorId? }`, `CredentialPayload` (VC-shaped `iss/sub/typ/iat/exp/kid` + domain fields), `CredentialEnvelope { kid, p, s }`. `signCredential`/`verifyCredential` use **Ed25519 (`@noble/curves`) + canonical CBOR (`cbor-x`) + base64url**. `decodeEnvelope`/`encodeEnvelope`/`generateKeyPair` exist for tests.
- `services/credential.service.ts` — `CredentialService.generate({type, refId})`: looks up the template, calls its `mapToCredential(refId)`, wraps the seed into a payload, signs, returns `{ envelope, qrDataUrl, qrPng, payload }`. `verify(envelope)` checks the Ed25519 sig against the pinned pubkey (callers still consult the status list). `signBatch` emits a digest-protected manifest.
- `gs1.ts` (GLN helpers), `status-list.ts` (CRL-style revocation list, ADR-0084 S4), `batch.ts` (bulk manifest, ADR-0084 S6).
- **Why it matters for signed PDFs handed to farmers:** the on-document QR (stamped in `DocumentService.generate` when `credentialService.hasSigningKey()` and the template has `mapToCredential`) lets a gate verify **offline** against Rocky's pinned public key — no server round-trip. `mapToCredential` is implemented by ear-tag / movement / passport / inspection-form; **ched-a does NOT implement it** (so `document.credential({type:"ched-a"})` returns `TEMPLATE_NOT_FOUND`); eudr instead injects `CredentialService` and embeds a `credentialReference`.

### Services / router / schema

- `packages/pdf/src/services/document.service.ts` — `DocumentService.generate(input: DocumentGenerateInput)` where **`DocumentGenerateInput = { type: string; refId: string; format?: string }`** (confirmed: **NO `sections` field**). Flow: validate format -> `registry.get(type)` -> `template.fetchData(refId)` -> `template.mapToModel(data)` (catches `DocumentError` to preserve domain codes) -> yaml/xml serialize **or** pdf path (`renderTypst` -> optional `embedQrPng` credential QR -> optional `embedLogoPng` -> `wrapPdfA3` embedding source YAML -> `signer.sign()` -> base64). `verify({type, refId})` **regenerates the pdf and calls `extractSignature`** to read back PAdES facts. `credential(...)` / `credentialBatch(...)` / `verifyCredential(...)` delegate to `CredentialService`.
  - **CONFIRMED: the prior-plan `sections?: string[]` option is NOT implemented.** Neither `DocumentGenerateInput`, nor `documentGenerateRequestSchema`, nor `DocumentService.generate` accept it. `mapToModel` receives the whole fetched data and decides everything.
- `apps/api/src/routers/document.router.ts` — `DocumentRouter` (`@Router({alias:"document"})`, `@RegisterPolicy("document")`, `@Policy({authenticated:true})`). Endpoints: `generate` (Mutation), `verify` (Query), `credential`, `credentialBatch`, `verifyCredential`, `listTypes` (returns `registry.listTypes()`), `statusList`. Uses `createResultUnwrapper(DOCUMENT_TRPC_ERROR_MAP)` — domain `Result` -> `TRPCError` (Church-and-State doctrine).
- `packages/validators/src/api/document.api.ts` — Diamond Seal request/response schemas with `satisfies` + NoDrift guillotines (`_drift_* = NoDriftSimple<...>`). **`documentGenerateRequestSchema` = `z.strictObject({ type: z.string().min(1), refId: z.uuid(), format: z.enum(["yaml","xml","pdf"]).default("yaml") })`** — again, **no `sections`**. Response `documentVerifyResponseSchema` mirrors `SignatureInfo`.

---

## How a template currently decides what content to emit

Fully inside `mapToModel(data)` — it is the author's responsibility. The engine is agnostic:

1. `fetchData(refId)` returns whatever domain objects the template's injected repos produce.
2. `mapToModel` shapes them into a plain object (the "YAML model").
3. For `yaml`/`xml`, that object is serialized verbatim.
4. For `pdf`, `buildDocumentModelInputs` flattens the object to `label/value` pairs and the **single generic `.typ`** renders them. **Nested objects become JSON strings**; there is **no section grouping, no field selection, no form->section mapping**.

This is the crux for the user's ask: "any web form produces the appropriate digitally-signed PDF." Today the mapping "form/entity -> document type + content" lives only in (a) the hardcoded inspection deep-link and (b) each template's `mapToModel`. There is **no declarative form->document binding layer**.

---

## TEST COVERAGE (the user's critical concern)

**All 15 `*.test.ts` under `packages/pdf`:**

```
src/credential/{batch,credential,gs1,status-list}.test.ts
src/engine/{pdfa3,pdf-embed,qr,typst-renderer}.test.ts
src/services/{credential.service,document.service.pdf}.test.ts
src/sign/{pades-cms,pdf-signer}.test.ts
src/templates/{ched,ear-tag,eudr}.template.test.ts
```

### WARNING: TOP RISK — uneven coverage

- **Template tests exist ONLY for `ched-a`, `ear-tag`, `eudr`.**
- **`movement`, `passport`, `inspection-form` have ZERO tests** — and these are arguably the most user-facing forms (passport + inspection). A planner authoring new templates "in parallel with tests" has **no safety net for 3 of 6 existing templates** and the same blank slate for anything new.
- The engine + sign layer are well-covered (4 engine, 2 sign, 2 service, 4 credential). The *template content* layer is not.

### What the existing tests assert

- **`engine/pdfa3.test.ts`** — pure **structural** assertions on `wrapPdfA3` output (decoded as latin1): presence of `/EmbeddedFile`, `/AF`, `/AFRelationship`, `pdfaid:part` + `>3<`, `pdfaid:conformance` + `>B<`, `OutputIntent`, `GTS_PDFA1`; asserts **no `/Sig`** (signing is a separate stage). **Does NOT call verapdf** (no binary dependency).
- **`sign/pdf-signer.test.ts`** — `NoOpSigner` returns buffer unchanged; `Pkcs12Signer` adds `/Sig` + `/ByteRange`; `HsmSigner` rejects non-https endpoints, rejects untrusted hosts, delegates the seal (mock `fetch`). PAdES "validity" is asserted structurally via `extractSignature`, not via an external validator.
- **`sign/pades-cms.test.ts`** — `FakeTimestampAuthority` mints a DER `TimeStampToken`; `buildPadesCms` embeds the RFC 3161 timestamp and `revocationInfoArchival`; `extractSignature` round-trips; `HttpTsaClient` SSRF guard.
- **`services/document.service.pdf.test.ts`** — the integration test. **Network probe:** `fetch("https://cdn.jsdelivr.net/")`; the whole `describe` is `describe.skipIf(!networkOk)` — so **offline, these PDF-render tests are SKIPPED**. It registers a `FAKE_TYPE` into the **shared** `DocumentRegistry` singleton (no DB), asserts: pdf is supported, renders Typst PDF/A-3 with structural tokens, applies a configured signer (marker), passes the model via `sys.inputs` (incl. Cyrillic), `verify()` reads back PAdES-LTV facts (with `Pkcs12Signer` + `FakeTimestampAuthority`), and `verify()` reports invalid when unsigned. Uses a self-signed `makeP12`.
- **`templates/*.template.test.ts`** — content correctness via mocked repos (`vi.fn()`). `ched`: the precondition guillotine throws `CHED_PRECONDITION_FAILED`. `eudr`: `credentialReference` embedding (ADR-0084 S14.3) + graceful nulls. `ear-tag`: `mapToCredential` resolution + offline Ed25519 sign/verify.

### Vitest config & CI gates

- `packages/pdf/vitest.config.ts` — `include: ["src/**/*.test.ts"]`, `environment: "node"`, `vite-tsconfig-paths` plugin (path aliases resolve).
- `packages/pdf/package.json` scripts:
  - `"test": "vitest run"` -> **runs ALL 15 tests** (the suite the user wants to run in parallel).
  - `"check:pdfa": "vitest run src/engine/pdfa3.test.ts src/sign/pdf-signer.test.ts"` -> **only 2 files** (engine + signer structural checks). Does NOT run template tests, does NOT build.
  - `"verify:pdfa": "tsx scripts/verify-pdfa.mts"`.
- `scripts/verify-pdfa.mts` — emits a real signed PDF/A-3 sample; **only runs `verapdf` if it is on PATH** (`command -v verapdf`), otherwise prints a warning and exits 0. **`verapdf` is NOT installed** (confirmed: `command -v verapdf` -> not on PATH). So the strict conformance gate is effectively **structural-only** unless verapdf is provisioned.
- Root `package.json` `ci:checks` runs `check:pdfa` (= the 2-file package script) **and** `pnpm test` (full vitest) — but `ci:checks` is itself **not** the production build (`pnpm build`/`nest build` is the real rot gate, per AGENTS.md). The `check:pdfa` gate never touches template tests or verapdf.

---

## Web form -> PDF flow (`apps/web/`)

- `apps/web/app/(admin)/documents/page.tsx` — generic manual form (`type`, `refId`, `format`) bound to `documentGenerateRequestSchema` via `useValidatedForm` -> `trpc.document.generate.mutateAsync`. On `pdf` it decodes base64 -> object URL, offers download/preview, and shows `trpc.document.verify` signature facts. **Deep-link support:** `?type=&refId=` auto-prefills + auto-generates once.
- `apps/web/components/inspections/columns.tsx` (L90-92) — the only concrete "generate PDF" button: `label: "Generate PDF"` -> `href: "/documents?type=inspection-form&refId=${row.original.id}"`. **This is ad-hoc per entity**, not a reusable component.
- `apps/web/app/(admin)/verify/page.tsx` — verify by `type`/`refId`; ADR-0084 offline QR paste; credential status-list freshness. `verifyUrl()` builds the canonical `/verify?type=&refId=` QR.
- **Existing FORM framework (schema-driven, reusable):** `apps/web/lib/use-validated-form.ts` (`react-hook-form` + `@hookform/resolvers/zod` `zodResolver` bound directly to a Diamond Seal schema), `apps/web/components/shared/validated-form.tsx` (`<ValidatedForm>`), `apps/web/components/shared/form-fields.tsx` (`TextField`/`SelectField`), and `packages/ui/src/components/form.tsx` (shadcn `Form` with `Controller`-based `FormField`/`FormItem`/etc.). This is the natural binding surface for a template system.
- `apps/web/lib/nav-config.ts` (L91-92) — `Documents` + `Verify document` nav entries (both gated by `report:read`).
- **Mapping layer (form -> document type + refId + sections) does NOT exist.** The only form->doc mapping is the literal deep-link string in the inspection columns. For the user's vision, a planner must build: (1) a declarative registry mapping an entity/form -> `{ documentType, optional sections }`, and/or (2) extend `documentGenerateRequestSchema` + `DocumentService.generate` + `fetchData`/`mapToModel` with a threadable `sections?: string[]` (the previously-designed-but-unbuilt option).

---

## Governance / conventions a worker must follow

- **ADR-0082** (PDF/A-3 hybrid + PAdES-LTV seal) and **ADR-0084** (offline signed-QR credential) are fixed; new templates must emit via the existing pipeline (no per-template signing).
- **ADR-0033** (ADR house standard — header table + required sections; Proposed->Accepted) and **ADR-0052** (docs taxonomy: tutorials/explanation/how-to/reference/runbooks/ADR) govern any new architecture decision docs.
- **RobotFarm pass** (update owning `AGENTS.md` + any ADR after meaningful change) is mandatory per root `AGENTS.md`.
- **Error Sovereignty:** services return `Result<T,E>` from `@rocky/domains-shared` (re-export of `neverthrow` `ok`/`err`); routers map `E` -> `TRPCError` via `createResultUnwrapper` — domain never knows about HTTP.
- **Zod `satisfies` + NoDrift guillotines** on every API schema (`document.api.ts` uses `satisfies z.ZodType<...>` + `_drift_* = NoDriftSimple<...>`). New request fields need a guillotine entry.
- Code style: `.mjs` for JS, `as const` not TS `enum`, no `console.log` in production (signer-bootstrap uses `console.warn` with an `eslint-disable`), `unwrap()` not `.data` in routers.
- **`ci:checks` -> `check:pdfa` runs only 2 files** and is NOT the full build. A new "PDF test suite" should hook in by **expanding `packages/pdf/package.json#check:pdfa`** (and/or a new `check:pdfa-templates` script) to include the template tests, with an optional verapdf stage gated on `command -v verapdf`. The full `pnpm test` already runs everything in parallel via vitest.

---

## Gap Analysis

### (a) TEMPLATE SYSTEM — what exists vs what must be built

**EXISTS:**

- Pluggable `DocumentRegistry` singleton + `DocumentTemplate`/`BaseDocumentTemplate` abstraction.
- 6 working templates (inspection-form, passport, movement, ched-a, eudr, ear-tag).
- Generic Typst render -> PDF/A-3 wrap -> PAdES seal, plus optional on-document credential QR (ADR-0084 S7) and brand logo stamp.
- `mapToCredential` hook feeding the offline credential + `document.credential`/`verifyCredential` endpoints.
- A reusable schema-driven form stack in `apps/web` (`useValidatedForm` + `ValidatedForm` + shadcn `Form`).

**MUST BUILD:**

1. **Section/field selection mechanism** (the unbuilt `sections?: string[]`). If "any web form -> appropriate PDF" means a *partial* form yields a *partial* document, `generate`/`fetchData`/`mapToModel` need a threadable `sections` param. Otherwise `mapToModel` must internally branch on a passed selector. This touches `document.api.ts` (schema + new NoDrift guillotine), `DocumentService.generate`, and every template's `mapToModel`.
2. **Central document-type catalog** shared web<->API. Today `type` is a bare `z.string()` resolved at runtime by the registry. A worker building "form -> appropriate doc" needs a typed enum/registry (e.g. a `documentTypes` Zod enum or a `formToDocumentMap`) so a form knows which `type` string + which `sections` to request.
3. **Generic form->document binding layer in `apps/web`.** Bind a react-hook-form/zod form to `document.generate({type, refId, format, sections?})` — replacing the ad-hoc `/documents?type=...` deep-link with a reusable component (e.g. a `<GenerateDocumentButton entity={...} documentType=... sections=... />`).
4. **Richer PDF layouts.** The single `GENERIC_DOCUMENT_TYPST` flattens nested objects to JSON strings — fine for a key/value dump, poor for real forms. Real "form -> PDF" likely needs either structured model sections or per-type `.typ` layouts (acknowledged as "future refinement" in the code).

**GOTCHAS (template system):**

- The generic renderer **JSON-stringifies nested objects** — any structured form output needs explicit model shaping in `mapToModel`.
- `ched-a` has **no `mapToCredential`** -> `document.credential` for ched errors; inconsistent with the other templates.
- Adding a template requires **5 coordinated edits** (template class -> `index.ts` export -> `app.module.ts` `useFactory` provider -> `AppModule` ctor injection -> `onModuleInit` `register`). A scaffold/generator would reduce drift.
- `DocumentRegistry` is a **process-wide singleton** — `DocumentService.generate`'s pdf test registers a `FAKE_TYPE` into it; parallel-authoring tests must use **unique `type` strings** to avoid cross-test collision.

### (b) PARALLEL TEST SUITE — what exists vs what must be built

**EXISTS:** 15 vitest specs; structural PDF/A-3 + PAdES assertions; network-gated integration; offline Ed25519 credential sign/verify; content tests for 3 templates via mocked repos. `pnpm test` runs them in parallel out of the box.

**MUST BUILD:**

1. **Fill the 3 missing template tests** (`movement`, `passport`, `inspection-form`) — the single biggest risk for "author templates in parallel with tests." Without them, half the form-facing surface is unverified and new templates inherit the same blank.
2. **Parallel-safety for `DocumentRegistry` mutations.** Tests that register templates into the shared singleton must use unique `type` keys (mirror the `FAKE_TYPE` pattern) so concurrent `vitest` workers don't clobber each other.
3. **Real conformance gate.** `verapdf` is **not installed**, and `verify:pdfa` only runs it opportunistically. To make "run tests in parallel" meaningful for signed-PDF correctness, provision verapdf in CI and add a `check:pdfa-conformance` (or extend `check:pdfa`) that fails on non-compliant output.
4. **Offline-green template tests.** The pdf *render* tests are `skipIf(!networkOk)` (Typst fetches fonts from `cdn.jsdelivr.net`). Template *content* tests (mocked repos, no Typst) must run regardless, so the parallel authoring loop stays green offline. Ensure new template tests don't accidentally depend on the network-gated render path.
5. **Wire into `ci:checks`.** Expand `packages/pdf#check:pdfa` (currently 2 files) and/or add a `check:pdfa-templates` so template tests + optional verapdf are part of the guardians, not just the full `pnpm test`.

### TOP RISK (flagged for the user)

**Uneven test coverage is the dominant risk to the "run tests in parallel while authoring templates" requirement.** The engine and sign layer are well-tested, but `movement`, `passport`, and `inspection-form` — the three most form-facing document types — have **no tests at all**, and the `DocumentRegistry` singleton means parallel test execution is only safe if every new test uses a unique `type` key. A planner should treat "write the 3 missing template tests + a parallel-safe registration convention" as the **first deliverable** of the test suite, before or alongside new template authoring.
