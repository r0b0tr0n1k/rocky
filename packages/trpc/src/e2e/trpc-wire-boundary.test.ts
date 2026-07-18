import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { appRouter } from "../generated/server.js";

// ── tRPC <-> Zod wire boundary ──
// The generated `appRouter` carries PLACEHOLDER resolvers (type-inference only);
// the real runtime router is assembled internally by nestjs-trpc and is never
// exported. What the generated router DOES faithfully carry are the real Zod
// @Input schemas from @rocky/validators. This suite proves the tRPC layer
// enforces those schemas at the wire: bad input must be rejected with a
// TRPCError before it ever reaches a (placeholder) resolver.
describe("tRPC <-> Zod wire boundary (input enforcement)", () => {
  const caller = appRouter.createCaller({ headers: new Headers() });

  it("rejects a malformed uuid at the wire (animal.getById)", async () => {
    await expect(caller.animal.getById({ id: "not-a-uuid" })).rejects.toThrow(TRPCError);
  });

  it("rejects a missing/empty required field at the wire (farm.create)", async () => {
    await expect(caller.farm.create({ name: "" } as any)).rejects.toThrow(TRPCError);
  });

  it("rejects a missing required payload at the wire (inspection.create)", async () => {
    await expect(caller.inspection.create({} as any)).rejects.toThrow(TRPCError);
  });

  it("rejects an unknown enum value at the wire (movement.recordDeath)", async () => {
    await expect(caller.movement.recordDeath({ animalId: "not-a-uuid", cause: "NOPE" } as any)).rejects.toThrow(
      TRPCError,
    );
  });
});
