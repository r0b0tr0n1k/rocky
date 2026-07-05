import type { TRPCErrorEntry } from "./types.js";

export const PASSPORT_TRPC_ERROR_MAP: Record<string, TRPCErrorEntry> = {
  PASSPORT_NOT_FOUND: {
    code: "NOT_FOUND",
    message: "Passport not found",
  },
  PASSPORT_ALREADY_SEIZED: {
    code: "BAD_REQUEST",
    message: "Passport is already seized",
  },
  PASSPORT_INVALID_STATUS_TRANSITION: {
    code: "BAD_REQUEST",
    message: "Invalid passport status transition",
  },
  PASSPORT_INVALID_INPUT: {
    code: "BAD_REQUEST",
    message: "Invalid passport input",
  },
  PASSPORT_FORBIDDEN: {
    code: "FORBIDDEN",
    message: "You do not have permission to access this passport",
  },
  PASSPORT_ANIMAL_NOT_FOUND: {
    code: "NOT_FOUND",
    message: "Animal not found for passport issuance",
  },
  PASSPORT_NO_ACTIVE_PASSPORT: {
    code: "NOT_FOUND",
    message: "No active passport found",
  },
  PASSPORT_PASSPORT_EXISTS_FOR_ANIMAL: {
    code: "CONFLICT",
    message: "Animal already has an active passport",
  },
};
