import { fromAsyncThrowable, type Result, toAppError } from "@rocky/domains-shared";
import type { CreateGeofenceRequest, GeofenceEventResponse, GeofenceResponse, LogGeofenceEventRequest, SettlementResponse } from "@rocky/validators/api";
import { geofenceEventResponseSchema, geofenceResponseSchema, settlementResponseSchema } from "@rocky/validators/api";
import { GEO_ERRORS, GeoError } from "../errors/geo.errors.js";
import type { GeoRepository } from "../repositories/geo.repository.js";
import type { RuleSet } from "@rocky/domains-system";
import { runDiseaseZoneCheck, type DiseaseZoneCheckResult } from "./disease-zone.service.js";
import { FENCE_TYPE } from "@rocky/database/constants";
import { sql } from "drizzle-orm";
import { geodesicCircle, toWktPolygon } from "./polygon.service.js";
import { randomUUID } from "node:crypto";

export class GeoService {
  constructor(private readonly repo: GeoRepository) {}

  // ── Queries ──
  // Geo is a spatial *reference* service: it is queried for geo data by other
  // capabilities (Movement lineage, Inspection disease zones, Farm, dashboard).
  // It owns no business workflow of its own.

  async listGeofences(farmId: string): Promise<Result<GeofenceResponse[], Error>> {
    return fromAsyncThrowable(async () => {
      const rows = await this.repo.listGeofencesByFarm(farmId);
      return rows.map((r: unknown) => geofenceResponseSchema.parse(r));
    }, toAppError)();
  }

  // ── Mutations (canonical geo home; iot is networking-only) ──

