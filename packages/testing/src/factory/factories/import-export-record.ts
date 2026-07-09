// ── Import/Export Record (Movement Bot) Test Factory ──
// Internal enums: IMPORT_EXPORT_STATUS, IMPORT_TYPE
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import {
  IMPORT_EXPORT_STATUS,
  IMPORT_TYPE,
  IMPORT_TYPE_VALUES,
} from "@rocky/database/constants";
import { importExportRecordsSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type ImportExportRecordRecord = InferSelectSchema<typeof importExportRecordsSelectSchema>;

export class ImportExportRecordFactory extends SchemaDataFactory<ImportExportRecordRecord> {
  constructor(animalId: string) {
    super(importExportRecordsSelectSchema, {
      id: faker.string.uuid(),
      direction: faker.helpers.arrayElement(["import", "export"]),
      animalId,
      fromFarmId: null,
      toFarmId: null,
      importType: null,
      countryOfOrigin: "MKD",
      destinationCountry: null,
      foreignPassportNumber: null,
      nationalPassportId: null,
      foreignPassportStored: false,
      foreignPassportStorageExpiry: null,
      bipId: null,
      bipEntryDate: null,
      bipExitDate: null,
      quarantineStableId: null,
      quarantineEntryDate: null,
      quarantineExitDate: null,
      retagged: false,
      retaggedAt: null,
      newEarTagNumber: null,
      status: IMPORT_EXPORT_STATUS.PENDING,
      isActive: true,
      createdAt: faker.date.recent({ days: 30 }),
      createdBy: null,
      updatedAt: null,
      validTo: null,
    });
  }

  createImport(overrides?: Partial<ImportExportRecordRecord>): ImportExportRecordRecord {
    return this.create({
      direction: "import",
      importType: faker.helpers.arrayElement(IMPORT_TYPE_VALUES),
      ...overrides,
    });
  }

  createExport(overrides?: Partial<ImportExportRecordRecord>): ImportExportRecordRecord {
    return this.create({
      direction: "export",
      destinationCountry: "MKD",
      ...overrides,
    });
  }

  createQuarantine(overrides?: Partial<ImportExportRecordRecord>): ImportExportRecordRecord {
    return this.create({ status: IMPORT_EXPORT_STATUS.QUARANTINE, ...overrides });
  }

  createCompleted(overrides?: Partial<ImportExportRecordRecord>): ImportExportRecordRecord {
    return this.create({ status: IMPORT_EXPORT_STATUS.COMPLETED, ...overrides });
  }
}
