/**
 * i18n.typ — Locale dictionary for Rocky documents
 *
 * Minimal internationalization: MK (Macedonian) and EN (English) label
 * lookup. Unlike TiefLetter's tieflang (which pulls in a full package
 * dependency), this module is self-contained and model-driven — the
 * TypeScript mapToModel() already populates translated field values.
 * The Typst template only needs to format section headings and static
 * labels.
 *
 * Usage:
 * ```typst
 * #import "../presets/i18n.typ": labels-mk, labels-en, tr
 * #let locale = data.at("language", default: "MK")
 * #let _(key) = if locale == "MK" { labels-mk.at(key, default: key) }
 *               else { labels-en.at(key, default: key) }
 * ```
 */

/// Macedonian labels
#let labels-mk = (
  document: "Документ",
  movement: "Пријава за движење",
  passport: "Пасош за говеда",
  inspection: "Записник за инспекција",
  declaration: "Декларација",
  animal: "Животно",
  farm: "Фарма",
  from: "Појдовна фарма",
  to: "Пристижна фарма",
  death: "Угинување",
  verification: "Верификација",
  signature: "Потпис",
  date: "Датум",
  earTag: "Ушна маркица",
  inspector: "Инспектор",
  owner: "Сопственик",
  keeper: "Чувар",
  address: "Адреса",
  municipality: "Општина",
);

/// English labels
#let labels-en = (
  document: "Document",
  movement: "Movement Declaration",
  passport: "Cattle Passport",
  inspection: "Inspection Form",
  declaration: "Declaration",
  animal: "Animal",
  farm: "Farm",
  from: "Departure Farm",
  to: "Arrival Farm",
  death: "Death",
  verification: "Verification",
  signature: "Signature",
  date: "Date",
  earTag: "Ear Tag",
  inspector: "Inspector",
  owner: "Owner",
  keeper: "Keeper",
  address: "Address",
  municipality: "Municipality",
);

/// Resolve a label key for the given locale.
#let tr(key, locale: "MK") = {
  if locale == "MK" {
    labels-mk.at(key, default: str(key))
  } else {
    labels-en.at(key, default: str(key))
  }
}
