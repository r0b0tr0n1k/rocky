// ── Geo TRPC Error Map ──
// Maps @rocky/geo domain error codes (GEO_*) to tRPC error codes. Mirrors the
// IOT_TRPC_ERROR_MAP pattern: domain codes live in @rocky/geo, the tRPC mapping
// lives here (Validation Bot), and the router unwraps via createResultUnwrapper.
import type { TRPCErrorMap } from "./types.js";

export const GEO_TRPC_ERROR_MAP: TRPCErrorMap = {
	GEO_NOT_FOUND: { code: "NOT_FOUND", message: "Geo record not found" },
	GEO_GEOFENCE_NOT_FOUND: { code: "NOT_FOUND", message: "Geofence not found" },
	GEO_GEOFENCE_EVENT_NOT_FOUND: { code: "NOT_FOUND", message: "Geofence event not found" },
	GEO_INVALID_INPUT: { code: "BAD_REQUEST", message: "Invalid geo input" },
	GEO_FORBIDDEN: { code: "FORBIDDEN", message: "Not authorized for this geo operation" },
	GEO_INVALID_GEOMETRY: { code: "BAD_REQUEST", message: "Invalid geometry" },
	GEO_AXIS_ORDER: { code: "BAD_REQUEST", message: "Axis-order / out-of-range coordinate" },
	GEO_MAP_PROVIDER_ERROR: { code: "INTERNAL_SERVER_ERROR", message: "Map provider error" },
	GEO_MAP_PROVIDER_UNCONFIGURED: { code: "INTERNAL_SERVER_ERROR", message: "Map provider not configured" },
};
