// -- Geo Router - Geofences, disease zones, EUDR traversal, map provider --
//
// Thin controller - delegates to GeoService / MapTilerMapService /
// DeforestationMonitor, unwraps Result<T,E>.
// Endpoints:
//   - geo.listGeofences, geo.findActiveDiseaseZones, geo.listGeofenceEvents
//   - geo.findGeofencesForAnimalPastures, geo.findActiveDiseaseZonesNearFarm
//   - geo.findGeofencesIntersectingPolygon
//   - geo.forwardGeocode, geo.reverseGeocode, geo.staticMapUrl, geo.geolocation
//   - geo.assessDeforestation

import { Inject, Injectable } from "@nestjs/common";
import { Policy, RegisterPolicy } from "@rocky/authorization/index.js";
import { DeforestationMonitor, GeoService, MapTilerMapService } from "@rocky/geo/index.js";
import type { AppContext } from "@rocky/trpc/context.js";
import { createResultUnwrapper } from "@rocky/trpc/index.js";
import {
  createGeofenceRequestSchema,
  declareDiseaseZoneRequestSchema,
  diseaseZoneListResponseSchema,
  geoCountSchema,
  geofenceEventResponseSchema,
  geofenceResponseSchema,
  logGeofenceEventRequestSchema,
  settlementResponseSchema,
} from "@rocky/validators/api/index.js";
import type {
  CreateGeofenceRequest,
  DeclareDiseaseZoneRequest,
  LogGeofenceEventRequest,
} from "@rocky/validators/api/index.js";
import { GEO_TRPC_ERROR_MAP } from "@rocky/validators/errors/index.js";
import { Ctx, Input, Mutation, Query, Router } from "nestjs-trpc";
import { z } from "zod";
import type { SubtypeGuillotine, ActivateGuillotines } from "@rocky/validators/utils";

const unwrap = createResultUnwrapper(GEO_TRPC_ERROR_MAP);

// Named output schemas (so Bridge 2b can reference z.output<typeof X>).
const geofenceArraySchema = z.array(geofenceResponseSchema);
const geofenceEventArraySchema = z.array(geofenceEventResponseSchema);
const settlementArraySchema = z.array(settlementResponseSchema);
const diseaseZoneListSchema = diseaseZoneListResponseSchema;
const geocodeFeatureSchema = z.object({
  id: z.string(),
  name: z.string(),
  placeName: z.string(),
  center: z.tuple([z.number(), z.number()]),
  relevance: z.number(),
  placeType: z.array(z.string()),
  countryCode: z.string().optional(),
  bbox: z.array(z.number()).optional(),
});
const geocodeResultSchema = z.object({
  features: z.array(geocodeFeatureSchema),
  attribution: z.string(),
});
const geolocationSchema = z.object({
  country: z.string().optional(),
  countryCode: z.string().optional(),
  city: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  eu: z.boolean().optional(),
});
const deforestationAssessmentSchema = z.object({
  geofenceId: z.string(),
  source: z.enum(["sentinel2_ndvi", "land_cover_2020", "hansen_gfc"]),
  cutoffYear: z.number(),
  totalPixels: z.number(),
  deforestedPixels: z.number(),
  deforestationFreeSince: z.date().nullable(),
  compliant: z.boolean(),
});

// GeoJSON-ish feature consumed by @rocky/ui GeoMapView (kind drives fill color).
const geoFeatureSchema = z.object({
  id: z.string(),
  geometry: z.unknown(),
  kind: z.enum(["geofence", "disease_zone", "deforested", "compliant"]).or(z.string()),
  properties: z.record(z.string(), z.unknown()).optional(),
});
const forestLayerResponseSchema = z.array(geoFeatureSchema);

@Router({ alias: "geo" })
@RegisterPolicy("geo")
@Policy({ authenticated: true })
@Injectable()
export class GeoRouter {
  constructor(
    @Inject(GeoService) private readonly geoService: GeoService,
    @Inject(MapTilerMapService) private readonly map: MapTilerMapService,
    @Inject(DeforestationMonitor) private readonly deforestation: DeforestationMonitor,
  ) {}

  // -- Geofences (reference queries) --

