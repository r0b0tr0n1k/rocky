import "reflect-metadata";
import { describe, expect, it } from "vitest";
import { OverridePolicy, Policy } from "./policy.decorator.js";
import { RegisterPolicy } from "./register-policy.decorator.js";
import { PolicyRegistry } from "./policy.registry.js";

// @Policy must sit BELOW @RegisterPolicy so it executes first (bottom-up) and
// its class metadata is present when @RegisterPolicy scans (see register-policy.decorator.ts).
@RegisterPolicy("override-sample")
@Policy({ authenticated: true, roles: ["SUPER_ADMIN"] })
class SampleRouter {
  @Policy({ action: "eartag:order" })
  placeOrder() {}

  @OverridePolicy({ authenticated: true })
  myOwn() {}
}

describe("PolicyRegistry @OverridePolicy (WO-104)", () => {
  it("method @Policy merges over the class gate (adds a restriction)", () => {
    const meta = PolicyRegistry.get("override-sample.placeOrder");
    expect(meta).toBeDefined();
    expect(meta?.authenticated).toBe(true);
    expect(meta?.roles).toEqual(["SUPER_ADMIN"]);
    expect(meta?.action).toBe("eartag:order");
  });

  it("@OverridePolicy REPLACES the class gate (no inherited SUPER_ADMIN)", () => {
    const meta = PolicyRegistry.get("override-sample.myOwn");
    expect(meta).toBeDefined();
    expect(meta?.authenticated).toBe(true);
    expect(meta?.roles ?? []).toEqual([]);
    expect(meta?.admin).toBeFalsy();
  });
});
