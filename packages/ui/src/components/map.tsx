"use client";

// GeoMapView - shared, presentational interactive map for the admin + (later) mobile web.
//
// Rendering is MapLibre GL (browser). The map *style URL* (with the MapTiler key)
// is supplied by the caller - we never hard-code a provider. Polygon geofences are
// drawn from a GeoJSON FeatureCollection; the caller transforms domain geofences
// into that shape. See apps/web/app/(admin)/geo for the wiring.
//
// MapLibre is imported dynamically inside the effect so the module is never evaluated
// during Next.js SSR (maplibre-gl touches `window` at import time). The runtime module
// is kept in `mlRef`; `MaplibreGl` (type-only) is used solely for typings.

import * as React from "react";
import type MaplibreGl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export type GeoMapFeatureKind =
	| "geofence"
	| "disease_zone"
	| "deforested"
	| "compliant"
	| (string & {});

export interface GeoMapFeature {
	id: string;
	/** GeoJSON Polygon, or raw coordinate rings: [[ [lng,lat], ... ]]. */
	geometry: unknown;
	kind?: GeoMapFeatureKind;
	properties?: Record<string, unknown>;
}

export interface GeoMapMarker {
	id?: string;
	longitude: number;
	latitude: number;
	label?: string;
	color?: string;
}

/** A drawn polygon vertex, lat-first (EPSG:4326), matching createGeofence input. */
export interface GeoMapVertex {
	latitude: number;
	longitude: number;
}

export interface GeoMapViewProps {
	/** MapTiler style URL (with key) or any MapLibre style URL. */
	styleUrl: string;
	initialViewState?: { longitude: number; latitude: number; zoom: number };
	features?: GeoMapFeature[];
	markers?: GeoMapMarker[];
	fitToFeatures?: boolean;
	onFeatureClick?: (id: string) => void;
	/** Enable click-to-draw polygon mode. */
	drawMode?: boolean;
	/** Called with the finished polygon (>= 3 vertices, lat-first) on double-click. */
	onPolygonDrawn?: (vertices: GeoMapVertex[]) => void;
	className?: string;
	height?: number | string;
}

const KIND_COLORS = {
	geofence: "#2563eb",
	disease_zone: "#dc2626",
	deforested: "#b91c1c",
	compliant: "#16a34a",
} as const;

type FeatureCollection = {
	type: string;
	features: Array<{
		type: string;
		id: string;
		properties: Record<string, unknown>;
		geometry: { type: string; coordinates: number[][][] };
	}>;
};

function wktPolygonToRings(wkt: string): number[][][] | null {
	// PostGIS default output: "SRID=4326;POLYGON((lng lat, lng lat, ...))"
	const s = wkt.trim().replace(/^SRID=\d+;/i, "");
	const m = s.match(/POLYGON\s*\(+.*\)+\s*$/is);
	if (!m) return null;
	const inner = m[0].replace(/^POLYGON\s*\(+/i, "").replace(/\s*\)+\s*$/, "");
	const ringStrs = inner.match(/\([^()]*\)/g) ?? [inner];
	const rings = ringStrs
		.map((r) => r.replace(/^\(+|\s*\)+$/g, ""))
		.map((r) =>
			r
				.split(/,\s*/)
				.map((pair) => pair.trim().split(/\s+/).map(Number)),
		)
		.filter(
			(ring) =>
				ring.length >= 3 &&
				ring.every((c) => c.length === 2 && c.every((n) => Number.isFinite(n))),
		);
	return rings.length ? rings : null;
}

