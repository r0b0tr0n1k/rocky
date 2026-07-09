// ── Modules API Schemas - Diamond Seal ──
//
// Feature-flag registry (sm.modules): global enable/disable of application
// modules. Per-user-group gating (module_roles) is a future extension.

import { z } from "zod";
import { modulesSelectSchema } from "@rocky/database/zod";
import { moduleTypeSchema } from "../enums/index.js";
import type { NoDrift, ActivateGuillotines } from "../utils/type-bridge.js";

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

/** A feature-flag module. */
export const moduleResponseSchema = modulesSelectSchema
  .extend({
    type: moduleTypeSchema,
    createdAt: z.coerce.date<string>(),
  })
  .strict();

export type ModuleResponse = z.infer<typeof moduleResponseSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// LIST SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const moduleListRequestSchema = z.strictObject({
  type: moduleTypeSchema.optional(),
  isActive: z.boolean().optional(),
  q: z.string().optional(),
  limit: z.int().min(1).max(100).default(20),
  offset: z.int().min(0).default(0),
});

export type ModuleListRequest = z.infer<typeof moduleListRequestSchema>;

export const moduleListResponseSchema = z.object({
  data: z.array(moduleResponseSchema),
  total: z.number(),
});

export type ModuleListResponse = z.infer<typeof moduleListResponseSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

/** Toggle a module's global availability (feature flag). */
export const updateModuleSchema = z.strictObject({
  isActive: z.boolean(),
});

export type UpdateModule = z.infer<typeof updateModuleSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// GUILLOTINES
// ═══════════════════════════════════════════════════════════════════════════

type _drift_moduleResponse = NoDrift<z.infer<typeof moduleResponseSchema>, ModuleResponse>;
type _drift_moduleListRequest = NoDrift<z.infer<typeof moduleListRequestSchema>, ModuleListRequest>;
type _drift_moduleListResponse = NoDrift<z.infer<typeof moduleListResponseSchema>, ModuleListResponse>;
type _drift_updateModule = NoDrift<z.infer<typeof updateModuleSchema>, UpdateModule>;

export type _ModuleGuillotines = ActivateGuillotines<
  [_drift_moduleResponse, _drift_moduleListRequest, _drift_moduleListResponse, _drift_updateModule]
>;
