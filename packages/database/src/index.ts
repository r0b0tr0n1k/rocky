// ── @rocky/db — Drizzle ORM PostgreSQL Connection ──

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as sm from "./schema/sm/index.js";
import * as hk from "./schema/hk/index.js";
import * as an from "./schema/an/index.js";
import * as auth from "./schema/auth/index.js";
import * as demo from "./schema/demo/index.js";
import { relations } from "./relations.js";
import type { AnyRelations } from "drizzle-orm/relations";

// Connection client
export const queryClient = postgres(process.env.DATABASE_URL!, {
	max: 20,
	idle_timeout: 30,
	connect_timeout: 5,
});

const relationsTyped = relations as AnyRelations;

export const db = drizzle({
	client: queryClient,
	relations: relationsTyped,
	logger: process.env.NODE_ENV === "development",
});

export type DB = typeof db;

// Helper to close connections (useful for serverless/testing)
export async function closeDatabase() {
	await queryClient.end();
}

// Re-export all schemas
export * from "./schema/sm/index.js";
export * from "./schema/hk/index.js";
export * from "./schema/an/index.js";
export * from "./schema/auth/index.js";
export * from "./schema/demo/index.js";

// Export geometry helpers for PostGIS
export * from "./geometry/index.js";

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