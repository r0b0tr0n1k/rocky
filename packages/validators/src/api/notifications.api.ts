// ── Notifications API Schemas — Diamond Seal ──
//
// Notifications are the System's way of speaking to the user, Comrade.
// The panopticon dispatches its messages through these channels.
//
// Based on: SM.PDF SM_NOTIFICATIONS specification

import { z } from "zod";
import { notificationSelectSchema, notificationInsertSchema } from "@rocky/database/zod";
import {
  notificationTypeSchema,
  notificationCategorySchema,
  notificationPrioritySchema,
  notificationStatusSchema,
} from "../enums/domain.js";
import type {
  notificationTypeType,
  notificationCategoryType,
  notificationPriorityType,
  notificationStatusType,
} from "../enums/domain.js";

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const notificationOutputSchema = notificationSelectSchema;

export const notificationResponseSchema = notificationSelectSchema
  .omit({
    webhookUrl: true,
    maxAttempts: true,
    lastAttemptAt: true,
    externalId: true,
    tags: true,
    createdBy: true,
    validTo: true,
  })
  .extend({
    data: z.unknown(),
    scheduledAt: z.coerce.date().nullable(),
    sentAt: z.coerce.date().nullable(),
    deliveredAt: z.coerce.date().nullable(),
    expiresAt: z.coerce.date().nullable(),
    type: notificationTypeSchema,
    category: notificationCategorySchema,
    priority: notificationPrioritySchema,
    status: notificationStatusSchema,
  })
  .strict();

export type NotificationResponse = z.infer<typeof notificationResponseSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// GUILLOTINES
// ═══════════════════════════════════════════════════════════════════════════

