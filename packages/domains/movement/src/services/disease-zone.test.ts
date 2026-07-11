import { describe, expect, it, vi } from "vitest";
import { runDiseaseZoneCheck, type DiseaseZoneHit } from "./disease-zone.js";

function makeMocks(opts: { protection?: DiseaseZoneHit[]; surveillance?: DiseaseZoneHit[] } = {}) {
  const iotRepo = {
    findActiveDiseaseZonesNearFarm: vi.fn((_farmId: string, radiusMeters: number) => {
      if (radiusMeters === 3000) return Promise.resolve(opts.protection ?? []);
      return Promise.resolve(opts.surveillance ?? []);
    }),
  } as never;
  const ruleSet = {
    thresholds: { protectionZoneKm: 3, surveillanceZoneKm: 10, diseaseZoneEnabled: true },
  } as never;
  return { iotRepo, ruleSet };
}

const ZONE: DiseaseZoneHit = {
  geofenceId: "gz1",
  name: "Infected Premises X",
  farmId: "farm-1",
  cadastralReference: "MK-9",
};

describe("runDiseaseZoneCheck (WO-119)", () => {
  it("skips and reports not-in-zone when diseaseZoneEnabled is false", async () => {
    const { iotRepo, ruleSet } = makeMocks({ protection: [ZONE] });
    const rs = { thresholds: { protectionZoneKm: 3, surveillanceZoneKm: 10, diseaseZoneEnabled: false } } as never;
    const res = await runDiseaseZoneCheck(iotRepo, rs, "farm-1");
    expect(res.enabled).toBe(false);
    expect(res.inProtectionZone).toBe(false);
    expect(res.inSurveillanceZone).toBe(false);
  });

  it("flags inProtectionZone when a disease zone is within 3 km", async () => {
    const { iotRepo, ruleSet } = makeMocks({ protection: [ZONE] });
    const res = await runDiseaseZoneCheck(iotRepo, ruleSet, "farm-1");
    expect(res.enabled).toBe(true);
    expect(res.inProtectionZone).toBe(true);
    expect(res.protectionZones).toHaveLength(1);
  });

  it("flags inSurveillanceZone (10 km) without protection when only the outer ring hits", async () => {
    const { iotRepo, ruleSet } = makeMocks({ surveillance: [ZONE] });
    const res = await runDiseaseZoneCheck(iotRepo, ruleSet, "farm-1");
    expect(res.inSurveillanceZone).toBe(true);
    expect(res.inProtectionZone).toBe(false);
  });

  it("reports clear when no disease zones intersect", async () => {
    const { iotRepo, ruleSet } = makeMocks();
    const res = await runDiseaseZoneCheck(iotRepo, ruleSet, "farm-1");
    expect(res.inProtectionZone).toBe(false);
    expect(res.inSurveillanceZone).toBe(false);
    expect(res.protectionZoneKm).toBe(3);
    expect(res.surveillanceZoneKm).toBe(10);
  });

  it("returns clear (no queries) when no farmId is supplied", async () => {
    const { iotRepo, ruleSet } = makeMocks({ protection: [ZONE] });
    const res = await runDiseaseZoneCheck(iotRepo, ruleSet, "");
    expect(res.inProtectionZone).toBe(false);
    expect(res.inSurveillanceZone).toBe(false);
    expect(iotRepo.findActiveDiseaseZonesNearFarm).not.toHaveBeenCalled();
  });
});
