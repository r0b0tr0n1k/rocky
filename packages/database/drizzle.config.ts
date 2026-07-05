import type { Config } from "drizzle-kit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaDir = path.join(__dirname, "src", "schema");
const enumsDir = path.join(__dirname, "src", "schemas", "enums");

function collectTsFiles(dir: string, exclude: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      files.push(...collectTsFiles(path.join(dir, entry.name), exclude));
    } else if (entry.name.endsWith(".ts") && !exclude.includes(entry.name)) {
      files.push("./" + path.relative(__dirname, path.join(dir, entry.name)));
    }
  }
  return files;
}

const excludeFiles = ["index.ts", "rls-helpers.ts", "ear-tags-index.ts"];
const schemaFiles = [
  ...collectTsFiles(schemaDir, excludeFiles),
  ...collectTsFiles(enumsDir, excludeFiles),
];

export default {
  schema: schemaFiles,
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: false,
  extensionsFilters: ["postgis"],
  entities: {
    roles: true,
  },
} satisfies Config;
