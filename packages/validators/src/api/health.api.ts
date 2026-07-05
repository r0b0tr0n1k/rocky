// ── Health API Schemas - Diamond Seal ──
//
// Vaccination, Treatment, Disease, Lab Tests - the health boundary.
// No disease escapes without a guillotine check.

import { z } from "zod";
import {
  diseaseSelectSchema,
  diseaseInsertSchema,
  vaccineSelectSchema,
  vaccineInsertSchema,
  vaccineBatchSelectSchema,
  vaccineBatchInsertSchema,
  vaccinationSelectSchema,
  vaccinationInsertSchema,
  treatmentSelectSchema,
  treatmentInsertSchema,
  labTestSelectSchema,
  labTestInsertSchema,
  vaccineDiseaseSelectSchema,
  vaccineDiseaseInsertSchema,
} from "@rocky/database/zod";
import {
  vaccineTypeSchema,
  administrationRouteSchema,
  testTypeSchema,
  testResultSchema,
} from "../enums/domain.js";

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE SCHEMAS (Diamond Seal - what the API returns)
// ═══════════════════════════════════════════════════════════════════════════

/** Disease master record */
export const diseaseResponseSchema = diseaseSelectSchema
  .omit({ createdBy: true, validTo: true })
  .strict();

export type DiseaseResponse = z.infer<typeof diseaseResponseSchema>;

/** Vaccine master record */
export const vaccineResponseSchema = vaccineSelectSchema
  .omit({ createdBy: true, validTo: true })
  .extend({
    type: vaccineTypeSchema,
  })
  .strict();

export type VaccineResponse = z.infer<typeof vaccineResponseSchema>;

/** Vaccine batch record */
export const vaccineBatchResponseSchema = vaccineBatchSelectSchema
  .omit({ createdBy: true, validTo: true })
  .strict();

export type VaccineBatchResponse = z.infer<typeof vaccineBatchResponseSchema>;

/** Vaccination event record */
export const vaccinationResponseSchema = vaccinationSelectSchema
  .omit({ createdBy: true, validTo: true })
  .extend({
    route: administrationRouteSchema,
    adminDate: z.coerce.date(),
  })
  .strict();

export type VaccinationResponse = z.infer<typeof vaccinationResponseSchema>;

/** Treatment event record */
export const treatmentResponseSchema = treatmentSelectSchema
  .omit({ createdBy: true, validTo: true })
  .extend({
    diagnosisDate: z.coerce.date(),
  })
  .strict();

export type TreatmentResponse = z.infer<typeof treatmentResponseSchema>;

/** Laboratory test result record */
export const labTestResponseSchema = labTestSelectSchema
  .omit({ createdBy: true, validTo: true })
  .extend({
    testType: testTypeSchema,
    result: testResultSchema,
    sampleDate: z.coerce.date(),
    resultDate: z.coerce.date(),
  })
  .strict();

export type LabTestResponse = z.infer<typeof labTestResponseSchema>;

/** Vaccine-to-disease mapping record */
export const vaccineDiseaseResponseSchema = vaccineDiseaseSelectSchema
  .omit({ createdBy: true })
  .strict();

export type VaccineDiseaseResponse = z.infer<typeof vaccineDiseaseResponseSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// LIST SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const diseaseListRequestSchema = z
  .strictObject({
    search: z.string().optional(),
    notifiable: z.boolean().optional(),
    limit: z.int().min(1).max(100).default(20),
    offset: z.int().min(0).default(0),
  });

export type DiseaseListRequest = z.infer<typeof diseaseListRequestSchema>;

export const vaccineListRequestSchema = z
  .strictObject({
    search: z.string().optional(),
    type: vaccineTypeSchema.optional(),
    limit: z.int().min(1).max(100).default(20),
    offset: z.int().min(0).default(0),
  });

export type VaccineListRequest = z.infer<typeof vaccineListRequestSchema>;

export const vaccinationListRequestSchema = z
  .strictObject({
    animalId: z.uuid().optional(),
    farmId: z.uuid().optional(),
    vaccineId: z.uuid().optional(),
    vetId: z.uuid().optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    limit: z.int().min(1).max(100).default(20),
    offset: z.int().min(0).default(0),
  });

