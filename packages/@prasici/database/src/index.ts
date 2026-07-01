// ── @prasici/db — Drizzle ORM PostgreSQL Connection ──

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as sm from "./schema/sm/index.js";
import * as hk from "./schema/hk/index.js";
import * as an from "./schema/an/index.js";
import * as auth from "./schema/auth/index.js";

// Connection pool
export const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	max: 20,
	idleTimeoutMillis: 30000,
	connectionTimeoutMillis: 5000,
});

// Drizzle instance with all schemas
export const db = drizzle(pool, {
	schema: {
		...sm,
		...hk,
		...an,
		...auth,
	},
	logger: process.env.NODE_ENV === "development",
});

export type DB = typeof db;

// Re-export all schemas
export * from "./schema/sm/index.js";
export * from "./schema/hk/index.js";
export * from "./schema/an/index.js";
export * from "./schema/auth/index.js";

// Drizzle config for CLI
import type { Config } from "drizzle-kit";

export const drizzleConfig: Config = {
	schema: "./src/schema/**/*.ts",
	out: "./drizzle",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DATABASE_URL!,
	},
	verbose: true,
	strict: true,
};
