// ── Farm TRPC Error Map ──
import type { TRPCErrorMap } from "./types.js";

export const FARM_TRPC_ERROR_MAP: TRPCErrorMap = {
  FARM_NOT_FOUND: { code: "NOT_FOUND", message: "Farm not found" },
  FARM_DUPLICATE_ID: { code: "CONFLICT", message: "Duplicate farm ID" },
  FARM_FORBIDDEN: { code: "FORBIDDEN", message: "Forbidden" },
  FARM_INVALID_INPUT: { code: "BAD_REQUEST", message: "Invalid input" },
};
