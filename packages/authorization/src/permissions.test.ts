import { describe, expect, it } from "vitest";
import {
  ALL_PERMISSIONS,
  Permissions,
  formatPermission,
  isPermission,
  type Permission,
} from "@rocky/validators/rbac";

// ── Confirm the working pattern: the isomorphic typed Permission catalog ──
// This is the single source of truth (ADR-0050 D1) shared by the server
// `@Policy` system and the client `clientCan`/`useCan` gates. The WO-101
// drift test proves it mirrors the seed; here we prove the *helpers* behave
// and the type narrows — i.e. that the catalog is safe to use in the UI.

describe("Typed Permission Catalog — isomorphic SSOT (ADR-0050 D1)", () => {
  it("isPermission narrows known literals and rejects unknown", () => {
    expect(isPermission("animal:register")).toBe(true);
    expect(isPermission("eartag:order")).toBe(true);
    expect(isPermission("not-a-permission")).toBe(false);
    expect(isPermission("animal:nope")).toBe(false);
  });

  it("isPermission is a real type guard (narrows string → Permission)", () => {
    const value: string = "health:write";
    if (isPermission(value)) {
      const p: Permission = value; // compile-time proof of narrowing
      expect(p).toBe("health:write");
    } else {
      throw new Error("expected a catalogued permission");
    }
  });

  it("ALL_PERMISSIONS is non-empty and every entry is a Permission", () => {
    expect(ALL_PERMISSIONS.length).toBeGreaterThan(0);
    for (const p of ALL_PERMISSIONS) {
      expect(isPermission(p)).toBe(true);
    }
  });

  it("Permissions map values equal ALL_PERMISSIONS (1:1, no drift)", () => {
    expect([...ALL_PERMISSIONS].sort()).toEqual(Object.values(Permissions).sort());
  });

  it("formatPermission composes the canonical ${resource}:${action} code", () => {
    expect(formatPermission("animal", "register")).toBe("animal:register");
    expect(formatPermission("eartag", "order")).toBe("eartag:order");
  });

  it("every catalogued code is a valid resource:action[:scope]* identifier", () => {
    // Canonical format is `${resource}:${action}`; the action segment may
    // itself contain colons (e.g. `eartag:order:cancel`, `eartag:order:cancel:any`).
    expect(ALL_PERMISSIONS.every((p) => /^[a-z_]+:[a-z_:]+$/.test(p))).toBe(true);
  });
});
