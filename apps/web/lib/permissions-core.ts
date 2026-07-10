// SPDX-License-Identifier: UNLICENSED
//
// Pure client-side authorization mirrors (ADR-0042 §7). Extracted from
// `permissions.tsx` / `nav-config.ts` so they run in a node environment
// without pulling in React / Next.js. No runtime imports — only a type-only
// reference to the nav shapes.

import type { NavSection } from "./nav-config";

/** Mirror of `Principal.hasPermission`. */
export function clientCan(permissions: readonly string[], required: string): boolean {
  return permissions.includes(required);
}

/** Any-of variant. */
export function clientCanAny(permissions: readonly string[], required: readonly string[]): boolean {
  return required.some((p) => permissions.includes(p));
}

/** Role + RuleSet variant for Health (ADR-0045): require any of `requiredRoles`. */
export function clientCanRole(roles: readonly string[], requiredRoles: readonly string[]): boolean {
  return requiredRoles.some((r) => roles.includes(r));
}

/**
 * Filter nav sections/items by the principal's resolved permissions.
 * Fail CLOSED: items with a `permission` requirement are hidden unless held;
 * items with no `permission` are always visible. Empty sections are dropped.
 * Server `@Policy` remains the authoritative backstop (ADR-0042).
 */
export function filterNavByPermissions(sections: NavSection[], permissions: readonly string[]): NavSection[] {
  return sections
    .map((s) => ({
      ...s,
      items: s.items.filter((i) => !i.permission || permissions.includes(i.permission)),
    }))
    .filter((s) => s.items.length > 0);
}
