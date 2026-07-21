import { animalGeofenceEvents, farms, geofences, pastureDeclarations, settlements } from "@rocky/database";
import { FENCE_TYPE } from "@rocky/database/constants";
import { BaseRepository } from "@rocky/domains-shared";
import { and, asc, eq, inArray, type SQL, sql } from "drizzle-orm";

/** Parse a PostGIS POINT wkt ("POINT(lng lat)") into { latitude, longitude }. */
function parsePointWkt(wkt: string): { latitude: number; longitude: number } {
  const m = /POINT\s*\(?\s*([-\d.]+)\s+([-\d.]+)\s*\)?/i.exec(wkt);
  if (!m) throw new Error(`Unparseable POINT wkt: ${wkt}`);
  return { longitude: Number(m[1]), latitude: Number(m[2]) };
}

export class GeoRepository extends BaseRepository {
  // ── Geofences ──

  async findGeofenceById(id: string) {
    const [row] = await this.client.select().from(geofences).where(eq(geofences.id, id)).limit(1);
    return row ?? null;
  }

  async listGeofencesByFarm(farmId: string) {
    return this.client.select().from(geofences).where(eq(geofences.farmId, farmId)).orderBy(asc(geofences.name));
  }

  async listGeofences(input: { farmId?: string; fenceType?: string; limit: number; offset: number }) {
    const c: SQL[] = [];
    if (input.farmId) c.push(eq(geofences.farmId, input.farmId));
    if (input.fenceType) c.push(eq(geofences.fenceType, input.fenceType as string));
    const where = c.length > 0 ? and(...c) : undefined;
    const [data, totalResult] = await Promise.all([
      this.client
        .select()
        .from(geofences)
        .where(where)
        .limit(input.limit)
        .offset(input.offset)
        .orderBy(asc(geofences.name)),
      this.client.select({ count: sql<number>`count(*)::int` }).from(geofences).where(where),
    ]);
    return { data, total: totalResult[0]?.count ?? 0 };
  }

  async findActiveDiseaseZonesByFarm(farmId: string) {
    return this.client
      .select()
      .from(geofences)
      .where(
        and(
          eq(geofences.farmId, farmId),
          eq(geofences.fenceType, FENCE_TYPE.DISEASE_ZONE),
          eq(geofences.isActive, true),
        ),
      )
      .orderBy(asc(geofences.name));
  }

  /** Count of active disease-zone geofences (dashboard tile). */
  async countActiveDiseaseZones(): Promise<number> {
    const [row] = await this.client
      .select({ count: sql<number>`count(*)::int` })
      .from(geofences)
      .where(and(eq(geofences.fenceType, FENCE_TYPE.DISEASE_ZONE), eq(geofences.isActive, true)));
    return row?.count ?? 0;
  }

