import { describe, expect, it, vi } from "vitest";
import { ok } from "@rocky/domains-shared";
import {
	computeNdvi,
	DeforestationMonitor,
	forestChange,
	forestMask,
	lossYear,
	NoDataRasterSource,
	type RasterGrid,
	type RasterSourcePort,
} from "./deforestation.service.js";

describe("deforestation kernels (port of the Sentinel-2 / xarray notebook)", () => {
	it("computeNdvi matches (NIR-RED)/(NIR+RED)", () => {
		const red = new Float32Array([0.1, 0.2, 0, 0]);
		const nir = new Float32Array([0.4, 0.3, 0, 5]);
		const ndvi = computeNdvi(red, nir);
		// (0.4-0.1)/(0.4+0.1) = 0.6
		expect(ndvi[0]).toBeCloseTo(0.6, 5);
		expect(ndvi[1]).toBeCloseTo(0.2, 5);
		// 0/0 guard → 0
		expect(ndvi[2]).toBe(0);
		// (5-0)/(5+0) = 1
		expect(ndvi[3]).toBe(1);
	});

	it("forestMask flags NDVI >= 0.7 (notebook threshold)", () => {
		const mask = forestMask(new Float32Array([0.8, 0.5, 0.71]));
		expect(Array.from(mask)).toEqual([1, 0, 1]);
	});

	it("forestChange: -1 loss, +1 gain, 0 no change", () => {
		const prev = new Uint8Array([1, 1, 0, 0]);
		const curr = new Uint8Array([1, 0, 0, 1]);
		const change = forestChange(prev, curr);
		expect(Array.from(change)).toEqual([0, -1, 0, 1]);
	});

	it("lossYear records first deforestation year per pixel", () => {
		// 3 years of change grids; pixel0 deforested at t=1, pixel1 at t=2, pixel2 never.
		const change = [
			new Int8Array([0, 0, 0]),
			new Int8Array([-1, 0, 0]),
			new Int8Array([0, -1, 0]),
		];
		const years = [2021, 2022, 2023];
		const ly = lossYear(change, years);
		expect(Array.from(ly)).toEqual([2022, 2023, 0]);
	});
});

describe("DeforestationMonitor (EUDR raster overlay)", () => {
	const WKT = "SRID=4326;POLYGON((0 0, 0 2, 2 2, 2 0, 0 0))";

	function fakeRepo(overrides: Partial<{ deforestationFreeSince: Date | null }> = {}) {
		return {
			findGeofenceById: vi.fn().mockResolvedValue({
				id: "g1",
				polygon: WKT,
				deforestationFreeSince: overrides.deforestationFreeSince ?? null,
			}),
		} as never;
	}

	it("with NoDataRasterSource is permissive (falls back to declared date)", async () => {
		const monitor = new DeforestationMonitor(fakeRepo(), new NoDataRasterSource());
		const res = await monitor.assessGeofence("g1", 2020);
		expect(res.isOk()).toBe(true);
		if (res.isOk()) {
			expect(res.value.compliant).toBe(true);
			expect(res.value.deforestedPixels).toBe(0);
			expect(res.value.totalPixels).toBe(0);
		}
	});

	it("detects a deforested cell inside the geofence → breach (compliant=false)", async () => {
		// 2x2 grid covering the polygon; pixel[0] flagged deforested.
		const stub: RasterSourcePort = {
		kind: "land_cover_2020",
		async load() {
			const grid: RasterGrid = {
				width: 2,
				height: 2,
				originX: 0,
				originY: 2,
				pixelWidth: 1,
				pixelHeight: -1,
				values: new Float32Array(4),
			};
			return ok(grid);
		},
		deforestationMask(g: RasterGrid) {
			const mask = new Uint8Array(g.width * g.height);
			mask[0] = 1; // one deforested cell (inside polygon)
			return ok(mask);
		},
	};
		const monitor = new DeforestationMonitor(fakeRepo(), stub);
		const res = await monitor.assessGeofence("g1", 2020);
		expect(res.isOk()).toBe(true);
		if (res.isOk()) {
			expect(res.value.compliant).toBe(false);
			expect(res.value.deforestedPixels).toBe(1);
			expect(res.value.totalPixels).toBe(4);
			expect(res.value.deforestationFreeSince).toBeNull();
		}
	});

	it("returns GEOFENCE_NOT_FOUND when the geofence is absent", async () => {
		const repo = { findGeofenceById: vi.fn().mockResolvedValue(null) } as never;
		const monitor = new DeforestationMonitor(repo, new NoDataRasterSource());
		const res = await monitor.assessGeofence("missing", 2020);
		expect(res.isErr()).toBe(true);
	});
});
