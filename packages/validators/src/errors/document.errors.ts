// ── Document TRPC Error Map ──
import type { TRPCErrorMap } from "./types.js";

export const DOCUMENT_TRPC_ERROR_MAP: TRPCErrorMap = {
  DOCUMENT_TEMPLATE_NOT_FOUND: { code: "NOT_FOUND", message: "Document template not found for this type" },
  DOCUMENT_UNSUPPORTED_FORMAT: { code: "BAD_REQUEST", message: "Unsupported output format. Supported: yaml, xml" },
  DOCUMENT_FETCH_FAILED: { code: "NOT_FOUND", message: "Failed to fetch data for document generation" },
  DOCUMENT_VALIDATION_FAILED: { code: "INTERNAL_SERVER_ERROR", message: "Document model validation failed" },
  DOCUMENT_SERIALIZATION_FAILED: { code: "INTERNAL_SERVER_ERROR", message: "Failed to serialize document" },
};