  @Query({ input: z.object({ farmId: z.uuid() }), output: geofenceArraySchema })
  async listGeofences(@Input() input: { farmId: string }) {
    return unwrap(await this.geoService.listGeofences(input.farmId));
  }

  @Query({ input: z.object({ farmId: z.uuid() }), output: geofenceArraySchema })
  async findActiveDiseaseZones(@Input() input: { farmId: string }) {
    return unwrap(await this.geoService.findActiveDiseaseZones(input.farmId));
  }

  @Query({
    input: z.object({
      animalId: z.uuid().optional(),
      geofenceId: z.uuid().optional(),
      farmId: z.uuid().optional(),
      limit: z.int().min(1).max(1000).default(50),
      offset: z.int().min(0).default(0),
    }),
    output: geofenceEventArraySchema,
  })
  async listGeofenceEvents(
    @Input() input: { animalId?: string; geofenceId?: string; farmId?: string; limit?: number; offset?: number },
  ) {
    return unwrap(await this.geoService.listGeofenceEvents(input));
  }

  // -- Geofence mutations (canonical geo home; iot is networking-only) --

  @Mutation({ input: createGeofenceRequestSchema, output: geofenceResponseSchema })
  async createGeofence(@Input() input: CreateGeofenceRequest) {
    return unwrap(await this.geoService.createGeofence(input));
  }

  @Mutation({ input: z.object({ id: z.uuid() }), output: z.void() })
  async deleteGeofence(@Input() input: { id: string }) {
    return unwrap(await this.geoService.deleteGeofence(input.id));
  }

  @Mutation({ input: logGeofenceEventRequestSchema, output: geofenceEventResponseSchema })
  async logGeofenceEvent(@Input() input: LogGeofenceEventRequest) {
    return unwrap(await this.geoService.logGeofenceEvent(input));
  }

  // -- Disease-zone declaration (ADR-0080) --
  // Zones are anchored to the NEAREST settlement (village/town) and drawn as
  // circular protection (3 km) / surveillance (10 km) geofences. The
  // authoritative settlement + outbreak data is supplied to us on go-live.

  @Query({ input: z.object({}), output: settlementArraySchema })
  async listSettlements(@Ctx() _ctx: AppContext) {
    return unwrap(await this.geoService.listSettlements());
  }

  @Mutation({ input: declareDiseaseZoneRequestSchema, output: geofenceArraySchema })
  async declareDiseaseZone(@Input() input: DeclareDiseaseZoneRequest) {
    return unwrap(await this.geoService.declareDiseaseZone(input.farmId, input.disease, input));
  }

  @Query({
    input: z.object({
      farmId: z.uuid().optional(),
      limit: z.int().min(1).max(1000).default(50),
      offset: z.int().min(0).default(0),
    }),
    output: diseaseZoneListSchema,
  })
  async listDiseaseZones(@Input() input: { farmId?: string; limit: number; offset: number }) {
    return unwrap(await this.geoService.listDiseaseZones(input));
  }

  // -- Dashboard counts (ADR-0078 Consequence) --
  // Real geo counts surfaced on the admin dashboard: active disease zones and
  // open geofence events (events in the last 30 days).

  @Query({ input: z.object({}), output: geoCountSchema })
  async counts(@Ctx() _ctx: AppContext) {
    const zones = unwrap(await this.geoService.countActiveDiseaseZones());
    const events = unwrap(await this.geoService.countOpenGeofenceEvents());
    return { activeDiseaseZones: zones, openGeofenceEvents: events };
  }

  // -- EUDR traversal (ADR-0063 §3) --

  @Query({ input: z.object({ animalId: z.uuid() }), output: geofenceArraySchema })
  async findGeofencesForAnimalPastures(@Input() input: { animalId: string }) {
    return unwrap(await this.geoService.findGeofencesForAnimalPastures(input.animalId));
  }

  @Query({
    input: z.object({ farmId: z.uuid(), radiusMeters: z.number().min(0).default(50_000) }),
    output: geofenceArraySchema,
  })
  async findActiveDiseaseZonesNearFarm(@Input() input: { farmId: string; radiusMeters: number }) {
    return unwrap(await this.geoService.findActiveDiseaseZonesNearFarm(input.farmId, input.radiusMeters));
  }

