// ── Notifications API Schemas - Diamond Seal ──
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
  eventSourceSchema,
} from "../enums/domain.js";
import type {
  notificationTypeType,
  notificationCategoryType,
  notificationPriorityType,
  notificationStatusType,
  eventSourceType,
} from "../enums/domain.js";
import type { NoDrift, NoDriftSimple, ActivateGuillotines } from "../utils/type-bridge.js";

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface NotificationResponse {
  id: string;
  legacyId: number | null;
  userId: string;
  subject: string | null;
  message: string;
  data: unknown;
  emailAddress: string | null;
  phoneNumber: string | null;
  pushToken: string | null;
  templateId: string | null;
  scheduledAt: Date | null;
  sentAt: Date | null;
  deliveredAt: Date | null;
  expiresAt: Date | null;
  attempts: number;
  lastError: string | null;
  type: notificationTypeType;
  category: notificationCategoryType;
  priority: notificationPriorityType;
  status: notificationStatusType;
  source: eventSourceType;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface SendNotificationInput {
  userId: string;
  type: notificationTypeType;
  category: notificationCategoryType;
  subject: string;
  message: string;
  priority?: notificationPriorityType;
  data?: unknown;
}

export interface MarkAsReadInput {
  id: string;
  userId: string;
}

export interface NotificationListRequest {
  userId?: string;
  type?: notificationTypeType;
  category?: notificationCategoryType;
  status?: notificationStatusType;
  priority?: notificationPriorityType;
  fromDate?: Date;
  limit: number;
  offset: number;
}

export interface MarkNotificationReadRequest {
  notificationIds: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// DOMAIN LAYER INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface CreateNotificationInput {
  userId?: string;
  type?: notificationTypeType;
  category?: notificationCategoryType;
  priority?: notificationPriorityType;
  subject?: string | null;
  message?: string;
  data?: unknown;
  scheduledAt?: Date | null;
}

export interface ListNotificationsInput {
  userId: string;
  status?: notificationStatusType;
  category?: notificationCategoryType;
  limit: number;
  offset: number;
}

export interface CreateBatchNotificationsInput {
  notifications: CreateNotificationInput[];
}

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
    source: eventSourceSchema,
  })
  .strict() satisfies z.ZodType<NotificationResponse>;

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

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
  .strict() satisfies z.ZodType<SendNotificationInput>;

export const markAsReadSchema = z.strictObject({
  id: z.uuid(),
  userId: z.uuid(),
}) satisfies z.ZodType<MarkAsReadInput>;

export const notificationListRequestSchema = z.strictObject({
  userId: z.uuid().optional(),
  type: notificationTypeSchema.optional(),
  category: notificationCategorySchema.optional(),
  status: notificationStatusSchema.optional(),
  priority: notificationPrioritySchema.optional(),
  fromDate: z.date().optional(),
  limit: z.int().min(1).max(100).default(20),
  offset: z.int().min(0).default(0),
}) satisfies z.ZodType<NotificationListRequest>;

export const markNotificationReadRequestSchema = z.strictObject({
  notificationIds: z.array(z.uuid()).min(1).max(100),
}) satisfies z.ZodType<MarkNotificationReadRequest>;

// ═══════════════════════════════════════════════════════════════════════════
// DOMAIN LAYER SCHEMAS (consumed by @rocky/domains-notification)
// ═══════════════════════════════════════════════════════════════════════════

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
  .strict() satisfies z.ZodType<CreateNotificationInput>;

export const listNotificationsSchema = z.strictObject({
  userId: z.uuid(),
  status: notificationStatusSchema.optional(),
  category: notificationCategorySchema.optional(),
  limit: z.int().min(1).max(100).default(20),
  offset: z.int().min(0).default(0),
}) satisfies z.ZodType<ListNotificationsInput>;

export const createBatchNotificationsSchema = z.strictObject({
  notifications: z.array(createNotificationSchema),
}) satisfies z.ZodType<CreateBatchNotificationsInput>;

// ═══════════════════════════════════════════════════════════════════════════
// GUILLOTINES
// ═══════════════════════════════════════════════════════════════════════════

type _drift_notificationResponse = NoDrift<z.infer<typeof notificationResponseSchema>, NotificationResponse>;
type _drift_sendNotification = NoDriftSimple<z.infer<typeof sendNotificationSchema>, SendNotificationInput>;
type _drift_markAsRead = NoDriftSimple<z.infer<typeof markAsReadSchema>, MarkAsReadInput>;
type _drift_notificationList = NoDriftSimple<z.infer<typeof notificationListRequestSchema>, NotificationListRequest>;
type _drift_markNotificationRead = NoDriftSimple<z.infer<typeof markNotificationReadRequestSchema>, MarkNotificationReadRequest>;
type _drift_createNotification = NoDriftSimple<z.infer<typeof createNotificationSchema>, CreateNotificationInput>;
type _drift_listNotifications = NoDriftSimple<z.infer<typeof listNotificationsSchema>, ListNotificationsInput>;
type _drift_createBatchNotifications = NoDriftSimple<z.infer<typeof createBatchNotificationsSchema>, CreateBatchNotificationsInput>;

export type _NotificationsGuillotines = ActivateGuillotines<
  [_drift_notificationResponse, _drift_sendNotification, _drift_markAsRead,
   _drift_notificationList, _drift_markNotificationRead, _drift_createNotification,
   _drift_listNotifications, _drift_createBatchNotifications]
>;
