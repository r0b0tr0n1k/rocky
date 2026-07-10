import "reflect-metadata";
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { PolicyRegistry } from "@rocky/authorization";
import { ALL_PERMISSIONS } from "@rocky/validators/rbac";

// ── Router contract test — confirms the WORKING PATTERNS across ALL routers ──
// The stale docs (router-design.md / router-patterns.md) describe a bygone
// `ctx.user` + `RequireAdminMiddleware` + `@Policy({ alias })` world. Our real
// pattern is: thin Diplomat (every procedure declares `output:`), `@RegisterPolicy`
// + `@Policy`/`@OverridePolicy` wired to the Execution-Bot principal, and every
// `@Policy({ action })` drawn from the isomorphic `Permission` catalog.
//
// This test is the material proof those patterns hold at scale — not just on
// the one rbac router the existing rbac.router.policy.test.ts covers.

const here = dirname(fileURLToPath(import.meta.url));
const routersDir = here;

const routerFiles = readdirSync(routersDir)
  .filter((f) => f.endsWith(".router.ts") && !f.endsWith(".test.ts"))
  .map((f) => join(routersDir, f));

// Dynamically import every router so @RegisterPolicy() populates PolicyRegistry
// as a side effect (decorators run at class-definition time).
const importErrors: string[] = [];
for (const f of routerFiles) {
  try {
    await import(pathToFileURL(f).href);
  } catch (e) {
    importErrors.push(`${f}: ${(e as Error).message}`);
  }
}

const catalog = new Set<string>(ALL_PERMISSIONS);
// Router alias must be a plain ASCII identifier — no dots / special chars.
// (The dot only appears in the COMBINED key `alias.method`, the tRPC path
// separator; permission codes use a colon, not a dot.)
const ALIAS_RE = /^[A-Za-z][A-Za-z0-9_]*$/;

describe("Router contract — working patterns across all routers", () => {
  it("every router module imports without throwing (decorators register cleanly)", () => {
    expect(importErrors, importErrors.join("\n")).toEqual([]);
  });

  for (const file of routerFiles) {
    const src = readFileSync(file, "utf8");
    const name = file.split("/").pop() ?? file;

    describe(name, () => {
      const reg = src.match(/@RegisterPolicy\(\s*["']([^"']+)["']\s*\)/);
      const router = src.match(/@Router\(\{\s*alias:\s*["']([^"']+)["']/);

      it("router alias is a plain ASCII identifier (no dots / special chars)", () => {
        expect(router, `${name} missing @Router({ alias })`).not.toBeNull();
        if (router) expect(router[1], `${name} @Router alias`).toMatch(ALIAS_RE);
        if (reg) expect(reg[1], `${name} @RegisterPolicy alias`).toMatch(ALIAS_RE);
      });

      it("@RegisterPolicy alias matches @Router alias", () => {
        expect(reg, `${name} missing @RegisterPolicy`).not.toBeNull();
        expect(router, `${name} missing @Router alias`).not.toBeNull();
        if (reg && router) expect(reg[1]).toBe(router[1]);
      });

      it("every procedure declares output: (Diplomat / Crime 1)", () => {
        const missing: string[] = [];
        for (const m of src.matchAll(/@(Query|Mutation)\(/g)) {
          const rest = src.slice(m.index ?? 0);
          const am = rest.match(/async\s+(\w+)\s*\(/);
          const slice = am ? rest.slice(0, am.index!) : rest;
          if (!/\boutput\s*:/.test(slice)) missing.push(am?.[1] ?? "?");
        }
        expect(missing, `procedures missing output: in ${name}: ${missing.join(", ")}`).toEqual([]);
      });

      it("every @Policy({ action }) is a catalogued Permission", () => {
        const actions = [...src.matchAll(/@Policy\(\{([^}]*)\}/g)]
          .map((d) => d[1]?.match(/action:\s*["']([^"']+)["']/))
          .filter((x): x is RegExpMatchArray => x !== null)
          .map((x) => x[1])
          .filter((a): a is string => a !== undefined);
        const bad = actions.filter((a) => !catalog.has(a));
        expect(bad, `uncatalogued @Policy actions in ${name}: ${bad.join(", ")}`).toEqual([]);
      });

      it("every procedure is registered in PolicyRegistry (dynamic)", () => {
        if (!reg) return;
        const alias = reg[1];
        const methods = [
          ...src.matchAll(/@(Query|Mutation)\([\s\S]*?async\s+(\w+)\s*\(/g),
        ].map((m) => m[2]);
        const missing = methods.filter((meth) => !PolicyRegistry.get(`${alias}.${meth}`));
        expect(missing, `unregistered procedures in ${name}: ${missing.join(", ")}`).toEqual([]);
      });
    });
  }
});