export type VaccinationListRequest = z.infer<typeof vaccinationListRequestSchema>;

export const treatmentListRequestSchema = z
  .strictObject({
    animalId: z.uuid().optional(),
    farmId: z.uuid().optional(),
    diseaseId: z.uuid().optional(),
    vetId: z.uuid().optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    limit: z.int().min(1).max(100).default(20),
    offset: z.int().min(0).default(0),
  });

export type TreatmentListRequest = z.infer<typeof treatmentListRequestSchema>;

export const labTestListRequestSchema = z
  .strictObject({
    animalId: z.uuid().optional(),
    farmId: z.uuid().optional(),
    diseaseId: z.uuid().optional(),
    testType: testTypeSchema.optional(),
    result: testResultSchema.optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    limit: z.int().min(1).max(100).default(20),
    offset: z.int().min(0).default(0),
  });

export type LabTestListRequest = z.infer<typeof labTestListRequestSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// CREATE / INPUT SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const createDiseaseRequestSchema = diseaseInsertSchema
  .pick({
    name: true,
    notifiable: true,
    description: true,
  })
  .strict();

export type CreateDiseaseRequest = z.infer<typeof createDiseaseRequestSchema>;

export const createVaccineRequestSchema = vaccineInsertSchema
  .pick({
    name: true,
    manufacturer: true,
    type: true,
  })
  .extend({
    type: vaccineTypeSchema,
  })
  .strict();

export type CreateVaccineRequest = z.infer<typeof createVaccineRequestSchema>;

export const createVaccineBatchRequestSchema = vaccineBatchInsertSchema
  .pick({
    vaccineId: true,
    batchNo: true,
    productionDate: true,
    expiryDate: true,
    quantityReceived: true,
  })
  .strict();

export type CreateVaccineBatchRequest = z.infer<typeof createVaccineBatchRequestSchema>;

export const recordVaccinationRequestSchema = vaccinationInsertSchema
  .pick({
    animalId: true,
    farmId: true,
    vaccineId: true,
    batchId: true,
    vetId: true,
    adminDate: true,
    notes: true,
  })
  .extend({
    route: administrationRouteSchema,
    adminDate: z.coerce.date(),
  })
  .refine(
    (data) => data.adminDate <= new Date(),
    { message: "Vaccination date cannot be in the future" },
  )
  .strict();

export type RecordVaccinationRequest = z.infer<typeof recordVaccinationRequestSchema>;

export const recordTreatmentRequestSchema = treatmentInsertSchema
  .pick({
    animalId: true,
    farmId: true,
    diseaseId: true,
    vetId: true,
    diagnosisDate: true,
    treatmentDesc: true,
    isolated: true,
  })
  .strict();

export type RecordTreatmentRequest = z.infer<typeof recordTreatmentRequestSchema>;

export const recordLabTestRequestSchema = labTestInsertSchema
  .pick({
    animalId: true,
    farmId: true,
    diseaseId: true,
    testMethod: true,
    labName: true,
    labSampleId: true,
    sampleDate: true,
    resultDate: true,
    certificateRef: true,
    interpretation: true,
  })
  .extend({
    testType: testTypeSchema,
    result: testResultSchema,
    resultNumeric: z.coerce.number().optional(),
    resultUnit: z.string().max(20).optional(),
    sampleDate: z.coerce.date(),
    resultDate: z.coerce.date(),
  })
  .refine(
    (data) => data.sampleDate <= new Date(),
    { message: "Sample date cannot be in the future" },
  )
  .refine(
    (data) => data.resultDate >= data.sampleDate,
    { message: "Result date must be on or after sample date" },
  )
  .strict();

export type RecordLabTestRequest = z.infer<typeof recordLabTestRequestSchema>;

export const linkVaccineDiseaseRequestSchema = vaccineDiseaseInsertSchema
  .pick({
    vaccineId: true,
    diseaseId: true,
  })
  .strict();

