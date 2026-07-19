/**
 * typst-templates.ts — Per-type Typst template sources
 *
 * Each exported constant is a Typst (.typ) template string used by the
 * render pipeline. The TEMPLATE_SOURCES map selects templates by
 * document type; GENERIC_FALLBACK_TYPST is the backward-compatible
 * fallback for types without a custom layout.
 *
 * This replaces the single flat GENERIC_DOCUMENT_TYPST with a catalog
 * of per-type templates (ADR-0107 Pillar A/B). Each template receives
 * a structured JSON model via `sys.inputs.model` with the shape:
 *   { title, subtitle, sections: [{ title, type, fields? rows? }] }
 *
 * == Build step ==
 * Inline string constants are developer-friendly but should eventually
 * be replaced by a build plugin that loads .typ files at compile time
 * (see ADR-0107 "future refinement"). For now, new templates are added
 * by pasting the .typ source here.
 */

// ── Presets (imported by templates) are embedded as Typst string
//    constants. In a later iteration, @myriaddreamin/typst.ts will
//    support virtual file imports so templates can `#import` presets
//    from the in-memory VFS directly rather than inlining.

import type { DocumentField, DocumentModelMeta } from "./typst-document.template.js";

/**
 * A single section in the structured model.
 *
 * ADR-0107 specifies that the model is an ordered list of sections,
 * each optionally typed so the Typst template can switch between
 * key-value fields, tables, and prose notes.
 */
export interface DocumentSection {
  title: string;
  type?: "fields" | "table" | "note";
  /** Fields for type === "fields" */
  fields?: DocumentField[];
  /** Table columns for type === "table" */
  columns?: number;
  /** Table header row for type === "table" */
  header?: string[];
  /** Table body rows for type === "table" */
  rows?: string[][];
  /** Prose content for type === "note" */
  content?: string;
}

/**
 * The structured model the render pipeline passes to per-type Typst templates
 * via sys.inputs.model (JSON-encoded).
 */
export interface DocumentTypstModel extends DocumentModelMeta {
  language?: string;
  generatedAt?: string;
  inspectorName?: string;
  sections: DocumentSection[];
}

// ── Fallback (backward-compatible generic template) ──────────────────
// Types without a custom layout render as the original flat key-value list.

export const GENERIC_FALLBACK_TYPST = `#set page(paper: "a4", margin: 2cm)
#set text(font: "DejaVu Sans", size: 11pt)
#set document(title: "Rocky Document")

#let raw = sys.inputs.at("model", default: "{}")
#let data = json.decode(raw)

= #data.at("title", default: "Document")
#text(size: 10pt, fill: rgb(90, 90, 90))[#data.at("subtitle", default: "")]
#line(length: 100%, stroke: rgb(80%, 80%, 80%))

#for section in data.at("sections", default: ()) [
  === #section.at("title", default: "")
  #for field in section.at("fields", default: ()) [
    #block[
      *#field.at("label", default: ""):* #field.at("value", default: "")
    ]
  ]
]
`;

// ── Movement / Transport Declaration ─────────────────────────────────
//
// The full .typ template lives at packages/pdf/src/typst/templates/movement.typ
// and is copied here as a string constant until a .typ → .ts build step exists.
// To update: edit the .typ file, then sync this string.

export const MOVEMENT_TYPST = `// ── Page setup (inlined document-preset) ──────────────────────
#set page(paper: "a4", margin: 2cm)
#set text(font: "DejaVu Sans", size: 11pt)

// ── Signature helper (inlined from signature.typ) ──────────────
#let sign(name, width: 15em) = {
  v(2em)
  line(length: width, stroke: 0.5pt)
  v(-0.4em)
  [#name]
  v(1em)
}

// ── i18n labels (inlined from i18n.typ) ───────────────────────
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

// ── Decode pipeline model ─────────────────────────────────────
#let raw = sys.inputs.at("model", default: "{}")
#let data = json.decode(raw)
#let sections = data.at("sections", default: ())
#let locale = data.at("language", default: "MK")

// ── Reserved top space for logo (post-render stamp) ───────────
#v(2.4cm)

// ── Title block ───────────────────────────────────────────────
= #data.at("title", default: tr("movement", locale: locale))
#text(size: 10pt, fill: rgb(90, 90, 90))[#data.at("subtitle", default: "")]
#line(length: 100%, stroke: rgb(80%, 80%, 80%))

// ── Sectioned content ─────────────────────────────────────────
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

// ── Signature block ────────────────────────────────────────────
#v(1.5em)
#line(length: 100%, stroke: rgb(80%, 80%, 80%))
#let inspector-name = data.at("inspectorName", default: "________________")
#sign(inspector-name)
`;

// ── TEMPLATE_SOURCES map ────────────────────────────────────────────
// Keyed by document type (matching DocumentTemplate.type).

export const TEMPLATE_SOURCES: ReadonlyMap<string, string> = new Map([
  ["movement", MOVEMENT_TYPST],
  // NOTE: passport, inspection-form, ched, ear-tag, eudr are stubs for now.
  // Each gets its own .typ template when the per-type layout is authored.
]);

/**
 * Resolve the Typst source for a document type.
 * Returns the per-type template, or the generic fallback when none exists.
 */
export function resolveTypstTemplate(type: string): string {
  return TEMPLATE_SOURCES.get(type) ?? GENERIC_FALLBACK_TYPST;
}

/**
 * Build the structured model for per-type Typst templates.
 *
 * ADR-0107: Instead of flattening to {fields}, the model preserves
 * the sectioned structure returned by mapToModel(). Each section is
 * independently renderable (selected via the `sections` option).
 *
 * For backward compatibility, types that don't yet return sections
 * get a single auto-generated section wrapping their flat fields.
 */
export function buildSectionedModel(model: Record<string, unknown>, meta: DocumentModelMeta): DocumentTypstModel {
  // Check if the model already has sections (ADR-0107 structured return)
  const rawSections = model.sections;
  if (Array.isArray(rawSections) && rawSections.length > 0) {
    return {
      title: meta.title,
      subtitle: meta.subtitle,
      sections: rawSections as DocumentSection[],
      language: (model.language as string) ?? "MK",
      generatedAt: (model.generatedAt as string) ?? new Date().toISOString(),
      inspectorName: model.inspectorName as string | undefined,
    };
  }

  // Fallback: auto-generate a single section from the flat model
  const fields: DocumentField[] = Object.entries(model)
    .filter(([key]) => key !== "sections" && key !== "language" && key !== "generatedAt")
    .map(([label, value]) => ({
      label,
      value:
        value === null || value === undefined ? "" : typeof value === "object" ? JSON.stringify(value) : String(value),
    }));

  return {
    title: meta.title,
    subtitle: meta.subtitle,
    language: (model.language as string) ?? "MK",
    generatedAt: (model.generatedAt as string) ?? new Date().toISOString(),
    sections: [{ title: meta.title, type: "fields", fields }],
  };
}
