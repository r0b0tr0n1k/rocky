import type { TRPCErrorEntry } from "./types.js";

export const CORRECTION_TRPC_ERROR_MAP: Record<string, TRPCErrorEntry> = {
  CORRECTION_NOT_FOUND: {
    code: "NOT_FOUND",
    message: "Correction not found",
  },
  CORRECTION_INVALID_STATUS_TRANSITION: {
    code: "BAD_REQUEST",
    message: "Invalid correction status transition",
  },
  CORRECTION_INVALID_INPUT: {
    code: "BAD_REQUEST",
    message: "Invalid correction input",
  },
  CORRECTION_FORBIDDEN: {
    code: "FORBIDDEN",
    message: "You do not have permission to access this correction",
  },
  CORRECTION_ESCALATION_REQUIRED: {
    code: "BAD_REQUEST",
    message: "This correction requires escalation to VI",
  },
  CORRECTION_ALREADY_RESOLVED: {
    code: "BAD_REQUEST",
    message: "This correction is already resolved",
  },
};
