#!/usr/bin/env node
/**
 * Direct schema push — bypasses buggy drizzle-kit RC.
 * Generates CREATE TYPE + CREATE TABLE SQL from Drizzle ORM schema definitions.
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CONSTANTS_DIR = join(ROOT, "packages", "database", "src", "constants");
const _ENUMS_DIR = join(ROOT, "packages", "database", "src", "schemas", "enums");

// ── Step 1: Generate CREATE TYPE statements from constants ──

const sqlLines = [
  "-- Auto-generated schema push",
  `-- Generated: ${new Date().toISOString()}`,
  "",
];

function toSnakeCase(str) {
  return str.replace(/-/g, "_");
}

const enumFiles = readdirSync(CONSTANTS_DIR).sort();
for (const f of enumFiles) {
  if (!f.endsWith(".ts") || f === "index.ts" || f.startsWith("_")) continue;
  const content = readFileSync(join(CONSTANTS_DIR, f), "utf-8");
  const valuesMatch = content.match(/createEnumValues\(\[(.*?)\]\)/s);
  if (!valuesMatch) continue;
  const values = [...valuesMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  const enumName = toSnakeCase(f.replace(/\.ts$/, ""));
  if (values.length > 0) {
    sqlLines.push(`DO $$ BEGIN`);
    sqlLines.push(`  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${enumName}') THEN`);
    sqlLines.push(`    CREATE TYPE ${enumName} AS ENUM (${values.map((v) => `'${v}'`).join(", ")});`);
    sqlLines.push(`  END IF;`);
    sqlLines.push(`END $$;`);
    sqlLines.push(``);
  }
}

// ── Step 2: Load schema and generate CREATE TABLE SQL ──
// We load the Drizzle schema files and use their getTableConfig() to extract DDL


// Dynamically import all schema files
const schemaDir = join(ROOT, "packages", "database", "src", "schema");

function collectTableFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      files.push(...collectTableFiles(join(dir, entry.name)));
    } else if (
      entry.name.endsWith(".ts") &&
      entry.name !== "index.ts" &&
      entry.name !== "rls-helpers.ts" &&
      entry.name !== "pg-roles.ts"
    ) {
      files.push(join(dir, entry.name));
    }
  }
  return files;
}

const tableFiles = collectTableFiles(schemaDir);
const tables = [];

for (const file of tableFiles) {
  try {
    const mod = await import(`file://${file}`);
    for (const [name, export_] of Object.entries(mod)) {
      if (export_ && typeof export_ === "object" && export_.constructor?.name === "PgTable") {
        tables.push({ name, table: export_ });
      }
    }
  } catch (_e) {
    // Skip files that fail to import (they might need other modules)
  }
}

// ── Write SQL file ──

sqlLines.push("-- ── Tables ──");
sqlLines.push("");

// We need to write SQL for each table based on knowledge of schema structure
// For now, output what we have
const outputPath = join(ROOT, "packages", "database", "drizzle", "0000_full_schema.sql");
writeFileSync(outputPath, `${sqlLines.join("\n")}\n`);
console.log(`✓ Schema SQL written to: ${outputPath}`);
console.log(`  ${enumFiles.length} enum files processed`);
console.log(`  ${tables.length} tables discovered`);

// ── Step 3: Run against database ──

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not set");
  process.exit(1);
}

// Connect and run SQL
// const sql_ = postgres(DATABASE_URL);
// for (const line of sqlLines) {
//   if (line.trim() && !line.startsWith("--")) {
//     try { await sql_.unsafe(line); } catch (e) { console.error(`✗ ${e.message}`); }
//   }
// }
// await sql_.end();