  /**
   * Count of "open" geofence events — events with no acknowledgedAt/status
   * column (per schema), so open = events recorded in the last 30 days.
   * (Confirmed against packages/database/src/schema/an/animal-geofence-events.ts:
   * no acknowledgedAt / status column exists.)
   */
  async countOpenGeofenceEvents(days: number = 30): Promise<number> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const [row] = await this.client
      .select({ count: sql<number>`count(*)::int` })
      .from(animalGeofenceEvents)
      .where(sql`${animalGeofenceEvents.eventAt} >= ${since.toISOString()}`);
    return row?.count ?? 0;
  }

  async insertGeofence(data: typeof geofences.$inferInsert) {
    const [row] = await this.client.insert(geofences).values(data).returning();
    return row;
  }

  async updateGeofence(id: string, data: Partial<typeof geofences.$inferInsert>) {
    const [row] = await this.client.update(geofences).set(data).where(eq(geofences.id, id)).returning();
    return row;
  }

  async deleteGeofence(id: string) {
    await this.client.delete(geofences).where(eq(geofences.id, id));
  }

  // ── Settlements (provided/ingested disease-zone anchor, ADR-0080) ──
  // Settlements are the nearest village/town a disease is reported against.
  // The authoritative settlement + outbreak data is supplied to us on go-live,
  // not hand-drawn by vets/farmers.

  /** Resolve a farm's GPS point as { latitude, longitude } (null if unknown). */
  async findFarmLocation(farmId: string): Promise<{ latitude: number; longitude: number } | null> {
    const [row] = await this.client
      .select({ wkt: sql<string>`ST_AsText(${farms.location})` })
      .from(farms)
      .where(eq(farms.id, farmId))
      .limit(1);
    if (!row?.wkt) return null;
    return parsePointWkt(row.wkt);
  }

  /** Nearest settlement (village/town/city) to a GPS point, via KNN (<-> operator). */
  async findNearestSettlement(
    longitude: number,
    latitude: number,
  ): Promise<{
    id: string;
    name: string;
    settlementType: string;
    location: { latitude: number; longitude: number };
  } | null> {
    const rows = await this.client
      .select({
        id: settlements.id,
        name: settlements.name,
        settlementType: settlements.settlementType,
        wkt: sql<string>`ST_AsText(${settlements.location})`,
      })
      .from(settlements)
      .orderBy(sql`${settlements.location} <-> ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`)
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      settlementType: row.settlementType,
      location: parsePointWkt(row.wkt),
    };
  }

  async listSettlements() {
    return this.client.select().from(settlements).orderBy(asc(settlements.name));
  }

  async insertSettlement(data: typeof settlements.$inferInsert) {
    const [row] = await this.client.insert(settlements).values(data).returning();
    return row;
  }

  // ── Animal geofence events ──

  async listGeofenceEvents(input: { animalId?: string; farmId?: string; limit?: number; offset?: number }) {
    const c: SQL[] = [];
    if (input.animalId) c.push(eq(animalGeofenceEvents.animalId, input.animalId));
    if (input.farmId) c.push(eq(animalGeofenceEvents.farmId, input.farmId));
    const where = c.length > 0 ? and(...c) : undefined;
    const limit = input.limit ?? 50;
    const offset = input.offset ?? 0;
    const [data, totalResult] = await Promise.all([
      this.client
        .select()
        .from(animalGeofenceEvents)
        .where(where)
        .limit(limit)
        .offset(offset)
        .orderBy(asc(animalGeofenceEvents.eventAt)),
      this.client.select({ count: sql<number>`count(*)::int` }).from(animalGeofenceEvents).where(where),
    ]);
    return { data, total: totalResult[0]?.count ?? 0 };
  }

  async insertGeofenceEvent(data: typeof animalGeofenceEvents.$inferInsert) {
    const [row] = await this.client.insert(animalGeofenceEvents).values(data).returning();
    return row;
  }

  // ── EUDR traversal (ADR-0063 §3) ──
  // The "pastures touched" query the EUDR due-diligence core needs: resolve the
  // pasture declarations an animal grazed, then the geofences of those pastures.

  /** Resolve the pasture declarations an animal touched (animal_ids UUID array contains it). */
  async findPastureDeclarationIdsByAnimalId(animalId: string): Promise<string[]> {
    const rows = await this.client
      .select({ id: pastureDeclarations.id })
      .from(pastureDeclarations)
      .where(sql`${animalId} = ANY(${pastureDeclarations.animalIds})`);
    return rows.map((r: { id: string }) => r.id);
  }

  /** Geofences linked to the given pasture declarations, optionally filtered to a fence type. */
  async findGeofencesByPastureIds(pastureIds: string[], fenceType?: string) {
    if (pastureIds.length === 0) return [];
    const conditions = [inArray(geofences.pastureId, pastureIds)];
    if (fenceType) conditions.push(eq(geofences.fenceType, fenceType));
    return this.client
      .select()
      .from(geofences)
      .where(and(...conditions));
  }

  /** Combined traversal: pastures touched by the animal → their geofences (default PASTURE_BOUNDARY). */
  async findGeofencesForAnimalPastures(animalId: string, fenceType: string = FENCE_TYPE.PASTURE_BOUNDARY) {
    const pastureIds = await this.findPastureDeclarationIdsByAnimalId(animalId);
    return this.findGeofencesByPastureIds(pastureIds, fenceType);
  }

  // ── Polygon intersection overlay (ADR-0063 Assumption seam) ──
  // The future satellite-deforestation raster overlay reuses this ST_Intersects
  // infra. Today it intersects a supplied WKT polygon (e.g. a deforestation
  // cell) against stored geofence polygons in SRID 4326.

  async findGeofencesIntersectingPolygon(wkt: string, fenceType?: string) {
    const conditions = [sql`ST_Intersects(${geofences.polygon}, ST_GeomFromText(${wkt}, 4326))`];
    if (fenceType) conditions.push(eq(geofences.fenceType, fenceType));
    return this.client
      .select()
      .from(geofences)
      .where(and(...conditions));
  }

  // ── Disease-zone proximity (WO-119 / AHL 2016/429) ──
  // Active disease-zone geofences whose polygon is within `radiusMeters` of a
  // farm's GPS location. Cast to geography so the radius is METRES (geometry
  // SRID 4326 would be degrees).

  async findActiveDiseaseZonesNearFarm(farmId: string, radiusMeters: number) {
    if (!farmId) return [];
    return this.client
      .select(geofences)
      .from(geofences)
      .innerJoin(farms, sql`ST_DWithin(${geofences.polygon}::geography, ${farms.location}::geography, ${radiusMeters})`)
      .where(and(eq(geofences.fenceType, FENCE_TYPE.DISEASE_ZONE), eq(geofences.isActive, true), eq(farms.id, farmId)));
  }
}