function toPolygonCoordinates(geometry: unknown): number[][][] | null {
	// PostGIS WKT string: "SRID=4326;POLYGON((lng lat, ...))"
	if (typeof geometry === "string") {
		return wktPolygonToRings(geometry);
	}
	// GeoJSON Polygon
	if (
		geometry &&
		typeof geometry === "object" &&
		(geometry as { type?: string }).type === "Polygon" &&
		Array.isArray((geometry as { coordinates?: unknown }).coordinates)
	) {
		return (geometry as { coordinates: number[][][] }).coordinates;
	}
	// Raw coordinates (rings)
	if (Array.isArray(geometry)) {
		const arr = geometry as unknown[];
		if (arr.length > 0 && Array.isArray(arr[0])) {
			if (Array.isArray((arr[0] as unknown[])[0])) {
				// [[[lng,lat], ...]] -> rings
				return arr as number[][][];
			}
			if (typeof (arr[0] as unknown[])[0] === "number") {
				// [[lng,lat], ...] -> single ring
				return [arr as number[][]];
			}
		}
	}
	return null;
}

function featureToGeoJSON(features: GeoMapFeature[]): FeatureCollection {
	return {
		type: "FeatureCollection",
		features: features
			.map((f) => {
				const coords = toPolygonCoordinates(f.geometry);
				if (!coords) return null;
				return {
					type: "Feature",
					id: f.id,
					properties: { kind: f.kind ?? "geofence", ...(f.properties ?? {}) },
					geometry: { type: "Polygon", coordinates: coords },
				};
			})
			.filter((x): x is NonNullable<typeof x> => x !== null),
	};
}

export function colorFor(kind: unknown): string {
	const key = String(kind ?? "geofence");
	return (KIND_COLORS as Record<string, string>)[key] ?? KIND_COLORS.geofence;
}

