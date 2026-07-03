// ── Movement TRPC Error Map ──
import type { TRPCErrorMap } from "./types.js";

export const MOVEMENT_TRPC_ERROR_MAP: TRPCErrorMap = {
  MOVEMENT_NOT_FOUND: { code: "NOT_FOUND", message: "Movement not found" },
  MOVEMENT_INVALID_DATES: { code: "BAD_REQUEST", message: "Invalid movement dates" },
  MOVEMENT_SAME_FARM_ERROR: { code: "BAD_REQUEST", message: "Cannot move animal to same farm" },
  MOVEMENT_FORBIDDEN: { code: "FORBIDDEN", message: "Forbidden" },
  MOVEMENT_INVALID_INPUT: { code: "BAD_REQUEST", message: "Invalid input" },
};
