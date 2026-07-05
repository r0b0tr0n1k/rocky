// ── Dumb Zod: Health Domain ──
// Auto-generated from Drizzle schemas — NO .strict(), .omit(), .extend()

import { createSelectSchema, createInsertSchema } from "./factory";
import { diseases } from "../schema/hd/diseases";
import { vaccines } from "../schema/hd/vaccines";
import { vaccineBatches } from "../schema/hd/vaccine-batches";
import { vaccinations } from "../schema/hd/vaccinations";
import { treatments } from "../schema/hd/treatments";
import { labTests } from "../schema/hd/lab-tests";
import { vaccineDiseases } from "../schema/hd/vaccine-diseases";

export const diseaseSelectSchema = createSelectSchema(diseases);
export const diseaseInsertSchema = createInsertSchema(diseases);

export const vaccineSelectSchema = createSelectSchema(vaccines);
export const vaccineInsertSchema = createInsertSchema(vaccines);

export const vaccineBatchSelectSchema = createSelectSchema(vaccineBatches);
export const vaccineBatchInsertSchema = createInsertSchema(vaccineBatches);

export const vaccinationSelectSchema = createSelectSchema(vaccinations);
export const vaccinationInsertSchema = createInsertSchema(vaccinations);

export const treatmentSelectSchema = createSelectSchema(treatments);
export const treatmentInsertSchema = createInsertSchema(treatments);

export const labTestSelectSchema = createSelectSchema(labTests);
export const labTestInsertSchema = createInsertSchema(labTests);

export const vaccineDiseaseSelectSchema = createSelectSchema(vaccineDiseases);
export const vaccineDiseaseInsertSchema = createInsertSchema(vaccineDiseases);
