// ── Inspection TRPC Error Map ──
import type { TRPCErrorMap } from "./types.js";

export const INSPECTION_TRPC_ERROR_MAP: TRPCErrorMap = {
  INSPECTION_NOT_FOUND: { code: "NOT_FOUND", message: "Inspection not found" },
  INSPECTION_FORBIDDEN: { code: "FORBIDDEN", message: "Permission denied" },
  INSPECTION_FARM_ALREADY_INSPECTED: { code: "CONFLICT", message: "Farm already has an active inspection" },
  INSPECTION_INVALID_STATUS_TRANSITION: { code: "BAD_REQUEST", message: "Invalid inspection status transition" },
  INSPECTION_INVALID_INPUT: { code: "BAD_REQUEST", message: "Invalid input" },
};
