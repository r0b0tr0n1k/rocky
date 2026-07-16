/**
 * Generic Typst document template (ADR-0082)
 *
 * A single, data-driven `.typ` layout used by `DocumentService.generate` for
 * `format: "pdf"`. It reads the document model as a JSON string passed via
 * `sys.inputs.model`, decodes it, and renders a title + metadata + a
 * key/value field list. Per-document-type `.typ` layouts are a future
 * refinement; this proves the render → embed → sign pipeline generically.
 *
 * The PDF/A-3 wrapper (@e-invoice-eu) and PAdES sign (HSM) are applied
 * downstream — this file only produces the visual PDF.
 */

export const GENERIC_DOCUMENT_TYPST = `#set page(paper: "a4", margin: 2cm)
#set text(font: "DejaVu Sans", size: 11pt)
#set document(title: "Rocky Document")

#let raw = sys.inputs.at("model", default: "{}")
#let data = json.decode(raw)

#v(2.4cm)

= #data.at("title", default: "Document")
#text(size: 10pt, fill: rgb(90, 90, 90))[#data.at("subtitle", default: "")]

#line(length: 100%, stroke: rgb(80%, 80%, 80%))

#for field in data.at("fields", default: ()) [
  #block[
    *#field.at("label", default: ""):* #field.at("value", default: "")
  ]
]
`;

export interface DocumentModelMeta {
  /** H1 title (usually the template's human-readable name). */
  title: string;
  /** Subtitle line (usually `type · v<modelVersion>`). */
  subtitle: string;
}

export interface DocumentField {
  label: string;
  value: string;
}

/**
 * Flatten a document model into the shape the generic template expects and
 * serialize it to a single `sys.inputs` string (inputs are strings only).
 * Nested objects are JSON-stringified so they remain inspectable.
 */
export function buildDocumentModelInputs(
  model: Record<string, unknown>,
  meta: DocumentModelMeta,
): Record<string, string> {
  const fields: DocumentField[] = Object.entries(model).map(([label, value]) => ({
    label,
    value:
      value === null || value === undefined
        ? ""
        : typeof value === "object"
          ? JSON.stringify(value)
          : String(value),
  }));

  return {
    model: JSON.stringify({ title: meta.title, subtitle: meta.subtitle, fields }),
  };
}
