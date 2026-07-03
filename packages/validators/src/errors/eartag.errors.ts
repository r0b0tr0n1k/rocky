// ── EarTag TRPC Error Map ──
import type { TRPCErrorMap } from "./types.js";

export const EARTAG_TRPC_ERROR_MAP: TRPCErrorMap = {
  EARTAG_NOT_FOUND: { code: "NOT_FOUND", message: "Ear tag not found" },
  EARTAG_ORDER_NOT_FOUND: { code: "NOT_FOUND", message: "Ear tag order not found" },
  EARTAG_ALREADY_ASSIGNED: { code: "CONFLICT", message: "Ear tag already assigned" },
  EARTAG_DUPLICATE_TAG: { code: "CONFLICT", message: "Duplicate ear tag number" },
  EARTAG_INVALID_STATUS_TRANSITION: { code: "BAD_REQUEST", message: "Invalid status transition" },
  EARTAG_INVALID_INPUT: { code: "BAD_REQUEST", message: "Invalid input" },
  EARTAG_FORBIDDEN: { code: "FORBIDDEN", message: "Forbidden" },
};
