import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { describe, it, expect } from "vitest";
import { ALL_PERMISSIONS } from "./permissions.js";

// ── WO-101: permission drift guillotine ──────────────────────────────────────
// The catalog in `permissions.ts` is the single source of truth. This test fails
// the build if any permission literal across the system drifts from it:
//   • a `@Policy({ action })` not in the catalog
//   • a web nav `permission:` not in the catalog
//   • a mobile `can(...)` not in the catalog
//   • a `ROLE_PERM_MAP` string with no matching `PERMISSION_DEFS` key
//     (which `seed.ts` silently drops → role never gets the permission)
//   • the catalog itself diverging from `PERMISSION_DEFS` (seed of record)

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../..");

const read = (p: string) => fs.readFileSync(path.join(repoRoot, p), "utf8");

function extractPermDefs(seed: string): Set<string> {
  const flat = new Set<string>();
  for (const m of seed.matchAll(/resource:\s*"([^"]+)"\s*,\s*action:\s*"([^"]+)"/g)) {
    flat.add(`${m[1]!}:${m[2]!}`);
  }
  return flat;
}

function extractRolePermMap(seed: string): Set<string> {
  const block = seed.match(/const ROLE_PERM_MAP[\s\S]*?\};\n/);
  const set = new Set<string>();
  if (!block) return set;
  for (const m of block[0]!.matchAll(/"([^"]+)"/g)) {
    if (m[1] !== "*") set.add(m[1]!);
  }
  return set;
}

function extractPolicyActions(dir: string): Set<string> {
  const set = new Set<string>();
  for (const f of fs.readdirSync(path.join(repoRoot, dir))) {
    if (!f.endsWith(".router.ts")) continue;
    const content = read(dir + "/" + f);
    for (const dec of content.matchAll(/@Policy\(\{([^}]*)\}/g)) {
      const am = dec[1]!.match(/action:\s*["']([^"']+)["']/);
      if (am) set.add(am[1]!);
    }
  }
  return set;
}

const catalog = new Set<string>(ALL_PERMISSIONS);

describe("WO-101 permission drift guillotine", () => {
  const seed = read("packages/database/src/seed.ts");
  const permDefs = extractPermDefs(seed);
  const rolePerm = extractRolePermMap(seed);
  const policyActions = extractPolicyActions("apps/api/src/routers");
  const nav = new Set<string>(
    [...read("apps/web/lib/nav-config.ts").matchAll(/permission:\s*["']([^"']+)["']/g)].map((m) => m[1]!),
  );
  const mob = new Set<string>(
    [...read("apps/mob/app/(tabs)/_layout.tsx").matchAll(/can\(\s*["']([^"']+)["']\s*\)/g)].map((m) => m[1]!),
  );

  it("catalog mirrors PERMISSION_DEFS (seed is the source of grantable perms)", () => {
    expect([...catalog].sort()).toEqual([...permDefs].sort());
  });

  it("every @Policy({ action }) is a catalogued permission", () => {
    const bad = [...policyActions].filter((p) => !catalog.has(p));
    expect(bad, `uncatalogued @Policy actions: ${bad.join(", ")}`).toEqual([]);
  });

  it("every web nav permission literal is catalogued", () => {
    const bad = [...nav].filter((p) => !catalog.has(p));
    expect(bad, `uncatalogued nav literals: ${bad.join(", ")}`).toEqual([]);
  });

  it("every mobile can() literal is catalogued", () => {
    const bad = [...mob].filter((p) => !catalog.has(p));
    expect(bad, `uncatalogued mobile literals: ${bad.join(", ")}`).toEqual([]);
  });

  it("every ROLE_PERM_MAP string matches a PERMISSION_DEFS key (no silent drops)", () => {
    const bad = [...rolePerm].filter((p) => !catalog.has(p));
    expect(bad, `ROLE_PERM_MAP strings with no matching def (silently dropped): ${bad.join(", ")}`).toEqual([]);
  });
});
