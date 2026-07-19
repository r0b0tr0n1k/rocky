# Scout Context: Typst Template System

## Source material

- `temp/TiefLetter-main/` — TiefLetter v0.2.2 Typst package for Austrian/German business docs (invoice, offer, letter)
- `packages/pdf/` — Rocky's existing PDF generation pipeline
- `apps/docs/content/ADR/0107-pdf-template-system.md` — the ADR for the typed template catalog + sections

## TiefLetter architecture (what we can borrow)

```
tiefletter/
├── lib.typ                # Entry point, re-exports classes
├── classes/
│   ├── document_preset.typ (47 lines)  # Base: A4 margins, page footer, banner image
│   ├── letter_preset.typ (81 lines)    # Sender/addressee blocks, salutation, signature
│   ├── invoice.typ (309 lines)         # Table, QR code, totals
│   └── offer.typ (248 lines)           # Similar table + item pattern
├── core/
│   ├── i18n.typ (285 lines)            # Locale dictionaries (en-at, en-de, en-us, de-at, de-de)
│   └── utils.typ (86 lines)            # format-currency, format-int, sign(), resolve-currency
├── template/              # Typst web-app template scaffold
└── examples/              # Usage examples
```

### Key patterns

1. **Layered composition**: `document-preset` → `letter-preset` → `invoice` — each layer wraps content via `show: preset.with(...)` and adds its own block.
2. **Internationalization**: `setup-i18n()` call, locale dictionaries keyed by language code, `tr()` function for translation lookup.
3. **Typst functions as templates**: Each class is a `#let class-name(args, body)` function that calls `setup-i18n()`, then uses `show: letter-preset.with(...)` to wrap its body.
4. **Structured parameters**: Named arguments with defaults (`seller: (name: none, ...)`) — clean, typed-ish parameter passing.
5. **Utility functions**: `format-currency(number, thousands-sep, decimal-sep, symbol)` for locale-aware formatting, `sign(name)` for signature lines.

## Rocky PDF pipeline (current state)

```
packages/pdf/
├── src/
│   ├── engine/
│   │   ├── document-template.ts         # DocumentTemplate interface + BaseDocumentTemplate
│   │   ├── document-registry.ts          # Singleton Map<string, DocumentTemplate>
│   │   ├── typst-document.template.ts    # SINGLE generic .typ template (30 lines, flat key-value)
│   │   ├── typst-renderer.ts             # WASM-backed render via @myriaddreamin/typst.ts
│   │   ├── pdfa3.ts                      # PDF/A-3 wrapper (@cantoo/pdf-lib)
│   │   ├── yaml-serializer.ts            # YAML/XML serialize
│   │   └── qr.ts / pdf-embed.ts          # QR generation + PDF stamping (post-render)
│   ├── services/
│   │   ├── document.service.ts           # Orchestrator: lookup → fetch → map → render → wrap → sign
│   │   └── credential.service.ts         # Ed25519 signed-QR credentials (ADR-0084)
│   ├── sign/                             # PAdES signers
│   └── templates/
│       ├── movement.template.ts          # Model: { movementDeclaration: { ... section objects ... } }
│       ├── passport.template.ts          # Model: { passport: { ... } }
│       ├── inspection-form.template.ts   # Model: { inspectionForm: { ... } }
│       ├── ched.template.ts              # CHED-A document
│       ├── ear-tag.template.ts           # Ear tag order
│       └── eudr.template.ts              # EUDR due diligence statement
```

### Critical constraint (stated in typst-renderer.ts line ~97)

Typst WASM sandbox cannot read images from its vfs, so QR codes and the logo are stamped post-render via @cantoo/pdf-lib, NOT inside Typst templates. TiefLetter's inline QR pattern cannot be reproduced directly.

### Current render flow

1. DocumentService.generate(input) → lookup template → fetchData → mapToModel
2. buildDocumentModelInputs(model) flattens model to {title, subtitle, fields: [{label, value}]}
3. renderTypst({ template: GENERIC_DOCUMENT_TYPST, inputs }) → single flat template
4. embedQrPng() + embedLogoPng() post-render
5. wrapPdfA3() + signer.sign() → final sealed PDF

### What's missing for per-type Typst templates

- No presets/ directory with shared Typst modules
- No per-type .typ files (all use one generic template)
- buildDocumentModelInputs() flattens everything — no structured sections support
- renderTypst() has no mechanism to select template by document type
- No locale/i18n support in Typst templates
- The sections feature from ADR-0107 is unimplemented

## Model shapes (what each template returns)

- movement: { movementDeclaration: { declarationId, movementType, date, animal: {earTagNumber, ...}, fromFarm, toFarm, deathInfo, transport, verification } }
- inspection-form: { inspectionForm: { formId, farm, checkedAnimals[], sections[], inspector, verification } }
- passport: { passport: { passportNumber, animal, owner, issuingAuthority, ... } }
- ched: { ched: { ... } }
- ear-tag: { earTag: { earTagId, type, status, ... } }
- eudr: { documentType: "EUDR_DUE_DILIGENCE_STATEMENT", regulation, animal, ... }

## Relevant ADR references

- ADR-0082: PDF/A-3 hybrid + PAdES signing (the engine)
- ADR-0084: Offline-verifiable signed-QR credentials
- ADR-0107: PDF Template System (typed catalog, sections, parallel tests)
- ADR-0106: State Vet capability (first specified sections design)
- ADR-0033: ADR house standard
- ADR-0052: Documentation taxonomy

## ISO references

- ISO 9241-12: Presentation of Information — document layout
- ISO 9241-110: Dialogue Principles — task suitability per document type
- ISO 9241-210: Human-centred design — template catalog process
- ISO 9001 clause 7.5: Documented information — controlled document outputs
