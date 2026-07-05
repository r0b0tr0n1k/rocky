// ── Policy Engine ──
// Pluggable evaluation engine that resolves actions to authorization decisions.
//
// The engine receives a Principal (not raw RBAC) and evaluates rules.
// This abstraction allows the engine to evolve independently of routers.
//
// Today: simple permission check.
// Tomorrow: ABAC rules (ownership, org status, subscription, time constraints).

import type { Principal } from "../principal/principal.js";
import type { PolicyMetadata } from "./policy.decorator.js";

export interface PolicyDecision {
  allowed: boolean;
  reason?: string;
}

/**
 * Pluggable policy engine.
 * Injected as a provider — can be swapped for different implementations.
 */
export class PolicyEngine {
  /**
   * Evaluate a policy against a Principal.
   *
   * @returns Decision with allowed status and optional reason.
   */
  async evaluate(principal: Principal, policy: PolicyMetadata): Promise<PolicyDecision> {
    // ── authenticated check ──
    if (policy.authenticated && principal.id === "anonymous") {
      return { allowed: false, reason: "Authentication required" };
    }

    // ── admin check (shortcut) ──
    if (policy.admin && !principal.isAdmin()) {
      return { allowed: false, reason: "Admin access required" };
    }

    // ── roles check ──
    if (policy.roles && policy.roles.length > 0) {
      const hasRole = policy.roles.some((r) => principal.hasRole(r));
      if (!hasRole) {
        return {
          allowed: false,
          reason: `Required one of roles: ${policy.roles.join(", ")}`,
        };
      }
    }

    // ── organization check ──
    if (policy.organization && !principal.organization) {
      return {
        allowed: false,
        reason: "Organization membership required",
      };
    }

    // ── action check ──
    if (policy.action) {
      if (!principal.hasPermission(policy.action)) {
        return {
          allowed: false,
          reason: `Missing required permission: ${policy.action}`,
        };
      }
    }

    return { allowed: true };
  }
}
