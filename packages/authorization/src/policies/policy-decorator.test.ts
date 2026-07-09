import { describe, expect, it } from "vitest";
import { Policy, getPolicyMetadata, POLICY_METADATA_KEY } from "./policy.decorator.js";

// Mirror of apps/api/src/routers/rbac.router.ts: class-level
// `@Policy({ authenticated: true, roles: ["SUPER_ADMIN"] })` with a
// method-level override on `myPermissions`. The override MUST explicitly clear
// `roles` (roles: []) so the class-level SUPER_ADMIN gate does not leak through
// the PolicyRegistry merge (WO-098 + WO-089 interaction).
@Policy({ authenticated: true, roles: ["SUPER_ADMIN"] })
class GatedRouter {
  @Policy({ authenticated: true, roles: [] })
  myPermissions() {}
  @Policy({ action: "rbac:write" })
  assignRole() {}
}

describe("Policy decorator + getPolicyMetadata (readback)", () => {
  it("reads class-level policy from the constructor", () => {
    expect(getPolicyMetadata(GatedRouter)).toEqual({ authenticated: true, roles: ["SUPER_ADMIN"] });
  });

  it("method-level policy is read from the PROTOTYPE (not the constructor)", () => {
    // Methods live on the prototype; passing the constructor yields the class policy.
    expect(getPolicyMetadata(GatedRouter.prototype, "myPermissions")).toEqual({
      authenticated: true,
      roles: [],
    });
    expect(getPolicyMetadata(GatedRouter.prototype, "assignRole")).toEqual({ action: "rbac:write" });
  });

  it("exposes a stable metadata key", () => {
    expect(POLICY_METADATA_KEY).toBe("rocky:policy");
  });
});
