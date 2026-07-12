import { iotDevices, sensorReadings, farms } from "@rocky/database";
import { FENCE_TYPE } from "@rocky/database/constants";
import { BaseRepository } from "@rocky/domains-shared";
import { and, desc, eq, gte, lte, sql, type SQL } from "drizzle-orm";

export class IotRepository extends BaseRepository {
  // ── IoT Devices ──

  async findDeviceById(id: string) {
    const [row] = await this.client.select().from(iotDevices).where(eq(iotDevices.id, id)).limit(1);
    return row ?? null;
  }

  async findDeviceByEui(eui: string) {
    const [row] = await this.client.select().from(iotDevices).where(eq(iotDevices.deviceEui, eui)).limit(1);
    return row ?? null;
  }

  async listDevices(input: {
    farmId?: string;
    animalId?: string;
    status?: string;
    transmissionType?: string;
    limit: number;
    offset: number;
  }) {
    const c: SQL[] = [];
    if (input.farmId) c.push(eq(iotDevices.assignedToFarmId, input.farmId));
    if (input.animalId) c.push(eq(iotDevices.assignedToAnimalId, input.animalId));
    if (input.status) c.push(eq(iotDevices.status, input.status as string));
    if (input.transmissionType) c.push(eq(iotDevices.transmissionType, input.transmissionType));
    const where = c.length > 0 ? and(...c) : undefined;

    const [data, totalResult] = await Promise.all([
      this.client
        .select()
        .from(iotDevices)
        .where(where)
        .limit(input.limit)
        .offset(input.offset)
        .orderBy(desc(iotDevices.createdAt)),
      this.client.select({ count: sql<number>`count(*)::int` }).from(iotDevices).where(where),
    ]);
    return { data, total: totalResult[0]?.count ?? 0 };
  }

  async insertDevice(data: typeof iotDevices.$inferInsert) {
    const [row] = await this.client.insert(iotDevices).values(data).returning();
    return row;
  }

  async updateDevice(id: string, data: Partial<typeof iotDevices.$inferInsert>) {
    const [row] = await this.client.update(iotDevices).set(data).where(eq(iotDevices.id, id)).returning();
    return row;
  }

  // ── Sensor Readings ──

  async insertReading(data: typeof sensorReadings.$inferInsert) {
    const [row] = await this.client.insert(sensorReadings).values(data).returning();
    return row;
  }

  async insertReadings(data: Array<typeof sensorReadings.$inferInsert>) {
    const rows = await this.client.insert(sensorReadings).values(data).returning();
    return rows;
  }

  async listReadings(input: {
    deviceId?: string;
    animalId?: string;
    farmId?: string;
    readingType?: string;
    fromDate?: Date;
    toDate?: Date;
    limit: number;
    offset: number;
  }) {
    const c: SQL[] = [];
    if (input.deviceId) c.push(eq(sensorReadings.deviceId, input.deviceId));
    if (input.animalId) c.push(eq(sensorReadings.animalId, input.animalId));
    if (input.farmId) c.push(eq(sensorReadings.farmId, input.farmId));
    if (input.readingType) c.push(eq(sensorReadings.readingType, input.readingType));
    if (input.fromDate) c.push(gte(sensorReadings.recordedAt, input.fromDate));
    if (input.toDate) c.push(lte(sensorReadings.recordedAt, input.toDate));
    const where = c.length > 0 ? and(...c) : undefined;

    const [data, totalResult] = await Promise.all([
      this.client
        .select()
        .from(sensorReadings)
        .where(where)
        .limit(input.limit)
        .offset(input.offset)
        .orderBy(desc(sensorReadings.recordedAt)),
      this.client.select({ count: sql<number>`count(*)::int` }).from(sensorReadings).where(where),
    ]);
    return { data, total: totalResult[0]?.count ?? 0 };
  }

}
