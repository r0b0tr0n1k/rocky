export const GEO_ERRORS = {
	NOT_FOUND: "GEO_NOT_FOUND",
	GEOFENCE_NOT_FOUND: "GEO_GEOFENCE_NOT_FOUND",
	GEOFENCE_EVENT_NOT_FOUND: "GEO_GEOFENCE_EVENT_NOT_FOUND",
	INVALID_INPUT: "GEO_INVALID_INPUT",
	FORBIDDEN: "GEO_FORBIDDEN",
	// Spatial-engine / geometry validation
	INVALID_GEOMETRY: "GEO_INVALID_GEOMETRY",
	AXIS_ORDER: "GEO_AXIS_ORDER",
	// External map provider (MapTiler Cloud, or a future self-hosted server)
	MAP_PROVIDER_ERROR: "GEO_MAP_PROVIDER_ERROR",
	MAP_PROVIDER_UNCONFIGURED: "GEO_MAP_PROVIDER_UNCONFIGURED",
} as const;

export type GeoErrorCode = (typeof GEO_ERRORS)[keyof typeof GEO_ERRORS];

export class GeoError extends Error {
	constructor(
		public readonly code: GeoErrorCode,
		public readonly context?: Record<string, unknown>,
	) {
		super(code);
		this.name = "GeoError";
	}
}

// External map-provider failure (network, API key, upstream 4xx/5xx).
// Distinct from GeoError so callers can branch on "our bug" vs "their outage".
export class MapProviderError extends Error {
	constructor(public readonly context?: Record<string, unknown>) {
		super(GEO_ERRORS.MAP_PROVIDER_ERROR);
		this.name = "MapProviderError";
	}
}
