# ADR-0082: PDF/A-3 Hybrid Container + PAdES Signing for Every Emitted Document

> Two renderers already work (`mk`/pandoc YAML→PDF/A for general docs; `@e-invoice-eu`
> for the invoice). The missing piece is **signing** — and the point of signing is not
> "invoices": it is that a PAdES seal (ETSI EN 319 142) plus an RFC 3161 timestamp
> makes the issuance date **mathematically provable in court**. This ADR resolves that,
> using `@e-invoice-eu` as the *universal* hybrid engine (it embeds XML into any PDF/A-3,
> not an invoice-only tool) and PAdES as the seal.

| Key | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-12 |
| **Author** | Architecture Review (prompted by user directive) |
| **Supersedes** | None |
| **Superseded** | None |
| **Related** | WO-050 (PDF/A + cryptographic seal) · ADR-0009 (doc-gen framework) · ADR-0029 (passport archive) · ADR-0079 (geo déférred PDF/A) · ADR-0033 (ADR standard) · ADR-0052 (doc taxonomy) · `docs/old/future.md` (PDF/A + cryptographic seal mandate) |

---

## Context

`docs/old/future.md` is explicit: *"When an event occurs, the system automatically generates a
digitally signed PDF, stores it in a tamper-proof cloud object store … and eliminates the
physical filing cabinets."* WO-050 tracks **"PDF/A rendering + cryptographic seal"** as a
Future item. The `archive` domain (ADR-0029) already stores 3-tier documents with
retention; the **seal is the unfinished half**.

The **Real** today (verified, not assumed):

1. **A lighter, unified renderer is desirable.** The `docs/old/*_MK*.pdf` (FS, HK,
   ear-tags, registration specs) were rendered with `pandoc` (Markdown/YAML → PDF/A) and
   `@e-invoice-eu` itself renders its visual PDF via **LibreOffice** (spreadsheet → PDF).
   Both are heavy. A **light, programmable typesetting library — Typst** (Rust/WASM,
   `.typ` template + data → PDF, in-process) can render *every* Rocky document type
   uniformly, replacing `pandoc`/LibreOffice. `@e-invoice-eu` is **schema-driven**
   (its `invoice.schema.json` + mapping schema define structure) — the same schema-first
   discipline fits Rocky's documents.

2. **`@e-invoice-eu` (vendored read-only at repo root `e-invoice-eu2/`) is a proven,
   TS-native engine** — the user already shipped it. It ships as **`@e-invoice-eu/core`
   (library) + `@e-invoice-eu/cli` + `@e-invoice-eu/server` (NestJS Swagger API) + a
   browser-from-XLS path**. It emits **UBL 2.1 / CII / XRechnung** XML **and** packages it
   as **PDF/A-3** with the XML embedded (Factur-X/ZUGFeRD hybrid; `format-factur-x.service`
   writes the PDF/A-3 XMP + Factur-X extension metadata via `@cantoo/pdf-lib`). Crucially,
   it **signs with *your* digital signature** (your cert/key — RS256/JWS in its proven
   build). Factur-X/ZUGFeRD/XRechnung are the **German + French EN 16931 standards**.
   The "invoice" is just one profile; fed any XML it is document-agnostic.

3. **The gap — the PDF document seal for Rocky.** The engine signs *its* payload with
   *your* key (proven). For Rocky the seal we need is a **PAdES** signature *on the PDF/A-3
   itself* (ETSI EN 319 142), bound to Rocky's certificate, so the issuance date is
   court-provable. That PAdES-on-PDF step is what we add, reusing the engine's
   "your digital signature" key-custody pattern. `mk`/pandoc alone renders PDF/A but
   applies no seal — so "digitally signed by us" is the unbuilt half.

4. **Hybrid embedding is half-done.** The invoice path embeds its XML as a PDF/A-3
   associated file for free. The general `mk` path does **not** re-attach the source
   YAML/XML (the stable API from ADR-0009) into the PDF — so a general Rocky doc
   is PDF/A but not self-describing.

5. **No contract enforces "every emitted PDF is signed PDF/A."** `document.generate`
   (ADR-0009) returns a YAML/XML *intermediate*; the PDF is a deferred concern.
   Nothing today guarantees the buffer the client downloads/prints is PDF/A **and** signed.

