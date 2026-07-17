import { describe, expect, it } from "vitest";
import { ANONYMOUS_PRINCIPAL } from "./principals.js";
import { PrincipalResolver } from "./principal.resolver.js";

// The anonymous branch returns before touching the SM tables / PrincipalCache,
// so we can construct the resolver with a stub cache and never hit the DB.
const stubCache = { get: () => undefined, set: () => {} } as any;

describe("PrincipalResolver.resolve (anonymous contract)", () => {
  it("returns ANONYMOUS_PRINCIPAL (not a throw) for a null AuthResult", async () => {
    const resolver = new PrincipalResolver(stubCache);
    const principal = await resolver.resolve(null);
    expect(principal).toBe(ANONYMOUS_PRINCIPAL);
    expect(principal.id).toBe("anonymous");
    expect(principal.roles).toEqual([]);
  });

  it("returns ANONYMOUS_PRINCIPAL when AuthResult has no user", async () => {
    const resolver = new PrincipalResolver(stubCache);
    const principal = await resolver.resolve({ session: null, user: null });
    expect(principal).toBe(ANONYMOUS_PRINCIPAL);
  });
});
