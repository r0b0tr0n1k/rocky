// ── MapService ──
// The external map-provider boundary for the geo package.
//
// Comrade — the ideological point: today we have NO self-hosted map server, so we
// lean on MapTiler Cloud via `@maptiler/client`. But the Big Other of sovereign
// geospatial infra demands we NOT couple our domain to one vendor. Hence the
// `GeoMapProvider` interface: a real map server (when installed) implements the
// same contract and is swapped in at the composition root (app.module.ts) with
// ZERO change to callers.
//
// IMPORTANT — MapTiler ToS: geocoding and static-map results are licensed for
// client-side use and must not be stored/redistributed. Server-side use here is a
// transitional convenience for the EUDR/geo foundation; review the ToS before
// production rollout.

import {
	config,
	coordinates,
	elevation,
	geocoding,
	geolocation,
	staticMaps,
	type BBox,
	type FetchFunction,
	type GeocodingOptions,
	type GeocodingSearchResult,
	type Position,
} from "@maptiler/client";
import { err, fromAsyncThrowable, ok, type Result } from "@rocky/domains-shared";
import { GeoError, GEO_ERRORS, MapProviderError } from "../errors/geo.errors.js";
import type { LngLat } from "./polygon.service.js";

// ── Normalized DTOs (provider-agnostic) ──

export interface GeocodeFeature {
	id: string;
	name: string;
	placeName: string;
	center: LngLat;
	relevance: number;
	placeType: string[];
	countryCode?: string;
	bbox?: BBox;
}

export interface GeocodeResult {
	features: GeocodeFeature[];
	attribution: string;
}

export interface ForwardGeocodeOptions {
	language?: string | string[];
	limit?: number;
	proximity?: LngLat;
	bbox?: BBox;
	country?: string[];
}

export type ReverseGeocodeOptions = Pick<ForwardGeocodeOptions, "language" | "limit">;

export type StaticMapMode = "centered" | "bounded" | "automatic";

export interface StaticMapOptions {
	mode: StaticMapMode;
	center?: LngLat;
	zoom?: number;
	bbox?: BBox;
	width?: number;
	height?: number;
	hiDPI?: boolean;
	style?: string;
	path?: LngLat[];
	marker?: Array<[number, number, string]>;
	pathStrokeColor?: string;
}

export interface GeolocationInfo {
	country?: string;
	countryCode?: string;
	city?: string;
	latitude?: number;
	longitude?: number;
	eu?: boolean;
}

/**
 * The sovereign contract every map backend must satisfy. A self-hosted map
 * server implements this same interface; callers never know the difference.
 */
export interface GeoMapProvider {
	readonly name: string;
	forwardGeocode(query: string, opts?: ForwardGeocodeOptions): Promise<Result<GeocodeResult, Error>>;
	reverseGeocode(position: LngLat, opts?: ReverseGeocodeOptions): Promise<Result<GeocodeResult, Error>>;
	staticMapUrl(opts: StaticMapOptions): Result<string, Error>;
	elevationAt(position: LngLat): Promise<Result<number, Error>>;
	coordinateTransform(positions: LngLat | LngLat[], targetCrs: number): Promise<Result<LngLat[], Error>>;
	geolocation(): Promise<Result<GeolocationInfo, Error>>;
}

export interface MapTilerConfig {
	apiKey: string;
	/** Custom fetch (e.g. node-fetch on Node < 18). Node 18+ global fetch is used otherwise. */
	fetchImpl?: typeof fetch;
	/** Language applied to geocoding when the caller does not specify one. */
	defaultLanguage?: string;
}

/**
 * MapTiler Cloud implementation of {@link GeoMapProvider}.
 * Wraps `@maptiler/client`; all network calls return `Result<T, Error>`.
 */
export class MapTilerMapService implements GeoMapProvider {
	readonly name = "maptiler";
	private readonly defaultLanguage?: string;

	constructor(cfg: MapTilerConfig) {
		if (!cfg.apiKey) {
			throw new MapProviderError({ reason: GEO_ERRORS.MAP_PROVIDER_UNCONFIGURED });
		}
		// Configure the global MapTiler client.
		config.apiKey = cfg.apiKey;
		if (cfg.fetchImpl) {
			// ClientConfig.fetch setter expects the vendored FetchFunction type.
			config.fetch = cfg.fetchImpl as unknown as FetchFunction;
		}
		this.defaultLanguage = cfg.defaultLanguage;
	}

