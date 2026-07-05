// ── Drizzle Schema: Archive Documents ──
// Replaces: Workflow 17-04-03.pdf §Instance 25
// 3-tier document archive (CPC / VS / VI) with retention enforcement

import { pgTable, uuid, varchar, timestamp, date, boolean, text, index, pgPolicy } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { farms } from "../hk/farms";
import {
  isRoleIn,
  farmInOrgArea,
  ADMIN_ROLES,
  ORG_READ_ROLES,
} from "../rls-helpers";
import { archiveLocationPgEnum } from "../../schemas/enums/archive-location";
import { archiveDocumentTypePgEnum } from "../../schemas/enums/archive-document-type";
import { ARCHIVE_LOCATION } from "../../constants/archive-location";

export const archiveDocuments = pgTable(
  "archive_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Document identity
    documentType: archiveDocumentTypePgEnum("document_type").notNull(),
    documentRef: varchar("document_ref", { length: 100 }),

    // Storage location
    archiveLocation: archiveLocationPgEnum("archive_location").notNull().default(ARCHIVE_LOCATION.CPC),
    physicalLocation: varchar("physical_location", { length: 200 }),

    // References
    animalId: uuid("animal_id"),
    farmId: uuid("farm_id").references(() => farms.id),
    passportId: uuid("passport_id"),
    inspectionId: uuid("inspection_id"),

    // Retention
    retentionExpiry: date("retention_expiry").notNull(),
    isArchived: boolean("is_archived").notNull().default(false),
    archivedAt: timestamp("archived_at"),
    destroyedAt: timestamp("destroyed_at"),

    // Audit
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    updatedAt: timestamp("updated_at"),
    validTo: timestamp("valid_to"),
  },
  (table) => [
    index("idx_archive_documents_type").on(table.documentType),
    index("idx_archive_documents_location").on(table.archiveLocation),
    index("idx_archive_documents_farm").on(table.farmId),
    index("idx_archive_documents_animal").on(table.animalId),
    index("idx_archive_documents_expiry").on(table.retentionExpiry),
    pgPolicy("archive_document_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: sql`(
        ${isRoleIn(...ADMIN_ROLES)}
        OR (${isRoleIn(...ORG_READ_ROLES)}
            AND (${farmInOrgArea(table.farmId)}
                 OR ${table.farmId} IS NULL))
      )`,
    }),
  ],
);
