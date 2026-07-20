import { describe, expect, it } from "vitest";
import type { NavSection } from "./nav-config";
import { Permissions, formatPermission } from "@rocky/validators/api";
import { clientCan, clientCanAny, clientCanRole, filterNavByPermissions } from "./permissions-core";

// Nav fixture built from the existing `Permissions` catalog — no magic strings.
const navFixture = [
  {
    title: "Overview",
    items: [{ title: "Dashboard", href: "/dashboard", icon: null as never }],
  },
  {
    title: "Livestock",
    items: [
      { title: "Animals", href: "/animals", permission: Permissions.AnimalRead, icon: null as never },
      { title: "Movements", href: "/movements", permission: Permissions.MovementRead, icon: null as never },
    ],
  },
  {
    title: "Health",
    items: [{ title: "Health", href: "/health", permission: Permissions.HealthRead, icon: null as never }],
  },
] as NavSection[];

describe("clientCan / clientCanAny / clientCanRole", () => {
  it("clientCan: exact-match and fail-closed on empty", () => {
    expect(clientCan([Permissions.AnimalRead], Permissions.AnimalRead)).toBe(true);
    expect(clientCan([Permissions.AnimalRead], Permissions.MovementRead)).toBe(false);
    expect(clientCan([], Permissions.AnimalRead)).toBe(false); // fail CLOSED
  });

  it("clientCanAny: any-of", () => {
    expect(clientCanAny([Permissions.AnimalRead], [Permissions.MovementRead, Permissions.AnimalRead])).toBe(true);
    expect(clientCanAny([Permissions.AnimalRead], [Permissions.MovementRead])).toBe(false);
  });

  it("clientCanRole: Health RuleSet/role variant (ADR-0045)", () => {
    expect(clientCanRole(["VET"], ["VET", "ADMIN"])).toBe(true);
    expect(clientCanRole(["FARMER"], ["VET", "ADMIN"])).toBe(false);
  });
});

describe("filterNavByPermissions (fail-closed)", () => {
  it("full grants => all gated sections visible", () => {
    const out = filterNavByPermissions(navFixture, [
      Permissions.AnimalRead,
      Permissions.MovementRead,
      Permissions.HealthRead,
    ]);
    expect(out.map((s) => s.title)).toEqual(["Overview", "Livestock", "Health"]);
  });

  it("empty => only always-visible items (fail-closed)", () => {
    const out = filterNavByPermissions(navFixture, []);
    expect(out).toHaveLength(1);
    expect(out[0]?.items.map((i) => i.title)).toEqual(["Dashboard"]);
  });

  it("partial => ungranted hidden, granted + always-visible kept", () => {
    const out = filterNavByPermissions(navFixture, [Permissions.AnimalRead]);
    expect(out.map((s) => s.title)).toEqual(["Overview", "Livestock"]);
    const live = out.find((s) => s.title === "Livestock")!;
    expect(live.items.map((i) => i.title)).toEqual(["Animals"]);
  });
});

describe("factory-generated permissions (Diamond Seal factories)", () => {
  it("PermissionFactory output maps to catalog-shaped strings via formatPermission", () => {
    const recs = [
      { resource: "animal", action: "read" },
      { resource: "animal", action: "write" },
      { resource: "movement", action: "read" },
      { resource: "farm", action: "read" },
      { resource: "user", action: "read" },
    ];
    const strings = recs.map((r) => formatPermission(r.resource, r.action));
    for (const s of strings) expect(s).toMatch(/^[^:]+:[^:]+$/); // `resource:action`
    const firstStr = strings[0] ?? "";
    const perms = [firstStr, Permissions.AnimalRead];
    expect(clientCan(perms, firstStr)).toBe(true);
    expect(clientCan(perms, Permissions.MovementRead)).toBe(false);
  });
});
