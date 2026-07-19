/**
 * signature.typ — Signature line + signatory name
 *
 * Borrowed from TiefLetter's utils.typ::sign().
 * Renders a horizontal line with the signatory's name below it.
 *
 * == Usage ==
 * ```typst
 * #import "../presets/signature.typ": sign
 * #sign("Inspector Name")
 * #sign("Authorized Person", width: 12em)
 * ```
 */

#let sign(name, width: 15em) = {
  v(2em)
  line(length: width, stroke: 0.5pt)
  v(-0.4em)
  [#name]
  v(1em)
}
