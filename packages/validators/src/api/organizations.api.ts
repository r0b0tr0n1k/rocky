// ── Organizations API Schemas - Diamond Seal ──
//
// Organizations are the administrative units of the Veterinary Directorate.
// Based on: SM.PDF

import { organizationsSelectSchema } from "@rocky/database/zod";
import { z } from "zod";
import type { NoDrift, ActivateGuillotines } from "../utils/type-bridge.js";

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const organizationResponseSchema = organizationsSelectSchema
  .omit({ createdBy: true, validTo: true })
  .extend({
    address: z
      .object({
        street: z.string(),
        city: z.string(),
        zipCode: z.string(),
      })
      .nullable(),
  }).strip(); // WO-040: kept .strip() — service passes full DB rows; .strict() would reject omitted audit keys

export type OrganizationResponse = z.infer<typeof organizationResponseSchema>;

export const organizationSummarySchema = z.object({
  id: z.uuid(),
  name1: z.string(),
  orgType: z.string(),
  parentId: z.uuid().nullable(),
  isActive: z.boolean(),
});

export type OrganizationSummary = z.infer<typeof organizationSummarySchema>;

// REQUEST SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const createOrganizationRequestSchema = z.strictObject({
  name1: z.string().min(1).max(100),
  name2: z.string().max(100).optional(),
  name3: z.string().max(100).optional(),
  address: z
    .object({
      street: z.string(),
      city: z.string(),
      zipCode: z.string(),
    })
    .optional(),
  phone: z.string().max(30).optional(),
  email: z.email().optional(),
  orgType: z.string().min(1).max(30),
  parentId: z.uuid().optional(),
});

export type CreateOrganizationRequest = z.infer<typeof createOrganizationRequestSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// GUILLOTINES
// ═══════════════════════════════════════════════════════════════════════════

type _drift_organizationResponse = NoDrift<z.infer<typeof organizationResponseSchema>, OrganizationResponse>;
type _drift_organizationSummary = NoDrift<z.infer<typeof organizationSummarySchema>, OrganizationSummary>;
type _drift_createOrganization = NoDrift<z.infer<typeof createOrganizationRequestSchema>, CreateOrganizationRequest>;

export type _OrganizationGuillotines = ActivateGuillotines<
  [_drift_organizationResponse, _drift_organizationSummary, _drift_createOrganization]
>;
