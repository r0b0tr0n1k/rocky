import { describe, expect, it } from "vitest";
import { Policy } from "./policy.decorator.js";
import { RegisterPolicy } from "./register-policy.decorator.js";
import { PolicyRegistry } from "./policy.registry.js";

// Fixture mirroring apps/api/src/routers/rbac.router.ts after the WO-098 fix:
// class SUPER_ADMIN gate + myPermissions explicitly relaxed with roles: [].
@RegisterPolicy("gatedfix")
@Policy({ authenticated: true, roles: ["SUPER_ADMIN"] })
class GatedRouter {
  @Policy({ authenticated: true, roles: [] })
  myPermissions() {}
  @Policy({ action: "rbac:write" })
  assignRole() {}
}

describe("PolicyRegistry — merge enforces the rbac router gate (WO-098 / WO-089)", () => {
  it("merges class + method: a mutating method keeps the SUPER_ADMIN gate", () => {
    const policy = PolicyRegistry.get("gatedfix.assignRole");
    expect(policy).toBeDefined();
    expect(policy?.authenticated).toBe(true);
    expect(policy?.roles).toContain("SUPER_ADMIN");
  });

  it("myPermissions is relaxed to auth-only (roles: [] clears the class gate)", () => {
    const policy = PolicyRegistry.get("gatedfix.myPermissions");
    expect(policy).toBeDefined();
    expect(policy?.authenticated).toBe(true);
    // Critical: the class-level SUPER_ADMIN gate must NOT leak through the merge.
    expect(policy?.roles).toEqual([]);
  });

  it("additive method policy merges with the class (authenticated + action)", () => {
    const policy = PolicyRegistry.get("gatedfix.assignRole");
    expect(policy?.action).toBe("rbac:write");
  });
});
