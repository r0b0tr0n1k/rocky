import { describe, expect, it, vi } from "vitest";
import { EarTagTemplate } from "./ear-tag.template.js";
import type { EarTagRepository } from "@rocky/domains-eartag";
import type { AnimalRepository } from "@rocky/domains-animal";
import type { FarmRepository } from "@rocky/domains-farm";
import { generateKeyPair, signCredential, verifyCredential } from "../credential/credential.js";
import type { CredentialPayload } from "../credential/credential.js";

function buildTemplate(earTagRow: unknown, animalRow: unknown | null, farmRow: unknown | null) {
  const earTagRepo = {
    findById: vi.fn().mockResolvedValue(earTagRow),
  } as unknown as EarTagRepository;
  const animalRepo = {
    findById: vi.fn().mockResolvedValue(animalRow),
  } as unknown as AnimalRepository;
  const farmRepo = {
    findById: vi.fn().mockResolvedValue(farmRow),
  } as unknown as FarmRepository;
  return { template: new EarTagTemplate(earTagRepo, animalRepo, farmRepo), animalRepo, farmRepo };
}

describe("EarTagTemplate — ADR-0084 Phase 2 (ear-tag signed credential)", () => {
  it("type is 'ear-tag'", () => {
    const { template } = buildTemplate(null, null, null);
    expect(template.type).toBe("ear-tag");
  });

  it("mapToCredential resolves farm + species from the applied animal", async () => {
    const { template } = buildTemplate(
      { id: "tag-1", animalId: "anim-1", status: "APPLIED" },
      { id: "anim-1", currentFarmId: "farm-9", species: "BOVINE" },
      { id: "farm-9", farmId: "123", name: "Holding A" },
    );

    const res = await template.mapToCredential("tag-1");
    expect(res.isOk()).toBe(true);
    if (res.isOk()) {
      expect(res.value).toEqual({ sub: "tag-1", farmId: "farm-9", species: "BOVINE" });
    }
  });

  it("mapToCredential returns only sub for an unapplied (inventory) tag", async () => {
    const { template } = buildTemplate({ id: "tag-2", animalId: null, status: "AVAILABLE" }, null, null);
    const res = await template.mapToCredential("tag-2");
    expect(res.isOk()).toBe(true);
    if (res.isOk()) {
      expect(res.value).toEqual({ sub: "tag-2", farmId: undefined, species: undefined });
    }
  });

  it("mapToCredential fails when the ear tag does not exist", async () => {
    const { template } = buildTemplate(null, null, null);
    const res = await template.mapToCredential("missing");
    expect(res.isErr()).toBe(true);
  });

  it("mapToModel builds a coherent record (tag + animal + farm)", async () => {
    const { template } = buildTemplate(
      { id: "tag-3", animalId: "anim-2", stateCode: "MK", tagNumber: "12345678", status: "APPLIED" },
      { id: "anim-2", currentFarmId: "farm-9", species: "OVINE", earTagNumber: "12345678" },
      { id: "farm-9", farmId: "123", name: "Holding A" },
    );
    const model = await template.mapToModel("tag-3");
    expect(model.earTag).toMatchObject({
      earTagId: "tag-3",
      tagNumber: "12345678",
      animal: { animalId: "anim-2", species: "OVINE" },
      farm: { farmId: "farm-9" },
    });
  });

  it("the credential seed signs + verifies offline (Ed25519, no server)", async () => {
    const { template } = buildTemplate(
      { id: "tag-4", animalId: "anim-3", status: "APPLIED" },
      { id: "anim-3", currentFarmId: "farm-9", species: "BOVINE" },
      null,
    );
    const seedRes = await template.mapToCredential("tag-4");
    expect(seedRes.isOk()).toBe(true);
    const seed = seedRes.isOk() ? seedRes.value : { sub: "", farmId: undefined, species: undefined };
    const { privateKey, publicKey } = generateKeyPair();
    const now = Math.floor(Date.now() / 1000);
    const payload: CredentialPayload = {
      iss: "rocky:cattle",
      sub: seed.sub,
      typ: "ear-tag",
      iat: now,
      exp: now + 86_400,
      kid: "rocky-dev",
      farmId: seed.farmId,
      species: seed.species,
    };

    const envelope = signCredential(payload, privateKey);
    const verified = verifyCredential(envelope, publicKey);
    expect(verified.valid).toBe(true);
    expect(verified.payload.sub).toBe("tag-4");
    expect(verified.payload.species).toBe("BOVINE");
  });
});
