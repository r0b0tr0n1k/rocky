/**
 * movement.typ — Movement / Transport Declaration
 *
 * Per-type Typst template for the Rocky movement declaration PDF.
 * Demonstrates the TiefLetter-inspired layered composition pattern:
 *   document-preset (page/footer) → sectioned content → signature
 *
 * == Pipeline Integration ==
 * This template receives a JSON model via sys.inputs.model with the shape:
 *   {
 *     title: "Movement / Transport Declaration",
 *     subtitle: "movement · v1.0",
 *     sections: [
 *       { title: "Movement Details", type: "fields", fields: [...] },
 *       { title: "Animal Information", type: "table", columns: 3,
 *         header: ["Property", "Value"],
 *         rows: [...] },
 *       ...
 *     ]
 *   }
 *
 * == Borrowed from TiefLetter ==
 * - Layered show: preset.with(...) wrapper (document-preset)
 * - Section-based rendering via for-loop over data sections
 * - Typed sections that switch between key-value fields and tables
 * - Signature block at end
 *
 * == NOT borrowed (WASM constraint) ==
 * - Inline QR (TiefLetter uses tiaoma.qrcode()) — Rocky stamps QR post-render
 * - Logo/banner image — Rocky stamps logo post-render via @cantoo/pdf-lib
 *
 * == Usage (driven by TypeScript pipeline, not manually) ==
 *   renderTypst({ template: MOVEMENT_TYPST, inputs })
 */

// ── Page setup ─────────────────────────────────────────────────────
#set page(paper: "a4", margin: 2cm)
#set text(font: "DejaVu Sans", size: 11pt)

// ── Signature helper ───────────────────────────────────────────────
#let sign(name, width: 15em) = {
  v(2em)
  line(length: width, stroke: 0.5pt)
  v(-0.4em)
  [#name]
  v(1em)
}

// ── i18n labels ────────────────────────────────────────────────────
#let labels-mk = (
  movement: "\u041F\u0440\u0438\u0458\u0430\u0432\u0430 \u0437\u0430 \u0434\u0432\u0438\u0436\u0435\u045A\u0435",
  document: "\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442",
)
#let labels-en = (
  movement: "Movement Declaration",
  document: "Document",
)
#let tr(key, locale: "MK") = {
  if locale == "MK" { labels-mk.at(key, default: str(key)) }
  else { labels-en.at(key, default: str(key)) }
}

// ── Decode pipeline model ──────────────────────────────────────────
#let raw = sys.inputs.at("model", default: "{}")
#let data = json.decode(raw)
#let sections = data.at("sections", default: ())
#let locale = data.at("language", default: "MK")

// Reserved top space for logo (stamped post-render)
#v(2.4cm)

// Title block
= #data.at("title", default: tr("movement", locale: locale))
#text(size: 10pt, fill: rgb(90, 90, 90))[#data.at("subtitle", default: "")]
#line(length: 100%, stroke: rgb(80%, 80%, 80%))

// Sectioned content
#for section in sections [
  #let sec-type = section.at("type", default: "fields")

  // Table section (e.g. animal list, farm details)
  #if sec-type == "table" [
    #v(0.8em)
    === #section.at("title", default: "")
    #let cols = section.at("columns", default: 2)
    #let header = section.at("header", default: ())
    #let rows = section.at("rows", default: ())
    #set table(stroke: 0.5pt)
    #table(
      columns: if cols == 2 { (auto, 1fr) } else if cols == 3 { (auto, auto, 1fr) } else if cols == 1 { (1fr,) } else { (auto,) * cols },
      inset: 6pt,
      align: (left, left),
      ..if header.len() > 0 {
        (table.hline(stroke: 0.8pt), ..header.map(cell => { [#cell] }), table.hline(stroke: 0.5pt))
      },
      ..rows.map(row => row.map(cell => { [#cell] })).flatten(),
      table.hline(stroke: 0.5pt),
    )

  // Fields section (key-value pairs)
  ] else if sec-type == "fields" [
    #v(0.5em)
    === #section.at("title", default: "")
    #let fields = section.at("fields", default: ())
    #table(
      columns: (auto, 1fr),
      inset: 4pt,
      stroke: none,
      ..fields.map(field => ([#field.at("label", default: ""):], [#field.at("value", default: "")])).flatten()
    )

  // Note section (prose paragraph)
  ] else if sec-type == "note" [
    #v(0.3em)
    #section.at("content", default: "")

  // Empty fallback
  ] else []
]

// Signature block
#v(1.5em)
#line(length: 100%, stroke: rgb(80%, 80%, 80%))
#let inspector-name = data.at("inspectorName", default: "________________")
#sign(inspector-name)
