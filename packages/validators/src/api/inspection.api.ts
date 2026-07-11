// ── Inspection API Schemas - Diamond Seal ──
//
// On-spot inspections, risk analysis, and notifiable disease alert integration.

import { z } from "zod";
import {
  inspectionsSelectSchema,
  inspectionsInsertSchema,
  riskAnalysesSelectSchema,
} from "@rocky/database/zod";
import {
  inspectionStatusSchema,
  animalStatusSchema,
  sexSchema,
  languageSchema,
  type animalStatusType,
  type sexType,
} from "../enums/index.js";
import type { NoDrift, NoDriftSimple, ActivateGuillotines } from "../utils/type-bridge.js";

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

/** Inspection record */
export const inspectionResponseSchema = inspectionsSelectSchema
  .omit({ createdBy: true, validTo: true })
  .extend({
    status: inspectionStatusSchema,
  }).strip(); // WO-040: kept .strip() — service passes full DB rows; .strict() would reject omitted audit keys

export type InspectionResponse = z.infer<typeof inspectionResponseSchema>;

/** Paginated list of inspections */
export const inspectionListResponseSchema = z
  .object({ data: z.array(inspectionResponseSchema), total: z.number(), limit: z.number(), offset: z.number() })
  .strict();
export type InspectionListResponse = z.infer<typeof inspectionListResponseSchema>;

/** Result of running a risk analysis */
export const riskAnalysisRunResponseSchema = z
  .object({ analysisId: z.string(), selectedFarmCount: z.number(), totalFarmCount: z.number() })
  .strict();
export type RiskAnalysisRunResponse = z.infer<typeof riskAnalysisRunResponseSchema>;

/** Paginated list of risk analyses (faithful projection of the risk-analysis row) */
export const riskAnalysisListResponseSchema = z.object({ data: z.array(riskAnalysesSelectSchema), total: z.number() }).strict();
export type RiskAnalysisListResponse = z.infer<typeof riskAnalysisListResponseSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// CHECKED ANIMAL (Form Data - Section F of inspection-form.yaml)
// ═══════════════════════════════════════════════════════════════════════════

/** Per-animal checklist entry - populated when form is generated, filled by VI during on-spot visit */
export interface CheckedAnimal {
  animalId: string;
  earTagNumber: string;
  stateCode: string;
  sex: sexType;
  breed: string | null;
  birthDate: Date | null;
  motherId: string | null;
  currentStatus: animalStatusType;
  tagPresent: boolean | null;
  tagCorrect: boolean | null;
  animalPresent: boolean | null;
  discrepancyNote: string | null;
}

export const checkedAnimalSchema = z.strictObject({
  animalId: z.uuid(),
  earTagNumber: z.string(),
  stateCode: z.string(),
  sex: sexSchema,
  breed: z.string().nullable(),
  birthDate: z.coerce.date<string>().nullable(),
  motherId: z.uuid().nullable(),
  currentStatus: animalStatusSchema,
  tagPresent: z.boolean().nullable(),
  tagCorrect: z.boolean().nullable(),
  animalPresent: z.boolean().nullable(),
  discrepancyNote: z.string().nullable(),
}) satisfies z.ZodType<CheckedAnimal>;

export type CheckedAnimalList = CheckedAnimal[];

export const checkedAnimalListSchema = z.array(checkedAnimalSchema);

// ═══════════════════════════════════════════════════════════════════════════
// LIST SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const inspectionListRequestSchema = z
  .strictObject({
    status: inspectionStatusSchema.optional(),
    farmId: z.uuid().optional(),
    inspectorId: z.uuid().optional(),
    limit: z.int().min(1).max(100).default(20),
    offset: z.int().min(0).default(0),
  });

export type InspectionListRequest = z.infer<typeof inspectionListRequestSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// CREATE / INPUT SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const createInspectionRequestSchema = inspectionsInsertSchema
  .pick({
    farmId: true,
    inspectorId: true,
    riskScore: true,
    riskCriteria: true,
    selectedByRiskAnalysis: true,
    notes: true,
  })
  .extend({
    scheduledDate: z.coerce.date<string>().optional(),
  })
  .strict();

