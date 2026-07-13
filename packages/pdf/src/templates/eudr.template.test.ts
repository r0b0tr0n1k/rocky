import { describe, expect, it, vi } from "vitest";
import { EudrTemplate } from "./eudr.template.js";
import type { AnimalRepository } from "@rocky/domains-animal";
import type { FarmRepository } from "@rocky/domains-farm";
import type { PassportRepository } from "@rocky/domains-passport";
import type { GeoRepository } from "@rocky/geo";
import type { MovementRepository } from "@rocky/domains-movement";
import type { SystemService } from "@rocky/domains-system";
import { ok, err } from "neverthrow";
import type { CredentialService } from "../services/credential.service.js";

function buildTemplate(opts: {
  animal: unknown | null;
  passport?: unknown | null;
  credential?: unknown | null; // ok payload, or null to simulate err
}) {
  const animalRepo = { findById: vi.fn().mockResolvedValue(opts.animal) } as unknown as AnimalRepository;
  const farmRepo = { findById: vi.fn().mockResolvedValue(null) } as unknown as FarmRepository;
  const passportRepo = {
    findByAnimalId: vi.fn().mockResolvedValue(opts.passport ?? null),
  } as unknown as PassportRepository;
  const geoRepo = {
    findGeofencesByPastureIds: vi.fn().mockResolvedValue([]),
  } as unknown as GeoRepository;
  const movementRepo = {
    findPastureDeclarationsByAnimalId: vi.fn().mockResolvedValue([]),
  } as unknown as MovementRepository;
  const system = {
    getRuleSet: vi.fn().mockResolvedValue(
      ok({ eudr: { enabled: true, deforestationCutoffDate: "2020-12-31" } }),
    ),
  } as unknown as SystemService;
  const credentialService = {
    generate: vi.fn().mockResolvedValue(
      opts.credential === null
        ? err(new Error("no key"))
        : ok({
            envelope: "env-xyz",
            qrDataUrl: "data:image/png;base64,aaa",
            payload: { kid: "rocky-dev", sub: "pass-1", typ: "passport" },
          }),
    ),
  } as unknown as CredentialService;

  const template = new EudrTemplate(
    movementRepo,
    geoRepo,
    animalRepo,
    farmRepo,
    system,
    passportRepo,
    credentialService,
  );
  return { template, credentialService };
}

describe("EudrTemplate — ADR-0084 §14.3 (DDS references the signed credential)", () => {
  it("type is 'eudr'", () => {
    const { template } = buildTemplate({ animal: { id: "a1" } });
    expect(template.type).toBe("eudr");
  });

  it("embeds credentialReference when a passport + credential exist", async () => {
    const { template, credentialService } = buildTemplate({
      animal: { id: "a1", earTagNumber: "123" },
      passport: { id: "pass-1" },
      credential: {},
    });

    const model = await template.mapToModel("a1");
    expect(credentialService.generate).toHaveBeenCalledWith({ type: "passport", refId: "pass-1" });
    expect(model.credentialReference).toMatchObject({
      type: "passport",
      sub: "pass-1",
      kid: "rocky-dev",
      qrDataUrl: "data:image/png;base64,aaa",
      envelope: "env-xyz",
    });
  });

  it("credentialReference is null when the animal has no passport", async () => {
    const { template, credentialService } = buildTemplate({
      animal: { id: "a1", earTagNumber: "123" },
      passport: null,
      credential: {},
    });
    const model = await template.mapToModel("a1");
    expect(credentialService.generate).not.toHaveBeenCalled();
    expect(model.credentialReference).toBeNull();
  });

  it("credentialReference is null when the credential cannot be built (graceful)", async () => {
    const { template } = buildTemplate({
      animal: { id: "a1" },
      passport: { id: "pass-1" },
      credential: null,
    });
    const model = await template.mapToModel("a1");
    expect(model.credentialReference).toBeNull();
  });
});
