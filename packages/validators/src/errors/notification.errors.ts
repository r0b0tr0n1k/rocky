// ── Notification TRPC Error Map ──
import type { TRPCErrorMap } from "./types.js";

export const NOTIFICATION_TRPC_ERROR_MAP: TRPCErrorMap = {
  NOTIFICATION_NOT_FOUND: { code: "NOT_FOUND", message: "Notification not found" },
  NOTIFICATION_INVALID_INPUT: { code: "BAD_REQUEST", message: "Invalid notification input" },
  NOTIFICATION_SEND_FAILED: { code: "INTERNAL_SERVER_ERROR", message: "Send failed" },
  NOTIFICATION_BLOCKED: { code: "FORBIDDEN", message: "Notification blocked by preferences" },
  NOTIFICATION_TEMPLATE_NOT_FOUND: { code: "NOT_FOUND", message: "Template not found" },
  NOTIFICATION_DELIVERY_FAILED: { code: "INTERNAL_SERVER_ERROR", message: "Delivery failed" },
  NOTIFICATION_MAX_RETRIES_EXCEEDED: { code: "INTERNAL_SERVER_ERROR", message: "Max retries exceeded" },
  NOTIFICATION_RATE_LIMIT_EXCEEDED: { code: "TOO_MANY_REQUESTS", message: "Rate limit exceeded" },
};
