// ── Subjects API Schemas - Diamond Seal ──
//
// The subject is the human agent in the I&R system - farmer, vet, slaughterhouse operator.
// Without the subject, the farm is an empty vessel.
//
// Based on: FS - HK_MK(v1.0).pdf, HK.PDF

import { z } from "zod";
import { subjectSelectSchema, subjectInsertSchema, farmSubjectSelectSchema } from "@rocky/database/zod";
import { subjectRoleSchema } from "../enums/domain.js";

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const subjectResponseSchema = subjectSelectSchema.omit({ createdBy: true, validTo: true }).strict();

export type SubjectResponse = z.infer<typeof subjectResponseSchema>;

export const subjectSummarySchema = z.strictObject({
  id: z.uuid(),
  shortName: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  personalId: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  email: z.string().nullable(),
  isActive: z.boolean(),
});

export type SubjectSummary = z.infer<typeof subjectSummarySchema>;

export const farmSubjectBindingResponseSchema = farmSubjectSelectSchema
  .omit({ createdBy: true, validTo: true })
  .strict();

export type FarmSubjectBindingResponse = z.infer<typeof farmSubjectBindingResponseSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const createSubjectRequestSchema = subjectInsertSchema
  .omit({ id: true, createdAt: true, createdBy: true, validTo: true })
  .extend({
    shortName: z.string().min(1).max(50),
    personalId: z.string().max(20).optional(),
    phoneNumber: z.string().max(30).optional(),
    email: z.email().optional(),
  });

export type CreateSubjectRequest = z.infer<typeof createSubjectRequestSchema>;

export const bindSubjectToFarmRequestSchema = z.object({
  farmId: z.uuid(),
  subjectId: z.uuid(),
  role: subjectRoleSchema,
});

export type BindSubjectToFarmRequest = z.infer<typeof bindSubjectToFarmRequestSchema>;

export const unbindSubjectFromFarmRequestSchema = z.object({
  bindingId: z.uuid(),
});

export type UnbindSubjectFromFarmRequest = z.infer<typeof unbindSubjectFromFarmRequestSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// GUILLOTINES
// ═══════════════════════════════════════════════════════════════════════════
