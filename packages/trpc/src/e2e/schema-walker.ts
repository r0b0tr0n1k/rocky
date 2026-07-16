// ── Zod schema-walker ──
//
// Derives a schema-VALID example value for ANY tRPC input schema by introspecting
// Zod 4 internals (`_zod.def`). This is the schema-factory that powers the
// frontend tRPC conformance suite: every generated test value is read from the
// schema itself (`.options` / `_zod.def.entries` for enums, `format` for
// uuid/email, `minValue`/`maxValue` for numbers, `def.checks` for string
// length, `.shape` for objects) — there are NO hand-written literals or
// enums anywhere in the suite.
//
// The companion `input-builder.ts` reuses the existing `@rocky/testing`
// factories for entity realism; this walker is the universal primitive that
// also covers the 8 factory-less routers.

import { faker } from "@faker-js/faker";
import { randomUUID } from "node:crypto";

// biome-ignore-all lint/suspicious/noExplicitAny: schema introspection utility
type Z = any;

/** Sentinel used to corrupt an enum field in negative tests (whitelisted by the zero-literal guard). */
export const SENTINEL_BAD_ENUM = "___NOT_A_VALID_ENUM___";

/** Unwrap `optional` / `nullable` / `default` to the inner schema. */
function unwrapMeta(s: Z): Z {
  let cur = s;
  for (let i = 0; i < 8 && cur?._zod?.def; i++) {
    const t = cur._zod.def.type;
    if (t === "optional" || t === "nullable" || t === "default") {
      cur = cur._zod.def.innerType ?? cur.innerType;
    } else break;
  }
  return cur;
}

/** Read an enum's allowed values from Zod 4 (`_zod.def.entries` or `.options`). */
function enumValues(s: Z): string[] | null {
  const inner = unwrapMeta(s);
  if (Array.isArray(inner?.options)) return inner.options as string[];
  if (inner?.options && typeof inner.options === "object") {
    return Object.values(inner.options as Record<number, string>);
  }
  const entries = inner?._zod?.def?.entries;
  if (entries instanceof Set) return Array.from(entries as Set<string>);
  if (entries instanceof Map) return Array.from((entries as Map<unknown, string>).values());
  if (entries && typeof entries === "object") return Object.values(entries as Record<string, string>);
  return null;
}

/** Numeric bounds: Zod 4 stores these as `minValue`/`maxValue` (also `min`/`max`). */
function intBounds(s: Z): { min: number; max: number } {
  const def: any = unwrapMeta(s)?._zod?.def ?? {};
  const raw = (k: string) => (typeof def[k] === "number" ? def[k] : undefined);
  const min = raw("min") ?? raw("minValue") ?? 1;
  const max = raw("max") ?? raw("maxValue") ?? 1000;
  return { min, max: Math.max(max, min) };
}

/** String max length: Zod 4 stores `kind:"max"` in `def.checks`, or `maxLength` on the def. */
function stringMaxLen(s: Z): number | null {
  const def: any = unwrapMeta(s)?._zod?.def ?? {};
  const checks = def.checks;
  if (Array.isArray(checks)) {
    for (const c of checks as any[]) {
      if (c && typeof c === "object") {
        const k = c.kind;
        if ((k === "max" || k === "maxLength" || k === "length") && typeof c.value === "number") {
          return c.value as number;
        }
      }
    }
  }
  if (typeof def.maxLength === "number") return def.maxLength;
  if (typeof def.max === "number") return def.max;
  return null;
}

function formatOf(s: Z): string | undefined {
  return unwrapMeta(s)?._zod?.def?.format;
}

/**
 * Derive a schema-valid value for any Zod schema, recursively.
 * @param schema   the Zod schema (procedure input parser)
 * @param omitKeys optional keys to OMIT (used to build negative/omission cases)
 */
export function derive(schema: Z, omitKeys: string[] = []): unknown {
  const s = unwrapMeta(schema);
  if (!s || typeof s.safeParse !== "function") return null;

  const enums = enumValues(s);
  if (enums && enums.length) return enums[Math.floor(Math.random() * enums.length)];

  const type = s._zod?.def?.type;
  switch (type) {
    case "enum":
      return enumValues(s)![0];
    case "string": {
      const fmt = formatOf(s);
      if (fmt === "uuid") return randomUUID();
      if (fmt === "email") return faker.internet.email();
      if (fmt === "url") return faker.internet.url();
      if (fmt === "date" || fmt === "datetime" || fmt === "time") return new Date().toISOString();
      const ml = stringMaxLen(s);
      const len = ml && ml > 0 ? Math.min(ml, 40) : 12;
      return faker.string.alphanumeric({ length: len });
    }
    case "number":
    case "int":
    case "float": {
      const { min, max } = intBounds(s);
      const isInt = (unwrapMeta(s)?._zod?.def as any)?.isInt;
      if (isInt) return faker.number.int({ min, max });
      return faker.number.float({ min, max });
    }
    case "bigint":
      return BigInt(faker.number.int({ min: 1, max: 1000 }));
    case "boolean":
      return faker.datatype.boolean();
    case "date":
      return new Date();
    case "object": {
      const shape = s.shape;
      if (!shape) return {};
      const out: Record<string, unknown> = {};
      for (const [key, field] of Object.entries(shape)) {
        if (omitKeys.includes(key)) continue;
        out[key] = derive(field);
      }
      return out;
    }
    case "array": {
      const el = s._zod?.def?.element ?? s.element;
      return [derive(el)];
    }
    case "record": {
      const valDef = s._zod?.def?.values ?? s._zod?.def?.valueType;
      return { sample: derive(valDef) };
    }
    case "literal":
      return s._zod?.def?.value ?? s._zod?.def?.values;
    case "union": {
      const opts = s._zod?.def?.options ?? [];
      return opts.length ? derive(opts[0]) : faker.string.alphanumeric({ length: 8 });
    }
    case "unknown":
    case "any":
    case "undefined":
      return faker.string.alphanumeric({ length: 8 });
    default:
      return faker.string.alphanumeric({ length: 8 });
  }
}

/**
 * Build a corrupted variant of a schema-valid input that MUST be rejected by
 * the wire: the first field is overwritten with a type-mismatched value
 * (enum → bad literal, uuid/string → wrong type, number → string, ...).
 */
export function negativeFor(schema: Z): { input: any; badKey: string } {
  const good = derive(schema) as Record<string, unknown>;
  const shape: Record<string, any> = (schema as Z).shape ?? {};
  const keys = Object.keys(good ?? {});
  if (!keys.length) return { input: good, badKey: "" };
  const key = keys[0] ?? "";
  const field = shape[key] ?? good[key];
  const t = unwrapMeta(field)?._zod?.def?.type;
  const enums = enumValues(field);
  let bad: unknown;
  if (enums) bad = SENTINEL_BAD_ENUM;
  else if (t === "string") bad = 12345;
  else if (t === "number" || t === "int" || t === "float" || t === "bigint") bad = "not-a-number";
  else if (t === "boolean") bad = "not-a-bool";
  else if (t === "date") bad = 12345;
  else if (t === "array") bad = "not-an-array";
  else if (t === "object") bad = "not-an-object";
  else bad = SENTINEL_BAD_ENUM;
  good[key] = bad;
  return { input: good, badKey: key };
}