  @Query({ input: z.object({ wkt: z.string() }), output: geofenceArraySchema })
  async findGeofencesIntersectingPolygon(@Input() input: { wkt: string }) {
    return unwrap(await this.geoService.findGeofencesIntersectingPolygon(input.wkt));
  }

  // -- Map provider (MapTiler Cloud; swappable for a self-hosted GeoMapProvider) --

  @Query({
    input: z.object({
      query: z.string(),
      language: z.string().optional(),
      limit: z.int().optional(),
      proximity: z.array(z.number()).length(2).optional(),
      bbox: z.array(z.number()).optional(),
      country: z.array(z.string()).optional(),
    }),
    output: geocodeResultSchema,
  })
  async forwardGeocode(
    @Input()
    input: {
      query: string;
      language?: string;
      limit?: number;
      proximity?: [number, number];
      bbox?: number[];
      country?: string[];
    },
  ) {
    return unwrap(
      await this.map.forwardGeocode(input.query, {
        language: input.language,
        limit: input.limit,
        proximity: input.proximity,
        bbox: input.bbox as never,
        country: input.country,
      }),
    );
  }

  @Query({
    input: z.object({ lng: z.number(), lat: z.number(), language: z.string().optional(), limit: z.int().optional() }),
    output: geocodeResultSchema,
  })
  async reverseGeocode(@Input() input: { lng: number; lat: number; language?: string; limit?: number }) {
    return unwrap(
      await this.map.reverseGeocode([input.lng, input.lat], { language: input.language, limit: input.limit }),
    );
  }

  @Query({
    input: z.object({
      mode: z.enum(["centered", "bounded", "automatic"]),
      center: z.array(z.number()).length(2).optional(),
      zoom: z.number().optional(),
      bbox: z.array(z.number()).optional(),
      width: z.number().optional(),
      height: z.number().optional(),
      hiDPI: z.boolean().optional(),
      style: z.string().optional(),
      path: z.array(z.array(z.number())).optional(),
      marker: z.array(z.tuple([z.number(), z.number(), z.string()])).optional(),
      pathStrokeColor: z.string().optional(),
    }),
    output: z.string(),
  })
  async staticMapUrl(
    @Input() input: {
      mode: "centered" | "bounded" | "automatic";
      center?: [number, number];
      zoom?: number;
      bbox?: number[];
      width?: number;
      height?: number;
      hiDPI?: boolean;
      style?: string;
      path?: number[][];
      marker?: Array<[number, number, string]>;
      pathStrokeColor?: string;
    },
  ) {
    return unwrap(
      this.map.staticMapUrl({
        mode: input.mode,
        center: input.center,
        zoom: input.zoom,
        bbox: input.bbox as never,
        width: input.width,
        height: input.height,
        hiDPI: input.hiDPI,
        style: input.style,
        path: input.path as never,
        marker: input.marker,
        pathStrokeColor: input.pathStrokeColor,
      }),
    );
  }

  @Query({ input: z.object({}), output: geolocationSchema })
  async geolocation(@Ctx() _ctx: AppContext) {
    return unwrap(await this.map.geolocation());
  }

  // -- Deforestation monitoring (ADR-0063 resolution) --

  @Query({
    input: z.object({ geofenceId: z.uuid(), cutoffYear: z.number().int() }),
    output: deforestationAssessmentSchema,
  })
  async assessDeforestation(@Input() input: { geofenceId: string; cutoffYear: number }) {
    return unwrap(await this.deforestation.assessGeofence(input.geofenceId, input.cutoffYear));
  }

