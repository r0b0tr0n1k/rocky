// ── Drizzle Schema: Farm-Subject Binding (with roles) ──
// Replaces: HK_KMG_SUBJ (Oracle HK.PDF)
// Represents the "Holder Keeper on Farm" relationship

import { sql } from "drizzle-orm";
import { boolean, index, integer, pgPolicy, pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { subjectRolePgEnum } from "../../schemas/enums/subject-role.js";
import { ADMIN_ROLES, currentUserId, farmInOrgArea, isRoleIn, ORG_READ_ROLES } from "../rls-helpers.js";
import { farms } from "./farms.js";
import { subjects } from "./subjects.js";

export const farmSubjects = pgTable(
  "farm_subjects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    legacyId: integer("legacy_id").unique(),

    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id, { onDelete: "cascade" }),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),

    role: subjectRolePgEnum("role").notNull(),

    isActive: boolean("is_active").notNull().default(true),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    validTo: timestamp("valid_to"),
  },
  (table) => [
    uniqueIndex("idx_farm_subjects_unique").on(table.farmId, table.subjectId, table.role),
    index("idx_farm_subjects_farm").on(table.farmId),
    index("idx_farm_subjects_subject").on(table.subjectId),
    pgPolicy("farm_subject_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: sql`(
        ${isRoleIn(...ADMIN_ROLES)}
        OR (${isRoleIn(...ORG_READ_ROLES)} AND ${farmInOrgArea(table.farmId)})
        OR ${table.subjectId} = ${currentUserId}
      )`,
    }),
  ],
);