export type LinkVaccineDiseaseRequest = z.infer<typeof linkVaccineDiseaseRequestSchema>;

export const unlinkVaccineDiseaseRequestSchema = z
  .strictObject({
    vaccineId: z.uuid(),
    diseaseId: z.uuid(),
  })
  .strict();

export type UnlinkVaccineDiseaseRequest = z.infer<typeof unlinkVaccineDiseaseRequestSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// GUILLLOTINES
// ═══════════════════════════════════════════════════════════════════════════

import type { NoDrift, ActivateGuillotines } from "../utils/type-bridge.js";

type _drift_diseaseResponse = NoDrift<z.infer<typeof diseaseResponseSchema>, DiseaseResponse>;
type _drift_vaccineResponse = NoDrift<z.infer<typeof vaccineResponseSchema>, VaccineResponse>;
type _drift_vaccineBatchResponse = NoDrift<z.infer<typeof vaccineBatchResponseSchema>, VaccineBatchResponse>;
type _drift_vaccinationResponse = NoDrift<z.infer<typeof vaccinationResponseSchema>, VaccinationResponse>;
type _drift_treatmentResponse = NoDrift<z.infer<typeof treatmentResponseSchema>, TreatmentResponse>;
type _drift_labTestResponse = NoDrift<z.infer<typeof labTestResponseSchema>, LabTestResponse>;
type _drift_vaccineDiseaseResponse = NoDrift<z.infer<typeof vaccineDiseaseResponseSchema>, VaccineDiseaseResponse>;
type _drift_diseaseList = NoDrift<z.infer<typeof diseaseListRequestSchema>, DiseaseListRequest>;
type _drift_vaccineList = NoDrift<z.infer<typeof vaccineListRequestSchema>, VaccineListRequest>;
type _drift_vaccinationList = NoDrift<z.infer<typeof vaccinationListRequestSchema>, VaccinationListRequest>;
type _drift_treatmentList = NoDrift<z.infer<typeof treatmentListRequestSchema>, TreatmentListRequest>;
type _drift_labTestList = NoDrift<z.infer<typeof labTestListRequestSchema>, LabTestListRequest>;
type _drift_createDisease = NoDrift<z.infer<typeof createDiseaseRequestSchema>, CreateDiseaseRequest>;
type _drift_createVaccine = NoDrift<z.infer<typeof createVaccineRequestSchema>, CreateVaccineRequest>;
type _drift_createVaccineBatch = NoDrift<z.infer<typeof createVaccineBatchRequestSchema>, CreateVaccineBatchRequest>;
type _drift_recordVaccination = NoDrift<z.infer<typeof recordVaccinationRequestSchema>, RecordVaccinationRequest>;
type _drift_recordTreatment = NoDrift<z.infer<typeof recordTreatmentRequestSchema>, RecordTreatmentRequest>;
type _drift_recordLabTest = NoDrift<z.infer<typeof recordLabTestRequestSchema>, RecordLabTestRequest>;
type _drift_linkVaccineDisease = NoDrift<z.infer<typeof linkVaccineDiseaseRequestSchema>, LinkVaccineDiseaseRequest>;
type _drift_unlinkVaccineDisease = NoDrift<z.infer<typeof unlinkVaccineDiseaseRequestSchema>, UnlinkVaccineDiseaseRequest>;

export type _HealthGuillotines = ActivateGuillotines<
  [
    _drift_diseaseResponse,
    _drift_vaccineResponse,
    _drift_vaccineBatchResponse,
    _drift_vaccinationResponse,
    _drift_treatmentResponse,
    _drift_labTestResponse,
    _drift_vaccineDiseaseResponse,
    _drift_diseaseList,
    _drift_vaccineList,
    _drift_vaccinationList,
    _drift_treatmentList,
    _drift_labTestList,
    _drift_createDisease,
    _drift_createVaccine,
    _drift_createVaccineBatch,
    _drift_recordVaccination,
    _drift_recordTreatment,
    _drift_recordLabTest,
    _drift_linkVaccineDisease,
    _drift_unlinkVaccineDisease,
  ]
>;
