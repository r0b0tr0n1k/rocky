// ── Drizzle Schema: Modules, Business Rules, Code Tables, System Params ──
// Replaces: SM_MODULES, SM_BUSINESS_RULES, SM_MODULE_BR, SM_LOG_CODES, SM_SYS_PARAMS

import {
	pgTable,
	uuid,
	varchar,
	timestamp,
	boolean,
	integer,
	text,
	jsonb,
	index,
	uniqueIndex,
} from "drizzle-orm/pg-core";

// ── APPLICATION MODULES (replaces SM_MODULES) ──
export const modules = pgTable("modules", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: varchar("name", { length: 50 }).notNull().unique(),
	title: varchar("title", { length: 100 }).notNull(),
	type: varchar("type", { length: 30 }).notNull(),
	orderSeq: integer("order_seq").notNull().default(0),
	parentId: uuid("parent_id"),
	icon: varchar("icon", { length: 50 }),
	route: varchar("route", { length: 200 }),
	isActive: boolean("is_active").notNull().default(true),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── BUSINESS RULES (replaces SM_BUSINESS_RULES) ──
export const businessRules = pgTable(
	"business_rules",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		name: varchar("name", { length: 100 }).notNull(),
		description: varchar("description", { length: 500 }),
		validatorPath: varchar("validator_path", { length: 200 }),
		severity: varchar("severity", { length: 10 }).notNull().default("ERROR"),
		executeIf: varchar("execute_if", { length: 500 }),
		isActive: boolean("is_active").notNull().default(true),
		runOnServer: boolean("run_on_server").notNull().default(true),
		runOnMobile: boolean("run_on_mobile").notNull().default(false),
		messageTemplate: varchar("message_template", { length: 500 }),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		createdBy: uuid("created_by"),
		updatedAt: timestamp("updated_at"),
	},
	(table) => ({
		nameIdx: uniqueIndex("idx_br_name").on(table.name),
	}),
);

// ── MODULE-BUSINESS RULE BINDING (replaces SM_MODULE_BR) ──
export const moduleBusinessRules = pgTable(
	"module_business_rules",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		moduleId: uuid("module_id")
			.notNull()
			.references(() => modules.id, { onDelete: "cascade" }),
		businessRuleId: uuid("business_rule_id")
			.notNull()
			.references(() => businessRules.id, { onDelete: "cascade" }),
		condition: varchar("condition", { length: 500 }),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => ({
		moduleRuleIdx: uniqueIndex("idx_module_br").on(
			table.moduleId,
			table.businessRuleId,
		),
	}),
);

// ── CODE TABLES (replaces SM_LOG_CODES — multi-language support) ──
export const codeTables = pgTable(
	"code_tables",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		group: varchar("group", { length: 50 }).notNull(),
		code: varchar("code", { length: 50 }).notNull(),

		// Multi-language labels: { "MK": "Холштајн", "EN": "Holstein" }
		label: jsonb("label").$type<Record<string, string>>().notNull(),
		description: varchar("description", { length: 500 }),
		displayOrder: integer("display_order").notNull().default(0),
		parentId: uuid("parent_id"),
		isActive: boolean("is_active").notNull().default(true),

		createdAt: timestamp("created_at").notNull().defaultNow(),
		createdBy: uuid("created_by"),
		validTo: timestamp("valid_to"),
	},
	(table) => ({
		groupCodeIdx: uniqueIndex("idx_code_tables_group_code").on(
			table.group,
			table.code,
		),
		groupIdx: index("idx_code_tables_group").on(table.group),
	}),
);

// ── SYSTEM PARAMETERS (replaces SM_SYS_PARAMS) ──
export const systemParameters = pgTable(
	"system_parameters",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		code: varchar("code", { length: 50 }).notNull().unique(),
		value: text("value").notNull(),
		dataType: varchar("data_type", { length: 20 }).notNull().default("STRING"),
		description: varchar("description", { length: 500 }),
		group: varchar("group", { length: 50 }),
		minValue: varchar("min_value", { length: 100 }),
		maxValue: varchar("max_value", { length: 100 }),
		allowedValues: jsonb("allowed_values").$type<string[]>(),
		isActive: boolean("is_active").notNull().default(true),
		isEditable: boolean("is_editable").notNull().default(true),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		createdBy: uuid("created_by"),
		updatedAt: timestamp("updated_at"),
	},
	(table) => ({
		codeIdx: uniqueIndex("idx_sys_params_code").on(table.code),
		groupIdx: index("idx_sys_params_group").on(table.group),
	}),
);
