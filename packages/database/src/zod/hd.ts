// ── Dumb Zod: Health Domain ──
// Auto-generated from Drizzle schemas - NO .strict(), .omit(), .extend()

import { diseases } from "../schema/hd/diseases.js";
import { labTests } from "../schema/hd/lab-tests.js";
import { treatments } from "../schema/hd/treatments.js";
import { vaccinations } from "../schema/hd/vaccinations.js";
import { vaccineBatches } from "../schema/hd/vaccine-batches.js";
import { vaccineDiseases } from "../schema/hd/vaccine-diseases.js";
import { vaccines } from "../schema/hd/vaccines.js";
import { createInsertSchema, createSelectSchema } from "./factory.js";

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