export const GeoMapView = React.forwardRef<HTMLDivElement, GeoMapViewProps>(function GeoMapView(
	{
		styleUrl,
		initialViewState,
		features = [],
		markers = [],
		fitToFeatures = false,
		onFeatureClick,
		drawMode = false,
		onPolygonDrawn,
		className,
		height = 480,
	},
	ref,
) {
	const containerRef = React.useRef<HTMLDivElement | null>(null);
	const mapRef = React.useRef<MaplibreGl.Map | null>(null);
	const mlRef = React.useRef<typeof MaplibreGl | null>(null);
	const drawModeRef = React.useRef(drawMode);
	const onPolygonDrawnRef = React.useRef(onPolygonDrawn);
	const [ready, setReady] = React.useState(false);
	const [webglError, setWebglError] = React.useState<string | null>(null);
	const [mapError, setMapError] = React.useState<string | null>(null);
	const [drawPts, setDrawPts] = React.useState<[number, number][]>([]);
	const fellBackRef = React.useRef(false);
	const errorSetRef = React.useRef(false);

	// Keep mutable refs current so map event handlers read fresh values.
	drawModeRef.current = drawMode;
	onPolygonDrawnRef.current = onPolygonDrawn;

	// Clear the in-progress drawing when draw mode is switched off.
	React.useEffect(() => {
		if (!drawMode) setDrawPts([]);
	}, [drawMode]);

	// Init the map once (per style URL). MapLibre is imported dynamically.
	React.useEffect(() => {
		let cancelled = false;
		let map: MaplibreGl.Map | null = null;

		(async () => {
			const maplibregl = (await import("maplibre-gl")).default;
			if (cancelled || !containerRef.current) return;
			mlRef.current = maplibregl;
			try {
				map = new maplibregl.Map({
					container: containerRef.current,
					style: styleUrl,
					center: initialViewState ? [initialViewState.longitude, initialViewState.latitude] : [0, 20],
					zoom: initialViewState?.zoom ?? 1.5,
					attributionControl: { compact: true },
				});
			} catch (err) {
				if (!cancelled) setWebglError(err instanceof Error ? err.message : String(err));
				return;
			}
			map.addControl(new maplibregl.NavigationControl(), "top-right");
			map.on("load", () => {
				if (!cancelled) setReady(true);
			});
			map.on("error", (e) => {
				if (cancelled) return;
				const msg = (e as { error?: { message?: string } }).error?.message ?? String(e);
				// Base style failed to load (offline / no MapTiler egress). Fall back once
				// to a blank canvas so geofence drawing + features still work, and surface a notice.
				if (map && !map.isStyleLoaded() && !fellBackRef.current) {
					fellBackRef.current = true;
					try {
						map.setStyle({
							version: 8,
							sources: {},
							layers: [{ id: "bg", type: "background", paint: { "background-color": "#0b1f33" } }],
						});
						errorSetRef.current = true;
						setMapError("Map base style unavailable (no MapTiler egress) - shown without base tiles.");
						return;
					} catch {
						/* fall through to generic error */
					}
				}
				if (errorSetRef.current) return;
				errorSetRef.current = true;
				setMapError(msg);
			});
			mapRef.current = map;
		})();

		return () => {
			cancelled = true;
			map?.remove();
			mapRef.current = null;
			mlRef.current = null;
			setReady(false);
			setWebglError(null);
			setMapError(null);
			fellBackRef.current = false;
			errorSetRef.current = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [styleUrl]);

	// Add / update polygon features.
	React.useEffect(() => {
		const map = mapRef.current;
		const maplibregl = mlRef.current;
		if (!map || !maplibregl || !ready) return;
		const sourceId = "geo-features";
		const fc = featureToGeoJSON(features);

		if (map.getSource(sourceId)) {
			(map.getSource(sourceId) as MaplibreGl.GeoJSONSource).setData(fc as unknown as GeoJSON.FeatureCollection);
		} else {
			map.addSource(sourceId, { type: "geojson", data: fc as unknown as GeoJSON.FeatureCollection });
			map.addLayer({
				id: "geo-fill",
				type: "fill",
				source: sourceId,
				paint: {
					"fill-color": [
						"match",
						["get", "kind"],
						"disease_zone",
						KIND_COLORS.disease_zone,
						"deforested",
						KIND_COLORS.deforested,
						"compliant",
						KIND_COLORS.compliant,
						KIND_COLORS.geofence,
					],
					"fill-opacity": 0.3,
				},
			});
			map.addLayer({
				id: "geo-outline",
				type: "line",
				source: sourceId,
				paint: {
					"line-color": [
						"match",
						["get", "kind"],
						"disease_zone",
						KIND_COLORS.disease_zone,
						"deforested",
						KIND_COLORS.deforested,
						"compliant",
						KIND_COLORS.compliant,
						KIND_COLORS.geofence,
					],
					"line-width": 2,
				},
			});
		}

		if (fitToFeatures && fc.features.length > 0) {
			try {
				const bounds = new maplibregl.LngLatBounds();
				fc.features.forEach((f) => {
					f.geometry.coordinates.forEach((ring) => {
						ring.forEach(([lng, lat]) => {
							if (typeof lng === "number" && typeof lat === "number") bounds.extend([lng, lat]);
						});
					});
				});
				if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 60, maxZoom: 14 });
			} catch {
				/* bounds computation is best-effort */
			}
		}
	}, [features, ready, fitToFeatures]);

	// Feature selection (suppressed while drawing).
	React.useEffect(() => {
		const map = mapRef.current;
		if (!map || !ready || !onFeatureClick) return;
		const handler = (e: MaplibreGl.MapLayerMouseEvent) => {
			if (drawModeRef.current) return;
			const f = e.features?.[0];
			if (f && f.id != null) onFeatureClick(String(f.id));
		};
		map.on("click", "geo-fill", handler);
		return () => {
			map.off("click", "geo-fill", handler);
		};
	}, [ready, onFeatureClick]);

	// Draw mode: click adds a vertex, double-click finishes.
	React.useEffect(() => {
		const map = mapRef.current;
		if (!map || !ready) return;
		const clickHandler = (e: MaplibreGl.MapMouseEvent) => {
			if (!drawModeRef.current) return;
			setDrawPts((pts) => [...pts, [e.lngLat.lng, e.lngLat.lat]]);
		};
		const dblHandler = (e: MaplibreGl.MapMouseEvent) => {
			if (!drawModeRef.current) return;
			e.preventDefault();
			setDrawPts((pts) => {
				if (pts.length >= 3) {
					onPolygonDrawnRef.current?.(
						pts.map(([lng, lat]) => ({ latitude: lat, longitude: lng })),
					);
				}
				return [];
			});
		};
		map.on("click", clickHandler);
		map.on("dblclick", dblHandler);
		return () => {
			map.off("click", clickHandler);
			map.off("dblclick", dblHandler);
		};
	}, [ready]);

	// Draw preview (in-progress polygon) + vertex markers.
	React.useEffect(() => {
		const map = mapRef.current;
		const maplibregl = mlRef.current;
		if (!map || !maplibregl || !ready) return;
		const srcId = "draw-preview";

		if (drawPts.length === 0) {
			if (map.getSource(srcId)) {
				map.removeLayer("draw-preview-fill");
				map.removeLayer("draw-preview-line");
				map.removeSource(srcId);
			}
			return;
		}

		const ring = drawPts.map(([lng, lat]) => [lng, lat]);
		const closed = ring.concat([ring[0]!]);
		const data: FeatureCollection = {
			type: "FeatureCollection",
			features: [{ type: "Feature", id: "draft", properties: {}, geometry: { type: "Polygon", coordinates: [closed] } }],
		};

		if (map.getSource(srcId)) {
			(map.getSource(srcId) as MaplibreGl.GeoJSONSource).setData(data as unknown as GeoJSON.FeatureCollection);
		} else {
			map.addSource(srcId, { type: "geojson", data: data as unknown as GeoJSON.FeatureCollection });
			map.addLayer({
				id: "draw-preview-fill",
				type: "fill",
				source: srcId,
				paint: { "fill-color": "#0ea5e9", "fill-opacity": 0.2 },
			});
			map.addLayer({
				id: "draw-preview-line",
				type: "line",
				source: srcId,
				paint: { "line-color": "#0ea5e9", "line-width": 2, "line-dasharray": [2, 2] },
			});
		}
	}, [drawPts, ready]);

	React.useEffect(() => {
		const map = mapRef.current;
		const maplibregl = mlRef.current;
		if (!map || !maplibregl || !ready) return;
		const added: MaplibreGl.Marker[] = [];
		drawPts.forEach(([lng, lat]) => {
			const el = document.createElement("div");
			el.style.cssText = "width:10px;height:10px;border-radius:9999px;background:#0ea5e9;border:2px solid #fff;";
			added.push(new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map));
		});
		return () => added.forEach((m) => m.remove());
	}, [drawPts, ready]);

	// Markers.
	React.useEffect(() => {
		const map = mapRef.current;
		const maplibregl = mlRef.current;
		if (!map || !maplibregl || !ready) return;
		const added: MaplibreGl.Marker[] = [];
		markers.forEach((m) => {
			const el = document.createElement("div");
			el.style.width = "14px";
			el.style.height = "14px";
			el.style.borderRadius = "9999px";
			el.style.background = m.color ?? "#0ea5e9";
			el.style.border = "2px solid #fff";
			el.style.boxShadow = "0 0 0 1px rgba(0,0,0,0.3)";
			const marker = new maplibregl.Marker({ element: el }).setLngLat([m.longitude, m.latitude]).addTo(map);
			if (m.label) marker.setPopup(new maplibregl.Popup({ offset: 12 }).setText(m.label));
			added.push(marker);
		});
		return () => added.forEach((mk) => mk.remove());
	}, [markers, ready]);

	return (
		<div
			className={className}
			style={{ position: "relative", height, width: "100%", borderRadius: 12, overflow: "hidden" }}
		>
			<div
				ref={(node) => {
					containerRef.current = node;
					if (typeof ref === "function") ref(node);
					else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
				}}
				style={{ height: "100%", width: "100%" }}
			/>
			{webglError || mapError ? (
				<div
					role="alert"
					style={{
						position: "absolute",
						inset: 0,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						gap: 8,
						padding: 24,
						textAlign: "center",
						background: "rgba(15,23,42,0.04)",
						color: "#475569",
					}}
				>
					<strong>Map unavailable</strong>
					<span style={{ fontSize: 13 }}>{webglError ?? mapError}</span>
				</div>
			) : null}
		</div>
	);
});
