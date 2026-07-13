/**
 * Notification Domain Service
 *
 * Orchestrates: validate → preference checks → delegate to repository → return Result.
 * Business logic (quiet hours, channel gating, scheduling) stays here.
 */

import { notificationErr, NOTIFICATION_ERRORS } from "../errors/notification.errors.js";
import type { NotificationRepository } from "../repositories/notification.repository.js";
import { type Result, fromAsyncThrowable, toAppError } from "@rocky/domains-shared";
import type { notifications as notificationsTable } from "@rocky/database";
import { deviceTokens as deviceTokensTable } from "@rocky/database";
import { sendExpoPush } from "../clients/expo-push.client.js";
import { NOTIFICATION_TYPE } from "@rocky/database/constants";
import type { Notification } from "../types/notification.types.js";

interface NotificationPreferences {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  timezone?: string | null;
}
import {
  createNotificationSchema,
  sendNotificationSchema,
  markAsReadSchema,
  listNotificationsSchema,
  createBatchNotificationsSchema,
  type CreateNotificationInput,
  type SendNotificationInput,
  type MarkAsReadInput,
  type ListNotificationsInput,
  type CreateBatchNotificationsInput,
  type RegisterDeviceInput,
} from "@rocky/validators/api";

export class NotificationService {
  constructor(private readonly repo: NotificationRepository) {}

  /**
   * @description Persists a notification WITHOUT delivery gating (preferences,
   * quiet hours). The gated, user-facing entry point is {@link send}.
   */
  async create(input: CreateNotificationInput): Promise<Result<Notification, Error>> {
    return fromAsyncThrowable(async () => {
      const validated = createNotificationSchema.parse(input);
      const row = await this.repo.insert({
        ...validated,
        status: "PENDING" as const,
        priority: validated.priority ?? "NORMAL",
        attempts: 0,
        maxAttempts: 3,
        source: "USER" as const,
        createdAt: new Date(),
      } as typeof notificationsTable.$inferInsert);
      return row as Notification;
    }, toAppError)();
  }

  /**
   * @description Bulk-persists pre-built notifications in one transaction.
   * Per-notification gating still runs in {@link send}.
   */
  async createBatch(input: CreateBatchNotificationsInput): Promise<Result<Notification[], Error>> {
    return fromAsyncThrowable(async () => {
      const validated = createBatchNotificationsSchema.parse(input);
      const now = new Date();
      const rows = validated.notifications.map(
        (n) =>
          ({
            ...n,
            status: "PENDING" as const,
            priority: "NORMAL",
            attempts: 0,
            maxAttempts: 3,
            source: "USER" as const,
            createdAt: now,
          }) as typeof notificationsTable.$inferInsert,
      );
      return (await this.repo.insertMany(rows)) as Notification[];
    }, toAppError)();
  }

  /** Send notification (create from template with preference/quiet-hour gating) */
  async send(input: SendNotificationInput): Promise<Result<Notification, Error>> {
    return fromAsyncThrowable(async () => {
      const validated = sendNotificationSchema.parse(input);

      const prefs = (await this.repo.findPreferences(validated.userId, validated.category)) as
        | NotificationPreferences
        | null
        | undefined;

      // Channel disabled → cancel
      if (prefs && !this.isChannelEnabled(validated.type, prefs)) {
        const row = await this.repo.insert({
          ...validated,
          status: "CANCELLED" as const,
          priority: validated.priority ?? "NORMAL",
          attempts: 0,
          maxAttempts: 3,
          source: "SYSTEM" as const,
          createdAt: new Date(),
        } as typeof notificationsTable.$inferInsert);
        return row as Notification;
      }

      // Quiet hours active → schedule
      if (prefs && this.isQuietHoursActive(prefs)) {
        const row = await this.repo.insert({
          ...validated,
          status: "PENDING" as const,
          priority: validated.priority ?? "NORMAL",
          scheduledAt: this.calculateAfterQuietHours(prefs),
          attempts: 0,
          maxAttempts: 3,
          source: "SYSTEM" as const,
          createdAt: new Date(),
        } as typeof notificationsTable.$inferInsert);
        return row as Notification;
      }

      // Normal delivery
      const row = await this.repo.insert({
        ...validated,
        status: "PENDING" as const,
        priority: validated.priority ?? "NORMAL",
        attempts: 0,
        maxAttempts: 3,
        source: "SYSTEM" as const,
        createdAt: new Date(),
      } as typeof notificationsTable.$inferInsert);
      return row as Notification;
    }, toAppError)();
  }

  /** Count unread notifications for a user (efficient SQL COUNT, no row fetching). */
  async getUnreadCount(userId: string): Promise<Result<number, Error>> {
    return fromAsyncThrowable(async () => {
      return this.repo.countByUserAndStatus(userId, "delivered");
    }, toAppError)();
  }

  
  async list(input: ListNotificationsInput): Promise<Result<Notification[], Error>> {
    return fromAsyncThrowable(async () => {
      const validated = listNotificationsSchema.parse(input);
      return (await this.repo.listFiltered(validated)) as Notification[];
    }, toAppError)();
  }

