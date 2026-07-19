/**
 * document-preset.typ — Base page layout for all Rocky documents
 *
 * Borrowed from TiefLetter's document_preset.typ with Rocky-specific
 * adaptations:
 *  - DejaVu Sans font (bundled, covers Latin + Cyrillic)
 *  - Logo area reserved at top (post-render stamped via @cantoo/pdf-lib)
 *  - Footer with page numbering
 *  - A4, 2cm margins
 *
 * == Usage ==
 * ```typst
 * #import "../presets/document-preset.typ": document-preset
 * #show: document-preset.with()
 * Content here...
 * ```
 */

#let document-preset(
  footer-left: none,
  footer-middle: none,
  footer-right: none,
  body,
) = {
  context {
    let has-footer = footer-left != none or footer-middle != none or footer-right != none

    set page(
      paper: "a4",
      margin: (top: 2cm, right: 2cm, bottom: if has-footer { 3.5cm } else { 2cm }, left: 2cm),
      footer-descent: 0.5cm,
      numbering: "1/1",
      footer: context {
        set text(size: 9pt, fill: rgb(120, 120, 120))
        if has-footer {
          box(width: 100%, inset: 8pt, grid(
            align: center,
            columns: 3,
            if footer-left != none { box(width: 1fr, align(left, footer-left)) },
            grid.vline(stroke: 0.3pt),
            if footer-middle != none { box(width: 1fr, align(center, footer-middle)) },
            grid.vline(stroke: 0.3pt),
            if footer-right != none { box(width: 1fr, align(right, footer-right)) },
          ))
        }
      },
    )

    // All Rocky documents use DejaVu Sans (bundled, Latin + Cyrillic)
    set text(font: "DejaVu Sans", size: 11pt)

    body
  }
}
