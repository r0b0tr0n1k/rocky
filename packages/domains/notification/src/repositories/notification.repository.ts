/**
 * Notification Repository
 *
 * @description DB access layer for notifications, templates, and preferences.
 */

import { eq, and, desc, asc, inArray, lte, sql, type SQL } from "drizzle-orm";
import {
  notifications,
  notificationPreferences,
  notificationTemplates,
  deviceTokens,
  eventSubscriptions,
  reminders,
  notificationDeliveries,
} from "@rocky/database";
import { BaseRepository } from "@rocky/domains-shared";

export class NotificationRepository extends BaseRepository {
  /** Insert a single notification. Returns the created row. */
  async insert(values: typeof notifications.$inferInsert): Promise<typeof notifications.$inferSelect | null> {
    const [row] = await this.client.insert(notifications).values(values).returning();
    return row ?? null;
  }

  /** Insert multiple notifications. Returns created rows. */
  async insertMany(rows: (typeof notifications.$inferInsert)[]): Promise<(typeof notifications.$inferSelect)[]> {
    return this.client.insert(notifications).values(rows).returning();
  }

  /** Find user preferences for a category. */
  async findPreferences(userId: string, category: string) {
    const [row] = await this.client
      .select()
      .from(notificationPreferences)
      .where(and(eq(notificationPreferences.userId, userId), eq(notificationPreferences.category, category)))
      .limit(1);
    return row ?? null;
  }

  /** List notifications with filters, pagination, and ordering. */
  async listFiltered(filters: { userId: string; status?: string; category?: string; limit: number; offset: number }) {
    const c: SQL<unknown>[] = [eq(notifications.userId, filters.userId)];
    if (filters.status) c.push(eq(notifications.status, filters.status));
    if (filters.category) c.push(eq(notifications.category, filters.category));

    return this.client
      .select()
      .from(notifications)
      .where(c.length > 1 ? and(...c) : c[0]!)
      .orderBy(desc(notifications.priority), desc(notifications.createdAt))
      .limit(filters.limit)
      .offset(filters.offset);
  }

  /** Update a notification and return the updated row. */
  async updateById(
    id: string,
    userId: string,
    data: Partial<typeof notifications.$inferInsert>,
  ): Promise<typeof notifications.$inferSelect | null> {
    const [row] = await this.client
      .update(notifications)
      .set(data)
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();
    return row ?? null;
  }

  /** Update any notification by ID only (for system/worker use). */
  async updateByIdSystem(
    id: string,
    data: Partial<typeof notifications.$inferInsert>,
  ): Promise<typeof notifications.$inferSelect | null> {
    const [row] = await this.client.update(notifications).set(data).where(eq(notifications.id, id)).returning();
    return row ?? null;
  }

  /** Get pending notifications for background workers. */
  async findPending(limit: number) {
    return this.client
      .select()
      .from(notifications)
      .where(and(eq(notifications.status, "PENDING"), lte(notifications.scheduledAt, new Date())))
      .orderBy(desc(notifications.priority), asc(notifications.createdAt))
      .limit(limit);
  }

  /** Increment attempt counter atomically. Returns updated row. */
  async incrementAttempts(
    id: string,
    updates: Partial<typeof notifications.$inferInsert>,
  ): Promise<typeof notifications.$inferSelect | null> {
    const [row] = await this.client
      .update(notifications)
      .set({
        ...updates,
        attempts: sql`${notifications.attempts} + 1`,
        lastAttemptAt: new Date(),
      })
      .where(eq(notifications.id, id))
      .returning();
    return row ?? null;
  }

  /** Count notifications by userId and status. */
  async countByUserAndStatus(userId: string, status: string): Promise<number> {
    const [result] = await this.client
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.status, status)));
    return result?.count ?? 0;
  }

  /** Find a notification template by code. */
  async findTemplateByCode(code: string) {
    const [row] = await this.client
      .select()
      .from(notificationTemplates)
      .where(eq(notificationTemplates.code, code))
      .limit(1);
    return row ?? null;
  }

  /** Upsert a device's Expo push token (one row per user+device). */
  async upsertDeviceToken(values: typeof deviceTokens.$inferInsert): Promise<void> {
    await this.client
      .insert(deviceTokens)
      .values(values)
      .onConflictDoUpdate({
        target: [deviceTokens.userId, deviceTokens.deviceId],
        set: {
          expoPushToken: values.expoPushToken,
          platform: values.platform,
          updatedAt: new Date(),
        },
      });
  }

  /** Fetch Expo push tokens for the given users (for emission). */
  async findDeviceTokensByUsers(userIds: string[]): Promise<(typeof deviceTokens.$inferSelect)[]> {
    if (userIds.length === 0) return [];
    return this.client.select().from(deviceTokens).where(inArray(deviceTokens.userId, userIds));
  }

  /** Find active event subscriptions for an event type. */
  async findActiveSubscriptionsByEventType(eventType: string) {
    return this.client
      .select()
      .from(eventSubscriptions)
      .where(and(eq(eventSubscriptions.eventType, eventType), eq(eventSubscriptions.isActive, true)));
  }

  /** Find a notification delivery by its dedup key (null if none). */
  async findDeliveryByKey(key: string) {
    const rows = await this.client
      .select({ id: notificationDeliveries.id })
      .from(notificationDeliveries)
      .where(eq(notificationDeliveries.deliveryKey, key))
      .limit(1);
    return rows[0] ?? null;
  }

  /** Insert a delivery record idempotently (null if conflict on deliveryKey). */
  async insertDelivery(values: typeof notificationDeliveries.$inferInsert) {
    const rows = await this.client
      .insert(notificationDeliveries)
      .values(values)
      .onConflictDoNothing({ target: notificationDeliveries.deliveryKey })
      .returning();
    return rows[0] ?? null;
  }

  /** Mark a delivery as sent. */
  async markDeliverySent(id: string, notificationId: string) {
    await this.client
      .update(notificationDeliveries)
      .set({
        notificationId,
        status: "sent",
        deliveredAt: new Date(),
      })
      .where(eq(notificationDeliveries.id, id));
  }

  /** Insert a reminder record. */
  async insertReminder(values: typeof reminders.$inferInsert) {
    await this.client.insert(reminders).values(values);
  }
}

// Row-shape types re-exported so services import them relative (ROCKY-DS 001:2026(E) §8.2 / Annex C),
// instead of reaching into @rocky/database for table definitions.
export type NotificationRow = typeof notifications.$inferInsert;
export type DeviceTokenRow = typeof deviceTokens.$inferInsert;
