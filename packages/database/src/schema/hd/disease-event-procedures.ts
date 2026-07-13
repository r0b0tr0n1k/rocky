// ── Drizzle Schema: Disease-Event Procedures (2020/687 step log) ──
// One row per regulated step (sampling, tracing, culling, disinfection, ...). ADR-0095.

import { index, pgPolicy, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { adminWrite } from "../rls-helpers.js";
import { procedureTypePgEnum } from "../../schemas/enums/procedure-type.js";
import { procedureStatusPgEnum } from "../../schemas/enums/procedure-status.js";
import { diseaseEvents } from "./disease-events.js";

export const diseaseEventProcedures = pgTable(
  "disease_event_procedures",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id").notNull().references(() => diseaseEvents.id),
    procedureType: procedureTypePgEnum("procedure_type").notNull(),
    status: procedureStatusPgEnum("status").notNull().default("planned"),
    performedAt: timestamp("performed_at"),
    performedBy: uuid("performed_by"), // logical ref → sm.users
    outcome: text("outcome"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: uuid("created_by"),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [
    index("idx_dep_event").on(table.eventId),
    index("idx_dep_type").on(table.procedureType),
    index("idx_dep_status").on(table.status),
    pgPolicy("disease_event_procedure_access_policy", {
      as: "permissive",
      to: "public",
      for: "all",
      using: adminWrite,
      withCheck: adminWrite,
    }),
  ],
);
