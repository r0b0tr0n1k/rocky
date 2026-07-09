// ── Subjects API Schemas - Diamond Seal ──
//
// The subject is the human agent in the I&R system - farmer, vet, slaughterhouse operator.
// Without the subject, the farm is an empty vessel.
//
// Based on: FS - HK_MK(v1.0).pdf, HK.PDF

import { farmSubjectsSelectSchema, subjectsInsertSchema, subjectsSelectSchema } from "@rocky/database/zod";
import { z } from "zod";
import { subjectRoleSchema } from "../enums/index.js";
import type { NoDrift, NoDriftSimple, ActivateGuillotines } from "../utils/type-bridge.js";

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const subjectResponseSchema = subjectsSelectSchema.omit({ createdBy: true, validTo: true }).strip();

export type SubjectResponse = z.infer<typeof subjectResponseSchema>;

export const subjectSummarySchema = z.object({
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

export const farmSubjectBindingResponseSchema = farmSubjectsSelectSchema
  .omit({ createdBy: true, validTo: true }).strip();

export type FarmSubjectBindingResponse = z.infer<typeof farmSubjectBindingResponseSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const createSubjectRequestSchema = subjectsInsertSchema
  .omit({ id: true, createdAt: true, createdBy: true, validTo: true })
  .extend({
    shortName: z.string().min(1).max(50),
    personalId: z.string().max(20).optional(),
    phoneNumber: z.string().max(30).optional(),
    email: z.email().optional(),
  }).strict();

export type CreateSubjectRequest = z.infer<typeof createSubjectRequestSchema>;

export const updateSubjectRequestSchema = z
  .strictObject({
    shortName: z.string().min(1).max(50).optional(),
    shortNameAlt: z.string().max(50).optional(),
    firstName: z.string().max(50).optional(),
    firstNameAlt: z.string().max(50).optional(),
    lastName: z.string().max(50).optional(),
    lastNameAlt: z.string().max(50).optional(),
    companyName: z.string().max(100).optional(),
    personalId: z.string().max(20).optional(),
    vatNumber: z.string().max(20).optional(),
    phoneNumber: z.string().max(30).optional(),
    email: z.email().optional(),
    addressId: z.uuid().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "At least one field must be updated");

export type UpdateSubjectRequest = z.infer<typeof updateSubjectRequestSchema>;

export const bindSubjectToFarmRequestSchema = z.strictObject({
  farmId: z.uuid(),
  subjectId: z.uuid(),
  role: subjectRoleSchema,
});

export type BindSubjectToFarmRequest = z.infer<typeof bindSubjectToFarmRequestSchema>;

export const unbindSubjectFromFarmRequestSchema = z.strictObject({
  bindingId: z.uuid(),
});

export type UnbindSubjectFromFarmRequest = z.infer<typeof unbindSubjectFromFarmRequestSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// GUILLOTINES
// ═══════════════════════════════════════════════════════════════════════════

type _drift_subjectResponse = NoDrift<z.infer<typeof subjectResponseSchema>, SubjectResponse>;
type _drift_subjectSummary = NoDrift<z.infer<typeof subjectSummarySchema>, SubjectSummary>;
type _drift_farmSubjectBindingResponse = NoDrift<z.infer<typeof farmSubjectBindingResponseSchema>, FarmSubjectBindingResponse>;
type _drift_createSubject = NoDriftSimple<z.infer<typeof createSubjectRequestSchema>, CreateSubjectRequest>;
type _drift_updateSubject = NoDrift<z.infer<typeof updateSubjectRequestSchema>, UpdateSubjectRequest>;
type _drift_bindSubjectToFarm = NoDrift<z.infer<typeof bindSubjectToFarmRequestSchema>, BindSubjectToFarmRequest>;
type _drift_unbindSubjectFromFarm = NoDrift<z.infer<typeof unbindSubjectFromFarmRequestSchema>, UnbindSubjectFromFarmRequest>;

export type _SubjectGuillotines = ActivateGuillotines<
  [_drift_subjectResponse, _drift_subjectSummary, _drift_farmSubjectBindingResponse,
   _drift_createSubject, _drift_updateSubject, _drift_bindSubjectToFarm,
   _drift_unbindSubjectFromFarm]
>;
