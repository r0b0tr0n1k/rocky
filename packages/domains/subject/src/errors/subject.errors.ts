/**
 * Subject Domain Errors
 */

export const SUBJECT_ERRORS = {
  NOT_FOUND: "SUBJECT_NOT_FOUND",
  DUPLICATE_PERSONAL_ID: "SUBJECT_DUPLICATE_PERSONAL_ID",
  INVALID_INPUT: "SUBJECT_INVALID_INPUT",
  FORBIDDEN: "SUBJECT_FORBIDDEN",
  BINDING_NOT_FOUND: "SUBJECT_BINDING_NOT_FOUND",
} as const;

export type SubjectErrorCode =
  (typeof SUBJECT_ERRORS)[keyof typeof SUBJECT_ERRORS];

export class SubjectError extends Error {
  constructor(
    public readonly code: SubjectErrorCode,
    public readonly context?: Record<string, unknown>,
  ) {
    super(code);
    this.name = "SubjectError";
  }
}

export const subjectErr = (
  code: SubjectErrorCode,
  context?: Record<string, unknown>,
): SubjectError => new SubjectError(code, context);
