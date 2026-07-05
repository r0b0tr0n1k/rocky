// ── @Policy Decorator ──
// Declarative, transport-agnostic authorization for routers.
//
// Routers declare ACTIONS, not permissions:
//   @Policy({ action: "animal:create" })
//
// The policy engine resolves actions to whatever implementation is current.
// Today: checks principal.permissions.includes("animal:create").
// Tomorrow: ABAC rules, licensing, feature flags, maintenance mode.
//
// The decorator never changes — only the policy engine's rules evolve.

import "reflect-metadata";

export const POLICY_METADATA_KEY = "rocky:policy";

export interface PolicyMetadata {
  /** Action to authorize — NEVER "permission", always "action" */
  action?: string;
  /** Require authenticated session */
  authenticated?: boolean;
  /** Require organization membership */
  organization?: boolean;
  /** Require specific roles (shortcut) */
  roles?: string[];
  /** Require admin access (shortcut) */
  admin?: boolean;
}

/**
 * Declare what authorization is required for a router method or class.
 *
 * @example
 * ```typescript
 * @Router({ alias: "farm" })
 * @Policy({ authenticated: true })
 * export class FarmRouter {
 *
 *   @Query(...)
 *   async list() {}  // Any authenticated user
 *
 *   @Mutation(...)
 *   @Policy({ action: "eartag:order" })
 *   async placeOrder() {}  // authenticated + eartag:order
 *
 *   @Mutation(...)
 *   @Policy({ admin: true })
 *   async forceDelete() {}  // authenticated + SUPER_ADMIN
 * }
 * ```
 */
export function Policy(options: PolicyMetadata): MethodDecorator & ClassDecorator {
  return (target: object | Function, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
    if (propertyKey && descriptor) {
      // Method decorator
      Reflect.defineMetadata(POLICY_METADATA_KEY, options, descriptor.value);
    } else {
      // Class decorator
      Reflect.defineMetadata(POLICY_METADATA_KEY, options, target);
    }
  };
}

/**
 * Read @Policy metadata from a class constructor or method.
 * Returns merged metadata: method-level overrides class-level.
 */
export function getPolicyMetadata(target: object, methodName?: string): PolicyMetadata | undefined {
  // Try method-level first
  if (methodName) {
    const method = (target as Record<string, unknown>)[methodName];
    if (method && typeof method === "function") {
      const methodMeta = Reflect.getMetadata(POLICY_METADATA_KEY, method as object) as PolicyMetadata | undefined;
      if (methodMeta) return methodMeta;
    }
  }

  // Fall back to class-level
  return Reflect.getMetadata(POLICY_METADATA_KEY, target) as PolicyMetadata | undefined;
}
