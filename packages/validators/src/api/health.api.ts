// ── Health API Schemas - Diamond Seal ──
//
// Vaccination, Treatment, Disease, Lab Tests - the health boundary.
// No disease escapes without a guillotine check.

import { z } from "zod";
import {
  diseasesSelectSchema,
  diseasesInsertSchema,
  vaccinesSelectSchema,
  vaccinesInsertSchema,
  vaccineBatchesSelectSchema,
  vaccineBatchesInsertSchema,
  vaccinationsSelectSchema,
  vaccinationsInsertSchema,
  treatmentsSelectSchema,
  treatmentsInsertSchema,
  labTestsSelectSchema,
  labTestsInsertSchema,
  vaccineDiseasesSelectSchema,
  vaccineDiseasesInsertSchema,
} from "@rocky/database/zod";
import {
  vaccineTypeSchema,
  administrationRouteSchema,
  testTypeSchema,
  testResultSchema,
  healthRecordTypeSchema,
  type healthRecordTypeType,
} from "../enums/index.js";
import type { NoDrift, ActivateGuillotines } from "../utils/type-bridge.js";

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE SCHEMAS (Diamond Seal - what the API returns)
// ═══════════════════════════════════════════════════════════════════════════

/** Disease master record */
export const diseaseResponseSchema = diseasesSelectSchema
  .omit({ createdBy: true, validTo: true }).strip();

export type DiseaseResponse = z.infer<typeof diseaseResponseSchema>;

/** Vaccine master record */
export const vaccineResponseSchema = vaccinesSelectSchema
  .omit({ createdBy: true, validTo: true })
  .extend({
    type: vaccineTypeSchema,
  }).strip();

export type VaccineResponse = z.infer<typeof vaccineResponseSchema>;

/** Vaccine batch record */
export const vaccineBatchResponseSchema = vaccineBatchesSelectSchema
  .omit({ createdBy: true, validTo: true }).strip();

export type VaccineBatchResponse = z.infer<typeof vaccineBatchResponseSchema>;

/** Vaccination event record */
export const vaccinationResponseSchema = vaccinationsSelectSchema
  .omit({ createdBy: true, validTo: true })
  .extend({
    route: administrationRouteSchema,
    adminDate: z.coerce.date<string>(),
  }).strip();

export type VaccinationResponse = z.infer<typeof vaccinationResponseSchema>;

/** Treatment event record */
export const treatmentResponseSchema = treatmentsSelectSchema
  .omit({ createdBy: true, validTo: true })
  .extend({
    diagnosisDate: z.coerce.date<string>(),
  }).strip();

export type TreatmentResponse = z.infer<typeof treatmentResponseSchema>;

/** Laboratory test result record */
export const labTestResponseSchema = labTestsSelectSchema
  .omit({ createdBy: true, validTo: true })
  .extend({
    testType: testTypeSchema,
    result: testResultSchema,
    sampleDate: z.coerce.date<string>(),
    resultDate: z.coerce.date<string>(),
  }).strip();

export type LabTestResponse = z.infer<typeof labTestResponseSchema>;

/** Vaccine-to-disease mapping record */
export const vaccineDiseaseResponseSchema = vaccineDiseasesSelectSchema
  .omit({ createdBy: true }).strip();

export type VaccineDiseaseResponse = z.infer<typeof vaccineDiseaseResponseSchema>;

// ── Paginated list responses (Diamond Seal) ──
export const diseaseListResponseSchema = z
  .object({ data: z.array(diseaseResponseSchema), total: z.number(), limit: z.number(), offset: z.number() })
  .strip();
export type DiseaseListResponse = z.infer<typeof diseaseListResponseSchema>;

export const vaccineListResponseSchema = z
  .object({ data: z.array(vaccineResponseSchema), total: z.number(), limit: z.number(), offset: z.number() })
  .strip();
export type VaccineListResponse = z.infer<typeof vaccineListResponseSchema>;

export const vaccineBatchListResponseSchema = z
  .object({ data: z.array(vaccineBatchResponseSchema), total: z.number(), limit: z.number(), offset: z.number() })
  .strip();
export type VaccineBatchListResponse = z.infer<typeof vaccineBatchListResponseSchema>;

