import { z } from "zod";

/**
 * Core geometry types for PostGIS and geofence operations.
 *
 * These are the canonical definitions - @repo/validators re-exports compatible
 * Zod schemas that mirror these types.
 */

// ============================================================================
// Coordinate - Basic lat/lng point
// ============================================================================

export const coordinateSchema = z.object({
	latitude: z.number().min(-90).max(90),
	longitude: z.number().min(-180).max(180),
});

export type Coordinate = z.infer<typeof coordinateSchema>;

// ============================================================================
// PolygonGeometry - Polygon defined by vertices
// ============================================================================

export const polygonGeometrySchema = z.object({
	type: z.literal("polygon"),
	vertices: z.array(coordinateSchema).min(3),
});

export type PolygonGeometry = z.infer<typeof polygonGeometrySchema>;

// ============================================================================
// CircleGeometry - Circle defined by center and radius
// ============================================================================

export const circleGeometrySchema = z.object({
	type: z.literal("circle"),
	center: coordinateSchema,
	radiusMeters: z.number().positive(),
});

export type CircleGeometry = z.infer<typeof circleGeometrySchema>;

// ============================================================================
// GeofenceGeometry - Union of supported geofence shapes
// ============================================================================

export const geofenceGeometrySchema = z.discriminatedUnion("type", [
	circleGeometrySchema,
	polygonGeometrySchema,
]);

export type GeofenceGeometry = z.infer<typeof geofenceGeometrySchema>;
