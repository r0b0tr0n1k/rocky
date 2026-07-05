import { pdaDevices as pdaDevicesTable } from "@rocky/database";
import { BaseRepository } from "@rocky/domains-shared";
import { and, eq, ilike, or, sql, type SQL } from "drizzle-orm";

export class DeviceRepository extends BaseRepository {

  async findById(id: string) {
    const [row] = await this.client.select().from(pdaDevicesTable).where(eq(pdaDevicesTable.id, id)).limit(1);
    return row ?? null;
  }

  async findByIdentifier(deviceIdentifier: string) {
    const [row] = await this.client
      .select()
      .from(pdaDevicesTable)
      .where(eq(pdaDevicesTable.deviceIdentifier, deviceIdentifier))
      .limit(1);
    return row ?? null;
  }

  async listFiltered(filter: { status?: string; search?: string }) {
    const c: SQL[] = [];
    if (filter.status) c.push(eq(pdaDevicesTable.status, filter.status));
    if (filter.search)
      c.push(
        or(
          ilike(pdaDevicesTable.deviceIdentifier, `%${filter.search}%`),
          ilike(pdaDevicesTable.name, `%${filter.search}%`),
        )!,
      );
    const where = c.length > 0 ? and(...c) : undefined;
    const [data, totalResult] = await Promise.all([
      this.client.select().from(pdaDevicesTable).where(where),
      this.client
        .select({ count: sql<number>`count(*)::int` })
        .from(pdaDevicesTable)
        .where(where),
    ]);
    return { data, total: totalResult[0]?.count ?? 0 };
  }

  async insert(data: typeof pdaDevicesTable.$inferInsert) {
    const [row] = await this.client.insert(pdaDevicesTable).values(data).returning();
    return row ?? null;
  }

  async update(id: string, data: Partial<typeof pdaDevicesTable.$inferInsert>) {
    const [row] = await this.client
      .update(pdaDevicesTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(pdaDevicesTable.id, id))
      .returning();
    return row ?? null;
  }

  async assignUser(deviceId: string, userId: string) {
    const [row] = await this.client
      .update(pdaDevicesTable)
      .set({ currentUserId: userId, updatedAt: new Date() })
      .where(eq(pdaDevicesTable.id, deviceId))
      .returning();
    return row ?? null;
  }

  async recordSync(deviceId: string) {
    const [row] = await this.client
      .update(pdaDevicesTable)
      .set({ lastSyncAt: new Date(), updatedAt: new Date() })
      .where(eq(pdaDevicesTable.id, deviceId))
      .returning();
    return row ?? null;
  }

  async incrementFailedAttempts(deviceId: string) {
    const [row] = await this.client
      .update(pdaDevicesTable)
      .set({
        failedAttempts: sql`${pdaDevicesTable.failedAttempts} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(pdaDevicesTable.id, deviceId))
      .returning();
    return row ?? null;
  }

  async block(deviceId: string) {
    const [row] = await this.client
      .update(pdaDevicesTable)
      .set({
        status: "blocked" as const,
        blockedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(pdaDevicesTable.id, deviceId))
      .returning();
    return row ?? null;
  }

  async unblock(deviceId: string) {
    const [row] = await this.client
      .update(pdaDevicesTable)
      .set({
        status: "active" as const,
        failedAttempts: 0,
        blockedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(pdaDevicesTable.id, deviceId))
      .returning();
    return row ?? null;
  }
}