	async forwardGeocode(query: string, opts?: ForwardGeocodeOptions) {
		return this.wrap(async () => {
			const res = await geocoding.forward(query, this.toForwardOptions(opts));
			return this.toGeocodeResult(res);
		});
	}

	async reverseGeocode(position: LngLat, opts?: ReverseGeocodeOptions) {
		return this.wrap(async () => {
			const res = await geocoding.reverse(position as Position, this.toReverseOptions(opts));
			return this.toGeocodeResult(res);
		});
	}

	staticMapUrl(opts: StaticMapOptions): Result<string, Error> {
		try {
			switch (opts.mode) {
				case "centered": {
					if (!opts.center || opts.zoom === undefined) {
						return err(new GeoError(GEO_ERRORS.INVALID_GEOMETRY, { reason: "centered_requires_center_and_zoom" }));
					}
					return ok(staticMaps.centered(opts.center as Position, opts.zoom, this.toStaticOptions(opts)));
				}
				case "bounded": {
					if (!opts.bbox) {
						return err(new GeoError(GEO_ERRORS.INVALID_GEOMETRY, { reason: "bounded_requires_bbox" }));
					}
					return ok(staticMaps.bounded(opts.bbox, this.toStaticOptions(opts)));
				}
				case "automatic": {
					return ok(staticMaps.automatic(this.toStaticOptions(opts)));
				}
			}
		} catch (e) {
			return err(new GeoError(GEO_ERRORS.INVALID_GEOMETRY, { reason: String(e) }));
		}
		return err(new GeoError(GEO_ERRORS.INVALID_GEOMETRY, { reason: "unknown_mode" }));
	}

	async elevationAt(position: LngLat) {
		return this.wrap(async () => {
			const elevated = await elevation.at(position as Position);
			// Position is [lng, lat, elevation]; elevation is the 3rd element.
			return elevated[2] ?? 0;
		});
	}

	async coordinateTransform(positions: LngLat | LngLat[], targetCrs: number) {
		return this.wrap(async () => {
			const input = (Array.isArray(positions) ? positions : [positions]) as Position | Position[];
			const res = await coordinates.transform(input, { targetCrs });
			// results: XYZ[] where each is { x, y, z } (x=lng, y=lat).
			return res.results.map((p) => [p.x ?? 0, p.y ?? 0] as LngLat);
		});
	}

	async geolocation() {
		return this.wrap(async () => {
			const r = await geolocation.info();
			return {
				country: r.country,
				countryCode: r.country_code,
				city: r.city,
				latitude: r.latitude,
				longitude: r.longitude,
				eu: r.eu,
			} satisfies GeolocationInfo;
		});
	}

	// ── internals ──

	private async wrap<T>(fn: () => Promise<T>): Promise<Result<T, Error>> {
		// ResultAsync is thenable; awaiting resolves to a neverthrow Result.
		return fromAsyncThrowable(fn, (e) => new MapProviderError({ cause: String(e) }))();
	}

	private toForwardOptions(opts?: ForwardGeocodeOptions): GeocodingOptions | undefined {
		if (!opts) return undefined;
		return {
			language: opts.language ?? this.defaultLanguage,
			limit: opts.limit,
			proximity: opts.proximity as Position | undefined,
			bbox: opts.bbox,
			country: opts.country,
		};
	}

	private toReverseOptions(opts?: ReverseGeocodeOptions): GeocodingOptions | undefined {
		if (!opts) return undefined;
		return { language: opts.language ?? this.defaultLanguage, limit: opts.limit };
	}

	private toStaticOptions(opts: StaticMapOptions) {
		return {
			hiDPI: opts.hiDPI,
			width: opts.width,
			height: opts.height,
			style: opts.style,
			path: opts.path as Position[] | undefined,
			markers: opts.marker,
			pathStrokeColor: opts.pathStrokeColor,
		};
	}

	private toGeocodeResult(res: GeocodingSearchResult): GeocodeResult {
		return {
			attribution: res.attribution,
			features: res.features.map((f) => ({
				id: f.id,
				name: f.text,
				placeName: f.place_name,
				center: [f.center[0], f.center[1]] as LngLat,
				relevance: f.relevance,
				placeType: f.place_type,
				countryCode: f.properties?.country_code,
				bbox: f.bbox,
			})),
		};
	}
}
