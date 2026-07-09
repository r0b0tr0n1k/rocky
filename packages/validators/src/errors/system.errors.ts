// ── System TRPC Error Map ──
import type { TRPCErrorMap } from "./types.js";

export const SYSTEM_TRPC_ERROR_MAP: TRPCErrorMap = {
  SYSTEM_MODULE_NOT_FOUND: { code: "NOT_FOUND", message: "Module not found" },
  SYSTEM_PARAMETER_NOT_FOUND: { code: "NOT_FOUND", message: "System parameter not found" },
  SYSTEM_PARAMETER_NOT_EDITABLE: { code: "FORBIDDEN", message: "System parameter is not editable" },
  SYSTEM_INVALID_INPUT: { code: "BAD_REQUEST", message: "Invalid input" },
};
