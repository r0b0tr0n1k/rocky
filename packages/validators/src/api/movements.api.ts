// ── Movements API Schemas — Diamond Seal ──
//
// Movement is the dialectical synthesis of the animal's journey, Comrade.
// Every movement changes the animal's position in the Symbolic order.
//
// Based on: FS - registration_MK(v0.91).pdf §Business rules (p12-15)

import { z } from "zod";
import { movementSelectSchema, movementInsertSchema } from "@rocky/database/zod";
import { movementTypeSchema } from "../enums/domain.js";
import { sortByMovementSchema, sortOrderSchema } from "../enums/domain.js";
import type { movementTypeType } from "../enums/domain.js";
import { earTagSchema, farmIdSchema } from "../utils/check-digit.js";

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const movementResponseSchema = movementSelectSchema
  .omit({ createdBy: true, validTo: true })
  .extend({
    movementDate: z.coerce.date(),
    arrivalDate: z.coerce.date().nullable(),
    deathDate: z.coerce.date().nullable(),
    type: movementTypeSchema,
  })
  .strict();

export type MovementResponse = z.infer<typeof movementResponseSchema>;
