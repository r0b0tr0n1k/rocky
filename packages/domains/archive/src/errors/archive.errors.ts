/**
 * Archive Domain Errors
 *
 * Following the Error Sovereignty Doctrine:
 * - Domain services return Result<T, Error>
 * - Errors are defined here for domain-specific failures
 * - tRPC layer maps these to TRPCError
 */

export const ARCHIVE_ERRORS = {
  NOT_FOUND: "ARCHIVE_NOT_FOUND",
  FORBIDDEN: "ARCHIVE_FORBIDDEN",
  RETENTION_EXPIRED: "ARCHIVE_RETENTION_EXPIRED",
  ALREADY_ARCHIVED: "ARCHIVE_ALREADY_ARCHIVED",
  INVALID_INPUT: "ARCHIVE_INVALID_INPUT",
} as const;

export type ArchiveErrorCode = (typeof ARCHIVE_ERRORS)[keyof typeof ARCHIVE_ERRORS];

export class ArchiveError extends Error {
  constructor(
    public readonly code: ArchiveErrorCode,
    public readonly context?: Record<string, unknown>,
  ) {
    super(code);
    this.name = "ArchiveError";
  }
}

export const archiveErr = (
  code: ArchiveErrorCode,
  context?: Record<string, unknown>,
): ArchiveError => new ArchiveError(code, context);
