/**
 * table-utils.typ — Styled table helpers for Rocky documents
 *
 * == Field table ==
 * Two-column label|value table with optional alternating row shading.
 * Used for metadata blocks (farm details, animal info, verification).
 *
 * == Animal / line-item table ==
 * Full-width table with header row, column alignment, and optional totals.
 * Used for animal lists, inspection checklist rows, lab results.
 *
 * Borrowed patterns from TiefLetter's invoice.typ line-item table
 * (columns, align, table.header, hline separators).
 */

/// Two-column label|value table with optional shading.
#let field-table(
  data: (),
  label-width: auto,
) = {
  table(
    columns: (label-width, 1fr),
    inset: 6pt,
    stroke: none,
    ..data.flatten()
  )
}

/// Full-width table with a bold header row and hline separators.
///   rows: array of arrays (each inner array is one row of cells)
///   columns: column specifiers (e.g. (auto, 1fr, auto))
///   header: row of header cells (optional, default: first row)
///   align-per-col: alignment per column (default: left for all)
#let data-table(
  data: (),
  columns: (auto, 1fr),
  header: none,
  align-per-col: (),
  caption: none,
) = {
  if caption != none {
    [#caption]
    v(0.3em)
  }
  set table(stroke: 0.5pt)
  table(
    columns: columns,
    align: if align-percol != () { (col, row) => align-per-col.at(col, default: left) } else { left },
    inset: 6pt,
    ..if header != none {
      (
        table.hline(stroke: 0.8pt),
        ..header.map(cell => { cell }),
        table.hline(stroke: 0.5pt),
      )
    },
    ..data.map(row => row.map(cell => { cell })).flatten(),
    table.hline(stroke: 0.5pt),
  )
}
