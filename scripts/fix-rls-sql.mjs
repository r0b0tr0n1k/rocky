#!/usr/bin/env node
// ── Fix RLS Policy SQL ─────────────────────────────────
// drizzle-kit v1.0.0-rc.4 generates $1, $2 etc. as parameterized
// placeholders in CREATE POLICY statements instead of literal role
// strings. This script converts them to proper SQL literals.
//
// It ALSO injects the `farm_org_id()` SECURITY DEFINER helper at the
// top of the fixed SQL. RLS org-scoping resolves a farm's organization
// via this function; it must exist BEFORE the CREATE POLICY statements
// that reference it. SECURITY DEFINER lets it query `farms` directly,
// breaking the RLS recursion (ADR-0020 defect, fixed WO-031).
//
// Usage: node scripts/fix-rls-sql.mjs <input.sql> [output.sql]
//   Default input: drizzle/*/migration.sql (latest)
//   Default output: <input>.fixed.sql

import { readFileSync, writeFileSync } from "node:fs";

// SECURITY DEFINER helper: resolves a farm's organization without
// re-entering RLS (queries `farms` directly). Body is only validated
// at call time, so creating it before the tables exist is safe.
const FARM_ORG_ID_FN = `CREATE OR REPLACE FUNCTION public.farm_org_id(p_farm_id uuid)
  RETURNS uuid
  LANGUAGE sql
  SECURITY DEFINER
  AS $function$
    SELECT oa.organization_id
    FROM farms f
    JOIN addresses a ON f.address_id = a.id
    JOIN org_areas oa ON a.commune_id = oa.commune_id
    WHERE f.id = p_farm_id
  $function$;

`;

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
  sql = FARM_ORG_ID_FN + sql;
  sql = fixPolicies(sql);
  const outPath = outputPath || input.replace(/\.sql$/, ".fixed.sql");
  writeFileSync(outPath, sql);
  console.log(`Written fixed SQL to ${outPath}`);
}

// Convert drizzle-kit's $1/$2 role placeholders to literal role strings.
// (Implementation preserved from the original script.)

function fixPolicies(sql) {
  const roleMap = {
    $1: "'SUPER_ADMIN'",
    $2: "'VD_ADMIN'",
    $3: "'VD_STAFF'",
    $4: "'VETERINARIAN'",
    $5: "'TECHNICIAN'",
    $6: "'FARMER'",
    $7: "'SLAUGHTERHOUSE_OP'",
    $8: "'MARKET_OP'",
    $9: "'ORG_ADMIN'",
  };
  let out = sql;
  for (const [ph, lit] of Object.entries(roleMap)) {
    out = out.split(ph).join(lit);
  }
  return out;
}

await main();
