// ── Archive Document Test Factory ──
// Internal enums: ARCHIVE_DOCUMENT_TYPE, ARCHIVE_LOCATION
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import {
  ARCHIVE_DOCUMENT_TYPE,
  ARCHIVE_DOCUMENT_TYPE_VALUES,
  ARCHIVE_LOCATION,
  ARCHIVE_LOCATION_VALUES,
} from "@rocky/database/constants";
import { archiveDocumentsSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type ArchiveDocumentRecord = InferSelectSchema<typeof archiveDocumentsSelectSchema>;

export class ArchiveDocumentFactory extends SchemaDataFactory<ArchiveDocumentRecord> {
  constructor(farmId?: string) {
    super(archiveDocumentsSelectSchema, {
      id: faker.string.uuid(),
      documentType: faker.helpers.arrayElement(ARCHIVE_DOCUMENT_TYPE_VALUES),
      documentRef: faker.string.alphanumeric({ length: 20 }).toUpperCase(),
      archiveLocation: faker.helpers.arrayElement(ARCHIVE_LOCATION_VALUES),
      physicalLocation: faker.location.streetAddress(),
      farmId: farmId ?? null,
      animalId: null,
      passportId: null,
      inspectionId: null,
      retentionExpiry: faker.date.future({ years: 3 }).toISOString().split("T")[0]!,
      isArchived: false,
      archivedAt: null,
      destroyedAt: null,
      isActive: true,
      createdAt: faker.date.recent({ days: 30 }),
      createdBy: null,
      updatedAt: null,
      validTo: null,
    });
  }

  createCPC(overrides?: Partial<ArchiveDocumentRecord>): ArchiveDocumentRecord {
    return this.create({
      archiveLocation: ARCHIVE_LOCATION.CPC,
      ...overrides,
    });
  }

  createVS(overrides?: Partial<ArchiveDocumentRecord>): ArchiveDocumentRecord {
    return this.create({
      archiveLocation: ARCHIVE_LOCATION.VS,
      ...overrides,
    });
  }

  createVI(overrides?: Partial<ArchiveDocumentRecord>): ArchiveDocumentRecord {
    return this.create({
      archiveLocation: ARCHIVE_LOCATION.VI,
      ...overrides,
    });
  }

  createArchived(overrides?: Partial<ArchiveDocumentRecord>): ArchiveDocumentRecord {
    return this.create({
      isArchived: true,
      archivedAt: faker.date.recent({ days: 7 }),
      ...overrides,
    });
  }

  createExpired(overrides?: Partial<ArchiveDocumentRecord>): ArchiveDocumentRecord {
    return this.create({
      retentionExpiry: faker.date.past({ years: 1 }).toISOString().split("T")[0]!,
      ...overrides,
    });
  }

  createDestroyed(overrides?: Partial<ArchiveDocumentRecord>): ArchiveDocumentRecord {
    return this.create({
      destroyedAt: faker.date.recent({ days: 7 }),
      ...overrides,
    });
  }
}
