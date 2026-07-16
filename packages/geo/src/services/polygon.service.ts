// ── PolygonService ──
// The pure spatial engine (no DB, no network). It is the computational core the
// EUDR guillotine and the geo foundation (ADR-0053 / ADR-0054 R1 / ADR-0063) rely on:
//
//   - axis-order normalization (EPSG:4326 is lat-first per spec; GeoJSON + PostGIS
//     are lng-first — the "axis-order trap" called out in the verification report)
//   - geodesic polygon area in hectares (the >4 ha / <=4 ha classification boundary)
//   - haversine distance, point-in-polygon, radius containment
//   - geometry classification + validation per ADR-0054 R1
//
// Everything here is deterministic and unit-tested, so the guillotine has a
// sovereign, side-effect-free truth to lean on.

import { type Coordinate, geometryPolygonFromWkt, geometryPolygonToWkt, type PolygonGeometry } from "@rocky/database";
import { err, ok, type Result } from "@rocky/domains-shared";
import { GEO_ERRORS, GeoError } from "../errors/geo.errors.js";

/** Latitude/longitude pair (mirrors @rocky/database `Coordinate`). */
export type LatLng = Coordinate;
/** GeoJSON position: [longitude, latitude]. */
export type LngLat = [number, number];

/** Area class boundary from ADR-0054 R1: > 4 ha = closed polygon; <= 4 ha = point. */
export const POLYGON_AREA_THRESHOLD_HECTARES = 4;
/** Minimum decimal precision for a <=4 ha point representation (ADR-0054 R1). */
export const MIN_POINT_DECIMAL_PRECISION = 6;
const EARTH_RADIUS_METERS = 6_378_137; // WGS84 semi-major axis

/**
 * Normalize a {latitude, longitude} pair into a GeoJSON [lng, lat] position.
 * Guards the axis-order trap explicitly.
 */
export function toPosition(coord: LatLng): LngLat {
	return [coord.longitude, coord.latitude];
}

/** Inverse of {@link toPosition}. */
export function toLatLng(pos: LngLat): LatLng {
	return { longitude: pos[0], latitude: pos[1] };
}

/** True when a number carries at least `decimals` decimal places. */
export function decimalPrecision(value: number): number {
	const s = Math.abs(value).toString();
	const dot = s.indexOf(".");
	return dot === -1 ? 0 : s.length - dot - 1;
}

/**
 * Geodesic polygon area in hectares using the spherical-polygon formula
 * (sum of (λ₂−λ₁)(2 + sinφ₁ + sinφ₂) · R²/2). Accurate to ~0.5% at pasture
 * scales — ample for the >4 ha classification (ADR-0054 R1). Rings are
 * auto-closed; the first/last vertex need not repeat.
 */
export function polygonAreaHectares(vertices: LatLng[]): number {
	if (vertices.length < 3) return 0;
	const pts: Array<[number, number]> = vertices.map((v) => [toRadians(v.longitude), toRadians(v.latitude)]);
	let total = 0;
	for (let i = 0; i < pts.length; i++) {
		const a = pts[i]!;
		const b = pts[(i + 1) % pts.length]!;
		total += (b[0] - a[0]) * (2 + Math.sin(a[1]) + Math.sin(b[1]));
	}
	const areaSqMeters = Math.abs(total * EARTH_RADIUS_METERS * EARTH_RADIUS_METERS) / 2;
	return areaSqMeters / 10_000;
}

/** Great-circle distance between two [lng, lat] positions, in meters. */
export function haversineDistanceMeters(a: LngLat, b: LngLat): number {
	const dLat = toRadians(b[1] - a[1]);
	const dLon = toRadians(b[0] - a[0]);
	const lat1 = toRadians(a[1]);
	const lat2 = toRadians(b[1]);
	const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
	return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Ray-casting point-in-polygon test. `polygon` is an open or closed ring of [lng, lat]. */
export function pointInPolygon(point: LngLat, polygon: LngLat[]): boolean {
	if (polygon.length < 3) return false;
	const [x, y] = point;
	let inside = false;
	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const [xi, yi] = polygon[i]!;
		const [xj, yj] = polygon[j]!;
		const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
		if (intersects) inside = !inside;
	}
	return inside;
}

