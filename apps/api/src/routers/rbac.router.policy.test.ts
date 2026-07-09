import "reflect-metadata";
import { describe, expect, it } from "vitest";
import { PolicyRegistry } from "@rocky/authorization";
// Importing the router runs @RegisterPolicy("rbac"), populating PolicyRegistry.
import { RbacRouter } from "./rbac.router.js";

describe("RbacRouter policy registration (WO-104 / WO-103 guard)", () => {
  it("myPermissions is auth-only — never inherits the class SUPER_ADMIN gate", () => {
    const meta = PolicyRegistry.get("rbac.myPermissions");
    expect(meta).toBeDefined();
    expect(meta?.authenticated).toBe(true);
    expect(meta?.roles ?? []).toEqual([]);
    expect(meta?.admin).toBeFalsy();
  });

  it("other rbac procedures keep the class SUPER_ADMIN gate", () => {
    const meta = PolicyRegistry.get("rbac.listRoles");
    expect(meta?.authenticated).toBe(true);
    expect(meta?.roles).toContain("SUPER_ADMIN");
  });
});
