// ── Error Correction (Correction Bot) Test Factory ──
// Internal enums: CORRECTION_STATUS, CORRECTION_CASE_TYPE
// detectionSource is a documented varchar (field | a_priori | a_posteriori)
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import {
  CORRECTION_CASE_TYPE,
  CORRECTION_CASE_TYPE_VALUES,
  CORRECTION_STATUS,
  CORRECTION_STATUS_VALUES,
} from "@rocky/database/constants";
import { errorCorrectionsSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type ErrorCorrectionRecord = InferSelectSchema<typeof errorCorrectionsSelectSchema>;

// Documented detection sources (see error-corrections.ts schema comment)
const DETECTION_SOURCES = ["field", "a_priori", "a_posteriori"] as const;

export class ErrorCorrectionFactory extends SchemaDataFactory<ErrorCorrectionRecord> {
  constructor(farmId?: string, animalId?: string) {
    super(errorCorrectionsSelectSchema, {
      id: faker.string.uuid(),
      detectionSource: faker.helpers.arrayElement(DETECTION_SOURCES),
      farmId: farmId ?? null,
      animalId: animalId ?? null,
      errorType: faker.helpers.arrayElement([
        "duplicate_ear_tag",
        "invalid_birth_date",
        "wrong_sex",
        "missing_parent",
        "invalid_movement",
      ]),
      errorDescription: faker.lorem.sentence(),
      originalData: null,
      correctedData: null,
      status: faker.helpers.arrayElement(CORRECTION_STATUS_VALUES),
      caseType: faker.helpers.arrayElement(CORRECTION_CASE_TYPE_VALUES),
      resolutionNotes: null,
      resolvedBy: null,
      resolvedAt: null,
      archiveNumber: null,
      passportReprintRequired: false,
      passportId: null,
      escalatedTo: null,
      escalatedAt: null,
      escalationReason: null,
      assignedToVs: null,
      assignedAt: null,
      vsResolutionAttempted: false,
      techCode: null,
      isActive: true,
      createdAt: faker.date.recent({ days: 30 }),
      createdBy: null,
      updatedAt: null,
      validTo: null,
    });
  }

  createPending(overrides?: Partial<ErrorCorrectionRecord>): ErrorCorrectionRecord {
    return this.create({ status: CORRECTION_STATUS.PENDING, ...overrides });
  }

  createResolved(overrides?: Partial<ErrorCorrectionRecord>): ErrorCorrectionRecord {
    return this.create({
      status: CORRECTION_STATUS.RESOLVED,
      resolvedAt: faker.date.recent({ days: 10 }),
      ...overrides,
    });
  }

  createEscalated(overrides?: Partial<ErrorCorrectionRecord>): ErrorCorrectionRecord {
    return this.create({
      status: CORRECTION_STATUS.ESCALATED,
      escalatedAt: faker.date.recent({ days: 10 }),
      ...overrides,
    });
  }

  createRejected(overrides?: Partial<ErrorCorrectionRecord>): ErrorCorrectionRecord {
    return this.create({ status: CORRECTION_STATUS.REJECTED, ...overrides });
  }

  createTechnicianResolvable(overrides?: Partial<ErrorCorrectionRecord>): ErrorCorrectionRecord {
    return this.create({
      caseType: CORRECTION_CASE_TYPE.TECHNICIAN_RESOLVABLE,
      ...overrides,
    });
  }
}
