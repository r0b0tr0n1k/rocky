# Plan: Per-Type Typst Templates (TiefLetter Adaptation)

## Architecture

```
packages/pdf/src/
├── typst/                          ← NEW: Typst source directory
│   ├── presets/                    ← Shared reusable modules (like TiefLetter classes/)
│   │   ├── document-preset.typ     # A4 page setup, footer, logo placement
│   │   ├── letterhead.typ          # Sender/authority block, addressee block
│   │   ├── table-utils.typ         # Styled tables, header rows, totals
│   │   ├── i18n.typ                # Locale dictionaries (MK/EN), tr() lookup
│   │   └── signature.typ           # Signature line + signatory name
│   └── templates/                  ← Per-document-type .typ layouts
│       ├── movement.typ
│       ├── passport.typ
│       ├── inspection-form.typ
│       ├── ched.typ
│       ├── ear-tag-order.typ
│       └── eudr.typ
```

## How the pipeline changes

### Current (flat generic)

```
mapToModel → { title, subtitle, fields: [{label, value}] }
           → renderTypst({ template: GENERIC_DOCUMENT_TYPST })
```

### Proposed (per-type, sectioned)

```
mapToModel → { sections: [{ title, fields: [...] }] }
           → renderTypst({ template: PER_TYPE_SOURCE, inputs })
```

### Changes needed in TypeScript

1. **typst-document.template.ts** — Replace flat GENERIC_DOCUMENT_TYPST with a map of per-type template sources, plus GENERIC_FALLBACK_TYPST for types without custom layouts.

2. **buildDocumentModelInputs()** — Instead of flattening to {fields}, keep the structured {sections} shape as defined in ADR-0107.

3. **document.service.ts:138** — The renderTypst call selects the template by type:

   ```
   const typstSource = TEMPLATE_SOURCES[template.type] ?? GENERIC_FALLBACK_TYPST;
   pdf = await renderTypst({ template: typstSource, inputs });
   ```

4. **Per-type template .ts files** — mapToModel() methods begin returning { sections: Section[] } where each Section has { title, fields, type? }.

## TiefLetter adaptations

| TiefLetter File | Lines | Rocky Adaptation | Changes Needed |
|-----------------|-------|-----------------|----------------|
| document_preset.typ | 47 | presets/document-preset.typ | Replace banner with logo area (post-render stamped) |
| letter_preset.typ | 81 | presets/letterhead.typ | Swap sender -> inspector/authority, addressee -> farm/vet |
| invoice.typ table section | ~100 | presets/table-utils.typ | Generic table builder: animal-table(), field-table() |
| invoice.typ QR section | ~30 | Not used | QR is post-render -- skip this pattern |
| i18n.typ | 285 | presets/i18n.typ | Strip to MK/EN only, no tieflang dependency |
| utils.typ:format-currency | 30 | presets/i18n.typ | Keep for MKD denar formatting |
| utils.typ:sign | 6 | presets/signature.typ | Keep as-is |

## Per-type template design

Each .typ template follows this structure:

```typst
// templates/movement.typ (or any type)
#import "../presets/document-preset.typ": document-preset
#import "../presets/signature.typ": sign

#let raw = sys.inputs.at("model", default: "{}")
#let data = json.decode(raw)
#let sections = data.at("sections", default: ())

// Document header
#v(2.4cm)  // space for logo (stamped post-render)
= #data.at("title", default: "Document")
#text(size: 10pt, fill: rgb(90, 90, 90))[#data.at("subtitle", default: "")]
#line(length: 100%, stroke: rgb(80%, 80%, 80%))

// Render each section, typed sections switch between table and field modes
#for section in sections [
  #if section.at("type", default: "fields") == "table" [
    // Table rendering
    === #section.at("title", default: "")
    #table(
      columns: (auto, 1fr),
      ..section.at("rows", default: ()).map(row => (row.at("label"), row.at("value"))).flatten()
    )
  ] else [
    // Key-value field rendering
    === #section.at("title", default: "")
    #for field in section.at("fields", default: ()) [
      *#field.at("label", default: ""):* #field.at("value", default: "")
    ]
  ]
]

// Signature block
#sign("Authorized Inspector")
```

## Build order

T01 — Create packages/pdf/src/typst/presets/ with 4 shared modules (document-preset, signature, table-utils, i18n)
T02 — Create packages/pdf/src/typst/templates/movement.typ (the reference template)
T03 — Add TEMPLATE_SOURCES map + GENERIC_FALLBACK_TYPST to a new typst-templates.ts
T04 — Wire template selection in document.service.ts
T05 — Build the reference demonstration .typ file (movement declaration)
T06 — Add remaining templates (passport, inspection-form, ched, ear-tag, eudr)

## Key design decisions

1. Typst sources stay TypeScript string constants (imported via inline strings), not separate .typ files loaded at runtime. This avoids adding a file-system load step to the existing pipeline.

2. Section type metadata (type: "fields" | "table") lets templates switch rendering strategies.

3. Logo and QR stay post-render. The .typ template reserves space with v(2.4cm) for the logo stamp.

4. Backward compatibility: types without a custom .typ layout fall back to GENERIC_FALLBACK_TYPST.

5. Internationalization is minimal: MK/EN dictionary lookups via inline Typst function, not tieflang.
