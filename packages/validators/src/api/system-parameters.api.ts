// ── System Parameters API Schemas - Diamond Seal ──
//
// Software preferences (sm.system_parameters): editable key/value configuration.

import { z } from "zod";
import { systemParametersSelectSchema } from "@rocky/database/zod";
import type { NoDrift, ActivateGuillotines } from "../utils/type-bridge.js";

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

/** A single system parameter (preference). */
export const systemParameterResponseSchema = systemParametersSelectSchema
  .extend({
    createdAt: z.coerce.date<string>(),
    updatedAt: z.coerce.date<string>().nullable(),
  })
  .strict();

export type SystemParameterResponse = z.infer<typeof systemParameterResponseSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// LIST SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const systemParameterListRequestSchema = z.strictObject({
  group: z.string().optional(),
  code: z.string().optional(),
  isActive: z.boolean().optional(),
  q: z.string().optional(),
  limit: z.int().min(1).max(100).default(20),
  offset: z.int().min(0).default(0),
});

export type SystemParameterListRequest = z.infer<typeof systemParameterListRequestSchema>;

export const systemParameterListResponseSchema = z.object({
  data: z.array(systemParameterResponseSchema),
  total: z.number(),
});

export type SystemParameterListResponse = z.infer<typeof systemParameterListResponseSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

/** Update an editable parameter's value and/or active state. */
export const updateSystemParameterSchema = z.strictObject({
  value: z.string(),
  isActive: z.boolean().optional(),
});

export type UpdateSystemParameter = z.infer<typeof updateSystemParameterSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// GUILLOTINES
// ═══════════════════════════════════════════════════════════════════════════

type _drift_systemParameterResponse = NoDrift<
  z.infer<typeof systemParameterResponseSchema>,
  SystemParameterResponse
>;
type _drift_systemParameterListRequest = NoDrift<
  z.infer<typeof systemParameterListRequestSchema>,
  SystemParameterListRequest
>;
type _drift_systemParameterListResponse = NoDrift<
  z.infer<typeof systemParameterListResponseSchema>,
  SystemParameterListResponse
>;
type _drift_updateSystemParameter = NoDrift<
  z.infer<typeof updateSystemParameterSchema>,
  UpdateSystemParameter
>;

export type _SystemParameterGuillotines = ActivateGuillotines<
  [
    _drift_systemParameterResponse,
    _drift_systemParameterListRequest,
    _drift_systemParameterListResponse,
    _drift_updateSystemParameter,
  ]
>;
