// ── Drizzle Schema: Disease Events (outbreak / investigation instance) ──
// Operational record of a suspicion/confirmation under Reg (EU) 2020/687 + AHL.
// diseaseZoneId is a LOGICAL link to @rocky/geo disease_zone (ADR-0080) — no hard FK.

import { index, pgPolicy, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { adminWrite } from "../rls-helpers.js";
import { diseaseCategoryPgEnum } from "../../schemas/enums/disease-category.js";
import { diseaseEventStatusPgEnum } from "../../schemas/enums/disease-event-status.js";
import { diseases } from "./diseases.js";

export const diseaseEvents = pgTable(
  "disease_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    diseaseId: uuid("disease_id").notNull().references(() => diseases.id),
    farmId: uuid("farm_id"), // logical ref → hk.farms; wild-animal events have none
    detectedCategory: diseaseCategoryPgEnum("detected_category").notNull(),
    status: diseaseEventStatusPgEnum("status").notNull().default("suspicion"),
    suspectedAt: timestamp("suspected_at"),
    confirmedAt: timestamp("confirmed_at"),
    resolvedAt: timestamp("resolved_at"),
    diseaseZoneId: uuid("disease_zone_id"), // logical ref → @rocky/geo disease_zone (ADR-0080)
    competentAuthority: varchar("competent_authority", { length: 120 }),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [
    index("idx_disease_events_disease").on(table.diseaseId),
    index("idx_disease_events_status").on(table.status),
    index("idx_disease_events_farm").on(table.farmId),
    pgPolicy("disease_event_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: adminWrite,
      withCheck: adminWrite,
    }),
  ],
);