The user's directive: investigate whether `@e-invoice-eu` "can be used in a way that we
generate the XML … embedded in the PDF as PDF/A … and digitally signed by us, so whenever
someone saves a PDF or prints it from the app that will be PDF/A." The answer: **yes** —
`@e-invoice-eu/core` is a *universal* PDF/A-3 hybrid engine (fed any XML it embeds it into
any PDF/A-3, the DE/FR EN 16931 standard) **and it signs with your digital signature**
(your cert/key). The best integration is the **library** (import `@e-invoice-eu/core` into
`@rocky/pdf`), not the CLI. The one piece we add is the **PAdES seal on the PDF** using
Rocky's certificate — which makes the issuance date court-provable.

Backend dependencies (ADR-0033 §D4): doc-gen → ADR-0009; archive → ADR-0029;
ADR standard → ADR-0033.

## Decision

**Use `@e-invoice-eu` as the *universal* document engine — as the *library*
(import `@e-invoice-eu/core` into `@rocky/pdf`), not by shelling out to its CLI. The
**XML is the canonical, standard artifact** (per EN 16931 some invoices are XML-only);
where a visual is required we emit **PDF/A-3** (the XML embedded + a rendered view). Add
one universal, server-side sign stage bound to Rocky's certificate. Enforce a single
contract: every emitted artifact — the **XML and/or the PDF/A-3** — is **signed**, which
makes its issuance date mathematically provable in court.**

### 1. `@e-invoice-eu` as the universal hybrid engine (both paths proven — do not split)

