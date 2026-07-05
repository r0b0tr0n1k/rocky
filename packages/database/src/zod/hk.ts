// --- Dumb Zod - Holder Keeper Domain ---
// ONLY createSelectSchema/createInsertSchema - no .strict(), .omit(), .extend()

import { addresses } from "../schema/hk/addresses.js";
import { farmSubjects } from "../schema/hk/farm-subjects.js";
import { farms } from "../schema/hk/farms.js";
import { subjects } from "../schema/hk/subjects.js";
import { createInsertSchema, createSelectSchema } from "./factory.js";

export const farmSelectSchema = createSelectSchema(farms);
export const farmInsertSchema = createInsertSchema(farms);

export const addressSelectSchema = createSelectSchema(addresses);
export const addressInsertSchema = createInsertSchema(addresses);

export const subjectSelectSchema = createSelectSchema(subjects);
export const subjectInsertSchema = createInsertSchema(subjects);

export const farmSubjectSelectSchema = createSelectSchema(farmSubjects);
export const farmSubjectInsertSchema = createInsertSchema(farmSubjects);
