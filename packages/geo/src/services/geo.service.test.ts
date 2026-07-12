import { describe, expect, it, vi } from "vitest";
import { GeoService } from "./geo.service.js";
import type { GeoRepository } from "../repositories/geo.repository.js";

// ── Mock repository ──
// We exercise the declaration logic (nearest-settlement anchoring, AHL radii,
// dual-write of geometry + polygon) without a live DB.

function makeRepo(overrides: Partial<GeoRepository> = {}): GeoRepository {
	const inserted: Record<string, unknown>[] = [];
	const base = {
		findFarmLocation: vi.fn(async () => ({ latitude: 46.0, longitude: 15.0 })),
		findNearestSettlement: vi.fn(async () => ({
			id: "s1",
			name: "Springfield",
			settlementType: "town",
			location: { latitude: 46.01, longitude: 15.02 },
		})),
		insertGeofence: vi.fn(async (data: Record<string, unknown>) => {
			inserted.push(data);
			return {
				id: data.id,
				name: data.name,
				description: data.description,
				farmId: data.farmId,
				pastureId: data.pastureId,
				geometry: data.geometry,
				polygon: { x: 1, y: 2 },
				cadastralReference: data.cadastralReference,
				deforestationFreeSince: data.deforestationFreeSince,
				fenceType: data.fenceType,
				isActive: data.isActive,
				createdAt: new Date(),
				updatedAt: null,
				createdBy: null,
				validTo: data.validTo,
			};
		}),
		listSettlements: vi.fn(async () => []),
		listGeofences: vi.fn(async () => ({ data: [], total: 0 })),
	} as unknown as GeoRepository;
	return { ...base, ...overrides } as unknown as GeoRepository;
}

describe("GeoService — disease-zone declaration (ADR-0080)", () => {
	it("declares two circular zones anchored to the nearest settlement", async () => {
		const repo = makeRepo();
		const svc = new GeoService(repo);

		const res = await svc.declareDiseaseZone("123e4567-e89b-12d3-a456-426614174000", "FMD");

		expect(res.isOk()).toBe(true);
		if (res.isOk()) {
			expect(res.value).toHaveLength(2);
			expect(res.value[0]!.name).toContain("Springfield");
			expect(res.value[0]!.name).toContain("Protection");
			expect(res.value[0]!.name).toContain("3 km");
			expect(res.value[1]!.name).toContain("Surveillance");
			expect(res.value[1]!.name).toContain("10 km");
			expect(res.value[0]!.fenceType).toBe("disease_zone");
		}

		// Nearest settlement resolved from the farm's GPS point.
		expect(repo.findNearestSettlement).toHaveBeenCalledWith(15.0, 46.0);

		// Both zones inserted with polygon dual-write + active flag.
		const inserted = (repo.insertGeofence as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0]);
		expect(inserted).toHaveLength(2);
		expect(inserted[0]!.polygon).toBeDefined();
		expect(inserted[0]!.isActive).toBe(true);
		expect(inserted[0]!.fenceType).toBe("disease_zone");
	});

	it("honors explicit radii overrides (AHL floors are defaults, not hard caps)", async () => {
		const repo = makeRepo();
		const svc = new GeoService(repo);
		const res = await svc.declareDiseaseZone("123e4567-e89b-12d3-a456-426614174000", "FMD", {
			protectionRadiusMeters: 5000,
			surveillanceRadiusMeters: 15000,
		});
		expect(res.isOk()).toBe(true);
		const inserted = (repo.insertGeofence as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0]);
		expect(inserted[0]!.name).toContain("5 km");
		expect(inserted[1]!.name).toContain("15 km");
	});

	it("falls back to the farm point when no settlement is known", async () => {
		const repo = makeRepo({
			findNearestSettlement: vi.fn(async () => null),
		});
		const svc = new GeoService(repo);
		const res = await svc.declareDiseaseZone("123e4567-e89b-12d3-a456-426614174000", "FMD");
		expect(res.isOk()).toBe(true);
		const inserted = (repo.insertGeofence as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0]);
		// No settlement name → reported against the holding itself.
		expect(inserted[0]!.cadastralReference).toBeNull();
	});

	it("errors when the farm has no location", async () => {
		const repo = makeRepo({ findFarmLocation: vi.fn(async () => null) });
		const svc = new GeoService(repo);
		const res = await svc.declareDiseaseZone("223e4567-e89b-12d3-a456-426614174001", "FMD");
		expect(res.isErr()).toBe(true);
	});
});

describe("GeoService — disease-zone queries", () => {
	it("listDiseaseZones filters geofences by disease_zone fence type", async () => {
		const repo = makeRepo({
		listGeofences: vi.fn(async () => ({
			data: [
				{
					id: "123e4567-e89b-12d3-a456-426614174002",
					name: "Zone",
					description: null,
					farmId: "123e4567-e89b-12d3-a456-426614174000",
					pastureId: null,
					geometry: { type: "circle", center: { latitude: 46, longitude: 15 }, radiusMeters: 3000 },
					polygon: { x: 1, y: 2 },
					cadastralReference: null,
					deforestationFreeSince: null,
					fenceType: "disease_zone",
					isActive: true,
					createdAt: new Date(),
					updatedAt: null,
				} as never,
			],
			total: 1,
		})),
		});
		const svc = new GeoService(repo);
		const res = await svc.listDiseaseZones({ farmId: "123e4567-e89b-12d3-a456-426614174000", limit: 50, offset: 0 });
		expect(res.isOk()).toBe(true);
		if (res.isOk()) {
			expect(res.value.total).toBe(1);
			expect(res.value.data).toHaveLength(1);
		}
		expect(repo.listGeofences).toHaveBeenCalledWith(
			expect.objectContaining({ fenceType: "disease_zone" }),
		);
	});
});
