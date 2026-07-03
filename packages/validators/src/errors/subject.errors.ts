// ── Subject TRPC Error Map ──
import type { TRPCErrorMap } from "./types.js";

export const SUBJECT_TRPC_ERROR_MAP: TRPCErrorMap = {
  SUBJECT_NOT_FOUND: { code: "NOT_FOUND", message: "Subject not found" },
  SUBJECT_DUPLICATE_PERSONAL_ID: { code: "CONFLICT", message: "Duplicate personal ID" },
  SUBJECT_FORBIDDEN: { code: "FORBIDDEN", message: "Forbidden" },
  SUBJECT_INVALID_INPUT: { code: "BAD_REQUEST", message: "Invalid input" },
  SUBJECT_BINDING_NOT_FOUND: { code: "NOT_FOUND", message: "Farm-subject binding not found" },
};
