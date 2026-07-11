/**
 * Document Generation Errors
 *
 * Following the Error Sovereignty Doctrine:
 * - DocumentService returns Result<T, DocumentError>
 * - Errors are defined here for document-specific failures
 * - tRPC layer maps these to TRPCError
 */

export const DOCUMENT_ERRORS = {
  TEMPLATE_NOT_FOUND: "DOCUMENT_TEMPLATE_NOT_FOUND",
  UNSUPPORTED_FORMAT: "DOCUMENT_UNSUPPORTED_FORMAT",
  FETCH_FAILED: "DOCUMENT_FETCH_FAILED",
  VALIDATION_FAILED: "DOCUMENT_VALIDATION_FAILED",
  SERIALIZATION_FAILED: "DOCUMENT_SERIALIZATION_FAILED",
  CHED_PRECONDITION_FAILED: "DOCUMENT_CHED_PRECONDITION_FAILED",
} as const;

export type DocumentErrorCode = (typeof DOCUMENT_ERRORS)[keyof typeof DOCUMENT_ERRORS];

export class DocumentError extends Error {
  constructor(
    public readonly code: DocumentErrorCode,
    public readonly context?: Record<string, unknown>,
  ) {
    super(code);
    this.name = "DocumentError";
  }
}

export const documentErr = (
  code: DocumentErrorCode,
  context?: Record<string, unknown>,
): DocumentError => new DocumentError(code, context);
