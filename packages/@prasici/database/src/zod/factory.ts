// ── Dumb Zod Factory — Diamond Seal L2 ──
// RAW IRON: Only createSelectSchema/createInsertSchema — NO intelligence

import { createSchemaFactory } from "drizzle-zod";

const factory = createSchemaFactory({
	coerce: {
		date: true, // All timestamp columns → z.coerce.date() automatically
	},
});

export const createSelectSchema = factory.createSelectSchema;
export const createInsertSchema = factory.createInsertSchema;
export const createUpdateSchema = factory.createUpdateSchema;
