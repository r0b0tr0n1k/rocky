// ── Disease-Zone Spatial Check API Schemas (WO-119, AHL 2016/429) ──
//
// Request/response for the movement.diseaseZoneCheck query. Defined standalone
// (not reusing the movement-domain type) to avoid a validators -> movement cycle.

import { z } from "zod";

export const diseaseZoneCheckRequestSchema = z.strictObject({
  /** UUID of the farm to test against active disease zones. */
  farmId: z.uuid("farmId must be a valid UUID"),
}) satisfies z.ZodType<DiseaseZoneCheckRequest>;

export interface DiseaseZoneCheckRequest {
  farmId: string;
}

export const diseaseZoneCheckResponseSchema = z.object({
  /** RuleSet disease-zone enforcement on/off. */
  enabled: z.boolean(),
  /** Farm is inside an active disease PROTECTION zone (quarantine). */
  inProtectionZone: z.boolean(),
  /** Farm is inside an active disease SURVEILLANCE zone. */
  inSurveillanceZone: z.boolean(),
  /** Protection radius used, in km. */
  protectionZoneKm: z.number(),
  /** Surveillance radius used, in km. */
  surveillanceZoneKm: z.number(),
  /** Disease zones intersecting the protection radius. */
  protectionZones: z.array(
    z.object({
      geofenceId: z.string(),
      name: z.string(),
      farmId: z.string().nullable(),
      cadastralReference: z.string().nullable(),
    }),
  ),
  /** Disease zones intersecting the surveillance radius. */
  surveillanceZones: z.array(
    z.object({
      geofenceId: z.string(),
      name: z.string(),
      farmId: z.string().nullable(),
      cadastralReference: z.string().nullable(),
    }),
  ),
});

export interface DiseaseZoneCheckResponse {
  enabled: boolean;
  inProtectionZone: boolean;
  inSurveillanceZone: boolean;
  protectionZoneKm: number;
  surveillanceZoneKm: number;
  protectionZones: Array<{ geofenceId: string; name: string; farmId: string | null; cadastralReference: string | null }>;
  surveillanceZones: Array<{ geofenceId: string; name: string; farmId: string | null; cadastralReference: string | null }>;
}
