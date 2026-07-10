// --- Passport Router - tRPC entry point ---

import { Inject, Injectable } from "@nestjs/common";
import { Policy, RegisterPolicy } from "@rocky/authorization/index.js";
import { PassportService } from "@rocky/domains-passport";
import type { AppContext } from "@rocky/trpc/context.js";
import { createResultUnwrapper } from "@rocky/trpc/index.js";
import {
  type IssuePassportRequest,
  issuePassportRequestSchema,
  passportListRequestSchema,
  passportListResponseSchema,
  passportResponseSchema,
  type ReprintPassportRequest,
  reprintPassportRequestSchema,
  type SeizePassportRequest,
  seizePassportRequestSchema,
} from "@rocky/validators/api/index.js";
import { PASSPORT_TRPC_ERROR_MAP } from "@rocky/validators/errors/index.js";
import { Ctx, Input, Mutation, Query, Router } from "nestjs-trpc";
import { z } from "zod";
import type { SubtypeGuillotine, ActivateGuillotines } from "@rocky/validators/utils";

const idParam = z.object({ id: z.uuid() });
const unwrap = createResultUnwrapper(PASSPORT_TRPC_ERROR_MAP);

@Router({ alias: "passport" })
@RegisterPolicy("passport")
@Policy({ authenticated: true })
@Injectable()
export class PassportRouter {
  constructor(@Inject(PassportService) private readonly passportService: PassportService) {}

  // -- CRUD --

  @Query({ input: idParam, output: passportResponseSchema })
  async getById(@Input() input: { id: string }) {
    return unwrap(await this.passportService.getById(input.id));
  }

  @Query({ input: passportListRequestSchema, output: passportListResponseSchema })
  async list(@Input() input: z.infer<typeof passportListRequestSchema>) {
    return unwrap(await this.passportService.list(input));
  }

  // -- Lifecycle --

  @Mutation({ input: issuePassportRequestSchema, output: passportResponseSchema })
  async issueForAnimal(@Input() input: IssuePassportRequest, @Ctx() ctx: AppContext) {
    return unwrap(await this.passportService.issueForAnimal({ ...input, createdBy: ctx.execution?.principal.id }));
  }

  @Mutation({ input: idParam, output: passportResponseSchema })
  async shipToVs(@Input() input: { id: string }) {
    return unwrap(await this.passportService.shipToVs(input.id));
  }

  @Mutation({ input: idParam, output: passportResponseSchema })
  async deliverToKeeper(@Input() input: { id: string }) {
    return unwrap(await this.passportService.deliverToKeeper(input.id));
  }

  @Mutation({ input: seizePassportRequestSchema, output: passportResponseSchema })
  async seize(@Input() input: SeizePassportRequest) {
    // biome-ignore lint/style/noNonNullAssertion: Zod-validated date guarantees split("T")[0] exists
    const datePart = input.deathDate.toISOString().split("T")[0]!;
    return unwrap(await this.passportService.seize(input.passportId, datePart, input.deathCause));
  }

  @Mutation({ input: reprintPassportRequestSchema, output: passportResponseSchema })
  async reprint(@Input() input: ReprintPassportRequest) {
    return unwrap(await this.passportService.reprint(input.originalPassportId));
  }
}

// SubtypeGuillotine (one-directional: schema output ⊆ return type) — response
// schemas are Drizzle-derived projections; the hand-written interface is the
// wider SSOT, so AssertEqual would false-positive. See audit G3.
type _verify_getByIdOutput = SubtypeGuillotine<
  z.output<typeof passportResponseSchema>,
  Awaited<ReturnType<PassportRouter["getById"]>>
>;
type _verify_listOutput = SubtypeGuillotine<
  z.output<typeof passportListResponseSchema>,
  Awaited<ReturnType<PassportRouter["list"]>>
>;
type _verify_issueForAnimalOutput = SubtypeGuillotine<
  z.output<typeof passportResponseSchema>,
  Awaited<ReturnType<PassportRouter["issueForAnimal"]>>
>;
type _verify_shipToVsOutput = SubtypeGuillotine<
  z.output<typeof passportResponseSchema>,
  Awaited<ReturnType<PassportRouter["shipToVs"]>>
>;
type _verify_deliverToKeeperOutput = SubtypeGuillotine<
  z.output<typeof passportResponseSchema>,
  Awaited<ReturnType<PassportRouter["deliverToKeeper"]>>
>;
type _verify_seizeOutput = SubtypeGuillotine<
  z.output<typeof passportResponseSchema>,
  Awaited<ReturnType<PassportRouter["seize"]>>
>;
type _verify_reprintOutput = SubtypeGuillotine<
  z.output<typeof passportResponseSchema>,
  Awaited<ReturnType<PassportRouter["reprint"]>>
>;

export type _PassportGuillotines = ActivateGuillotines<[
  _verify_getByIdOutput,
  _verify_listOutput,
  _verify_issueForAnimalOutput,
  _verify_shipToVsOutput,
  _verify_deliverToKeeperOutput,
  _verify_seizeOutput,
  _verify_reprintOutput
]>;
