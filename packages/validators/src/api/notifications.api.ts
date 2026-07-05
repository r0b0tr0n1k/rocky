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

export const sendNotificationSchema = notificationInsertSchema
  .pick({ userId: true, type: true, category: true })
  .extend({
    subject: z.string(),
    message: z.string(),
    type: notificationTypeSchema,
    category: notificationCategorySchema,
    priority: notificationPrioritySchema.optional(),
    data: z.unknown().optional(),
  })
  .strict();

export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;

export const markAsReadSchema = z.strictObject({
  id: z.uuid(),
  userId: z.uuid(),
});

export type MarkAsReadInput = z.infer<typeof markAsReadSchema>;

export const notificationListRequestSchema = z.strictObject({
  userId: z.uuid().optional(),
  type: notificationTypeSchema.optional(),
  category: notificationCategorySchema.optional(),
  status: notificationStatusSchema.optional(),
  priority: notificationPrioritySchema.optional(),
  fromDate: z.date().optional(),
  limit: z.int().min(1).max(100).default(20),
  offset: z.int().min(0).default(0),
});

export type NotificationListRequest = z.infer<typeof notificationListRequestSchema>;

export const markNotificationReadRequestSchema = z.strictObject({
  notificationIds: z.array(z.uuid()).min(1).max(100),
});

export type MarkNotificationReadRequest = z.infer<typeof markNotificationReadRequestSchema>;

// ── Domain Layer Schemas (consumed by @rocky/domains-notification) ──

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;

export const createNotificationSchema = notificationInsertSchema
  .pick({
    userId: true,
    type: true,
    category: true,
    priority: true,
    subject: true,
    message: true,
    data: true,
    scheduledAt: true,
  })
  .extend({
    type: notificationTypeSchema.optional(),
    category: notificationCategorySchema.optional(),
    priority: notificationPrioritySchema.optional(),
    data: z.unknown().optional(),
  })
  .partial()
  .strict();

export type ListNotificationsInput = z.infer<typeof listNotificationsSchema>;

export const listNotificationsSchema = z.strictObject({
  userId: z.uuid(),
  status: notificationStatusSchema.optional(),
  category: notificationCategorySchema.optional(),
  limit: z.int().min(1).max(100).default(20),
  offset: z.int().min(0).default(0),
});

export type CreateBatchNotificationsInput = z.infer<typeof createBatchNotificationsSchema>;

export const createBatchNotificationsSchema = z.strictObject({
  notifications: z.array(createNotificationSchema),
});
