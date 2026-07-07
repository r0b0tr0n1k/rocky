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
  type ReprintPassportRequest,
  reprintPassportRequestSchema,
  type SeizePassportRequest,
  seizePassportRequestSchema,
} from "@rocky/validators/api/index.js";
import { PASSPORT_TRPC_ERROR_MAP } from "@rocky/validators/errors/index.js";
import { Ctx, Input, Mutation, Query, Router } from "nestjs-trpc";
import { z } from "zod";

const idParam = z.object({ id: z.uuid() });
const unwrap = createResultUnwrapper(PASSPORT_TRPC_ERROR_MAP);

@Router({ alias: "passport" })
@RegisterPolicy("passport")
@Policy({ authenticated: true })
@Injectable()
export class PassportRouter {
  constructor(@Inject(PassportService) private readonly passportService: PassportService) {}

  // -- CRUD --

  @Query({ input: idParam })
  async getById(@Input() input: { id: string }) {
    return unwrap(await this.passportService.getById(input.id));
  }

  @Query({ input: passportListRequestSchema })
  async list(@Input() input: z.infer<typeof passportListRequestSchema>) {
    return unwrap(await this.passportService.list(input));
  }

  // -- Lifecycle --

  @Mutation({ input: issuePassportRequestSchema })
  async issueForAnimal(@Input() input: IssuePassportRequest, @Ctx() ctx: AppContext) {
    return unwrap(await this.passportService.issueForAnimal({ ...input, createdBy: ctx.execution?.principal.id }));
  }

  @Mutation({ input: idParam })
  async shipToVs(@Input() input: { id: string }) {
    return unwrap(await this.passportService.shipToVs(input.id));
  }

  @Mutation({ input: idParam })
  async deliverToKeeper(@Input() input: { id: string }) {
    return unwrap(await this.passportService.deliverToKeeper(input.id));
  }

  @Mutation({ input: seizePassportRequestSchema })
  async seize(@Input() input: SeizePassportRequest) {
    // biome-ignore lint/style/noNonNullAssertion: Zod-validated date guarantees split("T")[0] exists
    const datePart = input.deathDate.toISOString().split("T")[0]!;
    return unwrap(await this.passportService.seize(input.passportId, datePart, input.deathCause));
  }

  @Mutation({ input: reprintPassportRequestSchema })
  async reprint(@Input() input: ReprintPassportRequest) {
    return unwrap(await this.passportService.reprint(input.originalPassportId));
  }
}
