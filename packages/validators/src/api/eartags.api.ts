// ── Ear Tags API Schemas — Diamond Seal ──
//
// Ear tags are the material trace of the animal in the Symbolic order.
// Every tag has a lifecycle: manufactured → allocated → applied → replaced.
//
// Based on: FS - eartags_MK(v1.0).pdf, Eartags.PDF

import { z } from "zod";
import { earTagSelectSchema, earTagTypeSelectSchema } from "@rocky/database/zod";
import {
  earTagStatusSchema,
  contingentTypeSchema,
  duplicateTypeSchema,
  orderStatusSchema,
  allocationTypeSchema,
  sortByEartagSchema,
  sortOrderSchema,
} from "../enums/domain.js";
import type { earTagStatusType, orderStatusType } from "../enums/domain.js";
import { farmIdSchema } from "../utils/check-digit.js";
import { STATE_CODE, ORDER_STATUS, CONTINGENT_TYPE } from "../enums/index.js";

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const earTagResponseSchema = earTagSelectSchema
  .omit({ createdBy: true, validTo: true })
  .extend({
    appliedDate: z.coerce.date().nullable(),
    manufactureDate: z.coerce.date().nullable(),
    expiryDate: z.coerce.date().nullable(),
    status: earTagStatusSchema,
  })
  .strict();

export type EarTagResponse = z.infer<typeof earTagResponseSchema>;
