/**
 * Geometry Module - PostGIS geometry support for GPS coordinates and geofences
 *
 * Provides Zod schemas and helper functions for working with PostGIS geometry types.
 * All coordinates use SRID 4326 (WGS84) - the standard GPS coordinate system.
 */

export {
  coordinateSchema,
  type Coordinate,
  type PolygonGeometry,
  type CircleGeometry,
  type GeofenceGeometry,
  polygonGeometrySchema,
  circleGeometrySchema,
  geofenceGeometrySchema,
} from "./coordinate-schema.js";

export {
  geometryPointToWkt,
  geometryPolygonToWkt,
  geometryPointFromWkt,
  geometryPolygonFromWkt,
} from "./helpers.js";

export { geometry } from "./postgis.js";
