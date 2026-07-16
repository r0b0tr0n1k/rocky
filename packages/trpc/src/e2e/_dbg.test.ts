import { describe, it } from "vitest";
import { appRouter } from "../index.js";
import { writeFileSync } from "node:fs";

// biome-ignore-all lint/suspicious/noExplicitAny: debug only

function parserOf(def: any): any {
  const d = def?._def;
  const p = d?.inputs?.[0] ?? d?.inputParser;
  return p && typeof p.safeParse === "function" ? p : null;
}

function fullDef(schema: any, depth = 0, seen = new Set()): any {
  const s = schema?._zod?.def ? schema : schema;
  if (!s || typeof s.safeParse !== "function") return String(s);
  const d = s._zod?.def ?? {};
  if (seen.has(s)) return "<cycle>";
  seen.add(s);
  const o: any = { type: d.type };
  // surface the bound/length/format fields that matter
  for (const k of [
    "min",
    "max",
    "minimum",
    "maximum",
    "minValue",
    "maxValue",
    "minLength",
    "maxLength",
    "length",
    "format",
    "pattern",
    "innerType",
    "element",
  ]) {
    if (d[k] !== undefined && d[k] !== null) o[k] = d[k];
  }
  if (Array.isArray(d.checks))
    o.checks = d.checks.map((c: any) => {
      if (c && typeof c === "object") {
        const ks = Object.keys(c).filter((x: string) => x !== "def" && x !== "_zod");
        if (ks.length === 0) return "checksFn";
        const out: any = {};
        for (const x of ks) out[x] = (c as any)[x];
        return out;
      }
      return c;
    });
  if (d.entries && d.type === "object") {
    o.shape = Object.fromEntries(
      Object.entries((s.shape ?? {}) as Record<string, any>).map(([k, v]) => [k, fullDef(v, depth + 1, seen)]),
    );
  }
  if (d.type === "enum") o.options = (s as any).options;
  if (d.type === "union" || d.type === "discriminated")
    o.options = (d.options ?? []).map((o2: any) => fullDef(o2, depth + 1, seen));
  if (d.innerType) o.innerType = fullDef(d.innerType, depth + 1, seen);
  if (d.element) o.element = fullDef(d.element, depth + 1, seen);
  return o;
}

describe("dbg def shape 2", () => {
  it("dump specifics", () => {
    const procs = (appRouter._def as any).procedures as Record<string, any>;
    const targets: Record<string, string[]> = {
      "animal.list": ["limit", "stateCode", "sortBy", "sortOrder"],
      "geo.createGeofence": ["geometry"],
      "geo.forwardGeocode": ["proximity"],
      "geo.staticMapUrl": ["center", "marker"],
      "geo.logGeofenceEvent": ["latitude", "source"],
      "earTag.generateTagNumbers": ["startFrom"],
    };
    const out: Record<string, any> = {};
    for (const [t, fields] of Object.entries(targets)) {
      const p = parserOf(procs[t]);
      out[t] = {};
      for (const f of fields) {
        out[t][f] = p?.shape?.[f] ? fullDef(p.shape[f]) : "n/a";
      }
    }
    writeFileSync("/tmp/dbg-defs2.json", JSON.stringify(out, null, 2));
  });
});
