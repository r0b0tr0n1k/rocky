// ── Organizations API Schemas - Diamond Seal ──
//
// Organizations are the administrative units of the Veterinary Directorate.
// Based on: SM.PDF

import { z } from "zod";
import { organizationSelectSchema } from "@rocky/database/zod";

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const organizationResponseSchema = organizationSelectSchema
  .omit({ createdBy: true, validTo: true })
  .extend({
    address: z
      .object({
        street: z.string(),
        city: z.string(),
        zipCode: z.string(),
      })
      .nullable(),
  })
  .strict();

export type OrganizationResponse = z.infer<typeof organizationResponseSchema>;

export const organizationSummarySchema = z.strictObject({
    id: z.uuid(),
    name1: z.string(),
    orgType: z.string(),
    parentId: z.uuid().nullable(),
    isActive: z.boolean(),
  });

export type OrganizationSummary = z.infer<typeof organizationSummarySchema>;

// REQUEST SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const createOrganizationRequestSchema = z.object({
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
