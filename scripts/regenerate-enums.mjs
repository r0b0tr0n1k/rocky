#!/usr/bin/env node
/**
 * Enum Regenerator — Single Source of Truth
 *
 * ONE script that regenerates ALL internal enum infrastructure:
 *   1. Scans packages/database/src/constants/ for createEnumValues() exports
 *   2. Generates packages/database/src/schemas/enums/*.ts — Drizzle pgEnum definitions
 *   3. Generates packages/database/src/schemas/enums/index.ts — pgEnum barrel
 *   4. Generates packages/validators/src/enums/domain.ts — ALL Zod validators
 *   5. Generates packages/validators/src/enums/index.ts — validator barrel
 *   6. --delete removes orphan files (individual .schema.ts from validators)
 *
 *
 * Usage:
 *   node scripts/regenerate-enums.mjs           # regenerate all
 *   node scripts/regenerate-enums.mjs --delete  # also delete individual .schema.ts files
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CONSTANTS_DIR = path.join(
  ROOT,
  "packages",
  "database",
  "src",
  "constants",
);
const PGENUM_DIR = path.join(
  ROOT,
  "packages",
  "database",
  "src",
  "schemas",
  "enums",
);
const VALIDATORS_ENUMS_DIR = path.join(
  ROOT,
  "packages",
  "validators",
  "src",
  "enums",
);

// ── Step 1: Discover all createEnumValues exports ────────────────────

/**
 * @typedef {{ valuesName: string, constName: string, baseName: string }} EnumEntry
 */

