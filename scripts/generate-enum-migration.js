const fs = require("node:fs");
const path = require("node:path");

const dir = "packages/database/src/schemas/enums";
const out = "packages/database/drizzle/0041_enums_and_column_swaps.sql";

const files = fs.readdirSync(dir).filter((f) => f.endsWith(".ts") && f !== "index.ts");

const lines = [];
lines.push("-- Auto-generated migration: Create enum types");
lines.push("-- Based on constants and schema regeneration");
lines.push("");

for (const f of files) {
  const txt = fs.readFileSync(path.join(dir, f), "utf8");
  const m = txt.match(/pgEnum\('([^']+)', toPgEnumValues\((\w+)\)\)/);
  if (!m) continue;
  const enumName = m[1];
  const valuesConst = m[2];
  const constFile = path.join("packages/database/src/constants", f.replace(".ts", ".ts"));
  const constTxt = fs.readFileSync(constFile, "utf8");
  const vm = constTxt.match(/createEnumValues\(\[([\s\S]*?)\] as const\)/);
  if (!vm) continue;
  const vals = vm[1]
    .split(/[\s,]+/)
    .map((s) => s.trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean);

  lines.push(`CREATE TYPE IF NOT EXISTS ${enumName} AS ENUM (${vals.map((v) => `'${v}'`).join(", ")});`);
}

lines.push("");
lines.push("-- Swap varchar columns to pgEnum types");
lines.push("");

const columnSwaps = [
  // animals
  { table: "animals", column: "state_code", enumType: "state_code" },
  { table: "animals", column: "sex", enumType: "sex" },
  { table: "animals", column: "birth_type", enumType: "birth_type" },
  { table: "animals", column: "status", enumType: "animal_status" },
  { table: "animals", column: "parent_type", enumType: "parent_type" },
  // birth_notifications
  { table: "birth_notifications", column: "source", enumType: "event_source" },
  { table: "birth_notifications", column: "status", enumType: "birth_notification_status" },
  // movements
  { table: "movements", column: "type", enumType: "movement_type" },
  { table: "movements", column: "death_cause", enumType: "death_cause" },
  // pasture_declarations
  { table: "pasture_declarations", column: "pasture_type", enumType: "pasture_type" },
  // slaughter_records
  { table: "slaughter_records", column: "mass_type", enumType: "slaughter_mass_type" },
  // ear_tags
  { table: "ear_tags", column: "state_code", enumType: "state_code" },
  { table: "ear_tags", column: "status", enumType: "ear_tag_status" },
  // ear_tag_orders
  { table: "ear_tag_orders", column: "status", enumType: "ear_tag_order_status" },
  // ear_tag_replacements
  { table: "ear_tag_replacements", column: "reason", enumType: "ear_tag_replacement_reason" },
  { table: "ear_tag_replacements", column: "status", enumType: "ear_tag_replacement_status" },
  // ear_tag_allocations
  { table: "ear_tag_allocations", column: "distribution_method", enumType: "distribution_method" },
  { table: "ear_tag_allocations", column: "status", enumType: "allocation_status" },
  // ear_tag_types
  { table: "ear_tag_types", column: "category", enumType: "tag_category" },
  // farms
  { table: "farms", column: "type", enumType: "farm_type" },
  { table: "farms", column: "verification_status", enumType: "verification_status" },
  { table: "farms", column: "data_source", enumType: "data_source" },
  // farm_subjects
  { table: "farm_subjects", column: "role", enumType: "subject_role" },
  // sync_errors
  { table: "sync_errors", column: "error_type", enumType: "sync_error_type" },
  // notifications
  { table: "notifications", column: "type", enumType: "notification_type" },
  { table: "notifications", column: "category", enumType: "notification_category" },
  { table: "notifications", column: "priority", enumType: "notification_priority" },
  { table: "notifications", column: "status", enumType: "notification_status" },
  { table: "notifications", column: "source", enumType: "event_source" },
  // notification_templates
  { table: "notification_templates", column: "type", enumType: "notification_type" },
  { table: "notification_templates", column: "category", enumType: "notification_category" },
  { table: "notification_templates", column: "priority", enumType: "notification_priority" },
  // notification_preferences
  { table: "notification_preferences", column: "category", enumType: "notification_category" },
  // audit_log
  { table: "audit_log", column: "action", enumType: "audit_action" },
  { table: "audit_log", column: "source", enumType: "event_source" },
  // organizations
  { table: "organizations", column: "org_type", enumType: "org_type" },
  // modules
  { table: "modules", column: "type", enumType: "module_type" },
  { table: "modules", column: "severity", enumType: "severity" },
];

for (const c of columnSwaps) {
  lines.push(`ALTER TABLE ${c.table} ALTER COLUMN ${c.column} TYPE ${c.enumType} USING ${c.column}::${c.enumType};`);
}

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, lines.join("\n") + "\n");
console.log(`Generated ${out}`);
