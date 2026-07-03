/**
 * Notification Domain Errors
 *
 * Following Error Sovereignty Doctrine: 8 error codes covering all
 * distinct UI branching scenarios. Channel-specific failures were
 * consolidated (frontend doesn't branch by channel) and template
 * render failure folded into TEMPLATE_NOT_FOUND.
 *
 * Codes used in practice: NOT_FOUND, TEMPLATE_NOT_FOUND
 * Future: SEND_FAILED, BLOCKED, RATE_LIMIT_EXCEEDED, DELIVERY_FAILED,
 *         MAX_RETRIES_EXCEEDED, INVALID_INPUT
 */

export const NOTIFICATION_ERRORS = {
  // General
  NOT_FOUND: "NOTIFICATION_NOT_FOUND",

  // Input validation
  INVALID_INPUT: "NOTIFICATION_INVALID_INPUT",

  // Sending
  SEND_FAILED: "NOTIFICATION_SEND_FAILED",
  BLOCKED: "NOTIFICATION_BLOCKED",

  // Template
  TEMPLATE_NOT_FOUND: "NOTIFICATION_TEMPLATE_NOT_FOUND",

  // Delivery lifecycle
  DELIVERY_FAILED: "NOTIFICATION_DELIVERY_FAILED",
  MAX_RETRIES_EXCEEDED: "NOTIFICATION_MAX_RETRIES_EXCEEDED",

  // Rate limiting
  RATE_LIMIT_EXCEEDED: "NOTIFICATION_RATE_LIMIT_EXCEEDED",
} as const;

export class NotificationError extends Error {
  constructor(
    public readonly code: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(code);
    this.name = "NotificationError";
  }
}

export const notificationErr = (
  code: (typeof NOTIFICATION_ERRORS)[keyof typeof NOTIFICATION_ERRORS],
  context?: Record<string, unknown>,
): NotificationError => new NotificationError(code, context);
