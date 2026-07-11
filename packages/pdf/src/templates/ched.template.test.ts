import { describe, expect, it, vi } from "vitest";
import { ok } from "neverthrow";
import { ChedTemplate } from "./ched.template.js";
import { DOCUMENT_ERRORS, DocumentError } from "../errors/document.errors.js";

const IMSOC_DEFAULT = {
  enabled: true,
  chedFormat: "xml",
  schemaVersion: "1.0",
  destinationBcp: "BG",
  requireWithdrawalClear: true,
  requirePassport: true,
  requireVaccinations: true,
  requireDiseaseClear: true,
};

type Row = Record<string, unknown>;

function buildTemplate(opts: {
  passport?: Row | null;
  vaccinations?: Row[];
  treatments?: Row[];
  activeWithdrawal?: Row[];
  imsoc?: Partial<typeof IMSOC_DEFAULT>;
  movement?: Row;
  animal?: Row | null;
} = {}) {
  const movement =
    opts.movement ??
    {
      id: "mv-1",
      animalId: "an-1",
      fromFarmId: "fm-1",
      toFarmId: "fm-2",
      type: "EXPORT",
      movementDate: "2026-07-01",
      exportCountry: "BG",
    };
  const animal =
    opts.animal ??
    {
      id: "an-1",
      earTagNumber: "8071234561",
      sex: "MALE",
      birthDate: "2025-01-01",
      status: "ALIVE",
    };
  const farm = { id: "fm-1", farmId: "FM1", name: "Farm One", addressId: "addr-1" };
  const address = { id: "addr-1", street: "Main", city: "Skopje" };

  const movementRepo = { findById: vi.fn().mockResolvedValue(ok(movement)) };
  const animalRepo = { findById: vi.fn().mockResolvedValue(ok(animal)) };
  const farmRepo = {
    findById: vi.fn().mockResolvedValue(ok(farm)),
    findAddressById: vi.fn().mockResolvedValue(ok(address)),
  };
  // NOTE: listVaccinations / listTreatments / findActiveWithdrawalTreatments return
  // PLAIN data (not a Result) in the real repositories — mirror that here.
  const healthRepo = {
    listVaccinations: vi.fn().mockResolvedValue({
      data: opts.vaccinations ?? [{ vaccineId: "VX1", adminDate: "2026-03-01" }],
      total: (opts.vaccinations ?? []).length || 1,
    }),
    listTreatments: vi.fn().mockResolvedValue({ data: opts.treatments ?? [], total: (opts.treatments ?? []).length }),
    findActiveWithdrawalTreatments: vi.fn().mockResolvedValue(opts.activeWithdrawal ?? []),
  };
  // Honor an explicit `null` (no passport) — `??` would turn null into the default.
  const passportRow = opts.passport === undefined
    ? { id: "pp-1", passportNumber: "MK-001", status: "ACTIVE" }
    : opts.passport;
  const passportRepo = {
    findByAnimalId: vi.fn().mockResolvedValue(ok(passportRow)),
  };
  const system = {
    getRuleSet: vi.fn().mockResolvedValue(ok({ imsoc: { ...IMSOC_DEFAULT, ...opts.imsoc } } as never)),
  };

  const t = new ChedTemplate(
    movementRepo as never,
    animalRepo as never,
    farmRepo as never,
    healthRepo as never,
    passportRepo as never,
    system as never,
  );
  return { t, mocks: { movementRepo, animalRepo, farmRepo, healthRepo, passportRepo, system } };
}

async function expectPreconditionThrow(t: ChedTemplate, reason: string) {
  let thrown: unknown = null;
  try {
    await t.mapToModel("mv-1");
  } catch (e) {
    thrown = e;
  }
  expect(thrown).toBeInstanceOf(DocumentError);
  const err = thrown as DocumentError;
  expect(err.code).toBe(DOCUMENT_ERRORS.CHED_PRECONDITION_FAILED);
  expect((err.context?.reasons as string[] | undefined)?.includes(reason)).toBe(true);
}

describe("ChedTemplate (WO-121)", () => {
  it("type is 'ched-a' and supports yaml + xml", () => {
    const { t } = buildTemplate();
    expect(t.type).toBe("ched-a");
    expect(t.availableFormats).toContain("yaml");
    expect(t.availableFormats).toContain("xml");
  });

  it("generates a CHED-A model for a fully compliant movement", async () => {
    const { t } = buildTemplate();
    const model = await t.mapToModel("mv-1");
    expect(model.chedType).toBe("CHED-A");
    expect((model.consignment as Row).chedReference).toBe("CHED-A-mv-1");
    expect((model.consignment as Row).originCountry).toBe("MK");
    expect(Array.isArray(model.animals)).toBe(true);
    const kdes = model.kdes as Array<{ element: string; value: unknown }>;
    expect(kdes.some((k) => k.element === "ear_tag")).toBe(true);
    expect(kdes.some((k) => k.element === "passport_number")).toBe(true);
  });

  it("throws CHED_PRECONDITION_FAILED when passport is missing", async () => {
    const { t } = buildTemplate({ passport: null });
    await expectPreconditionThrow(t, "missing_passport");
  });

  it("throws CHED_PRECONDITION_FAILED when no vaccinations recorded", async () => {
    const { t } = buildTemplate({ vaccinations: [] });
    await expectPreconditionThrow(t, "missing_vaccinations");
  });

  it("throws CHED_PRECONDITION_FAILED when an active withdrawal period exists", async () => {
    const { t } = buildTemplate({ activeWithdrawal: [{ id: "t1", withdrawalPeriod: 10 }] });
    await expectPreconditionThrow(t, "active_withdrawal_period");
  });

  it("does not generate when imsoc is disabled", async () => {
    const { t } = buildTemplate({ imsoc: { enabled: false } });
    await expectPreconditionThrow(t, "imsoc.disabled");
  });
});
