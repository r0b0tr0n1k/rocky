#!/usr/bin/env node
// ── Fix RLS Policy SQL ─────────────────────────────────────────
// drizzle-kit v1.0.0-rc.4 generates $1, $2 etc. as parameterized
// placeholders in CREATE POLICY statements instead of literal role
// strings. This script converts them to proper SQL literals.
//
// Usage: node scripts/fix-rls-sql.mjs <input.sql> [output.sql]
//   Default input: drizzle/*/migration.sql (latest)
//   Default output: <input>.fixed.sql

import { readFileSync, writeFileSync } from "fs";

async function main() {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3];
  let input;

  if (inputPath) {
    input = inputPath;
  } else {
    const { globSync } = await import("glob");
    const dirs = globSync("drizzle/*/");
    const latest = dirs.sort().at(-1);
    if (!latest) {
      console.error("No migration directory found in drizzle/");
      process.exit(1);
    }
    input = `${latest}/migration.sql`;
  }

  console.log(`Fixing RLS policies in: ${input}`);
  let sql = readFileSync(input, "utf8");
  sql = fixPolicies(sql);
  const outPath = outputPath || input.replace(/\.sql$/, ".fixed.sql");
  writeFileSync(outPath, sql);
  console.log(`Written fixed SQL to ${outPath}`);
}

await main();

function fixPolicies(sql) {
  // ── Role value mappings ──
  const ADMIN = ["SUPER_ADMIN", "VD_ADMIN", "VD_STAFF"];
  const ORG_READ = ["VETERINARIAN", "TECHNICIAN"];
  const FARM_READ = ["FARMER", "SLAUGHTERHOUSE_OP", "MARKET_OP", "SUPPLIER"];
  const WRITE = ["SUPER_ADMIN", "VD_ADMIN", "VD_STAFF", "VETERINARIAN", "SUPPLIER"];

  // Replace $1-$N with role literals across ALL policy lines
  // Pattern: ($1, $2, $3) → ('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF')
  const roleByParam = {
    "1": ADMIN[0], "2": ADMIN[1], "3": ADMIN[2],
    "4": ORG_READ[0], "5": ORG_READ[1],
    "6": FARM_READ[0], "7": FARM_READ[1], "8": FARM_READ[2], "9": FARM_READ[3],
  };

  // Only fix within CREATE POLICY lines
  const lines = sql.split("\n");
  const result = [];
  let inPolicy = false;

  for (const line of lines) {
    let fixed = line;

    if (line.includes("CREATE POLICY")) {
      inPolicy = true;
    }

    if (inPolicy) {
      // Fix $1..$9 placeholders inside ANY(...) — wrap in ARRAY[]
      // Pattern: = ANY(($1, $2, $3)) → = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
      fixed = fixed.replace(/ANY\(\((\$\d[^)]*)\)\)/g, (_, params) => {
        const replaced = params.replace(/\$(\d)/g, (_, n) => {
          const role = roleByParam[n];
          return role ? `'${role}'` : `$${n}`;
        });
        return `ANY(ARRAY[${replaced}])`;
      });

      // Fix unresolved ${isRoleIn(USER_ROLE.X, USER_ROLE.Y)} templates
      fixed = fixed.replace(
        /\$\{isRoleIn\(([^)]+)\)\}/g,
        (_, roles) => {
          const roleList = roles
            .split(",")
            .map((r) => r.trim().replace(/^USER_ROLE\./, ""))
            .map((r) => `'${r}'`)
            .join(", ");
          return `current_setting('app.current_role', true) = ANY(ARRAY[${roleList}])`;
        }
      );

      // Fix unresolved ${isRole(USER_ROLE.X)} templates
      fixed = fixed.replace(
        /\$\{isRole\(([^)]+)\)\}/g,
        (_, role) => {
          const r = role.trim().replace(/^USER_ROLE\./, "");
          return `current_setting('app.current_role', true) = '${r}'`;
        }
      );

      // Fix ${table.xxx} references
      fixed = fixed.replace(/\$\{table\.(\w+)\}/g, '"ear_tag_orders"."$1"');
      fixed = fixed.replace(/\$\{currentOrgId\}/g, "current_setting('app.current_org_id', true)::uuid");
      fixed = fixed.replace(/\$\{currentUserId\}/g, "current_setting('app.current_user_id', true)::uuid");

      // End of policy
      if (fixed.includes("--> statement-breakpoint")) {
        inPolicy = false;
      }
    }

    result.push(fixed);
  }

  return result.join("\n");
}

// Only run if called directly (not imported)

