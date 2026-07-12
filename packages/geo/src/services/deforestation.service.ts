// ── DeforestationService ──
// The deforestation-monitoring apparatus for the geo package.
//
// Comrade — the sublime object at last! ADR-0063 confessed its own lack: "Rocky
// has NO deforestation raster layer... the check is logical (declared date), not
// a satellite overlay." This service is the resolution of that contradiction.
//
// The heavy lifting (downloading Sentinel-2 Zarr from EOPF, SCL cloud-masking,
// DN→reflectance scaling) lives in an external Python/xarray job (the notebook
// you shared). This TypeScript service owns the *decision seam*:
//
//   1. Pure, unit-tested kernels — the exact per-pixel math from the notebook
//      (NDVI = (B08-B04)/(B08+B04), forest mask NDVI>0.7, year-over-year change,
//      loss-year). Ported to typed arrays so they run anywhere and are testable.
//   2. A swappable `RasterSourcePort` — Sentinel-2 NDVI, Copernicus Land Cover
//      2020 (10 m), or Hansen Global Forest Change. A real backend implements
//      the port; `NoDataRasterSource` is the graceful "no coverage yet" default.
//   3. `DeforestationMonitor.assessGeofence()` — intersects a raster grid with a
//      geofence polygon (reusing PolygonService) and returns an EUDR-ready verdict
//      that the WO-115 guillotine can consume INSTEAD of the declared date.
//
// The grid is assumed to be in WGS84 (EPSG:4326); real backends reproject to
// 4326 before handing the grid over.

import { err, ok, type Result } from "@rocky/domains-shared";
import { GEO_ERRORS, GeoError } from "../errors/geo.errors.js";
import type { GeoRepository } from "../repositories/geo.repository.js";
import { fromWktPolygon, pointInPolygon, type LngLat } from "./polygon.service.js";

export type RasterSourceKind = "sentinel2_ndvi" | "land_cover_2020" | "hansen_gfc";

/** A georeferenced raster grid (row-major, length = width*height). */
export interface RasterGrid {
	width: number;
	height: number;
	/** Upper-left x of pixel (0,0) (easting or lng). */
	originX: number;
	/** Upper-left y of pixel (0,0) (northing or lat). */
	originY: number;
	/** Pixel size; pixelHeight is typically negative for north-up grids. */
	pixelWidth: number;
	pixelHeight: number;
	/** Band values, row-major. */
	values: Float32Array;
}

/**
 * Swappable deforestation raster backend. A real Sentinel-2 / Land Cover 2020 /
 * Hansen GFC implementation provides this; until then `NoDataRasterSource` is used.
 */
export interface RasterSourcePort {
	readonly kind: RasterSourceKind;
	/** Load the deforestation/forest raster covering the given WGS84 bbox + epoch. */
	load(opts: { bbox: [number, number, number, number]; year: number }): Promise<Result<RasterGrid, Error>>;
	/** Per-pixel "deforested after cutoff" flag grid (1 = deforested, 0 = intact/no-data). */
	deforestationMask(grid: RasterGrid, cutoffYear: number): Result<Uint8Array, Error>;
}

// ── Pure kernels (ported from the xarray / Sentinel-2 notebook) ──

/** NDVI = (NIR - RED) / (NIR + RED). Guards 0/0 → 0. */
export function computeNdvi(red: Float32Array, nir: Float32Array): Float32Array {
	if (red.length !== nir.length) {
		throw new GeoError(GEO_ERRORS.INVALID_GEOMETRY, { reason: "band_length_mismatch" });
	}
	const out = new Float32Array(red.length);
	for (let i = 0; i < red.length; i++) {
		const r = red[i]!;
		const nr = nir[i]!;
		const denom = nr + r;
		out[i] = denom === 0 ? 0 : (nr - r) / denom;
	}
	return out;
}

/** Forest mask: 1 where NDVI >= threshold (default 0.7 per the notebook), else 0. */
export function forestMask(ndvi: Float32Array, threshold = 0.7): Uint8Array {
	const out = new Uint8Array(ndvi.length);
	for (let i = 0; i < ndvi.length; i++) out[i] = ndvi[i]! >= threshold ? 1 : 0;
	return out;
}

/**
 * Year-over-year forest change: -1 loss, 0 no change, +1 gain.
 * prev/curr are 0/1 forest masks of equal length.
 */
export function forestChange(prev: Uint8Array, curr: Uint8Array): Int8Array {
	if (prev.length !== curr.length) {
		throw new GeoError(GEO_ERRORS.INVALID_GEOMETRY, { reason: "mask_length_mismatch" });
	}
	const out = new Int8Array(prev.length);
	for (let i = 0; i < prev.length; i++) out[i] = (curr[i]! - prev[i]!) as -1 | 0 | 1;
	return out;
}

