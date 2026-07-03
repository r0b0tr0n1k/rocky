import { createSchemaFactory } from "drizzle-orm/zod";

const factory = createSchemaFactory({
	coerce: {
		date: true,
	},
});

export const createSelectSchema = factory.createSelectSchema;
export const createInsertSchema = factory.createInsertSchema;
export const createUpdateSchema = factory.createUpdateSchema;
