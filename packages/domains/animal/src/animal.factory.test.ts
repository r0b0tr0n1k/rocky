import { describe, expect, it } from "vitest";
import { AnimalFactory } from "@rocky/testing";
import { animalsSelectSchema } from "@rocky/database/zod";
import { ANIMAL_STATUS } from "@rocky/database/constants";

// Diamond Seal: factory output must satisfy the Drizzle-derived select schema,
// and shared enum constants (not magic strings) drive status.
describe("AnimalFactory (schema-grounded)", () => {
  const farmId = "11111111-1111-4111-8111-111111111111";

  it("create() output satisfies animalsSelectSchema", () => {
    const rec = new AnimalFactory(farmId).create();
    expect(() => animalsSelectSchema.parse(rec)).not.toThrow();
    const parsed = animalsSelectSchema.parse(rec);
    expect(parsed.currentFarmId).toBe(farmId);
    expect(parsed.stateCode).toBe("MK");
  });

  it("createAlive / createDead set the status field via ANIMAL_STATUS", () => {
    expect(new AnimalFactory(farmId).createAlive().status).toBe(ANIMAL_STATUS.ALIVE);
    expect(new AnimalFactory(farmId).createDead().status).toBe(ANIMAL_STATUS.DEAD);
  });

  it("applies overrides (birthDate, sex)", () => {
    const bd = "2020-01-01";
    const rec = new AnimalFactory(farmId).create({ birthDate: bd, sex: "female" });
    expect(rec.birthDate).toBe(bd);
    expect(rec.sex).toBe("female");
  });
});