/** @returns {EnumEntry[]} */
function discoverConstants() {
  const entries = [];
  for (const f of fs.readdirSync(CONSTANTS_DIR).sort()) {
    if (!f.endsWith(".ts") || f === "index.ts" || f.startsWith("_")) continue;
    const content = fs.readFileSync(path.join(CONSTANTS_DIR, f), "utf-8");
    const match = content.match(/export const (\w+)\s*=\s*createEnumValues\(/);
    if (!match) continue;

    const valuesName = match[1]; // e.g., "RIDE_STATUS_VALUES"
    const constName = valuesName.replace(/_VALUES$/, ""); // e.g., "RIDE_STATUS"
    const baseName = f.replace(/\.ts$/, ""); // e.g., "ride-status"

    entries.push({ valuesName, constName, baseName });
  }
  return entries;
}

// ── Step 2: Naming (dedup collisions) ────────────────────────────────

function toCamelCase(str) {
  return str
    .toLowerCase()
    .replace(/[_-]+([a-z0-9])/g, (_, c) => c.toUpperCase());
}

function toSnakeCase(str) {
  return str.replace(/-/g, "_");
}

/**
 * Handle naming collisions. Each unique baseName gets one pgEnum file.
 * For collisions where toCamelCase(baseName) produces the same name,
 * the first entry keeps the primary name; subsequent get a distinct suffix.
 */
function resolveCollisions(entries) {
  const byCamel = new Map(); // camelBaseName → entry[]
  for (const e of entries) {
    const camel = toCamelCase(e.baseName);
    if (!byCamel.has(camel)) byCamel.set(camel, []);
    byCamel.get(camel).push(e);
  }

  /** @type {{ valuesName: string, constName: string, baseName: string, pgEnumName: string, pgEnumFile: string, sqlEnumName: string, schemaName: string, typeName: string, isCollision: boolean, importAlias: string | null }[]} */
  const resolved = [];

  for (const [, group] of byCamel) {
    if (group.length === 1) {
      const e = group[0];
      const camel = toCamelCase(e.baseName);
      resolved.push({
        ...e,
        pgEnumName: `${camel}PgEnum`,
        pgEnumFile: e.baseName,
        sqlEnumName: toSnakeCase(e.baseName),
        schemaName: `${camel}Schema`,
        typeName: `${camel}Type`,
        isCollision: false,
        importAlias: null,
      });
    } else {
      for (let i = 0; i < group.length; i++) {
        const e = group[i];
        const camel = toCamelCase(e.baseName);
        if (i === 0) {
          resolved.push({
            ...e,
            pgEnumName: `${camel}PgEnum`,
            pgEnumFile: e.baseName,
            sqlEnumName: toSnakeCase(e.baseName),
            schemaName: `${camel}Schema`,
            typeName: `${camel}Type`,
            isCollision: true,
            importAlias: null,
          });
        } else {
          resolved.push({
            ...e,
            pgEnumName: `${camel}PgEnum`,
            pgEnumFile: e.baseName,
            sqlEnumName: toSnakeCase(e.baseName),
            schemaName: `${camel}Schema`,
            typeName: `${camel}Type`,
            isCollision: true,
            importAlias: `${e.valuesName}_2`,
          });
        }
      }
    }
  }

  return resolved;
}

// ── Step 3: Generate pgEnum definition files ─────────────────────────

function generatePgEnumFile(entry) {
  return [
    `import { toPgEnumValues } from '../../constants/index.js';`,
    `import { pgEnum } from 'drizzle-orm/pg-core';`,
    `import { ${entry.valuesName} } from '../../constants/${entry.baseName}.js';`,
    "",
    `export const ${entry.pgEnumName} = pgEnum('${entry.sqlEnumName}', toPgEnumValues(${entry.valuesName}));`,
    "",
  ].join("\n");
}

function generatePgEnumIndex(resolved) {
  const exports = resolved
    .map((e) => `export * from './${e.pgEnumFile}.js';`)
    .sort();
  return [
    `/** Auto-generated pgEnum barrel — DO NOT EDIT */`,
    `// Generated by: node scripts/regenerate-enums.mjs`,
    "",
    ...exports,
    "",
  ].join("\n");
}

// ── Step 4: Generate domain.ts ───────────────────────────────────────

function generateDomainTs(resolved) {
  const header = `/**
 * DOMAIN ENUMS — Single Source of Truth (auto-generated)
 *
 * Contains ALL internal enum validator schemas. Vendor enums (pgenums)
 * are no longer stored as PostgreSQL ENUM types — they use text() columns
 * and are validated at the Zod boundary by integration schemas.
 *
 * DO NOT EDIT MANUALLY. Run: node scripts/regenerate-enums.mjs
 *
 * Generated: ${new Date().toISOString()}
 */
`;

  const seenBases = new Set();
  const importLines = [];
  for (const e of resolved) {
    if (!seenBases.has(e.baseName)) {
      seenBases.add(e.baseName);
      const importAlias =
        e.isCollision && e.importAlias ? ` as ${e.importAlias}` : "";
      importLines.push(
        `import { ${e.valuesName}${importAlias} } from "@rocky/database/constants";`,
      );
    }
  }
  importLines.sort();

  const schemaLines = [];
  const nodriftNames = [];
  for (const e of resolved) {
    const valuesRef = e.importAlias ?? e.valuesName;
    schemaLines.push(`export const ${e.schemaName} = zEnum(${valuesRef});`);
    schemaLines.push(
      `export type ${e.typeName} = z.infer<typeof ${e.schemaName}>;`,
    );
    schemaLines.push(
      `const _satisfies_${e.schemaName}: z.ZodType<${e.typeName}> = ${e.schemaName};`,
    );
    schemaLines.push(
      `type _nodrift_${e.schemaName} = NoDrift<z.infer<typeof ${e.schemaName}>, ${e.typeName}>;`,
    );
    nodriftNames.push(`_nodrift_${e.schemaName}`);
  }

  const nodriftEntries = nodriftNames.map((n) => `  ${n}`).join(",\n");
  const activationLine = `export type _Activate = ActivateGuillotines<[\n${nodriftEntries}\n]>;`;
  return [
    header,
    `import { zEnum } from "../_enum-helper.js";`,
    `import { z } from "zod";`,
    `import type { NoDrift, ActivateGuillotines } from "../utils/type-bridge.js";`,
    "",
    ...importLines,
    "",
    `// ${resolved.length} enum schemas`,
    "",
    ...schemaLines,
    "",
    `// ⚔️ Activate ALL ${nodriftNames.length} guillotine proofs`,
    activationLine,
    "",
  ].join("\n");
}

// ── Step 5: Generate validators index.ts barrel ──────────────────────

/**
 * Generate validators barrel index.
 * Exports:
 *   1. Zod schema objects (e.g., rideStatusSchema)
 *   2. Inferred types (e.g., rideStatusType)
 *   3. Dictionary constants (e.g., RIDE_STATUS) — re-exported for FRONTEND
 *
 * LAW XI compliance: Frontend imports from @rocky/validators/enums, NOT @rocky/database.
 * _VALUES arrays are NOT re-exported — they stay quarantined (LAW X).
 */
function generateValidatorsIndex(resolved) {
  const exportNames = resolved.map((e) => e.schemaName).sort();
  const typeNames = resolved.map((e) => e.typeName).sort();

  // Dictionary re-exports for frontend consumption (LAW XI)
  const seenBases = new Set();
  const dictExports = [];
  for (const e of resolved) {
    if (!seenBases.has(e.baseName)) {
      seenBases.add(e.baseName);
      dictExports.push(
        `export { ${e.constName} } from "@rocky/database/constants";`,
      );
    }
  }
  dictExports.sort();

  return [
    `/** Auto-generated enum barrel — DO NOT EDIT */`,
    `/** LAW XI: Frontend must import dictionaries from here, NOT @rocky/database. */`,
    "",
    "// ── Dictionary constants (for frontend) ──",
    ...dictExports,
    "",
    "// ── Zod schemas ──",
    ...exportNames.map((n) => `export { ${n} } from "./domain.js";`),
    "// ── Inferred types ──",
    ...typeNames.map((n) => `export type { ${n} } from "./domain.js";`),
    "",
  ].join("\n");
}

// ── Step 6: Generate constants barrel ────────────────────────────────

function generateConstantsBarrel() {
  const lines = ["/** Pure Constants Barrel */", ""];
  lines.push(
    "export { createEnumValues, toPgEnumValues, type DbEnumValues } from './_brand.js';",
  );

  for (const f of fs.readdirSync(CONSTANTS_DIR).sort()) {
    if (!f.endsWith(".ts") || f === "index.ts" || f.startsWith("_")) continue;
    const content = fs.readFileSync(path.join(CONSTANTS_DIR, f), "utf-8");
    const exports = [...content.matchAll(/export const (\w+)/g)].map(
      (m) => m[1],
    );
    if (exports.length === 0) continue;
    const baseName = f.replace(/\.ts$/, "");
    lines.push(`export { ${exports.join(", ")} } from './${baseName}.js';`);
  }

  return `${lines.join("\n")}\n`;
}

// ── MAIN ─────────────────────────────────────────────────────────────

const deleteMode = process.argv.includes("--delete");

console.log(
  `Scanning ${fs.readdirSync(CONSTANTS_DIR).filter((f) => f.endsWith(".ts")).length} constants files...`,
);
const entries = discoverConstants();
console.log(`  Found: ${entries.length} enums`);

const resolved = resolveCollisions(entries);
console.log(`  After collision resolution: ${resolved.length} schemas`);

// Ensure output dirs exist
fs.mkdirSync(PGENUM_DIR, { recursive: true });

// ── Write pgEnum definition files ────────────────────────────────────

// First, clear old generated files (only files that match our pattern)
const generatedFiles = new Set(resolved.map((e) => `${e.pgEnumFile}.ts`));
let pgEnumCleaned = 0;
for (const f of fs.readdirSync(PGENUM_DIR)) {
  if (f === "index.ts") continue;
  if (!f.endsWith(".ts")) continue;
  if (!generatedFiles.has(f)) {
    fs.unlinkSync(path.join(PGENUM_DIR, f));
    pgEnumCleaned++;
  }
}

// Write each pgEnum file
for (const e of resolved) {
  fs.writeFileSync(
    path.join(PGENUM_DIR, `${e.pgEnumFile}.ts`),
    generatePgEnumFile(e),
  );
}

// Write pgEnum index.ts
fs.writeFileSync(
  path.join(PGENUM_DIR, "index.ts"),
  generatePgEnumIndex(resolved),
);
console.log(
  `✓ ${resolved.length} pgEnum files → schemas/enums/ (${pgEnumCleaned > 0 ? `${pgEnumCleaned} cleaned` : "0 cleaned"})`,
);

// ── Write validators ─────────────────────────────────────────────────

const domainPath = path.join(VALIDATORS_ENUMS_DIR, "domain.ts");
const indexPath = path.join(VALIDATORS_ENUMS_DIR, "index.ts");

fs.writeFileSync(domainPath, generateDomainTs(resolved));
console.log(`✓ enums/domain.ts (${resolved.length} schemas)`);

fs.writeFileSync(indexPath, generateValidatorsIndex(resolved));
console.log(`✓ enums/index.ts`);

// ── Write constants barrel ────────────────────────────────────────────

const constantsBarrelPath = path.join(CONSTANTS_DIR, "index.ts");
fs.writeFileSync(constantsBarrelPath, generateConstantsBarrel());
console.log(`✓ constants/index.ts (barrel regenerated)`);

// ── Delete individual .schema.ts files if --delete ───────────────────
if (deleteMode) {
  let deleted = 0;
  for (const f of fs.readdirSync(VALIDATORS_ENUMS_DIR)) {
    if (f.endsWith(".schema.ts") && f !== "domain.ts") {
      fs.unlinkSync(path.join(VALIDATORS_ENUMS_DIR, f));
      deleted++;
    }
  }
  console.log(`✓ Deleted ${deleted} individual .schema.ts files`);
}

console.log(`\n=== Regeneration Complete ===`);
console.log(`  pgEnum files:      ${resolved.length} → schemas/enums/`);
console.log(`  Zod validators:    ${resolved.length} → enums/domain.ts`);
if (deleteMode)
  console.log(`  Mode:              --delete (cleaned individual files)`);