export const vaccinationListResponseSchema = z
  .object({ data: z.array(vaccinationResponseSchema), total: z.number(), limit: z.number(), offset: z.number() })
  .strip();
export type VaccinationListResponse = z.infer<typeof vaccinationListResponseSchema>;

export const treatmentListResponseSchema = z
  .object({ data: z.array(treatmentResponseSchema), total: z.number(), limit: z.number(), offset: z.number() })
  .strip();
export type TreatmentListResponse = z.infer<typeof treatmentListResponseSchema>;

export const labTestListResponseSchema = z
  .object({ data: z.array(labTestResponseSchema), total: z.number(), limit: z.number(), offset: z.number() })
  .strip();
export type LabTestListResponse = z.infer<typeof labTestListResponseSchema>;

export const vaccineDiseaseListResponseSchema = z.array(vaccineDiseaseResponseSchema);
export type VaccineDiseaseListResponse = z.infer<typeof vaccineDiseaseListResponseSchema>;

export const vaccineDiseaseUnlinkResponseSchema = z.object({ deleted: z.boolean() }).strip();
export type VaccineDiseaseUnlinkResponse = z.infer<typeof vaccineDiseaseUnlinkResponseSchema>;

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
    dateFrom: z.coerce.date<string>().optional(),
    dateTo: z.coerce.date<string>().optional(),
    limit: z.int().min(1).max(100).default(20),
    offset: z.int().min(0).default(0),
  })
  .superRefine((data, ctx) => {
    if (data.dateFrom && data.dateTo && data.dateFrom > data.dateTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "dateFrom must be on or before dateTo",
        path: ["dateTo"],
      });
    }
  });

export type VaccinationListRequest = z.infer<typeof vaccinationListRequestSchema>;

export const treatmentListRequestSchema = z
  .strictObject({
    animalId: z.uuid().optional(),
    farmId: z.uuid().optional(),
    diseaseId: z.uuid().optional(),
    vetId: z.uuid().optional(),
    dateFrom: z.coerce.date<string>().optional(),
    dateTo: z.coerce.date<string>().optional(),
    limit: z.int().min(1).max(100).default(20),
    offset: z.int().min(0).default(0),
  })
  .superRefine((data, ctx) => {
    if (data.dateFrom && data.dateTo && data.dateFrom > data.dateTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "dateFrom must be on or before dateTo",
        path: ["dateTo"],
      });
    }
  });

export type TreatmentListRequest = z.infer<typeof treatmentListRequestSchema>;

export const labTestListRequestSchema = z
  .strictObject({
    animalId: z.uuid().optional(),
    farmId: z.uuid().optional(),
    diseaseId: z.uuid().optional(),
    testType: testTypeSchema.optional(),
    result: testResultSchema.optional(),
    dateFrom: z.coerce.date<string>().optional(),
    dateTo: z.coerce.date<string>().optional(),
    limit: z.int().min(1).max(100).default(20),
    offset: z.int().min(0).default(0),
  })
  .superRefine((data, ctx) => {
    if (data.dateFrom && data.dateTo && data.dateFrom > data.dateTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "dateFrom must be on or before dateTo",
        path: ["dateTo"],
      });
    }
  });

export type LabTestListRequest = z.infer<typeof labTestListRequestSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// CREATE / INPUT SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const createDiseaseRequestSchema = diseasesInsertSchema
  .pick({
    name: true,
    notifiable: true,
    description: true,
  })
  .strict();

export type CreateDiseaseRequest = z.infer<typeof createDiseaseRequestSchema>;

export const createVaccineRequestSchema = vaccinesInsertSchema
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

export const createVaccineBatchRequestSchema = vaccineBatchesInsertSchema
  .pick({
    vaccineId: true,
    batchNo: true,
    productionDate: true,
    expiryDate: true,
    quantityReceived: true,
  })
  .strict();

export type CreateVaccineBatchRequest = z.infer<typeof createVaccineBatchRequestSchema>;

export const recordVaccinationRequestSchema = vaccinationsInsertSchema
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
    adminDate: z.coerce.date<string>(),
  })
  .refine(
    (data) => data.adminDate <= new Date(),
    { message: "Vaccination date cannot be in the future" },
  )
  .strict();