  // -- Forest / EUDR overlay (WO-143): spatial deforestation-status layer --
  // Paints each geofence green (intact) / red (breached) from the EUDR verdict.
  // With the default NoDataRasterSource every geofence is compliant (green); a real
  // Sentinel-2 / Land Cover 2020 backend plugged into RasterSourcePort flips
  // breached areas to red automatically.
  @Query({
    input: z.object({ farmId: z.uuid(), cutoffYear: z.number().int().optional() }),
    output: forestLayerResponseSchema,
  })
  async forestLayer(@Input() input: { farmId: string; cutoffYear?: number }) {
    const cutoff = input.cutoffYear ?? 2020;
    const geofences = unwrap(await this.geoService.listGeofences(input.farmId));
    const features: z.infer<typeof geoFeatureSchema>[] = [];
    for (const g of geofences) {
      const res = await this.deforestation.assessGeofence(g.id, cutoff);
      const compliant = res.isOk() ? res.value.compliant : true;
      const props = res.isOk()
        ? {
            compliant: res.value.compliant,
            deforestedPixels: res.value.deforestedPixels,
            totalPixels: res.value.totalPixels,
          }
        : {};
      features.push({
        id: g.id,
        geometry: (g as unknown as { polygon?: unknown }).polygon,
        kind: compliant ? "compliant" : "deforested",
        properties: props,
      });
    }
    return features;
  }
}

// SubtypeGuillotine (one-directional: schema output ⊆ return type) for the
// geo-reference queries that reuse existing response schemas. Map-provider and
// deforestation endpoints intentionally omit the guillotine: their outputs cross
// an external (MapTiler) BBox tuple boundary, so the schema is the SSOT there.
type _verify_listGeofences = SubtypeGuillotine<
  z.output<typeof geofenceArraySchema>,
  Awaited<ReturnType<GeoRouter["listGeofences"]>>
>;
type _verify_findActiveDiseaseZones = SubtypeGuillotine<
  z.output<typeof geofenceArraySchema>,
  Awaited<ReturnType<GeoRouter["findActiveDiseaseZones"]>>
>;
type _verify_listGeofenceEvents = SubtypeGuillotine<
  z.output<typeof geofenceEventArraySchema>,
  Awaited<ReturnType<GeoRouter["listGeofenceEvents"]>>
>;
type _verify_findGeofencesForAnimalPastures = SubtypeGuillotine<
  z.output<typeof geofenceArraySchema>,
  Awaited<ReturnType<GeoRouter["findGeofencesForAnimalPastures"]>>
>;
type _verify_findActiveDiseaseZonesNearFarm = SubtypeGuillotine<
  z.output<typeof geofenceArraySchema>,
  Awaited<ReturnType<GeoRouter["findActiveDiseaseZonesNearFarm"]>>
>;
type _verify_findGeofencesIntersectingPolygon = SubtypeGuillotine<
  z.output<typeof geofenceArraySchema>,
  Awaited<ReturnType<GeoRouter["findGeofencesIntersectingPolygon"]>>
>;

type _verify_createGeofence = SubtypeGuillotine<
  z.output<typeof geofenceResponseSchema>,
  Awaited<ReturnType<GeoRouter["createGeofence"]>>
>;
type _verify_deleteGeofence = SubtypeGuillotine<void, Awaited<ReturnType<GeoRouter["deleteGeofence"]>>>;
type _verify_logGeofenceEvent = SubtypeGuillotine<
  z.output<typeof geofenceEventResponseSchema>,
  Awaited<ReturnType<GeoRouter["logGeofenceEvent"]>>
>;

type _verify_listSettlements = SubtypeGuillotine<
  z.output<typeof settlementArraySchema>,
  Awaited<ReturnType<GeoRouter["listSettlements"]>>
>;
type _verify_declareDiseaseZone = SubtypeGuillotine<
  z.output<typeof geofenceArraySchema>,
  Awaited<ReturnType<GeoRouter["declareDiseaseZone"]>>
>;
type _verify_listDiseaseZones = SubtypeGuillotine<
  z.output<typeof diseaseZoneListSchema>,
  Awaited<ReturnType<GeoRouter["listDiseaseZones"]>>
>;

export type _GeoGuillotines = ActivateGuillotines<
  [
    _verify_listGeofences,
    _verify_findActiveDiseaseZones,
    _verify_listGeofenceEvents,
    _verify_findGeofencesForAnimalPastures,
    _verify_findActiveDiseaseZonesNearFarm,
    _verify_findGeofencesIntersectingPolygon,
    _verify_createGeofence,
    _verify_deleteGeofence,
    _verify_logGeofenceEvent,
    _verify_listSettlements,
    _verify_declareDiseaseZone,
    _verify_listDiseaseZones,
  ]
>;