/**
 * First year a pixel was detected as deforested (change == -1), per the notebook's
 * `lost_year` / `LOST_YEAR` logic. Pixels never deforested → 0.
 * @param changeByYear change grids ordered oldest → newest
 * @param years the calendar year for each change grid
 */
export function lossYear(changeByYear: Int8Array[], years: number[]): Int32Array {
	if (changeByYear.length === 0) return new Int32Array(0);
	const n = changeByYear[0]!.length;
	const out = new Int32Array(n);
	for (let p = 0; p < n; p++) {
		let found = 0;
		for (let t = 0; t < changeByYear.length; t++) {
			if (changeByYear[t]![p] === -1) {
				found = years[t]!;
				break;
			}
		}
		out[p] = found;
	}
	return out;
}

// ── Monitor ──

export interface DeforestationAssessment {
	geofenceId: string;
	source: RasterSourceKind;
	cutoffYear: number;
	/** Pixels of the geofence polygon that fall inside the raster coverage. */
	totalPixels: number;
	/** Of those, pixels flagged as deforested after the cutoff. */
	deforestedPixels: number;
	/** Inferred deforestation-free date, or null when a breach is detected. */
	deforestationFreeSince: Date | null;
	/** False when any deforested pixel is found inside the geofence. */
	compliant: boolean;
}

export class DeforestationMonitor {
	constructor(
		private readonly repo: GeoRepository,
		private readonly raster: RasterSourcePort,
	) {}

	/**
	 * Overlay the deforestation raster against one geofence and return an
	 * EUDR-ready verdict. Reuses PolygonService (point-in-polygon) to count raster
	 * cells whose center falls inside the geofence polygon.
	 */
	async assessGeofence(
		geofenceId: string,
		cutoffYear: number,
	): Promise<Result<DeforestationAssessment, Error>> {
		const geofence = await this.repo.findGeofenceById(geofenceId);
		if (!geofence) {
			return err(new GeoError(GEO_ERRORS.GEOFENCE_NOT_FOUND, { id: geofenceId }));
		}
		const vertices = fromWktPolygon(geofence.polygon);
		if (vertices.isErr()) return err(vertices.error);

		const ring: LngLat[] = vertices.value.map((v) => [v.longitude, v.latitude]);
		const xs = ring.map((p) => p[0]);
		const ys = ring.map((p) => p[1]);
		const bbox: [number, number, number, number] = [
			Math.min(...xs),
			Math.min(...ys),
			Math.max(...xs),
			Math.max(...ys),
		];

		const gridRes = await this.raster.load({ bbox, year: cutoffYear });
		if (gridRes.isErr()) return err(gridRes.error);
		const grid = gridRes.value;

		const maskRes = this.raster.deforestationMask(grid, cutoffYear);
		if (maskRes.isErr()) return err(maskRes.error);
		const mask = maskRes.value;

		let totalPixels = 0;
		let deforestedPixels = 0;
		for (let row = 0; row < grid.height; row++) {
			const y = grid.originY + (row + 0.5) * grid.pixelHeight;
			for (let col = 0; col < grid.width; col++) {
				const x = grid.originX + (col + 0.5) * grid.pixelWidth;
				if (!pointInPolygon([x, y], ring)) continue;
				totalPixels++;
				if (mask[row * grid.width + col] === 1) deforestedPixels++;
			}
		}

		const compliant = deforestedPixels === 0;
		return ok({
			geofenceId,
			source: this.raster.kind,
			cutoffYear,
			totalPixels,
			deforestedPixels,
			deforestationFreeSince: compliant
				? geofence.deforestationFreeSince ?? new Date(`${cutoffYear}-12-31`)
				: null,
			compliant,
		});
	}
}

/**
 * Graceful default: no raster coverage wired yet → no deforestation can be
 * proven → fall back to the declared `deforestation_free_since` date (ADR-0063's
 * current logical behavior). Returns an empty-grid mask of all zeros so the gate
 * stays permissive until a real Sentinel-2 / Land Cover 2020 backend is plugged in.
 */
export class NoDataRasterSource implements RasterSourcePort {
	readonly kind = "sentinel2_ndvi" as const;

	async load(): Promise<Result<RasterGrid, Error>> {
		return ok({ width: 0, height: 0, originX: 0, originY: 0, pixelWidth: 1, pixelHeight: -1, values: new Float32Array(0) });
	}

	deforestationMask(grid: RasterGrid): Result<Uint8Array, Error> {
		return ok(new Uint8Array(grid.width * grid.height));
	}
}
