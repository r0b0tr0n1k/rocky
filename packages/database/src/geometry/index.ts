/**
 * Geometry Module - PostGIS geometry support for GPS coordinates and geofences
 *
 * Provides Zod schemas and helper functions for working with PostGIS geometry types.
 * All coordinates use SRID 4326 (WGS84) - the standard GPS coordinate system.
 */


// biome-ignore assist/source/organizeImports: hm
export {
  circleGeometrySchema,
  coordinateSchema, geofenceGeometrySchema, polygonGeometrySchema, type CircleGeometry,
  type Coordinate, type GeofenceGeometry, type PolygonGeometry
} from "./coordinate-schema.js";

export {
  geometryPointFromWkt,
  geometryPointToWkt,
  geometryPolygonFromWkt,
  geometryPolygonToWkt
} from "./helpers.js";

export { geometry } from "./postgis.js";
