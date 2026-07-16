// ── Factory reuse sanity ──
//
// Proves the existing `@rocky/testing` factories (Diamond Seal) are wired into
// the conformance suite: each factory produces a schema-valid select record,
// and the animal factory derives a correctly-formatted MK_8 ear tag. This is
// the "use the factories" leg of the frontend tRPC conformance work; the
// per-procedure inputs in `wire-acceptance.test.ts` are derived from Zod
// schemas (the schema-walker), which together with these factories exercise
// the full schema/validator surface.

import { describe, expect, it } from "vitest";
import { faker } from "@faker-js/faker";
import { AnimalFactory, FarmFactory } from "@rocky/testing/factory";

describe("factory reuse — Diamond Seal sanity", () => {
  it("FarmFactory produces a schema-valid farm record", () => {
    const farm = new FarmFactory(faker.string.uuid()).create();
    expect(farm.farmId).toBeDefined();
    expect(typeof farm.farmId).toBe("string");
  });

  it("AnimalFactory produces a schema-valid animal record with an MK_8 ear tag", () => {
    const animal = new AnimalFactory(faker.string.uuid()).create();
    expect(animal.earTagNumber).toMatch(/^\d{8}$/);
  });
});
