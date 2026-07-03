// ── Farms API Schemas — Diamond Seal ──
//
// The farm is the fundamental unit of the I&R system, Comrade.
// Without a farm, an animal is a floating signifier with no anchor in the material world.
//
// Based on: FS - HK_MK(v1.0).pdf, HK.PDF

import { z } from "zod";
import { farmSelectSchema, farmInsertSchema, addressSelectSchema } from "@rocky/database/zod";
import { verificationStatusSchema, farmTypeSchema, dataSourceSchema } from "../enums/domain.js";
import type { verificationStatusType, farmTypeType, dataSourceType } from "../enums/domain.js";
import { farmIdSchema } from "../utils/check-digit.js";

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const farmResponseSchema = farmSelectSchema
  .omit({ createdBy: true, updatedBy: true, validTo: true })
  .extend({
    location: z.unknown().nullable(),
    signatureCapturedAt: z.coerce.date().nullable(),
    verifiedAt: z.coerce.date().nullable(),
    type: farmTypeSchema,
    verificationStatus: verificationStatusSchema,
    dataSource: dataSourceSchema,
  })
  .strict();

export type FarmResponse = z.infer<typeof farmResponseSchema>;
