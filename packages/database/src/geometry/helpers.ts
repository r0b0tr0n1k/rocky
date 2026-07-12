/**
 * Geometry Helpers - Helper functions for PostGIS geometry types
 *
 * These functions convert between typed coordinates and PostGIS WKT format
 * (SRID 4326 - WGS84 coordinate system for GPS data)
 */

const POINT_REGEX = /POINT\(([-\d.]+)\s+([-\d.]+)\)/;
// Accepts both POLYGON((x y, ...)) (standard PostGIS ring) and POLYGON(x y, ...).
const POLYGON_REGEX = /POLYGON\s*\(+\s*(.+?)\s*\)+\s*$/;

/**
 * Convert latitude/longitude to PostGIS Point WKT format
 * @param latitude - Latitude in degrees
 * @param longitude - Longitude in degrees
 * @returns PostGIS Point WKT string like "SRID=4326;POINT(longitude latitude)"
 */
export function geometryPointToWkt(
	latitude: number,
	longitude: number,
): string {
	return `SRID=4326;POINT(${longitude} ${latitude})`;
}

/**
 * Convert an array of coordinates to PostGIS Polygon WKT format
 * @param coordinates - Array of {latitude, longitude} points
 * @returns PostGIS Polygon WKT string like "SRID=4326;POLYGON((lng lat, lat, ...))"
 */
export function geometryPolygonToWkt(
	coordinates: Array<{ latitude: number; longitude: number }>,
): string {
	if (!coordinates || coordinates.length === 0) {
		throw new Error("Polygon requires at least one coordinate");
	}
	const coords = coordinates
		.map((p) => `${p.longitude} ${p.latitude}`)
		.join(", ");
	return `SRID=4326;POLYGON((${coords}))`;
}

/**
 * Parse PostGIS Point WKT to coordinates
 * @param wkt - PostGIS Point WKT string
 * @returns Object with latitude and longitude
 */
export function geometryPointFromWkt(
	wkt: string | null,
): { latitude: number; longitude: number } | null {
	if (!wkt) {
		return null;
	}
	const match = wkt.match(POINT_REGEX);
	if (!(match?.[1] && match?.[2])) {
		throw new Error(`Invalid geometry point format: ${wkt}`);
	}
	return {
		longitude: Number.parseFloat(match[1]),
		latitude: Number.parseFloat(match[2]),
	};
}

/**
 * Parse PostGIS Polygon WKT to coordinates
 * @param wkt - PostGIS Polygon WKT string
 * @returns Array of {latitude, longitude} points
 */
export function geometryPolygonFromWkt(
	wkt: string | null,
): Array<{ latitude: number; longitude: number }> | null {
	if (!wkt) {
		return null;
	}
	const match = wkt.match(POLYGON_REGEX);
	if (!match?.[1]) {
		throw new Error(`Invalid geometry polygon format: ${wkt}`);
	}
	const coords = match[1].split(", ").map((coord): {
		latitude: number;
		longitude: number;
	} => {
		// Strip any residual ring parentheses around an individual coordinate.
		const parts = coord.replace(/^\(+|\s*\)+$/g, "").trim().split(/\s+/);
		const longitude = Number(parts[0]);
		const latitude = Number(parts[1]);
		if (Number.isNaN(longitude) || Number.isNaN(latitude)) {
			throw new Error(`Invalid coordinate in polygon: ${coord}`);
		}
		return { latitude, longitude };
	});
	return coords;
}