export type RecordVaccinationRequest = z.infer<typeof recordVaccinationRequestSchema>;

export const recordTreatmentRequestSchema = treatmentsInsertSchema
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

export const recordLabTestRequestSchema = labTestsInsertSchema
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
    sampleDate: z.coerce.date<string>(),
    resultDate: z.coerce.date<string>(),
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

export const linkVaccineDiseaseRequestSchema = vaccineDiseasesInsertSchema
  .pick({
    vaccineId: true,
    diseaseId: true,
  })
  .strict();

export type LinkVaccineDiseaseRequest = z.infer<typeof linkVaccineDiseaseRequestSchema>;

export const unlinkVaccineDiseaseRequestSchema = z.strictObject(z
  .strictObject({
    vaccineId: z.uuid(),
    diseaseId: z.uuid(),
  }).shape);

export type UnlinkVaccineDiseaseRequest = z.infer<typeof unlinkVaccineDiseaseRequestSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// PDA SYNC SCHEMAS (Phase 5)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * PDA sync download — returns all master data the mobile app needs to work offline.
 */
export const syncDownloadResponseSchema = z.strictObject({
  diseases: z.array(diseaseResponseSchema),
  vaccines: z.array(vaccineResponseSchema),
  batches: z.array(vaccineBatchResponseSchema),
  vaccineDiseases: z.array(vaccineDiseaseResponseSchema),
  syncedAt: z.coerce.date<string>(),
}) satisfies z.ZodType<SyncDownloadResponse>;

export type SyncDownloadResponse = {
  diseases: DiseaseResponse[];
  vaccines: VaccineResponse[];
  batches: VaccineBatchResponse[];
  vaccineDiseases: VaccineDiseaseResponse[];
  syncedAt: Date;
};

/**
 * Upload record with idempotency key for offline sync.
 */
export const syncUploadItemSchema = z.strictObject({
  idempotencyKey: z.string().max(100),
  type: healthRecordTypeSchema,
  data: z.record(z.string(), z.unknown()),
}) satisfies z.ZodType<SyncUploadItem>;

export type SyncUploadItem = {
  idempotencyKey: string;
  type: healthRecordTypeType;
  data: Record<string, unknown>;
};

export const syncUploadRequestSchema = z.strictObject({
  records: z.array(syncUploadItemSchema).min(1).max(500),
}) satisfies z.ZodType<SyncUploadRequest>;

export type SyncUploadRequest = {
  records: SyncUploadItem[];
};

export const syncUploadResultSchema = z.strictObject({
  idempotencyKey: z.string(),
  success: z.boolean(),
  recordId: z.uuid().nullable(),
  error: z.string().nullable(),
}) satisfies z.ZodType<SyncUploadResult>;

export type SyncUploadResult = {
  idempotencyKey: string;
  success: boolean;
  recordId: string | null;
  error: string | null;
};

export const syncUploadResponseSchema = z.strictObject({
  results: z.array(syncUploadResultSchema),
  processed: z.int().nonnegative(),
  failed: z.int().nonnegative(),
}) satisfies z.ZodType<SyncUploadResponse>;

export type SyncUploadResponse = {
  results: SyncUploadResult[];
  processed: number;
  failed: number;
};

// ═══════════════════════════════════════════════════════════════════════════
// GUILLLOTINES
// ═══════════════════════════════════════════════════════════════════════════


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
type _drift_syncDownload = NoDrift<z.infer<typeof syncDownloadResponseSchema>, SyncDownloadResponse>;
type _drift_syncUploadItem = NoDrift<z.infer<typeof syncUploadItemSchema>, SyncUploadItem>;
type _drift_syncUploadRequest = NoDrift<z.infer<typeof syncUploadRequestSchema>, SyncUploadRequest>;
type _drift_syncUploadResult = NoDrift<z.infer<typeof syncUploadResultSchema>, SyncUploadResult>;
type _drift_syncUploadResponse = NoDrift<z.infer<typeof syncUploadResponseSchema>, SyncUploadResponse>;

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
    _drift_syncDownload,
    _drift_syncUploadItem,
    _drift_syncUploadRequest,
    _drift_syncUploadResult,
    _drift_syncUploadResponse,
  ]
>;
