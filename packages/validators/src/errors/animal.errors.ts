// ── Animal TRPC Error Map ──
import type { TRPCErrorMap } from "./types.js";

export const ANIMAL_TRPC_ERROR_MAP: TRPCErrorMap = {
  ANIMAL_NOT_FOUND: { code: "NOT_FOUND", message: "Animal not found" },
  ANIMAL_DUPLICATE_EAR_TAG: { code: "CONFLICT", message: "Duplicate ear tag" },
  ANIMAL_FORBIDDEN: { code: "FORBIDDEN", message: "Forbidden" },
  ANIMAL_INVALID_INPUT: { code: "BAD_REQUEST", message: "Invalid input" },
};
