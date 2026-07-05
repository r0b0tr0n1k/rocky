// ── Health TRPC Error Map ──
import type { TRPCErrorMap } from "./types.js";

export const HEALTH_TRPC_ERROR_MAP: TRPCErrorMap = {
  HEALTH_NOT_FOUND: { code: "NOT_FOUND", message: "Resource not found" },
  HEALTH_FORBIDDEN: { code: "FORBIDDEN", message: "Vet not authorized on this farm" },
  HEALTH_VACCINE_EXPIRED: { code: "BAD_REQUEST", message: "Vaccine batch has expired" },
  HEALTH_ANIMAL_TOO_YOUNG: { code: "BAD_REQUEST", message: "Animal below minimum vaccination age" },
  HEALTH_BATCH_DEPLETED: { code: "BAD_REQUEST", message: "No remaining doses in batch" },
  HEALTH_ANIMAL_NOT_ALIVE: { code: "BAD_REQUEST", message: "Animal is not alive" },
  HEALTH_INVALID_INPUT: { code: "BAD_REQUEST", message: "Invalid input" },
  HEALTH_LAB_TEST_NOT_FOUND: { code: "NOT_FOUND", message: "Lab test not found" },
  HEALTH_VACCINE_DISEASE_CONFLICT: { code: "CONFLICT", message: "Vaccine already linked to this disease" },
  HEALTH_VACCINE_DISEASE_NOT_FOUND: { code: "NOT_FOUND", message: "Vaccine-disease link not found" },
};
