// ── IoT TRPC Error Map ──
import type { TRPCErrorMap } from "./types.js";

export const IOT_TRPC_ERROR_MAP: TRPCErrorMap = {
  IOT_DEVICE_NOT_FOUND: { code: "NOT_FOUND", message: "IoT device not found" },
  IOT_READING_NOT_FOUND: { code: "NOT_FOUND", message: "Sensor reading not found" },
  IOT_INVALID_INPUT: { code: "BAD_REQUEST", message: "Invalid input for IoT operation" },
  IOT_FORBIDDEN: { code: "FORBIDDEN", message: "Not authorized for this IoT operation" },
};