export type CreateInspectionRequest = z.infer<typeof createInspectionRequestSchema>;

export const completeInspectionRequestSchema = z.strictObject(z
  .strictObject({
    id: z.uuid(),
    inspectionDate: z.coerce.date<string>(),
    result: z.string().max(50).optional(),
    notes: z.string().optional(),
    discrepanciesFound: z.boolean().optional(),
    keeperSigned: z.boolean().optional(),
    formReturned: z.boolean().optional(),
  }).shape);

export type CompleteInspectionRequest = z.infer<typeof completeInspectionRequestSchema>;

export const scheduleInspectionRequestSchema = z.strictObject(z
  .strictObject({
    id: z.uuid(),
    scheduledDate: z.coerce.date<string>(),
  }).shape);

export type ScheduleInspectionRequest = z.infer<typeof scheduleInspectionRequestSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// FORM GENERATION SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const printInspectionFormRequestSchema = z.strictObject(z
  .strictObject({
    id: z.uuid(),
    language: languageSchema.nullable().optional().transform((v) => (v ?? "MK") as z.infer<typeof languageSchema>),
  }).shape);

export type PrintInspectionFormRequest = z.infer<typeof printInspectionFormRequestSchema>;

/** The generated form data structure - matches models/inspection-form.yaml */
export interface InspectionFormData {
  formId: string;
  formVersion: string;
  generatedAt: Date;
  language: string;
  farm: {
    farmId: string;
    farmIdNumber: string;
    farmName: string | null;
    owner: { subjectId: string | null; shortName: string | null; personalId: string | null };
    keeper: { subjectId: string | null; shortName: string | null };
    address: { street: string | null; city: string | null; zipCode: string | null; commune: string | null; state: string | null };
  };
  inspector: { inspectorId: string; shortName: string; vsName: string | null };
  riskAnalysis: {
    selectedByRiskAnalysis: boolean;
    riskScore: string | null;
    riskCriteria: string | null;
    analysisPeriod: string | null;
  };
  scheduledDate: Date | null;
  inspectionDate: Date | null;
  animals: CheckedAnimal[];
  result: {
    overallResult: string | null;
    discrepanciesFound: boolean;
    notes: string | null;
  };
  signature: {
    keeperSigned: boolean;
    signedAt: Date | null;
  };
  lifecycle: {
    formPrinted: boolean;
    formReturned: boolean;
    storedAtVi: boolean;
    retentionExpiry: Date | null;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// GUILLOTINES
// ═══════════════════════════════════════════════════════════════════════════

type _drift_inspectionResponse = NoDrift<z.infer<typeof inspectionResponseSchema>, InspectionResponse>;
type _drift_inspectionList = NoDrift<z.infer<typeof inspectionListRequestSchema>, InspectionListRequest>;
type _drift_createInspection = NoDrift<z.infer<typeof createInspectionRequestSchema>, CreateInspectionRequest>;
type _drift_completeInspection = NoDrift<z.infer<typeof completeInspectionRequestSchema>, CompleteInspectionRequest>;
type _drift_scheduleInspection = NoDrift<z.infer<typeof scheduleInspectionRequestSchema>, ScheduleInspectionRequest>;
type _drift_checkedAnimal = NoDriftSimple<z.infer<typeof checkedAnimalSchema>, CheckedAnimal>;
type _drift_printForm = NoDrift<z.infer<typeof printInspectionFormRequestSchema>, PrintInspectionFormRequest>;

export type _InspectionGuillotines = ActivateGuillotines<
  [
    _drift_inspectionResponse,
    _drift_inspectionList,
    _drift_createInspection,
    _drift_completeInspection,
    _drift_scheduleInspection,
    _drift_checkedAnimal,
    _drift_printForm,
  ]
>;