/** True when `point` is within `radiusMeters` of `center` (haversine). */
export function isWithinRadius(center: LngLat, point: LngLat, radiusMeters: number): boolean {
	return haversineDistanceMeters(center, point) <= radiusMeters;
}

/** Centroid (mean of vertices) as [lng, lat] — good enough for map centering / sampling. */
export function polygonCentroid(vertices: LatLng[]): LngLat {
	if (vertices.length === 0) {
		throw new GeoError(GEO_ERRORS.INVALID_GEOMETRY, { reason: "empty_ring" });
	}
	let lng = 0;
	let lat = 0;
	for (const v of vertices) {
		lng += v.longitude;
		lat += v.latitude;
	}
	return [lng / vertices.length, lat / vertices.length];
}

export type GeometryClassification =
	| { kind: "polygon"; areaHectares: number; requiredPrecision: null }
	| { kind: "point"; areaHectares: number; requiredPrecision: number };

/**
 * ADR-0054 R1 classification: > 4 ha MUST be a closed polygon; <= 4 ha MAY be a
 * point with >= 6 decimal precision. For a circle we derive the area from π·r².
 */
export function classifyGeometry(
	geometry: PolygonGeometry | { type: "circle"; radiusMeters: number },
): GeometryClassification {
	const areaHectares =
		geometry.type === "circle"
			? (Math.PI * geometry.radiusMeters * geometry.radiusMeters) / 10_000
			: polygonAreaHectares(geometry.vertices);
	if (areaHectares > POLYGON_AREA_THRESHOLD_HECTARES) {
		return { kind: "polygon", areaHectares, requiredPrecision: null };
	}
	return { kind: "point", areaHectares, requiredPrecision: MIN_POINT_DECIMAL_PRECISION };
}

/**
 * Validate + normalize a polygon ring (>= 3 vertices, in-range lat/lng, auto-closed).
 * Returns the normalized, closed ring of {latitude, longitude}.
 */
export function validatePolygon(vertices: LatLng[]): Result<LatLng[], GeoError> {
	if (vertices.length < 3) {
		return err(
			new GeoError(GEO_ERRORS.INVALID_GEOMETRY, {
				reason: "min_3_vertices",
				count: vertices.length,
			}),
		);
	}
	for (const v of vertices) {
		if (v.latitude < -90 || v.latitude > 90 || v.longitude < -180 || v.longitude > 180) {
			return err(new GeoError(GEO_ERRORS.AXIS_ORDER, { reason: "out_of_range", vertex: v }));
		}
	}
	const closed = vertices.slice();
	const first = closed[0]!;
	const last = closed[closed.length - 1]!;
	if (first.latitude !== last.latitude || first.longitude !== last.longitude) {
		closed.push(first);
	}
	return ok(closed);
}

/** Build a PostGIS WKT polygon string from vertices (SRID 4326). */
export function toWktPolygon(vertices: LatLng[]): Result<string, GeoError> {
	const validated = validatePolygon(vertices);
	if (validated.isErr()) return err(validated.error);
	try {
		return ok(geometryPolygonToWkt(validated.value));
	} catch (e) {
		return err(new GeoError(GEO_ERRORS.INVALID_GEOMETRY, { reason: String(e) }));
	}
}

/** Parse a PostGIS WKT polygon string back into {latitude, longitude} vertices (open ring). */
export function fromWktPolygon(wkt: string | null): Result<LatLng[], GeoError> {
	if (!wkt) return err(new GeoError(GEO_ERRORS.INVALID_GEOMETRY, { reason: "empty_wkt" }));
	try {
		const parsed = geometryPolygonFromWkt(wkt);
		if (!parsed) {
			return err(new GeoError(GEO_ERRORS.INVALID_GEOMETRY, { reason: "unparseable_wkt" }));
		}
		return ok(parsed);
	} catch (e) {
		return err(new GeoError(GEO_ERRORS.INVALID_GEOMETRY, { reason: String(e) }));
	}
}