  async createGeofence(data: CreateGeofenceRequest): Promise<Result<GeofenceResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const geofence = await this.repo.insertGeofence({
        id: randomUUID(),
        name: data.name,
        description: data.description,
        farmId: data.farmId,
        pastureId: data.pastureId,
        fenceType: data.fenceType,
        geometry: data.geometry,
        cadastralReference: data.cadastralReference,
        deforestationFreeSince: data.deforestationFreeSince ?? null,
      });
      return geofenceResponseSchema.parse(geofence);
    }, toAppError)();
  }

  async deleteGeofence(id: string): Promise<Result<void, Error>> {
    return fromAsyncThrowable(async () => {
      const existing = await this.repo.findGeofenceById(id);
      if (!existing) throw new GeoError(GEO_ERRORS.GEOFENCE_NOT_FOUND, { id });
      await this.repo.deleteGeofence(id);
    }, toAppError)();
  }

  async logGeofenceEvent(data: LogGeofenceEventRequest): Promise<Result<GeofenceEventResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const event = await this.repo.insertGeofenceEvent({
        animalId: data.animalId,
        geofenceId: data.geofenceId,
        farmId: data.farmId,
        eventType: data.eventType,
        eventAt: new Date(data.eventAt),
        location: data.latitude && data.longitude
          ? { x: data.longitude, y: data.latitude }
          : undefined,
        source: data.source,
      });
      return geofenceEventResponseSchema.parse(event);
    }, toAppError)();
  }

  async findActiveDiseaseZones(farmId: string): Promise<Result<GeofenceResponse[], Error>> {
    return fromAsyncThrowable(async () => {
      const rows = await this.repo.findActiveDiseaseZonesByFarm(farmId);
      return rows.map((r: unknown) => geofenceResponseSchema.parse(r));
    }, toAppError)();
  }

  // ── Disease-zone declaration (ADR-0080) ──
  // A confirmed infected premises is declared; we anchor the zone to the NEAREST
  // settlement (village/town) — the catastrophe shapes are not hand-drawn
  // by vets/farmers, and the authoritative settlement + outbreak data is
  // supplied to us on go-live. Two concentric CIRCULAR disease_zone
  // geofences (protection 3 km / surveillance 10 km, AHL 2016/429) are
  // centered on that settlement; both geometry (jsonb) + polygon (PostGIS)
  // are written so the movement block can fire (runDiseaseZoneCheck).

  private readonly ahlProtectionRadiusMeters = 3000;
  private readonly ahlSurveillanceRadiusMeters = 10000;

  async listSettlements(): Promise<Result<SettlementResponse[], Error>> {
    return fromAsyncThrowable(async () => {
      const rows = await this.repo.listSettlements();
      return rows.map((r: unknown) => settlementResponseSchema.parse(r));
    }, toAppError)();
  }

  async declareDiseaseZone(
    farmId: string,
    disease: string,
    opts: {
      protectionRadiusMeters?: number;
      surveillanceRadiusMeters?: number;
      validTo?: Date | string | null;
      source?: string;
    } = {},
  ): Promise<Result<GeofenceResponse[], Error>> {
    return fromAsyncThrowable(async () => {
      const farm = await this.repo.findFarmLocation(farmId);
      if (!farm) throw new GeoError(GEO_ERRORS.NOT_FOUND, { farmId });
      const settlement = await this.repo.findNearestSettlement(farm.longitude, farm.latitude);
      const center = settlement ? settlement.location : farm;
      const centerName = settlement?.name ?? "Unknown holding";
      const protection = opts.protectionRadiusMeters ?? this.ahlProtectionRadiusMeters;
      const surveillance = opts.surveillanceRadiusMeters ?? this.ahlSurveillanceRadiusMeters;
      const zones = [
        { km: protection / 1000, label: "Protection", radiusMeters: protection },
        { km: surveillance / 1000, label: "Surveillance", radiusMeters: surveillance },
      ];
      const created: GeofenceResponse[] = [];
      for (const z of zones) {
        const ring = geodesicCircle(center, z.radiusMeters, 64);
        const wkt = toWktPolygon(ring);
        if (wkt.isErr()) throw wkt.error;
        const geometry = {
          type: "circle" as const,
          center: { latitude: center.latitude, longitude: center.longitude },
          radiusMeters: z.radiusMeters,
        };
        const validTo =
          opts.validTo == null
            ? null
            : opts.validTo instanceof Date
              ? opts.validTo
              : new Date(opts.validTo);
        const row = await this.repo.insertGeofence({
          id: randomUUID(),
          name: `${centerName} — ${z.label} (${z.km} km)`,
          description: `Disease zone (${disease}) anchored to ${centerName}.`,
          farmId,
          pastureId: null,
          fenceType: FENCE_TYPE.DISEASE_ZONE,
          geometry,
          polygon: sql`ST_GeomFromText(${wkt.value}, 4326)` as unknown as { x: number; y: number },
          cadastralReference: settlement?.name ?? null,
          deforestationFreeSince: null,
          isActive: true,
          validTo,
          createdBy: null,
        });
        created.push(geofenceResponseSchema.parse(row));
      }
      return created;
    }, toAppError)();
  }

  async listDiseaseZones(input: { farmId?: string; limit: number; offset: number }): Promise<
    Result<{ data: GeofenceResponse[]; total: number }, Error>
  > {
    return fromAsyncThrowable(async () => {
      const { data, total } = await this.repo.listGeofences({
        ...input,
        fenceType: FENCE_TYPE.DISEASE_ZONE,
      });
      return { data: data.map((r: unknown) => geofenceResponseSchema.parse(r)), total };
    }, toAppError)();
  }

  // ── WO-119: Disease-zone spatial check (AHL 2016/429, ADR-0064) ──
  // Canonical home moved here from Movement per ADR-0078 (Geo owns the spatial
  // truth). Returns the raw check result; Movement wraps it in the movement gate.
  async runDiseaseZoneCheck(fromFarmId: string, ruleSet: RuleSet): Promise<DiseaseZoneCheckResult> {
    return runDiseaseZoneCheck(this.repo, ruleSet, fromFarmId);
  }

  async listGeofenceEvents(input: { animalId?: string; farmId?: string }): Promise<Result<GeofenceEventResponse[], Error>> {
    return fromAsyncThrowable(async () => {
      const { data } = await this.repo.listGeofenceEvents(input);
      return data.map((r: unknown) => geofenceEventResponseSchema.parse(r));
    }, toAppError)();
  }

  // ── EUDR traversal (ADR-0063 §3) ──
  // The "pastures touched" query the due-diligence guillotine needs.

  async findGeofencesForAnimalPastures(animalId: string): Promise<Result<GeofenceResponse[], Error>> {
    return fromAsyncThrowable(async () => {
      const rows = await this.repo.findGeofencesForAnimalPastures(animalId);
      return rows.map((r: unknown) => geofenceResponseSchema.parse(r));
    }, toAppError)();
  }

  async findGeofencesIntersectingPolygon(wkt: string): Promise<Result<GeofenceResponse[], Error>> {
    return fromAsyncThrowable(async () => {
      const rows = await this.repo.findGeofencesIntersectingPolygon(wkt);
      return rows.map((r: unknown) => geofenceResponseSchema.parse(r));
    }, toAppError)();
  }

  // ── Disease-zone proximity (WO-119 / AHL 2016/429) ──

  async findActiveDiseaseZonesNearFarm(farmId: string, radiusMeters: number): Promise<Result<GeofenceResponse[], Error>> {
    return fromAsyncThrowable(async () => {
      const rows = await this.repo.findActiveDiseaseZonesNearFarm(farmId, radiusMeters);
      return rows.map((r: unknown) => geofenceResponseSchema.parse(r));
    }, toAppError)();
  }
}
