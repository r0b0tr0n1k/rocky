import { describe, expect, it } from "vitest";
import {
	classifyGeometry,
	decimalPrecision,
	fromWktPolygon,
	geodesicCircle,
	haversineDistanceMeters,
	isWithinRadius,
	pointInPolygon,
	polygonAreaHectares,
	toWktPolygon,
	validatePolygon,
	type LatLng,
} from "./polygon.service.js";

// Square ~300m x 300m at the equator → ~9 ha (> 4 ha boundary).
const SQUARE_300M: LatLng[] = [
	{ latitude: 0, longitude: 0 },
	{ latitude: 0.0027, longitude: 0 },
	{ latitude: 0.0027, longitude: 0.0027 },
	{ latitude: 0, longitude: 0.0027 },
];

// Square ~100m x 100m at the equator → ~1 ha (< 4 ha boundary).
const SQUARE_100M: LatLng[] = [
	{ latitude: 0, longitude: 0 },
	{ latitude: 0.0009, longitude: 0 },
	{ latitude: 0.0009, longitude: 0.0009 },
	{ latitude: 0, longitude: 0.0009 },
];

describe("polygon.service (spatial engine)", () => {
	describe("haversineDistanceMeters", () => {
		it("returns ~111.2 km for 1 degree of latitude", () => {
			const d = haversineDistanceMeters([0, 0], [0, 1]);
			expect(d).toBeGreaterThan(110_000);
			expect(d).toBeLessThan(112_000);
		});
	});

	describe("polygonAreaHectares", () => {
		it("classifies a 300m square as > 4 ha (polygon territory)", () => {
			const ha = polygonAreaHectares(SQUARE_300M);
			expect(ha).toBeGreaterThan(4);
			// Spherical formula is ~0.5% accurate at this scale.
			expect(ha).toBeGreaterThan(8);
			expect(ha).toBeLessThan(10.5);
		});

		it("classifies a 100m square as < 4 ha (point territory)", () => {
			const ha = polygonAreaHectares(SQUARE_100M);
			expect(ha).toBeLessThan(4);
			expect(ha).toBeGreaterThan(0.5);
		});

		it("returns 0 for degenerate (< 3 vertices)", () => {
			expect(polygonAreaHectares([{ latitude: 0, longitude: 0 }])).toBe(0);
		});
	});

	describe("classifyGeometry (ADR-0054 R1)", () => {
		it("returns kind 'polygon' for a >4 ha polygon", () => {
			const c = classifyGeometry({ type: "polygon", vertices: SQUARE_300M });
			expect(c.kind).toBe("polygon");
			expect(c.requiredPrecision).toBeNull();
		});

		it("returns kind 'point' with 6-decimal precision for a <=4 ha shape", () => {
			const c = classifyGeometry({ type: "polygon", vertices: SQUARE_100M });
			expect(c.kind).toBe("point");
			expect(c.requiredPrecision).toBe(6);
		});

		it("derives circle area from π·r²", () => {
			const c = classifyGeometry({ type: "circle", radiusMeters: 100 });
			// π * 100² m² = 31,415.9 m² ≈ 3.14 ha → point.
			expect(c.areaHectares).toBeCloseTo(3.14159, 4);
			expect(c.kind).toBe("point");
		});
	});

	describe("pointInPolygon", () => {
		const ring: Array<[number, number]> = [
			[0, 0],
			[0, 1],
			[1, 1],
			[1, 0],
		];
		it("detects an inside point", () => {
			expect(pointInPolygon([0.5, 0.5], ring)).toBe(true);
		});
		it("detects an outside point", () => {
			expect(pointInPolygon([2, 2], ring)).toBe(false);
		});
	});

	describe("isWithinRadius", () => {
		it("is true within radius, false beyond", () => {
			expect(isWithinRadius([0, 0], [0, 0.001], 200)).toBe(true);
			expect(isWithinRadius([0, 0], [0, 1], 200)).toBe(false);
		});
	});

	describe("decimalPrecision", () => {
		it("counts decimal places", () => {
			expect(decimalPrecision(1.234567)).toBe(6);
			expect(decimalPrecision(42)).toBe(0);
			expect(decimalPrecision(3.14)).toBe(2);
		});
	});

	describe("validatePolygon", () => {
		it("rejects < 3 vertices", () => {
			const r = validatePolygon([
				{ latitude: 0, longitude: 0 },
				{ latitude: 1, longitude: 1 },
			]);
			expect(r.isErr()).toBe(true);
		});

		it("flags out-of-range coordinates (axis-order guard)", () => {
			const r = validatePolygon([
				{ latitude: 0, longitude: 0 },
				{ latitude: 0, longitude: 0 },
				{ latitude: 200, longitude: 0 },
			]);
			expect(r.isErr()).toBe(true);
			if (r.isErr()) expect(r.error.code).toBe("GEO_AXIS_ORDER");
		});

		it("auto-closes an open ring", () => {
			const open = [
				{ latitude: 0, longitude: 0 },
				{ latitude: 0, longitude: 1 },
				{ latitude: 1, longitude: 1 },
			];
			const r = validatePolygon(open);
			expect(r.isOk()).toBe(true);
			if (r.isOk()) expect(r.value).toHaveLength(4);
		});
	});

	describe("WKT roundtrip", () => {
		it("serializes to WKT and parses back", () => {
			const wkt = toWktPolygon(SQUARE_100M);
			expect(wkt.isOk()).toBe(true);
			if (wkt.isOk()) {
				expect(wkt.value).toContain("SRID=4326;POLYGON");
				const back = fromWktPolygon(wkt.value);
				expect(back.isOk()).toBe(true);
				if (back.isOk()) expect(back.value).toHaveLength(5);
			}
		});

		it("errors on empty WKT", () => {
			const r = fromWktPolygon(null);
			expect(r.isErr()).toBe(true);
		});
	});

	describe("geodesicCircle (ADR-0080 disease zones)", () => {
		it("produces `segments` vertices all ~radiusMeters from center", () => {
			const center = { latitude: 46, longitude: 15 };
			const ring = geodesicCircle(center, 3000, 64);
			expect(ring).toHaveLength(64);
			for (const v of ring) {
				const d = haversineDistanceMeters([v.longitude, v.latitude], [center.longitude, center.latitude]);
				expect(d).toBeGreaterThan(2900);
				expect(d).toBeLessThan(3100);
			}
		});

		it("respects the configured radius (protection 3 km vs surveillance 10 km)", () => {
			const center = { latitude: 46, longitude: 15 };
			const r3k = geodesicCircle(center, 3000, 32);
			const r10k = geodesicCircle(center, 10000, 32);
			const d3 = haversineDistanceMeters([r3k[0]!.longitude, r3k[0]!.latitude], [center.longitude, center.latitude]);
			const d10 = haversineDistanceMeters([r10k[0]!.longitude, r10k[0]!.latitude], [center.longitude, center.latitude]);
			expect(d3).toBeGreaterThan(2900);
			expect(d3).toBeLessThan(3100);
			expect(d10).toBeGreaterThan(9800);
			expect(d10).toBeLessThan(10200);
		});

		it("auto-closes into a valid ring", () => {
			const ring = geodesicCircle({ latitude: 0, longitude: 0 }, 5000, 16);
			const closed = validatePolygon(ring);
			expect(closed.isOk()).toBe(true);
		});
	});
});
