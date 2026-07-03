// ── Drizzle Schema: Sync Error Log ──
// Replaces: HK_SYNC_ERRORS (Oracle HK.PDF)

import { pgTable, uuid, varchar, timestamp, boolean, integer, text, index, pgPolicy } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { USER_ROLE, isRole, isRoleIn, farmInOrgArea, ADMIN_ROLES } from "../rls-helpers.js";
import { syncErrorTypePgEnum } from "../../schemas/enums/sync-error-type.js";

export const syncErrors = pgTable(
  "sync_errors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    legacyId: integer("legacy_id"),

    farmId: uuid("farm_id"),
    addressId: uuid("address_id"),
    subjectId: uuid("subject_id"),

    errorType: syncErrorTypePgEnum("error_type").notNull(),
    note: text("note"),

    resolved: boolean("resolved").notNull().default(false),
    resolvedAt: timestamp("resolved_at"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
  },
  (table) => [
    index("idx_sync_errors_farm").on(table.farmId),
    index("idx_sync_errors_type").on(table.errorType),
    index("idx_sync_errors_resolved").on(table.resolved),
    pgPolicy("sync_error_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: sql`(
        ${isRoleIn(...ADMIN_ROLES)}
        OR (${isRole(USER_ROLE.VETERINARIAN)} AND ${farmInOrgArea(table.farmId)})
      )`,
    }),
  ],
);
