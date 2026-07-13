/**
 * ChannelRouter — policy-driven, security-tiered channel selection (ADR-0094).
 *
 * The Notification domain decides channels from *intent*, not from a caller-
 * supplied `type`. Channels are tiered by trust boundary:
 *   - Tier 0 (preferred): our app — push + in_app (TLS, authenticated, in-boundary).
 *   - Tier 1 (external, acceptable): email — long body / PDF attachment.
 *   - Tier 2 (last resort, minimal): SMS — plaintext, PII-leaking; consent-gated,
 *     content-minimized (pointer only), and per-category suppressible.
 *
 * The function is PURE and DETERMINISTIC so it can be exhaustively unit-tested
 * with no provider, DB, or network. The real SMS transport is deferred (ADR-0094
 * §7) — this module only *decides*; it never sends.
 */

export type ChannelName = "push" | "in_app" | "email" | "sms" | "webhook";
export type ChannelRole = "PRIMARY" | "FALLBACK";

export interface ChannelDecision {
  channel: ChannelName;
  role: ChannelRole;
  /** True when the channel must carry only a pointer, not the real content (SMS). */
  minimized: boolean;
}

export type NotificationPriority = "normal" | "urgent" | "critical";

export interface ChannelRouterInput {
  priority: NotificationPriority;
  category: string;
  messageLength: number;
  hasAttachment: boolean;
  /** User consent for SMS (notification_preferences.sms_enabled). */
  smsEnabled: boolean;
  /** App delivery report received (Android/iOS confirmDelivery). */
  confirmed: boolean;
  /** Escalation window elapsed with no confirmation. */
  fallbackTtlExpired: boolean;
}

/** Per-category SMS permission: primary (important) and/or fallback (unreachable). */
export interface CategorySmsPolicy {
  primary: boolean;
  fallback: boolean;
}

export interface ChannelPlan {
  channels: ChannelDecision[];
  /** SMS was suppressed by category policy even on fallback. */
  smsSuppressed: boolean;
  smsSuppressedReason?: string;
}

/** Bodies longer than this (chars) are routed to email rather than the app. */
export const EMAIL_BODY_THRESHOLD = 160;

/** Default SMS permission when a category has no explicit policy. */
export const DEFAULT_CATEGORY_SMS_POLICY: CategorySmsPolicy = { primary: true, fallback: true };

export type CategorySmsPolicyMap = Record<string, CategorySmsPolicy>;

/**
 * Resolve the channel plan for a notification from intent (ADR-0094 §3).
 *
 * @param input     intent-derived facts about the message + recipient state.
 * @param categoryPolicy  optional per-category SMS overrides; defaults to
 *                         {@link DEFAULT_CATEGORY_SMS_POLICY} for unknown categories.
 */
export function resolveChannels(
  input: ChannelRouterInput,
  categoryPolicy: CategorySmsPolicyMap = {},
): ChannelPlan {
  const policy = categoryPolicy[input.category] ?? DEFAULT_CATEGORY_SMS_POLICY;
  const isImportant = input.priority === "urgent" || input.priority === "critical";

  const channels: ChannelDecision[] = [
    { channel: "push", role: "PRIMARY", minimized: false },
    { channel: "in_app", role: "PRIMARY", minimized: false },
  ];

  if (input.hasAttachment || input.messageLength > EMAIL_BODY_THRESHOLD) {
    channels.push({ channel: "email", role: "PRIMARY", minimized: false });
  }

  // SMS as a primary channel for important messages the category allows + consent.
  if (isImportant && policy.primary && input.smsEnabled) {
    channels.push({ channel: "sms", role: "PRIMARY", minimized: true });
  }

  // SMS fallback only when the app did NOT confirm and the category allows it.
  // `smsSuppressed` means the CATEGORY forbids fallback (not mere missing consent).
  let smsSuppressed = false;
  if (!input.confirmed && input.fallbackTtlExpired) {
    if (policy.fallback && input.smsEnabled) {
      channels.push({ channel: "sms", role: "FALLBACK", minimized: true });
    } else if (!policy.fallback) {
      smsSuppressed = true;
    }
  }

  return {
    channels,
    smsSuppressed,
    smsSuppressedReason: smsSuppressed ? "category suppresses SMS fallback" : undefined,
  };
}
