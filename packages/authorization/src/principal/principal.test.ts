import { describe, expect, it } from "vitest";
import { Principal } from "./principal.js";

describe("Principal", () => {
  const base = {
    id: "u1",
    username: "user",
    roles: [] as string[],
    permissions: [] as string[],
    organization: null,
    accessLevel: "all" as const,
  };

  it("creates with frozen roles / permissions (immutable value object)", () => {
    const p = Principal.create({ ...base, roles: ["VD_ADMIN"], permissions: ["animal:read"] });
    expect(p.roles).toEqual(["VD_ADMIN"]);
    expect(p.permissions).toEqual(["animal:read"]);
    expect(Object.isFrozen(p.roles)).toBe(true);
    expect(Object.isFrozen(p.permissions)).toBe(true);
  });

  it("hasRole checks membership", () => {
    const p = Principal.create({ ...base, roles: ["VD_ADMIN", "VD_STAFF"] });
    expect(p.hasRole("VD_ADMIN")).toBe(true);
    expect(p.hasRole("SUPER_ADMIN")).toBe(false);
  });

  it("hasPermission checks membership", () => {
    const p = Principal.create({ ...base, permissions: ["animal:read", "animal:create"] });
    expect(p.hasPermission("animal:create")).toBe(true);
    expect(p.hasPermission("health:read")).toBe(false);
  });

  it("isAdmin is true only for SUPER_ADMIN", () => {
    expect(Principal.create({ ...base, roles: ["SUPER_ADMIN"] }).isAdmin()).toBe(true);
    expect(Principal.create({ ...base, roles: ["VD_ADMIN"] }).isAdmin()).toBe(false);
    expect(Principal.create({ ...base, roles: [] }).isAdmin()).toBe(false);
  });

  it("carries organization context or null", () => {
    expect(Principal.create({ ...base, organization: { id: "org-1" } }).organization).toEqual({ id: "org-1" });
    expect(Principal.create({ ...base, organization: null }).organization).toBeNull();
  });
});
