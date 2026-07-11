import { iotDevices, sensorReadings, geofences, animalGeofenceEvents, farms } from "@rocky/database";
import { FENCE_TYPE } from "@rocky/database/constants";
import { BaseRepository } from "@rocky/domains-shared";
import { and, asc, desc, eq, gte, inArray, lte, sql, type SQL } from "drizzle-orm";

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

  // ── Geofences ──

  async findGeofenceById(id: string) {
    const [row] = await this.client.select().from(geofences).where(eq(geofences.id, id)).limit(1);
    return row ?? null;
  }

  async listGeofencesByFarm(farmId: string) {
    return this.client.select().from(geofences).where(eq(geofences.farmId, farmId)).orderBy(asc(geofences.name));
  }

  async insertGeofence(data: typeof geofences.$inferInsert) {
    const [row] = await this.client.insert(geofences).values(data).returning();
    return row;
  }

  async deleteGeofence(id: string) {
    await this.client.delete(geofences).where(eq(geofences.id, id));
  }

  /** WO-115 (EUDR): geofences linked to the given pasture declarations, optionally filtered to a fence type. */
  async findByPastureIds(pastureIds: string[], fenceType?: string) {
    if (pastureIds.length === 0) return [];
    const conditions: SQL[] = [inArray(geofences.pastureId, pastureIds)];
    if (fenceType) conditions.push(eq(geofences.fenceType, fenceType));
    return this.client.select().from(geofences).where(and(...conditions));
  }

  /**
   * WO-119 (AHL 2016/429): active disease-zone geofences whose polygon is within
   * `radiusMeters` of the given farm's GPS location. Uses ST_DWithin on cast-to-geography
   * geometry so the radius is interpreted in METRES (geometry SRID 4326 would be degrees).
   * Returns the intersecting disease-zone geofences (protection/surveillance determined by caller radius).
   */
  async findActiveDiseaseZonesNearFarm(farmId: string, radiusMeters: number) {
    if (!farmId) return [];
    return this.client
      .select({
        id: geofences.id,
        name: geofences.name,
        farmId: geofences.farmId,
        fenceType: geofences.fenceType,
        cadastralReference: geofences.cadastralReference,
        polygon: geofences.polygon,
      })
      .from(geofences)
      .innerJoin(
        farms,
        sql`ST_DWithin(${geofences.polygon}::geography, ${farms.location}::geography, ${radiusMeters})`,
      )
      .where(and(eq(geofences.fenceType, FENCE_TYPE.DISEASE_ZONE), eq(geofences.isActive, true), eq(farms.id, farmId)));
  }

  // ── Geofence Events ──

  async insertGeofenceEvent(data: typeof animalGeofenceEvents.$inferInsert) {
    const [row] = await this.client.insert(animalGeofenceEvents).values(data).returning();
    return row;
  }

  async listGeofenceEvents(input: {
    animalId?: string;
    geofenceId?: string;
    farmId?: string;
    limit: number;
    offset: number;
  }) {
    const c: SQL[] = [];
    if (input.animalId) c.push(eq(animalGeofenceEvents.animalId, input.animalId));
    if (input.geofenceId) c.push(eq(animalGeofenceEvents.geofenceId, input.geofenceId));
    if (input.farmId) c.push(eq(animalGeofenceEvents.farmId, input.farmId));
    const where = c.length > 0 ? and(...c) : undefined;

    const [data, totalResult] = await Promise.all([
      this.client
        .select()
        .from(animalGeofenceEvents)
        .where(where)
        .limit(input.limit)
        .offset(input.offset)
        .orderBy(desc(animalGeofenceEvents.eventAt)),
      this.client.select({ count: sql<number>`count(*)::int` }).from(animalGeofenceEvents).where(where),
    ]);
    return { data, total: totalResult[0]?.count ?? 0 };
  }
}
