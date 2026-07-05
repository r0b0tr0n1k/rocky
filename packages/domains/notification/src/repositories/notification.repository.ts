/**
 * Notification Repository
 *
 * @description DB access layer for notifications, templates, and preferences.
 */

import { eq, and, desc, asc, lte, sql, type SQL } from "drizzle-orm";
import { notifications, notificationPreferences, notificationTemplates } from "@rocky/database";
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

  /** Find a notification template by code. */
  async findTemplateByCode(code: string) {
    const [row] = await this.client
      .select()
      .from(notificationTemplates)
      .where(eq(notificationTemplates.code, code))
      .limit(1);
    return row ?? null;
  }
}