  /** Mark notification as read (IN_APP type) */
  async markAsRead(input: MarkAsReadInput): Promise<Result<Notification, Error>> {
    return fromAsyncThrowable(async () => {
      const validated = markAsReadSchema.parse(input);
      const row = await this.repo.updateById(validated.id, validated.userId, {
        status: "DELIVERED",
        deliveredAt: new Date(),
      });
      if (!row) throw notificationErr(NOTIFICATION_ERRORS.NOT_FOUND, { id: validated.id });
      return row as Notification;
    }, toAppError)();
  }

  /**
   * Confirm delivery (app / push receipt). The mobile app reports that the
   * push was received/displayed; we record `acknowledgedAt` (+ `deliveredAt`,
   * status DELIVERED). This is the signal the delivery worker uses to decide
   * whether to escalate an unreachable notification to SMS (ADR-0094 §5).
   */
  async confirmDelivery(input: { id: string; userId: string }): Promise<Result<Notification, Error>> {
    return fromAsyncThrowable(async () => {
      const row = await this.repo.updateById(input.id, input.userId, {
        acknowledgedAt: new Date(),
        deliveredAt: new Date(),
        status: "DELIVERED",
      });
      if (!row) throw notificationErr(NOTIFICATION_ERRORS.NOT_FOUND, { id: input.id });
      return row as Notification;
    }, toAppError)();
  }

  /** Get pending notifications for background worker */
  async getPending(limit = 100): Promise<Result<Notification[], Error>> {
    return fromAsyncThrowable(async () => {
      return (await this.repo.findPending(limit)) as Notification[];
    }, toAppError)();
  }

  /** Update notification status after delivery attempt */
  async updateDeliveryStatus(
    id: string,
    status: "SENT" | "DELIVERED" | "FAILED",
    externalId?: string,
    errorMessage?: string,
  ): Promise<Result<Notification, Error>> {
    return fromAsyncThrowable(async () => {
      const updates: Partial<typeof notificationsTable.$inferInsert> = {};
      if (status === "SENT") updates.sentAt = new Date();
      if (status === "DELIVERED") updates.deliveredAt = new Date();
      if (status === "FAILED" && errorMessage) updates.lastError = errorMessage;
      if (externalId) updates.externalId = externalId;

      const row = await this.repo.incrementAttempts(id, { ...updates, status });
      if (!row) throw notificationErr(NOTIFICATION_ERRORS.NOT_FOUND, { id });
      return row as Notification;
    }, toAppError)();
  }

  
  async getTemplate(code: string): Promise<Result<unknown, Error>> {
    return fromAsyncThrowable(async () => {
      const template = await this.repo.findTemplateByCode(code);
      if (!template) throw notificationErr(NOTIFICATION_ERRORS.TEMPLATE_NOT_FOUND, { code });
      return template;
    }, toAppError)();
  }

  /** Register a device's Expo push token (WO-091). */
  async registerDevice(userId: string, input: RegisterDeviceInput): Promise<Result<void, Error>> {
    return fromAsyncThrowable(async () => {
      await this.repo.upsertDeviceToken({
        userId,
        deviceId: input.deviceId,
        expoPushToken: input.expoPushToken,
        platform: input.platform,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as typeof deviceTokensTable.$inferInsert);
    }, toAppError)();
  }

  /** Emit an Expo push to the given users (best-effort, WO-091). */
  async emitPush(input: {
    userIds: string[];
    title?: string;
    body?: string;
    data?: Record<string, unknown>;
  }): Promise<Result<void, Error>> {
    return fromAsyncThrowable(async () => {
      if (input.userIds.length === 0) return;
      const tokens = await this.repo.findDeviceTokensByUsers(input.userIds);
      const messages = tokens
        .filter((t) => t.expoPushToken.startsWith("ExponentPushToken") || t.expoPushToken.startsWith("ExpoPushToken"))
        .map((t) => ({
          to: t.expoPushToken,
          title: input.title,
          body: input.body,
          data: input.data,
        }));
      if (messages.length > 0) await sendExpoPush(messages);
    }, toAppError)();
  }

  // ── Private helpers ────────────────────────────────────────────

  private isChannelEnabled(type: string, prefs: NotificationPreferences): boolean {
    switch (type) {
      case NOTIFICATION_TYPE.EMAIL:
        return prefs.emailEnabled;
      case NOTIFICATION_TYPE.SMS:
        return prefs.smsEnabled;
      case NOTIFICATION_TYPE.PUSH:
        return prefs.pushEnabled;
      case NOTIFICATION_TYPE.IN_APP:
        return prefs.inAppEnabled;
      case NOTIFICATION_TYPE.WEBHOOK:
        return true;
      default:
        return true;
    }
  }

  private isQuietHoursActive(prefs: NotificationPreferences): boolean {
    if (!prefs.quietHoursStart || !prefs.quietHoursEnd) return false;
    return false; // TODO: timezone-aware quiet hours
  }

  private calculateAfterQuietHours(_prefs: NotificationPreferences): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);
    return tomorrow;
  }
}
