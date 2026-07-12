import { describe, expect, it, vi } from "vitest";
import { runEudrDueDiligence, type EudrBreach } from "./eudr-due-diligence.js";

type Geo = {
  id: string;
  pastureId: string | null;
  polygon: unknown;
  cadastralReference: string | null;
  deforestationFreeSince: Date | null;
  fenceType: string;
};

function makeMocks(opts: { geofences?: Geo[]; declarations?: Array<{ id: string }> } = {}) {
  const movementRepo = {
    findPastureDeclarationsByAnimalId: vi.fn().mockResolvedValue(opts.declarations ?? [{ id: "pd1" }]),
  } as never;
  const geoRepo = {
    findGeofencesByPastureIds: vi.fn().mockResolvedValue(opts.geofences ?? []),
  } as never;
  const ruleSet = { eudr: { enabled: true, deforestationCutoffDate: "2020-12-31" } } as never;
  return { movementRepo, geoRepo, ruleSet };
}

const CLEAR: Geo = {
  id: "g1",
  pastureId: "pd1",
  polygon: "POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))",
  cadastralReference: "MK-123",
  deforestationFreeSince: new Date("2018-06-01"),
  fenceType: "pasture_boundary",
};

describe("runEudrDueDiligence (WO-115)", () => {
  it("skips and is compliant when eudr.enabled is false", async () => {
    const { movementRepo, geoRepo, ruleSet } = makeMocks({ geofences: [CLEAR] });
    const ruleSetOff = { eudr: { enabled: false, deforestationCutoffDate: "2020-12-31" } } as never;
    const res = await runEudrDueDiligence(movementRepo, geoRepo, ruleSetOff, "an-1");
    expect(res.skipped).toBe(true);
    expect(res.compliant).toBe(true);
    expect(res.breaches).toHaveLength(0);
  });

  it("is compliant when every pasture polygon is deforestation-free before the cutoff", async () => {
    const { movementRepo, geoRepo, ruleSet } = makeMocks({ geofences: [CLEAR] });
    const res = await runEudrDueDiligence(movementRepo, geoRepo, ruleSet, "an-1");
    expect(res.compliant).toBe(true);
    expect(res.breaches).toHaveLength(0);
    expect(res.geofencesChecked).toBe(1);
  });

  it("flags missing_polygon", async () => {
    const g = { ...CLEAR, polygon: null } as Geo;
    const { movementRepo, geoRepo, ruleSet } = makeMocks({ geofences: [g] });
    const res = await runEudrDueDiligence(movementRepo, geoRepo, ruleSet, "an-1");
    expect(res.compliant).toBe(false);
    expect((res.breaches[0] as EudrBreach).reason).toBe("missing_polygon");
  });

  it("flags missing_cadastral", async () => {
    const g = { ...CLEAR, cadastralReference: null } as Geo;
    const { movementRepo, geoRepo, ruleSet } = makeMocks({ geofences: [g] });
    const res = await runEudrDueDiligence(movementRepo, geoRepo, ruleSet, "an-1");
    expect(res.compliant).toBe(false);
    expect((res.breaches[0] as EudrBreach).reason).toBe("missing_cadastral");
  });

  it("flags no_deforestation_proof", async () => {
    const g = { ...CLEAR, deforestationFreeSince: null } as Geo;
    const { movementRepo, geoRepo, ruleSet } = makeMocks({ geofences: [g] });
    const res = await runEudrDueDiligence(movementRepo, geoRepo, ruleSet, "an-1");
    expect(res.compliant).toBe(false);
    expect((res.breaches[0] as EudrBreach).reason).toBe("no_deforestation_proof");
  });

  it("flags deforested_after_cutoff", async () => {
    const g = { ...CLEAR, deforestationFreeSince: new Date("2021-06-01") } as Geo;
    const { movementRepo, geoRepo, ruleSet } = makeMocks({ geofences: [g] });
    const res = await runEudrDueDiligence(movementRepo, geoRepo, ruleSet, "an-1");
    expect(res.compliant).toBe(false);
    expect((res.breaches[0] as EudrBreach).reason).toBe("deforested_after_cutoff");
  });

  it("is compliant when there are no pasture declarations", async () => {
    const { movementRepo, geoRepo, ruleSet } = makeMocks({ declarations: [], geofences: [] });
    const res = await runEudrDueDiligence(movementRepo, geoRepo, ruleSet, "an-1");
    expect(res.compliant).toBe(true);
    expect(res.pasturesChecked).toBe(0);
  });
});
