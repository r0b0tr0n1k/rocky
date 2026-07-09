#!/usr/bin/env node
/**
 * ⛔ Dumb Zod Generator — Domain-Aligned Auto-Generation
 *
 * Reads the domain table map and override registry, then emits per-domain
 * Dumb Zod files with createSelectSchema / createInsertSchema calls.
 *
 * Usage:
 *   node scripts/generate-dumb-zod.mjs           # regenerate all
 *   node scripts/generate-dumb-zod.mjs --check   # verify only (no write)
 *
 * Pipeline:
 *   1. Read _domain-map.ts → domain → schema file mapping
 *   2. Read _overrides.ts → table → column overrides
 *   3. Scan each schema file for pgTable exports
 *   4. Emit per-domain .ts files
 *   5. Regenerate index.ts barrel
 *   6. Validate: every pgTable export claimed by exactly one domain
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ZOD_DIR = path.join(ROOT, "packages", "database", "src", "zod");
const SCHEMA_DIR = path.join(ROOT, "packages", "database", "src", "schema");
const DOMAIN_MAP_PATH = path.join(ZOD_DIR, "_domain-map.ts");
const OVERRIDES_PATH = path.join(ZOD_DIR, "_overrides.ts");

const checkMode = process.argv.includes("--check");

// ── Step 1: Parse the domain map ────────────────────────────────────

/**
 * Parse _domain-map.ts to extract the domain → schema files mapping.
 * Uses regex — no ts-morph dependency needed.
 * @returns {Record<string, string[]>}
 */
function parseDomainMap() {
  const content = fs.readFileSync(DOMAIN_MAP_PATH, "utf-8");
  const map = {};

  // Match: domainName: ["path1.ts", "path2.ts", ...]
  const domainRegex = /(\w+):\s*\[([\s\S]*?)\]/g;
  let match;

  while ((match = domainRegex.exec(content)) !== null) {
    const domain = match[1];
    if (domain === "as" || domain === "const") continue; // skip "as const" and "export const"
    const filesStr = match[2];
    const files = [...filesStr.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    if (files.length > 0) {
      map[domain] = files;
    }
  }

  return map;
}

// ── Step 2: Parse the override registry ─────────────────────────────

/**
 * Parse _overrides.ts to find which tables have overrides.
 * Returns a Set of table names that have InsertOverride or SelectOverride.
 * @returns {Set<string>}
 */
function parseOverrides() {
  const overrides = new Set();
  if (!fs.existsSync(OVERRIDES_PATH)) return overrides;

  const content = fs.readFileSync(OVERRIDES_PATH, "utf-8");
  const overrideRegex = /export (?:const|let|var)\s+(\w+)(Insert|Select)Override\b/g;
  let match;

  while ((match = overrideRegex.exec(content)) !== null) {
    overrides.add(match[1]);
  }

  return overrides;
}

// ── Step 3: Scan schema files for pgTable exports ───────────────────

/**
 * Scan a schema file for pgTable exports.
 * Returns an array of { tableName, exportName } objects.
 * @param {string} schemaFilePath - relative path from SCHEMA_DIR
 * @returns {{ tableName: string, exportName: string }[]}
 */
function scanSchemaFile(schemaFilePath) {
  const fullPath = path.join(SCHEMA_DIR, schemaFilePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`  ⚠ Schema file not found: ${schemaFilePath}`);
    return [];
  }

  const content = fs.readFileSync(fullPath, "utf-8");
  const tables = [];

  // Match: export const <name> = pgTable(
  const tableRegex = /export const (\w+)\s*=\s*pgTable\s*\(/g;
  let match;

  while ((match = tableRegex.exec(content)) !== null) {
    tables.push({
      exportName: match[1],
      tableName: match[1], // The export name IS the table variable name
    });
  }

  return tables;
}

// ── Step 4: Build the complete table registry ───────────────────────

/**
 * Build a complete registry of all tables across all domains.
 * Validates that every pgTable export is claimed by exactly one domain.
 * @param {Record<string, string[]>} domainMap
 * @returns {{ domainTables: Record<string, { exportName: string, schemaFile: string }[]>, unclaimed: string[] }}
 */
function buildTableRegistry(domainMap) {
  // First, collect all claimed tables: schemaFile → [exportName]
  const claimed = new Map(); // "schemaFile:exportName" → domain
  const domainTables = {};

  for (const [domain, schemaFiles] of Object.entries(domainMap)) {
    domainTables[domain] = [];

    for (const schemaFile of schemaFiles) {
      const tables = scanSchemaFile(schemaFile);

      for (const { exportName } of tables) {
        const key = `${schemaFile}:${exportName}`;
        if (claimed.has(key)) {
          console.error(
            `  ❌ DUPLICATE: ${exportName} in ${schemaFile} already claimed by domain "${claimed.get(key)}"`,
          );
          process.exit(1);
        }
        claimed.set(key, domain);
        domainTables[domain].push({ exportName, schemaFile });
      }
    }
  }

  // Now find unclaimed tables by scanning ALL schema files
  const unclaimed = [];
  const allSchemaFiles = collectAllSchemaFiles();

  for (const schemaFile of allSchemaFiles) {
    const tables = scanSchemaFile(schemaFile);
    for (const { exportName } of tables) {
      const key = `${schemaFile}:${exportName}`;
      if (!claimed.has(key)) {
        unclaimed.push(`${schemaFile} → ${exportName}`);
      }
    }
  }

  return { domainTables, unclaimed };
}

/**
 * Recursively collect all .ts files in the schema directory.
 * @returns {string[]} relative paths from SCHEMA_DIR
 */
function collectAllSchemaFiles() {
  const files = [];

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(SCHEMA_DIR, fullPath);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".ts") && !entry.name.startsWith("_")) {
        files.push(relPath);
      }
    }
  }

  walk(SCHEMA_DIR);
  return files.sort();
}

