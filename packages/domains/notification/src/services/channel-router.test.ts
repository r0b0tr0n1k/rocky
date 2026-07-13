import { describe, expect, it } from "vitest";
import {
  resolveChannels,
  EMAIL_BODY_THRESHOLD,
  DEFAULT_CATEGORY_SMS_POLICY,
  type ChannelRouterInput,
  type CategorySmsPolicyMap,
} from "./channel-router.js";

const base: ChannelRouterInput = {
  priority: "normal",
  category: "BIRTH",
  messageLength: 40,
  hasAttachment: false,
  smsEnabled: true,
  confirmed: true,
  fallbackTtlExpired: false,
};

const planChannels = (i: ChannelRouterInput, p?: CategorySmsPolicyMap) =>
  resolveChannels(i, p).channels.map((c) => `${c.role}:${c.channel}${c.minimized ? "*" : ""}`);

describe("resolveChannels (ADR-0094)", () => {
  it("always routes to our app (push + in_app) as the secure default", () => {
    const plan = resolveChannels(base);
    expect(plan.channels.map((c) => c.channel)).toEqual(["push", "in_app"]);
    expect(plan.smsSuppressed).toBe(false);
  });

  it("routes long messages to email (Tier 1)", () => {
    const ch = planChannels({ ...base, messageLength: EMAIL_BODY_THRESHOLD + 1 });
    expect(ch).toContain("PRIMARY:email");
  });

  it("routes attachments to email regardless of length", () => {
    const ch = planChannels({ ...base, hasAttachment: true, messageLength: 10 });
    expect(ch).toContain("PRIMARY:email");
  });

  it("does NOT add SMS for a normal-priority message even when consenting", () => {
    expect(planChannels(base)).not.toContain("PRIMARY:sms*");
  });

  it("adds SMS (primary, minimized) for urgent/critical when allowed + consenting", () => {
    const ch = planChannels({ ...base, priority: "critical" });
    expect(ch).toContain("PRIMARY:sms*");
  });

  it("does NOT add SMS primary when smsEnabled is false (consent gate)", () => {
    const ch = planChannels({ ...base, priority: "critical", smsEnabled: false });
    expect(ch).not.toContain("PRIMARY:sms*");
  });

  it("does NOT add SMS primary when the category forbids primary", () => {
    const policy: CategorySmsPolicyMap = { BIRTH: { primary: false, fallback: true } };
    const ch = planChannels({ ...base, priority: "critical" }, policy);
    expect(ch).not.toContain("PRIMARY:sms*");
  });

  it("escalates to SMS (fallback, minimized) only when unreachable + ttl elapsed + allowed + consent", () => {
    const ch = planChannels({ ...base, confirmed: false, fallbackTtlExpired: true });
    expect(ch).toContain("FALLBACK:sms*");
    expect(ch).not.toContain("PRIMARY:sms*");
  });

  it("does NOT escalate when the app confirmed delivery", () => {
    const ch = planChannels({ ...base, confirmed: true, fallbackTtlExpired: true });
    expect(ch).not.toContain("FALLBACK:sms*");
  });

  it("does NOT escalate before the fallback TTL elapses", () => {
    const ch = planChannels({ ...base, confirmed: false, fallbackTtlExpired: false });
    expect(ch).not.toContain("FALLBACK:sms*");
  });

  it("SUPPRESSES SMS on fallback when the category forbids it - even if unreachable", () => {
    const policy: CategorySmsPolicyMap = { MARKETING: { primary: false, fallback: false } };
    const input: ChannelRouterInput = {
      ...base,
      category: "MARKETING",
      confirmed: false,
      fallbackTtlExpired: true,
    };
    const plan = resolveChannels(input, policy);
    expect(plan.channels.map((c) => c.channel)).toEqual(["push", "in_app"]);
    expect(plan.smsSuppressed).toBe(true);
    expect(plan.smsSuppressedReason).toBe("category suppresses SMS fallback");
  });

  it("does not flag suppression when fallback is merely gated by missing consent", () => {
    const plan = resolveChannels({ ...base, confirmed: false, fallbackTtlExpired: true, smsEnabled: false });
    expect(plan.smsSuppressed).toBe(false);
    expect(plan.channels.map((c) => c.channel)).toEqual(["push", "in_app"]);
  });

  it("marks every SMS decision minimized (pointer only, never the payload)", () => {
    const plan = resolveChannels({ ...base, priority: "critical", confirmed: false, fallbackTtlExpired: true });
    for (const c of plan.channels) {
      if (c.channel === "sms") expect(c.minimized).toBe(true);
    }
  });

  it("uses the default SMS policy for unknown categories", () => {
    expect(DEFAULT_CATEGORY_SMS_POLICY).toEqual({ primary: true, fallback: true });
  });
});
