// ── @rocky/pdf ──
// Document generation framework — YAML/XML intermediate output with pluggable PDF engine (future).

// Engine
export { DocumentRegistry } from "./engine/document-registry.js";
export { type DocumentTemplate, BaseDocumentTemplate } from "./engine/document-template.js";
export { serializeToYaml, isFormatSupported } from "./engine/yaml-serializer.js";
export type { DocumentFormat } from "./engine/yaml-serializer.js";

// Module
export { PdfModule } from "./pdf.module.js";

// Templates
export { InspectionFormTemplate } from "./templates/inspection-form.template.js";
export { PassportTemplate } from "./templates/passport.template.js";
export { MovementTemplate } from "./templates/movement.template.js";

// Services
export { DocumentService } from "./services/document.service.js";
export type { DocumentGenerateInput, DocumentResponse } from "./services/document.service.js";

// Errors
export { DocumentError, DOCUMENT_ERRORS, documentErr } from "./errors/document.errors.js";
export type { DocumentErrorCode } from "./errors/document.errors.js";