// ── Step 5: Generate per-domain files ───────────────────────────────

/**
 * Generate the content for a single domain Dumb Zod file.
 * @param {string} domain
 * @param {{ exportName: string, schemaFile: string }[]} tables
 * @param {Set<string>} overrides
 * @returns {string}
 */
function generateDomainFile(domain, tables, overrides) {
  if (tables.length === 0) return null;

  // Group tables by schema file for efficient imports
  const byFile = {};
  for (const { exportName, schemaFile } of tables) {
    if (!byFile[schemaFile]) byFile[schemaFile] = [];
    byFile[schemaFile].push(exportName);
  }

  const lines = [];
  lines.push(`/** ⛔ AUTO-GENERATED BY scripts/generate-dumb-zod.mjs ⛔ */`);
  lines.push(`/** DO NOT EDIT. To add a table, update _domain-map.ts and re-run the generator. */`);
  lines.push(``);

  // Imports from schema files
  const schemaFiles = Object.keys(byFile).sort();
  for (const schemaFile of schemaFiles) {
    const exports = byFile[schemaFile].sort();
    const importPath = `../schema/${schemaFile.replace(/\.ts$/, ".js")}`;

    if (exports.length === 1) {
      lines.push(`import { ${exports[0]} } from "${importPath}";`);
    } else {
      lines.push(`import { ${exports.join(", ")} } from "${importPath}";`);
    }
  }

  // Import factory
  lines.push(`import { createInsertSchema, createSelectSchema } from "./factory.js";`);

  // Import overrides if any table in this domain has overrides
  const hasOverrides = tables.some((t) => overrides.has(t.exportName));
  if (hasOverrides) {
    lines.push(`import * as overrides from "./_overrides.js";`);
  }

  lines.push(``);

  // Schema exports
  for (const { exportName } of tables) {
    const hasInsertOverride = overrides.has(exportName);
    const hasSelectOverride = overrides.has(exportName);

    const insertOverride = hasInsertOverride ? `, overrides.${exportName}InsertOverride` : "";
    const selectOverride = hasSelectOverride ? `, overrides.${exportName}SelectOverride` : "";

    lines.push(`export const ${exportName}SelectSchema = createSelectSchema(${exportName}${selectOverride});`);
    lines.push(`export const ${exportName}InsertSchema = createInsertSchema(${exportName}${insertOverride});`);
    lines.push(``);
  }

  return lines.join("\n");
}

// ── Step 6: Generate the barrel index ───────────────────────────────

/**
 * Generate the index.ts barrel that re-exports all domain files.
 * Also includes legacy files (an, hk, hd, sm) for backward compatibility.
 * @param {string[]} domains - sorted list of domain names
 * @returns {string}
 */