- **General documents** (passport, inspection form, movement declaration, vaccination
  certificate, slaughter certificate, ear-tag order, farm book): feed `@e-invoice-eu` the
  **Rocky XML/YAML intermediate** (ADR-0009's stable API) as the embedded file. The
  `mk`/pandoc step produces the *visual* PDF; `@e-invoice-eu` wraps it into
  **PDF/A-3 with that XML attached** as an associated file (AFRelationship = Alternative/Data).
  The "invoice" is just one profile of the same engine — fed our XML, it is document-agnostic.
- **Invoice document type** (when billing lands — tag fees, vet services, movement charges):
  `@e-invoice-eu` renders the EN 16931 **UBL/CII** XML and the PDF/A-3 hybrid turnkey.
  Reuses the user-proven invoice path; no separate engine.

Do **not** treat `@e-invoice-eu` as invoice-only. Its Factur-X/ZUGFeRD/XRechnung
container is the EN 16931 standard (German + French) and embeds *whatever XML you give it*
into *whatever PDF/A-3 you hand it*. The "invoice" framing is a fetish; the technique
is universal.

### 1b. Invocation variant — the **library** is the engine; topology is the choice

`@e-invoice-eu` can be driven four ways. Two axes separate them: **engine** (we always
use `@e-invoice-eu/core` — never shell out to the CLI) and **topology** (run the library
*in-process* inside `@rocky/pdf`, or stand it up as the **dedicated NestJS signing
service**). The signing key lives in an HSM/external KMS either way — so topology is an
ops/scaling call, not a custody one:

| Variant | How | Key custody | Verdict |
| --- | --- | --- | --- |
| **Library** (`@e-invoice-eu/core`) | Import into `@rocky/pdf`; call `InvoiceService.generate()` in `document.service.ts` | Server-side (Rocky cert) | **Canonical — best option** |
| **NestJS Swagger API** (`@e-invoice-eu/server`) | Run the lib as a *dedicated* service (render/scaling isolation) | Server-side; **key in HSM, not on server** | Valid topology — justified by render isolation, not key custody |
| **CLI** (`@e-invoice-eu/cli`) | Spreadsheet/JSON → e-invoice, run as a process | Server-side (if run server-side) | **Secondary** — offline/batch only (archive re-sign job), not the production egress |
| **Browser (from XLS)** | Upload spreadsheet → mapped → PDF in browser | **Key must NOT be in browser** | Thin client: build unsigned preview, POST to the API to sign |

The **library is the best option**: it runs *inside* `@rocky/pdf` (no process boundary,
no version drift, Rocky's cert stays in the module). The CLI and browser paths are
convenience surfaces that ultimately call the same library on the server.

### 1c. Unified rendering with a light engine (Typst)

Stop carrying two heavy renderers (`pandoc` for general docs, **LibreOffice** for
`@e-invoice-eu`'s spreadsheet→PDF). Use **Typst** as the typesetter, via
**`typst-business-templates`** (casoon — MIT, [github.com/casoon/typst-business-templates]):
a schema-driven, **JSON-in → PDF-out** Rust engine with templates, fonts and
localization **embedded** (no running Typst install needed). It already covers
invoice / offer / contract / credentials / concept / documentation / diagram / letter /
delivery-note / credit-note / reminder — the same shape Rocky needs, mapped to our
document types (passport, inspection form, movement declaration, vaccination certificate,
ear-tag order, farm book). Multi-language (de/en/fr/es/it/nl/pt) fits Rocky's locales.
It is **schema-driven** — mirroring `@e-invoice-eu`'s `invoice.schema.json` discipline:
a JSON/Zod schema defines each document's structure; Typst renders it. Because it consumes
**JSON**, Rocky's ADR-0009 intermediate (the template's `mapToModel` output) flows straight
in — there is **no format translation** between the domain model and the renderer, which
is precisely why JSON-in is the right fit.

**Integration (Rocky is TS, the lib is Rust):** the crate is Rust, so we don't shell the
`docgen` CLI (consistent with "library, not CLI"). Two in-process options:

- **Prebuilt Typst WASM** (e.g. the community `@myriaddreamin/typst.ts`, ships compiled
  WASM) — **no Rust toolchain for us at all**; adopt `typst-business-templates`' JSON/
  template schema as the *design reference* and render our own `.typ` templates. Lightest.
- **Build `typst-business-templates` → WASM/NAPI** — needs a Rust toolchain **at build
  time only** (runtime is WASM/native, no Rust process). Gets its embedded templates,
  fonts and locales for free.
Either way it stays in-process. The `@e-invoice-eu` **library** then wraps the rendered
visual + the source XML/YAML into PDF/A-3 and we PAdES-sign it (Option E). One pipeline
generates them all.

> Note: the lib also offers **PDF password encryption** (AES-256 via `qpdf`). That is
> *confidentiality* (a password gate), **distinct** from the PAdES **seal** (integrity +
> non-repudiation). They can coexist, but encryption is not the seal — the seal is the
> XML + PAdES (§3, §2).

### 2. Universal Sign stage — the missing piece (owned by `@rocky/pdf`, server-side)

Apply **PAdES** (ETSI EN 319 142 — the German/French/EU electronic-signature standard)
to the PDF/A-3 buffer **before it leaves the server**:

- **Signature**: PAdES-LTV (CAdES/PKCS#7 embedded in the PDF) with Rocky's X.509 certificate.
- **Timestamp**: RFC 3161 TSA (long-term validation — the seal survives certificate expiry).
- **Revocation**: OCSP/CRLInfo embedded so a verifier needs no network.
- **Key custody — the key is *not* on the server, and is barely on this planet.**
  Rocky's master signing key is generated and used **inside an HSM** (FIPS 140-3
  Level 3/4, ideally air-gapped — "a metal box in a basement") — it is **never
  exported**; a tamper response erases it. The PDF server sends a *signing request*
  (the document hash) over PKCS#11 / a KMS API and receives the signature; it never
  holds key material. This is the root of trust for the court-provable seal, and it
  dissolves the "dedicated server for key isolation" argument — custody is solved by
  the HSM regardless of topology. The key **never** reaches the browser either.

**Why this is the point:** a PAdES-LTV seal + RFC 3161 timestamp is a
cryptographic proof of *when* the document was issued, bound to Rocky's identity. That is
exactly `future.md`'s "cryptographic seal" — and it is **mathematically provable in court**
that Rocky produced this document on this date. The XML embedded alongside it is the
self-describing source. PDF/A-3 is the decades-stable container.

### 3. Universal Hybrid-Embed stage (complete it for general docs)

Every emitted PDF/A-3 carries its **source XML/YAML as an associated file**
(`AFRelationship = Alternative`/`Data`, `/Collection`) so the document is
self-describing and archivable. **The embedded XML is the key to the whole scheme:** it is
the authoritative, machine-readable source of truth. The PAdES seal (§2) binds *that
XML* to the issuance date, so a signed PDF/A-3 is self-describing and re-validatable
without the live system — you can re-parse and re-check the structured data, not just
view a frozen picture. Drop the XML and the seal proves only "these pixels existed";
keep it and the seal proves "this *data* existed, issued by Rocky, on this date."

- **Invoice path**: free from `@e-invoice-eu` (Factur-X embeds the XML).
- **General path**: `@e-invoice-eu` attaches the YAML/XML the template already produces
  (ADR-0009's stable API) into the PDF/A-3. No new data model — we re-bundle
  what the template already generated.

### 4. The contract

The **XML is canonical**; the PDF/A-3 is the human-facing flavor. `document.generate`
returns the **standard XML** (signed) and, when a visual is wanted, the **PDF/A-3 hybrid**
(XML embedded + Typst visual, signed). Per EN 16931, **some invoices are XML-only** —
that is a valid, complete, standard output, not a degraded one. The planned `@rocky/pdf`
**CLI** (mirroring `@e-invoice-eu`'s lib+cli shape) covers offline/batch render+sign
(archive retention, re-signing history). The web client merely downloads/prints. "Whenever
someone saves or prints a document from the app, it is a signed standard artifact" holds
because the app **only ever emits signed XML and/or signed PDF/A-3** — there is no
raw, unsigned egress path.

### 5. QR code generation (documents + ear tags)

The engine also **generates QR codes** (light lib — e.g. `@napi-rs/qrcode` or Typst's
native QR), encoding the document/animal **reference** (UID + a resolvable link to the
signed record). The code is embedded in the Typst visual and is also available as a
standalone artifact for **ear-tag printing**: the physical cattle ear tag carries the QR
that resolves back to the animal's canonical, signed record (passport / registration).
This is the `future.md` "QR codes" mandate made concrete, and it closes the loop with the
ear-tag domain (`packages/domains/eartag`) — scan the tag, land on the cryptographically
sealed XML. The QR points *at* the key (the XML); it is not a substitute for it.

```mermaid
flowchart LR
  D[Domain data] --> T[DocumentTemplate<br/>fetchData + mapToModel]
  T --> Y[XML/YAML intermediate<br/>ADR-0009 stable API]
  Y --> R1["Typst (light, in-process)<br/>.typ + data → visual PDF"]
  Y --> R2["@e-invoice-eu/core (library)<br/>UBL/CII XML"]
  R1 --> H["@e-invoice-eu hybrid wrap<br/>XML embedded → PDF/A-3"]
  R2 --> H
  H --> S[PdfSigner<br/>PAdES-LTV (ETSI EN 319 142), server-side]
  S -->|"RFC 3161 TSA + OCSP/CRL"| C["document.generate / pdf CLI<br/>ONLY egress = signed PDF/A-3"]
  C -->|"download / print"| U[User: save or print = signed artifact<br/>(XML and/or PDF/A-3)]
  classDef rend fill:#87CEEB,stroke:#333,stroke-width:2px,color:darkblue
  classDef sign fill:#f8d7da,stroke:#b02a37,stroke-width:2px,color:#000
  classDef ego fill:#FFD700,stroke:#333,stroke-width:2px,color:black
  class R1,R2 rend
  class H,S sign
  class C ego
```

## Options Evaluated

### A — Use `@e-invoice-eu` as the **library** (import into `@rocky/pdf`)

**Adopted (best option).** `@e-invoice-eu/core` is TS-native and imported directly into
`@rocky/pdf`'s `document.service.ts`; we call `InvoiceService.generate()` programmatically.
No process boundary, no version drift, Rocky's cert stays in the module. This is the
canonical integration — **not the CLI**.

### B — Use the **CLI** (`@e-invoice-eu/cli`)

**Secondary (offline/batch only).** The CLI (spreadsheet/JSON → e-invoice) is fine for
the archive re-sign job and ad-hoc generation, but it is *not* the production egress:
shelling out per request adds latency, process-management, and drift risk. Use it as a
/dev-ops tool, not the app path.

### C — Run the **NestJS Swagger API** (`@e-invoice-eu/server`) as a signing service

**A valid topology — but the rationale is ops/scaling, not key custody.** The vendored
server (`apps/server/src`) is a self-contained NestJS app (`NestFactory`, global prefix
`api`, Swagger at `/api`, `PORT` env). Its surface is `GET /format/list`,
`POST /api/invoice/create/:format` (generates XML **or** the Factur-X PDF/A-3 and returns
the buffer), `POST /mapping/transform/:format`, `GET /schema/{mapping,invoice}`. Every
endpoint is a one-line call into `@e-invoice-eu/core`.

Standing it up as a **dedicated Document Generation + Signing service** isolates the
CPU-heavy LibreOffice render path and gives a clean network boundary — but the *signing
key is not on this server anyway* (it lives in the HSM/external KMS, Option E). So the
dedicated service is justified by **render isolation + independent scaling**, not by key
custody. Cost: a second process to deploy (Docker, health, internal mTLS/token auth
between `apps/api` and the doc service).

### D — **Browser (from XLS)**

**Thin client only.** A web UI can let a user upload a spreadsheet → mapped → PDF, but the
**key must never reach the browser**. The browser builds an *unsigned* preview; the signed
PDF/A-3 is produced server-side by the library. Rejected as a signing surface.

### E — The PAdES sign stage (the added piece): ETSI EN 319 142

**Adopted.** PAdES (ETSI EN 319 142 — the German/French/EU e-signature standard) on the
PDF/A-3, server-side, with Rocky's certificate + RFC 3161 TSA timestamp + OCSP/CRL
revocation info. Reuses the engine's "your digital signature" key-custody pattern. The
seal + timestamp is the court-provable issuance date — the realized `future.md` mandate.
Libraries: `node-signpdf` (turnkey PAdES-LTV) or `pkijs` + `node-forge` (MIT) for an
AGPL-free stack. **The private key is not resident on the server** — the signer delegates
to an HSM / external KMS / remote signing service over PKCS#11 or a KMS API, so the
PDF-generation server never stores key material. Hardened to a FIPS 140-3 HSM / air-gapped
root key: the master key is generated and used inside the hardware and never leaves it.
For XML-only artifacts (per standard), the signature is applied as XML-DSig (detached) or
by wrapping — the same HSM-delegated key; the XML remains the canonical, signed source
of truth.

## Consequences

### Positive

- **Every emitted PDF is a signed PDF/A-3** — directly satisfies `future.md`'s mandate
  and closes WO-050.
- **Court-provable issuance.** PAdES-LTV + RFC 3161 TSA = cryptographic proof of *when*
  Rocky issued the document, bound to Rocky's identity. This is the `future.md` seal, realized.
- **Self-describing archive**: PDF/A-3 + embedded source XML/YAML means a stored
  document is verifiable without the live system (ADR-0029 tamper-proof store).
- **Long-term validity**: PAdES-LTV + TSA means seals survive certificate expiry.
- **Reuses proven work**: `mk`/pandoc (general) and `@e-invoice-eu` (invoice) are
  both already working — we add the sign/embed stages, not a renderer.
- **Lib+cli parity**: a `@rocky/pdf` CLI (mirroring `@e-invoice-eu`'s lib+cli shape) enables
  offline/batch render+sign (re-signing history, archive jobs).

### Negative / Cost

- **Sign stage is net-new**: PAdES-LTV + TSA + revocation + key custody infra.
- **Certificate lifecycle**: Rocky needs an X.509 cert (+ key), a TSA endpoint, and
  OCSP/CRL feeding — operational burden.
- **Hybrid-embed for general docs** requires `@e-invoice-eu` to wrap the `mk` output
  (attach the YAML/XML) — a small but real addition.

### Neutral

- Invoice adoption is **gated on billing landing** (a future domain); general docs are
  unaffected and ship first.
- `document.generate` keeps returning YAML/XML for non-PDF consumers; only the
  `format: "pdf"` branch becomes signed PDF/A-3.

## Implementation (Plan)

**Owning Bot:** PDF Bot (`packages/pdf`). RobotFarm pass: update `packages/pdf/AGENTS.md`
(scope = YAML/XML + PDF/A-3 hybrid + PAdES sign; note the lib+cli shape), root
`AGENTS.md` PDF Bot description, and promote WO-050 from Future → Active in `WORKORDER`.

- **Phase 0 — Pin & parity (no new deps):**
  - Commit the `mk`/pandoc **version + PDF/A profile** as a reproducible script
    (today it is implicit/"was working" — pin it for the RobotFarm rail).
  - Add a **`@rocky/pdf` CLI** (`packages/pdf/src/cli.ts`, bin entry) mirroring
    `@e-invoice-eu`'s lib+cli shape: `pdf generate <type> <refId> --format pdf`
    for offline/batch render+sign.

- **Phase 1 — Unified generate + sign (the working pieces):**
  - **Render the visual with a light engine.** Replace `pandoc`/LibreOffice with
    **Typst via `typst-business-templates`** (casoon, MIT — JSON → PDF, templates/fonts/
    locales embedded, in-process via WASM/NAPI). Schema-driven: a JSON/Zod schema defines
    each document's structure (mirroring `@e-invoice-eu`'s schema-first approach).
  - **Generate QR codes.** Encode the document/animal reference (UID + link to the signed
    record); embed in the visual and emit as a standalone artifact for **ear-tag printing**
    (closes the loop with `packages/domains/eartag` and the `future.md` QR mandate).
  - **Embed + sign with the library.** Import `@e-invoice-eu/core` into `@rocky/pdf`;
    call `InvoiceService.generate()` in `document.service.ts` to wrap the Typst visual +
    the source XML/YAML into PDF/A-3. The library is the canonical path — **not the CLI**.
  - **Topology:** either run the library *in-process* inside `@rocky/pdf` (single
    process, simplest) **or** stand up `@e-invoice-eu/server` as a **dedicated signing
    service** (render-isolation scaling). Both use the library; neither shells out to the
    CLI. The dedicated service adds the PAdES stage (HSM-delegated) inside
    `invoice.service.generate()` so it returns a *signed* PDF/A-3.

- **Phase 2 — Universal Sign stage (the gap):**
  - `PdfSigner` in `@rocky/pdf`: PAdES-LTV via `node-signpdf` or `pkijs` + `node-forge`,
    server-side key from HSM/env; RFC 3161 TSA; OCSP/CRL.
  - Applied to the PDF/A-3 buffer from **either** renderer, before egress.

- **Phase 3 — Contract enforcement:**
  - `document.generate({ format: "pdf" })` returns **signed PDF/A-3**; add a
    `veraPDF`/`pdfcpu` conformance check in CI (a NoDrift guillotine:
    *"is it actually PDF/A-3 **and** signed?"* — reject unsigned/non-A PDFs).

- **Phase 4 — Invoice doc type (optional, gated on billing):**
  - `@e-invoice-eu` already renders the invoice XML → PDF/A-3 hybrid; layer the
    Phase-2 sign stage on top.

## Verification (Definition of Done)

```bash
# 1. ADR exists in the canonical set and cites backend deps
ls apps/docs/content/ADR/0082-pdf-a-hybrid-signing.md
rg -n "ADR-00(09|29|33)" apps/docs/content/ADR/0082-pdf-a-hybrid-signing.md

# 2. Sign stage present + server-side only (no client key egress)
rg -n "PAdES|node-signpdf|pkijs|node-forge|TSA|OCSP" packages/pdf/src
rg -L "privateKey|signingKey" apps/web   # client must not touch the key

# 3. Hybrid container: emitted PDF/A-3 carries the source as an associated file
#    (verify with pdfcpu / veraPDF on a generated sample)
npx pdfcpu validate -mode strict sample.pdf
#    -> PDF/A-3 + /EmbeddedFile with AFRelationship

# 4. Contract: document.generate({format:'pdf'}) returns a SIGNED pdf/a
#    (assert %PDF header + /Sig + PDF/A XMP on the returned buffer)
```

## Anti-Patterns (do not repeat)

1. **Treating `@e-invoice-eu` as invoice-only** — it embeds *any* XML into *any* PDF/A-3;
   the "invoice" is one profile of a universal container. Feed it Rocky's XML.
2. **Client-side signing / shipping the private key** — key custody is server-side only.
3. **Emitting an *unsigned* artifact anywhere** — the app must only egress *signed*
   XML and/or signed PDF/A-3. (XML-only per EN 16931 is fine and standard; raw,
   unsigned PDF/XML is not.)
4. **Treating "PDF/A" as done when it is unsigned** — PDF/A without PAdES is not the
   `future.md` mandate; the seal (the court-provable date) is the half that was missing.
5. **Relying on an implicit, unpinned `mk` pipeline** — pin pandoc version + the
   PDF/A profile as a committed, reproducible script.

## Related ADRs

- **ADR-0009** — Document Generation framework (YAML/XML stable API; PDF deferred).
- **ADR-0029** — Passport Archive (3-tier retention; the seal's storage home).
- **ADR-0079** — Geo map-provider + deforestation overlay (PDF/A rendering deferred).
- **ADR-0033** — ADR house standard (this document conforms).
- **ADR-0052** — Documentation taxonomy (this is an ADR; the plan lives in §Implementation).
- **WO-050** — PDF/A rendering + cryptographic seal (this ADR activates it).
- **`docs/old/future.md`** — PDF/A digital archiving + cryptographic seal mandate.
