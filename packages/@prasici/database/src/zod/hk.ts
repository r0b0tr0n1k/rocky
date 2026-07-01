// ── Dumb Zod — Holder Keeper Domain ──
// ONLY createSelectSchema/createInsertSchema — no .strict(), .omit(), .extend()

import { createSelectSchema, createInsertSchema } from "./factory";
import { farms } from "../schema/hk/farms";
import { addresses } from "../schema/hk/addresses";
import { subjects } from "../schema/hk/subjects";
import { farmSubjects } from "../schema/hk/farm-subjects";

export const farmSelectSchema = createSelectSchema(farms);
export const farmInsertSchema = createInsertSchema(farms);

export const addressSelectSchema = createSelectSchema(addresses);
export const addressInsertSchema = createInsertSchema(addresses);

export const subjectSelectSchema = createSelectSchema(subjects);
export const subjectInsertSchema = createInsertSchema(subjects);

export const farmSubjectSelectSchema = createSelectSchema(farmSubjects);
export const farmSubjectInsertSchema = createInsertSchema(farmSubjects);
