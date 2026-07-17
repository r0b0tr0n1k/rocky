import { describe, expect, it, vi } from "vitest";
import { PolicyEngine } from "./engine.js";
import { Principal } from "../principal/principal.js";
import type { SystemService } from "@rocky/domains-system";

// The engine reads the jurisdiction RuleSet via SystemService.getRuleSet().
// We make it reject so the farmer-administer gate is bypassed and the role /
// permission / organization decisions are tested in isolation (no DB, no system).
function makeEngine() {
  const system = {
    getRuleSet: vi.fn().mockRejectedValue(new Error("test: no rule set")),
  } as unknown as SystemService;
  return new PolicyEngine(system);
}

type CreateParams = Parameters<typeof Principal.create>[0];
function principal(overrides: Partial<CreateParams> = {}): Principal {
  return Principal.create({
    id: "u1",
    username: "user",
    roles: [],
    permissions: [],
    organization: null,
    accessLevel: "all",
    ...overrides,
  });
}

describe("PolicyEngine — authorization decisions", () => {
  it("denies when authentication is required but the principal is anonymous", async () => {
    const engine = makeEngine();
    const decision = await engine.evaluate(principal({ id: "anonymous" }), { authenticated: true });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/Authentication required/);
  });

  it("allows an authenticated principal when only authentication is required", async () => {
    const engine = makeEngine();
    const decision = await engine.evaluate(principal(), { authenticated: true });
    expect(decision.allowed).toBe(true);
  });

  // ── WO-098: SUPER_ADMIN gate on the rbac / user routers ──
  describe("role gate (WO-098)", () => {
    const policy = { authenticated: true, roles: ["SUPER_ADMIN"] };

    it("DENIES a non-SUPER_ADMIN session (e.g. VD_ADMIN) — the regression guard", async () => {
      const engine = makeEngine();
      const decision = await engine.evaluate(principal({ roles: ["VD_ADMIN"] }), policy);
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toMatch(/SUPER_ADMIN/);
    });

    it("ALLOWS a SUPER_ADMIN session", async () => {
      const engine = makeEngine();
      const decision = await engine.evaluate(principal({ roles: ["SUPER_ADMIN"] }), policy);
      expect(decision.allowed).toBe(true);
    });
  });

  it("allows when the principal holds ANY of the required roles", async () => {
    const engine = makeEngine();
    const decision = await engine.evaluate(principal({ roles: ["VD_STAFF"] }), {
      authenticated: true,
      roles: ["VD_ADMIN", "VD_STAFF"],
    });
    expect(decision.allowed).toBe(true);
  });

  it("denies when the principal holds NONE of the required roles", async () => {
    const engine = makeEngine();
    const decision = await engine.evaluate(principal({ roles: ["AUDITOR"] }), {
      authenticated: true,
      roles: ["VD_ADMIN", "VD_STAFF"],
    });
    expect(decision.allowed).toBe(false);
  });

  it("enforces the admin shortcut via isAdmin() (SUPER_ADMIN)", async () => {
    const engine = makeEngine();
    expect((await engine.evaluate(principal({ roles: ["VD_ADMIN"] }), { admin: true })).allowed).toBe(false);
    expect((await engine.evaluate(principal({ roles: ["SUPER_ADMIN"] }), { admin: true })).allowed).toBe(true);
  });

  it("enforces action / permission checks", async () => {
    const engine = makeEngine();
    const denied = await engine.evaluate(principal({ permissions: ["animal:read"] }), { action: "animal:create" });
    expect(denied.allowed).toBe(false);
    const allowed = await engine.evaluate(principal({ permissions: ["animal:create"] }), { action: "animal:create" });
    expect(allowed.allowed).toBe(true);
  });

  it("enforces organization membership", async () => {
    const engine = makeEngine();
    expect((await engine.evaluate(principal({ organization: null }), { organization: true })).allowed).toBe(false);
    expect(
      (await engine.evaluate(principal({ organization: { id: "org-1" } }), { organization: true })).allowed,
    ).toBe(true);
  });
});
