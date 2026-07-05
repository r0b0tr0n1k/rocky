// ── Policy Registry ──
// Static registry that maps tRPC procedure paths to @Policy() metadata.
//
// Usage:
//   1. Router decorated with @RegisterPolicy("alias") scans its methods
//   2. @Policy() decorators at class + method level attach metadata via Reflect
//   3. PolicyResolver looks up by procedure path at runtime
//
// Pure static map — no DI needed at decorator time.

import { POLICY_METADATA_KEY, type PolicyMetadata } from "./policy.decorator.js";

/**
 * Static registry mapping "alias.methodName" → merged PolicyMetadata.
 * Populated by @RegisterPolicy() decorator at definition time.
 */
export class PolicyRegistry {
  /** Map keyed by "alias.methodName" */
  private static readonly procedurePolicies = new Map<string, PolicyMetadata>();

  /**
   * Register a router class under its tRPC alias.
   * Scans the class prototype for @Policy() metadata on all methods,
   * merges with class-level defaults.
   */
  static register(alias: string, target: abstract new (...args: unknown[]) => unknown): void {
    // ── Read class-level policy ──
    const classPolicy = Reflect.getMetadata(POLICY_METADATA_KEY, target) as PolicyMetadata | undefined;

    // ── Scan prototype methods for @Policy() metadata ──
    const proto = target.prototype as Record<string, unknown>;
    const methodNames = Object.getOwnPropertyNames(proto).filter(
      (name) => name !== "constructor" && typeof proto[name] === "function",
    );

    for (const methodName of methodNames) {
      const methodFn = proto[methodName] as object;
      const methodPolicy = Reflect.getMetadata(POLICY_METADATA_KEY, methodFn) as PolicyMetadata | undefined;

      // Merge: method-level overrides class-level defaults
      const merged: PolicyMetadata = { ...classPolicy, ...methodPolicy };

      // Only register if there's actually a policy defined (non-empty)
      if (Object.keys(merged).length > 0) {
        const key = `${alias}.${methodName}`;
        PolicyRegistry.procedurePolicies.set(key, merged);
      }
    }
  }

  /**
   * Look up merged PolicyMetadata for a procedure path.
   * @param path — e.g. "farm.list"
   * @returns Merged policy metadata, or undefined if no policy is set
   */
  static get(path: string): PolicyMetadata | undefined {
    // Try exact match first (method-level policy)
    const exact = PolicyRegistry.procedurePolicies.get(path);
    if (exact) return exact;

    // Fall back: find any entry with this alias prefix
    const dot = path.indexOf(".");
    if (dot !== -1) {
      const _alias = path.slice(0, dot);
      for (const [, value] of PolicyRegistry.procedurePolicies) {
        if (value !== undefined) return value;
      }
    }

    return undefined;
  }
}
