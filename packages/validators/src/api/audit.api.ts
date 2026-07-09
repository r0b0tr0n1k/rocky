// ── Audit API Schemas - Diamond Seal ──
//
// Centralized audit log (ADR-0007): pre/post snapshots of domain mutations,
// surfaced read-only to SUPER_ADMIN / VD_ADMIN via the /audit admin page.

import { z } from "zod";
import { auditLogSelectSchema } from "@rocky/database/zod";
import { auditActionSchema, eventSourceSchema } from "../enums/index.js";
import type { NoDrift, ActivateGuillotines } from "../utils/type-bridge.js";

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

/** A single audit-log record (RLS already scopes rows to the caller). */
export const auditResponseSchema = auditLogSelectSchema
  .extend({
    action: auditActionSchema,
    source: eventSourceSchema,
    createdAt: z.coerce.date<string>(),
  })
  .strict();

export type AuditResponse = z.infer<typeof auditResponseSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// LIST SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const auditListRequestSchema = z.strictObject({
  userId: z.uuid().optional(),
  resource: z.string().optional(),
  action: auditActionSchema.optional(),
  source: eventSourceSchema.optional(),
  success: z.boolean().optional(),
  q: z.string().optional(),
  from: z.coerce.date<string>().optional(),
  to: z.coerce.date<string>().optional(),
  limit: z.int().min(1).max(100).default(20),
  offset: z.int().min(0).default(0),
});

export type AuditListRequest = z.infer<typeof auditListRequestSchema>;

export const auditListResponseSchema = z.object({
  data: z.array(auditResponseSchema),
  total: z.number(),
});

export type AuditListResponse = z.infer<typeof auditListResponseSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// GUILLOTINES
// ═══════════════════════════════════════════════════════════════════════════

type _drift_auditResponse = NoDrift<z.infer<typeof auditResponseSchema>, AuditResponse>;
type _drift_auditListRequest = NoDrift<z.infer<typeof auditListRequestSchema>, AuditListRequest>;
type _drift_auditListResponse = NoDrift<z.infer<typeof auditListResponseSchema>, AuditListResponse>;

export type _AuditGuillotines = ActivateGuillotines<
  [_drift_auditResponse, _drift_auditListRequest, _drift_auditListResponse]
>;