/**
 * Generate a geodesic circle ring (LatLng[]) centered at `center` with the
 * given `radiusMeters`, approximated by `segments` vertices. Used to derive
 * circular disease-zone geofences (protection/surveillance) centered on the
 * nearest settlement (ADR-0080). Ring is open — validatePolygon auto-closes.
 */
export function geodesicCircle(center: LatLng, radiusMeters: number, segments = 64): LatLng[] {
	const R = EARTH_RADIUS_METERS;
	const lat1 = toRadians(center.latitude);
	const lng1 = toRadians(center.longitude);
	const d = radiusMeters / R;
	const ring: LatLng[] = [];
	for (let i = 0; i < segments; i++) {
		const theta = (2 * Math.PI * i) / segments;
		const lat = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(theta));
		const lng =
			lng1 + Math.atan2(Math.sin(theta) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat));
		ring.push({ latitude: toDegrees(lat), longitude: toDegrees(lng) });
	}
	return ring;
}

function toRadians(deg: number): number {
	return (deg * Math.PI) / 180;
}

function toDegrees(rad: number): number {
	return (rad * 180) / Math.PI;
}

// Capture the pure functions so the injectable class below can delegate to them
// without its method names (toPosition, polygonAreaHectares, ...) shadowing and
// recursing into themselves.
const PolygonFns = {
	toPosition,
	toLatLng,
	decimalPrecision,
	polygonAreaHectares,
	haversineDistanceMeters,
	pointInPolygon,
	isWithinRadius,
	polygonCentroid,
	classifyGeometry,
	validatePolygon,
	toWktPolygon,
	fromWktPolygon,
	geodesicCircle,
};

/**
 * Injectable facade over the pure spatial-engine functions above. Stateless:
 * constructed with no dependencies, so it can be provided at the composition
 * root (app.module.ts) and injected wherever the EUDR guillotine / geo
 * foundation needs deterministic geometry truth.
 */
export class PolygonService {
	toPosition(coord: LatLng): LngLat {
		return PolygonFns.toPosition(coord);
	}
	toLatLng(pos: LngLat): LatLng {
		return PolygonFns.toLatLng(pos);
	}
	decimalPrecision(value: number): number {
		return PolygonFns.decimalPrecision(value);
	}
	polygonAreaHectares(vertices: LatLng[]): number {
		return PolygonFns.polygonAreaHectares(vertices);
	}
	haversineDistanceMeters(a: LngLat, b: LngLat): number {
		return PolygonFns.haversineDistanceMeters(a, b);
	}
	pointInPolygon(point: LngLat, polygon: LngLat[]): boolean {
		return PolygonFns.pointInPolygon(point, polygon);
	}
	isWithinRadius(center: LngLat, point: LngLat, radiusMeters: number): boolean {
		return PolygonFns.isWithinRadius(center, point, radiusMeters);
	}
	polygonCentroid(vertices: LatLng[]): LngLat {
		return PolygonFns.polygonCentroid(vertices);
	}
	classifyGeometry(geometry: PolygonGeometry | { type: "circle"; radiusMeters: number }): GeometryClassification {
		return PolygonFns.classifyGeometry(geometry);
	}
	validatePolygon(vertices: LatLng[]): Result<LatLng[], GeoError> {
		return PolygonFns.validatePolygon(vertices);
	}
	toWktPolygon(vertices: LatLng[]): Result<string, GeoError> {
		return PolygonFns.toWktPolygon(vertices);
	}
	fromWktPolygon(wkt: string | null): Result<LatLng[], GeoError> {
		return PolygonFns.fromWktPolygon(wkt);
	}
	geodesicCircle(center: LatLng, radiusMeters: number, segments?: number): LatLng[] {
		return PolygonFns.geodesicCircle(center, radiusMeters, segments);
	}
}
