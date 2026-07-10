import { describe, expect, it } from "vitest";
import { Principal } from "@rocky/authorization";
// Wield the @rocky/testing factories to build role-bearing actors and confirm
// the gating pattern end-to-end (role → Principal → can/hasRole).
import { UserFactory } from "@rocky/testing/factory";

// ── Confirm the working pattern: role-bearing factory → Principal gating ──
// The UserFactory (Diamond Seal: Drizzle select schema → SchemaDataFactory)
// produces Better-Auth user rows with a `role`. Feeding that role into the
// canonical `Principal` proves the role→permission gating the routers rely on.

describe("Principal gating confirmed via @rocky/testing UserFactory", () => {
  it("UserFactory.createSuperAdmin() → Principal.isAdmin() is true", () => {
    const admin = new UserFactory().createSuperAdmin();
    const principal = Principal.create({
      id: admin.id,
      username: admin.username,
      roles: [admin.role],
      permissions: [],
      organization: null,
      accessLevel: "all",
    });
    expect(principal.isAdmin()).toBe(true);
    expect(principal.hasRole(admin.role)).toBe(true);
  });

  it("UserFactory.createFarmer() → Principal.isAdmin() is false (least-privilege)", () => {
    const farmer = new UserFactory().createFarmer();
    const principal = Principal.create({
      id: farmer.id,
      username: farmer.username,
      roles: [farmer.role],
      permissions: [],
      organization: null,
      accessLevel: "all",
    });
    expect(principal.isAdmin()).toBe(false);
    expect(principal.hasRole("SUPER_ADMIN")).toBe(false);
  });

  it("Principal.hasPermission checks the catalogued permission set", () => {
    const user = new UserFactory().createActive();
    const principal = Principal.create({
      id: user.id,
      username: user.username,
      roles: [user.role],
      permissions: ["animal:register", "health:write"],
      organization: null,
      accessLevel: "all",
    });
    expect(principal.hasPermission("animal:register")).toBe(true);
    expect(principal.hasPermission("animal:death")).toBe(false);
  });
});