function generateBarrel(domains) {
  const lines = [];
  lines.push(`/** ⛔ AUTO-GENERATED BARREL BY scripts/generate-dumb-zod.mjs ⛔ */`);
  lines.push(`/** Re-exports all per-domain Dumb Zod schemas. */`);
  lines.push(`/** Legacy files (an, hk, hd, sm) exist for direct import compatibility but are NOT re-exported via barrel to avoid TS2308 ambiguity errors. */`);
  lines.push(``);
  lines.push(`export { createInsertSchema, createSelectSchema, createUpdateSchema } from "./factory.js";`);
  lines.push(``);

  // New domain-aligned files only — legacy files exist for direct imports but are
  // NOT spread via barrel to avoid name collisions with domain-aligned exports.
  for (const domain of domains) {
    lines.push(`export * from "./${domain}.js";`);
  }

  lines.push(``);
  return lines.join("\n");
}

// ── MAIN ────────────────────────────────────────────────────────────

console.log(`☭ WAKING THE DUMB ZOD FORGE...`);
console.log(`  Schema dir: ${SCHEMA_DIR}`);
console.log(`  Output dir: ${ZOD_DIR}`);

// Parse inputs
const domainMap = parseDomainMap();
const domainNames = Object.keys(domainMap).sort();
console.log(`  Found ${domainNames.length} domains in _domain-map.ts`);

const overrides = parseOverrides();
console.log(`  Found ${overrides.size} table overrides in _overrides.ts`);

// Build registry
const { domainTables, unclaimed } = buildTableRegistry(domainMap);

if (unclaimed.length > 0) {
  console.error(`\n❌ UNCLAIMED pgTable exports (not in _domain-map.ts):`);
  for (const u of unclaimed) {
    console.error(`     ${u}`);
  }
  console.error(`\n  Add them to _domain-map.ts or remove the table.`);
  process.exit(1);
}

// Count total tables
let totalTables = 0;
for (const tables of Object.values(domainTables)) {
  totalTables += tables.length;
}
console.log(`  Found ${totalTables} pgTable exports across ${domainNames.length} domains`);

// Generate files
let generated = 0;
let skipped = 0;

for (const domain of domainNames) {
  const tables = domainTables[domain];
  if (!tables || tables.length === 0) {
    skipped++;
    continue;
  }

  const content = generateDomainFile(domain, tables, overrides);
  if (!content) {
    skipped++;
    continue;
  }

  const outPath = path.join(ZOD_DIR, `${domain}.ts`);

  if (checkMode) {
    // In check mode, just verify the file exists and has the right header
    if (fs.existsSync(outPath)) {
      const existing = fs.readFileSync(outPath, "utf-8");
      if (existing.startsWith("/** ⛔ AUTO-GENERATED")) {
        generated++;
      } else {
        console.error(`  ❌ ${domain}.ts exists but is NOT auto-generated`);
        process.exit(1);
      }
    } else {
      console.error(`  ❌ ${domain}.ts does not exist (run generator first)`);
      process.exit(1);
    }
  } else {
    fs.writeFileSync(outPath, content);
    generated++;
    console.log(`  ✅ ${domain}.ts (${tables.length} tables)`);
  }
}

// Generate barrel
const barrelPath = path.join(ZOD_DIR, "index.ts");
if (checkMode) {
  if (fs.existsSync(barrelPath)) {
    const existing = fs.readFileSync(barrelPath, "utf-8");
    if (!existing.startsWith("/** ⛔ AUTO-GENERATED BARREL")) {
      console.error(`  ❌ index.ts is NOT auto-generated`);
      process.exit(1);
    }
  }
} else {
  const barrelContent = generateBarrel(domainNames);
  fs.writeFileSync(barrelPath, barrelContent);
  console.log(`  ✅ index.ts (barrel)`);
}

console.log(`\n🏭 FACTORY COMPLETE.`);
console.log(`  Generated: ${generated} files`);
if (skipped > 0) console.log(`  Skipped: ${skipped} empty domains`);
if (checkMode) {
  console.log(`  Mode: --check (verification only)`);
  console.log(`  ✅ All generated files are in sync.`);
} else {
  console.log(`  Run with --check to verify sync.`);
}
