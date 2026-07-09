// ── Health Domain Events ──
// Every health event leaves a trace in the Symbolic order, Comrade.
// From vaccination to treatment to notifiable disease alerts,
// the health of the herd is recorded in the system.

import { z } from "zod";
import type {
  administrationRouteType,
  testResultType,
  testTypeType,
  healthSeverityType
} from "../enums/index.js";
import {
  administrationRouteSchema,
  testResultSchema,
  testTypeSchema,
  healthSeveritySchema
} from "../enums/index.js";
import type { ActivateGuillotines, NoDrift } from "../utils/type-bridge.js";
import { eventEnvelopeSchema } from "./base.js";

// ═══════════════════════════════════════════════════════════════
// VACCINATION ADMINISTERED
// ═══════════════════════════════════════════════════════════════

export interface VaccinationAdministeredPayload {
  vaccinationId: string;
  animalId: string;
  farmId: string;
  vaccineId: string;
  batchId: string;
  vetId: string;
  adminDate: Date;
  route: administrationRouteType;
  notes: string | null;
}

export const vaccinationAdministeredPayloadSchema = z.strictObject({
  vaccinationId: z.uuid(),
  animalId: z.uuid(),
  farmId: z.uuid(),
  vaccineId: z.uuid(),
  batchId: z.uuid(),
  vetId: z.uuid(),
  adminDate: z.date(),
  route: administrationRouteSchema,
  notes: z.string().nullable(),
}) satisfies z.ZodType<VaccinationAdministeredPayload>;

export const VaccinationAdministeredEvent = eventEnvelopeSchema(vaccinationAdministeredPayloadSchema);
export type VaccinationAdministeredEvent = z.infer<typeof VaccinationAdministeredEvent>;

type _drift_vaccinationAdministeredPayload = NoDrift<
  z.infer<typeof vaccinationAdministeredPayloadSchema>,
  VaccinationAdministeredPayload
>;

// ═══════════════════════════════════════════════════════════════
// TREATMENT RECORDED
// ═══════════════════════════════════════════════════════════════

export interface TreatmentRecordedPayload {
  treatmentId: string;
  animalId: string;
  farmId: string;
  diseaseId: string | null;
  vetId: string;
  diagnosisDate: Date;
  treatmentDesc: string | null;
  isolated: boolean;
}

export const treatmentRecordedPayloadSchema = z.strictObject({
  treatmentId: z.uuid(),
  animalId: z.uuid(),
  farmId: z.uuid(),
  diseaseId: z.uuid().nullable(),
  vetId: z.uuid(),
  diagnosisDate: z.date(),
  treatmentDesc: z.string().nullable(),
  isolated: z.boolean(),
}) satisfies z.ZodType<TreatmentRecordedPayload>;

export const TreatmentRecordedEvent = eventEnvelopeSchema(treatmentRecordedPayloadSchema);
export type TreatmentRecordedEvent = z.infer<typeof TreatmentRecordedEvent>;

type _drift_treatmentRecordedPayload = NoDrift<
  z.infer<typeof treatmentRecordedPayloadSchema>,
  TreatmentRecordedPayload
>;

// ═══════════════════════════════════════════════════════════════
// NOTIFIABLE DISEASE ALERT
// ═══════════════════════════════════════════════════════════════

export interface NotifiableDiseaseAlertPayload {
  alertId: string;
  diseaseId: string;
  diseaseName: string;
  farmId: string;
  animalId: string;
  triggerEvent: string;
  triggerEntityId: string;
  reportedAt: Date;
  reportedBy: string;
  severity: healthSeverityType;
}

export const notifiableDiseaseAlertPayloadSchema = z.strictObject({
  alertId: z.uuid(),
  diseaseId: z.uuid(),
  diseaseName: z.string(),
  farmId: z.uuid(),
  animalId: z.uuid(),
  triggerEvent: z.string(),
  triggerEntityId: z.uuid(),
  reportedAt: z.date(),
  reportedBy: z.uuid(),
  severity: healthSeveritySchema,
}) satisfies z.ZodType<NotifiableDiseaseAlertPayload>;

export const NotifiableDiseaseAlertEvent = eventEnvelopeSchema(notifiableDiseaseAlertPayloadSchema);
export type NotifiableDiseaseAlertEvent = z.infer<typeof NotifiableDiseaseAlertEvent>;

type _drift_notifiableDiseaseAlertPayload = NoDrift<
  z.infer<typeof notifiableDiseaseAlertPayloadSchema>,
  NotifiableDiseaseAlertPayload
>;

// ═══════════════════════════════════════════════════════════════
// LAB TEST COMPLETED
// ═══════════════════════════════════════════════════════════════

export interface LabTestCompletedPayload {
  labTestId: string;
  animalId: string;
  farmId: string;
  diseaseId: string;
  testType: testTypeType;
  result: testResultType;
  resultNumeric: number | null;
  resultUnit: string | null;
  interpretation: string | null;
  certificateRef: string | null;
}

export const labTestCompletedPayloadSchema = z.strictObject({
  labTestId: z.uuid(),
  animalId: z.uuid(),
  farmId: z.uuid(),
  diseaseId: z.uuid(),
  testType: testTypeSchema,
  result: testResultSchema,
  resultNumeric: z.number().nullable(),
  resultUnit: z.string().nullable(),
  interpretation: z.string().nullable(),
  certificateRef: z.string().nullable(),
}) satisfies z.ZodType<LabTestCompletedPayload>;

export const LabTestCompletedEvent = eventEnvelopeSchema(labTestCompletedPayloadSchema);
export type LabTestCompletedEvent = z.infer<typeof LabTestCompletedEvent>;

type _drift_labTestCompletedPayload = NoDrift<
  z.infer<typeof labTestCompletedPayloadSchema>,
  LabTestCompletedPayload
>;

// ═══════════════════════════════════════════════════════════════
// GUILLOTINE ACTIVATION
// ═══════════════════════════════════════════════════════════════

export type _HealthEventGuillotines = ActivateGuillotines<
  [
    _drift_vaccinationAdministeredPayload,
    _drift_treatmentRecordedPayload,
    _drift_notifiableDiseaseAlertPayload,
    _drift_labTestCompletedPayload,
  ]
>;
