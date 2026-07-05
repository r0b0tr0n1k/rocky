// ── @RegisterPolicy Decorator ──
// Class decorator that scans a router class for @Policy() metadata
// (both class-level and method-level) and registers it in the PolicyRegistry.
//
// MUST appear AFTER @Policy() in the decorator stack so that
// @Policy() has already set the metadata by the time we scan it:
//
//   @Router({ alias: "farm" })
//   @RegisterPolicy("farm")     // ← scans metadata set by @Policy
//   @Policy({ authenticated: true })  // ← sets metadata first
//   export class FarmRouter { ... }
//
// Method-level @Policy decorators are on the prototype methods and
// are evaluated BEFORE class decorators, so their metadata is also
// available when @RegisterPolicy runs.

import { PolicyRegistry } from "./policy.registry.js";

/**
 * Register a router class in the PolicyRegistry after @Policy()
 * decorators have set their metadata.
 *
 * @param alias — tRPC router alias (must match @Router({ alias }))
 */
export function RegisterPolicy(alias: string): ClassDecorator {
  return (target: object) => {
    PolicyRegistry.register(alias, target as abstract new (...args: unknown[]) => unknown);
  };
}
