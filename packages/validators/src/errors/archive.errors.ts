// ── Archive TRPC Error Map ──
import type { TRPCErrorMap } from "./types.js";

export const ARCHIVE_TRPC_ERROR_MAP: TRPCErrorMap = {
  ARCHIVE_NOT_FOUND: { code: "NOT_FOUND", message: "Archive document not found" },
  ARCHIVE_FORBIDDEN: { code: "FORBIDDEN", message: "Permission denied" },
  ARCHIVE_RETENTION_EXPIRED: { code: "BAD_REQUEST", message: "Document past retention period" },
  ARCHIVE_ALREADY_ARCHIVED: { code: "CONFLICT", message: "Document already archived" },
  ARCHIVE_INVALID_INPUT: { code: "BAD_REQUEST", message: "Invalid input" },
};
