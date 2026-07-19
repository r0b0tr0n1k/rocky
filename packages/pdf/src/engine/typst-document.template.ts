/**
 * Generic Typst document template (ADR-0082) — DEPRECATED
 *
 * @deprecated Use per-type templates from typst-templates.ts instead.
 * The single flat GENERIC_DOCUMENT_TYPST remains as the fallback for
 * document types without a custom .typ layout.
 *
 * Per-type templates live in packages/pdf/src/typst/templates/ and are
 * imported string-constants via the TEMPLATE_SOURCES map. The pipeline
 * selects them via resolveTypstTemplate(type).
 *
 * The PDF/A-3 wrapper and PAdES sign are applied downstream.
 */

import { resolveTypstTemplate, buildSectionedModel } from "./typst-templates.js";
import type { DocumentTypstModel } from "./typst-templates.js";

/**
 * @deprecated Use resolveTypstTemplate(type) instead.
 * Kept for backward compatibility with tests.
 */
export const GENERIC_DOCUMENT_TYPST = resolveTypstTemplate("__fallback__");

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

export type { DocumentTypstModel, DocumentSection } from "./typst-templates.js";

/**
 * Build structured model inputs for a per-type Typst template.
 *
 * ADR-0107: The model is passed as a sectioned JSON (not flat fields),
 * allowing per-type .typ templates to render tables, key-value fields,
 * and prose notes differently. Backward-compatible: types without
 * sections get a single auto-generated section.
 */
export function buildDocumentModelInputs(
  model: Record<string, unknown>,
  meta: DocumentModelMeta,
): Record<string, string> {
  const structured = buildSectionedModel(model, meta);
  return {
    model: JSON.stringify(structured),
  };
}

/**
 * Resolve the Typst template source for a document type.
 * Delegates to typst-templates.ts TEMPLATE_SOURCES map.
 */
export { resolveTypstTemplate, TEMPLATE_SOURCES } from "./typst-templates.js";
