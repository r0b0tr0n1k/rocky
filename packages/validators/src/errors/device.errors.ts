// ── Device tRPC Error Map ──

import type { TRPCErrorEntry } from "./types.js";

export const DEVICE_TRPC_ERROR_MAP: Record<string, TRPCErrorEntry> = {
  DEVICE_NOT_FOUND: {
    code: "NOT_FOUND",
    message: "Device not found",
  },
  DEVICE_BLOCKED: {
    code: "FORBIDDEN",
    message: "This device has been blocked",
  },
  DEVICE_INVALID_INPUT: {
    code: "BAD_REQUEST",
    message: "Invalid device input",
  },
  DEVICE_FORBIDDEN: {
    code: "FORBIDDEN",
    message: "You do not have permission to access this device",
  },
};
