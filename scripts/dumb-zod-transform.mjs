/**
 * Dumb Zod Transformer
 *
 * Converts "satisfies z.ZodType<ManualInterface>" + ManualInterface + NoDrift guillotines
 * into the Dumb Zod pattern: schema IS the type, no drift checks.
 *
 * Run: node scripts/dumb-zod-transform.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { globSync } from "glob";

const FILES = globSync("packages/validators/src/api/*.api.ts");

for (const file of FILES) {
  let content = readFileSync(file, "utf-8");
  let changed = false;

  // ── 1. Find every schema + interface pair ──
  // Pattern: schema chain ending with .strict() satisfies z.ZodType<Foo>;
  //          export interface Foo { ... }
  const schemaBlockRe =
    /(?<before>(?:\.extend\([^)]*\)\s*)?\.(?:strict|partial)\(\))\s+satisfies\s+z\.ZodType<(?<type>\w+)>;/g;

  let match;
  const interfaces = new Map();

  // First pass: collect interface → schema name mapping from satisfies lines
  while ((match = schemaBlockRe.exec(content)) !== null) {
    const typeName = match.groups.type;
    // Find the schema variable name by looking backwards from the match
    const beforeMatch = content.slice(0, match.index);
    const lastExport = beforeMatch.lastIndexOf("export const ");
    if (lastExport === -1) continue;
    const schemaLine = beforeMatch.slice(lastExport, match.index);
    const schemaNameMatch = schemaLine.match(/export const (\w+) =/);
    if (!schemaNameMatch) continue;
    const schemaName = schemaNameMatch[1];
    interfaces.set(typeName, schemaName);
  }

  // Second pass: replace satisfies, remove interfaces, remove drifts, remove guillotines

  // 2a. Remove " satisfies z.ZodType<Foo>" — just keep the chain ending
  content = content.replaceAll(/\.(strict|partial)\(\)\s+satisfies\s+z\.ZodType<\w+>;/g, ".$1();");

  // 2b. Replace manual interfaces with inferred types
  for (const [typeName, schemaName] of interfaces) {
    const interfaceRe = new RegExp(`export interface ${typeName}\\s*\\{[^}]*\\}\\s*`, "g");
    // Simple brace-balanced interface match — works for flat interfaces
    // For nested, we use a different approach
    content = content.replace(
      new RegExp(`export interface ${typeName}\\s*\\{([^}]*(?:\\{[^}]*\\}[^}]*)*)\\}\\s*`, "g"),
      `export type ${typeName} = z.infer<typeof ${schemaName}>;\n`,
    );
  }

  // 2c. Remove _drift_ lines
  content = content.replaceAll(/^type _drift_\w+ = NoDrift<[^>]*>;\s*$/gm, "");
  content = content.replaceAll(/^type _drift_\w+ = NoDrift<[\s\S]*?^>;\s*$/gm, "");

  // 2d. Remove guillotines export
  content = content.replaceAll(/^export type _\w+Guillotines = ActivateGuillotines<[\s\S]*?^>;\s*$/gm, "");

  // 2e. Remove NoDrift import if NoDrift is no longer used
  if (!content.includes("NoDrift")) {
    content = content.replace(
      /import type \{ NoDrift, ActivateGuillotines \} from "\.\.\/utils\/type-bridge\.js";?\s*/g,
      "",
    );
    content = content.replace(
      /import type \{ NoDrift, ActivateGuillotines \} from "\.\.\/utils\/type-bridge\.js";?\s*/g,
      "",
    );
    // Also handle if only one is present
    content = content.replace(/import type \{ NoDrift \} from "\.\.\/utils\/type-bridge\.js";?\s*/g, "");
    content = content.replace(/import type \{ ActivateGuillotines \} from "\.\.\/utils\/type-bridge\.js";?\s*/g, "");
  }

  if (content !== readFileSync(file, "utf-8")) {
    writeFileSync(file, content);
    console.log(`✓ ${file}`);
    changed = true;
  }
}

if (!changed) {
  console.log("No files changed.");
}
