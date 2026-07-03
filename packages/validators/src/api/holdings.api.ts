// ── Holdings (Farm) & Keepers (Subject) Validators ──
// Business rules from:
//   FS - HK_MK(v1.0).pdf §Processes (p3-4)
//   Workflow 17-04-03.pdf §Instance 1-3
//   HK.PDF — Table hierarchy: States → Zip → Address → Farm → Subject → KMG_SUBJ

import { z } from "zod";
import {
  farmTypeSchema as FarmTypeZ,
  subjectRoleSchema as SubjectRoleZ,
  dataSourceSchema as DataSourceZ,
  entityTypeSchema,
  holdingTypeSchema,
  approvalActionSchema,
  deliveryMethodSchema,
} from "../enums/index.js";
import { FARM_TYPE, DATA_SOURCE, SUBJECT_ROLE, APPROVAL_ACTION } from "@rocky/database/constants";
import type {
  farmTypeType as FarmType,
  subjectRoleType as SubjectRole,
  dataSourceType as DataSource,
} from "../enums/index.js";

// ============================================================================
// ADDRESS INPUT (with GPS auto-fill — replaces legacy drill-down hierarchy)
// Legacy: States → Zip Codes → Addresses mandatory drill-down
// Modern: GPS reverse-geocoding auto-fills the hierarchy
// ============================================================================

export type AddressInput = z.infer<typeof addressInputSchema>;

export const addressInputSchema = z.strictObject({
  // Manual fields (fallback when GPS unavailable)
  city: z.string().min(1).max(30),
  street: z.string().max(50).optional(),
  houseNumber: z.string().max(10),
  houseNumberAdd: z.string().max(5).optional(),

  // Foreign keys (auto-resolved from GPS)
  zipCodeId: z.uuid().optional(),
  zipCodeName: z.string().max(50).optional(),
  communeId: z.uuid().optional(),
  adminUnitId: z.uuid().optional(),

  // GPS coordinates (modern replacement for X/Y/Z)
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().positive().max(10000).optional(),
});

