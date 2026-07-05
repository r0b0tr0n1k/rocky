// ── Passport Router — tRPC entry point ──

import { Injectable, Inject } from "@nestjs/common";
import { Router, Query, Mutation, Input, Ctx, UseMiddlewares } from "nestjs-trpc";
import { z } from "zod";
import { createResultUnwrapper } from "@rocky/trpc";
import { PASSPORT_TRPC_ERROR_MAP } from "@rocky/validators/errors";
import { ProtectedMiddleware, type ProtectedMiddlewareContext } from "../trpc/middlewares/protected.middleware.js";
import { PassportService } from "@rocky/domains-passport";
import {
  issuePassportRequestSchema,
  seizePassportRequestSchema,
  reprintPassportRequestSchema,
  passportListRequestSchema,
  type IssuePassportRequest,
  type SeizePassportRequest,
  type ReprintPassportRequest,
} from "@rocky/validators/api";

const idParam = z.object({ id: z.uuid() });
const unwrap = createResultUnwrapper(PASSPORT_TRPC_ERROR_MAP);

@Router({ alias: "passport" })
@UseMiddlewares(ProtectedMiddleware)
@Injectable()
export class PassportRouter {
  constructor(
    @Inject(PassportService) private readonly passportService: PassportService,
  ) { }

  // ── CRUD ──

  @Query({ input: idParam })
  async getById(@Input() input: { id: string }) {
    return unwrap(await this.passportService.getById(input.id));
  }

  @Query({ input: passportListRequestSchema })
  async list(@Input() input: z.infer<typeof passportListRequestSchema>) {
    return unwrap(await this.passportService.list(input));
  }

  // ── Lifecycle ──

  @Mutation({ input: issuePassportRequestSchema })
  async issueForAnimal(
    @Input() input: IssuePassportRequest,
    @Ctx() ctx: ProtectedMiddlewareContext,
  ) {
    return unwrap(
      await this.passportService.issueForAnimal({ ...input, createdBy: ctx.auth.userId }),
    );
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
    return unwrap(
      await this.passportService.seize(
        input.passportId,
        input.deathDate.toISOString().split("T")[0]!,
        input.deathCause,
      ),
    );
  }

  @Mutation({ input: reprintPassportRequestSchema })
  async reprint(@Input() input: ReprintPassportRequest) {
    return unwrap(await this.passportService.reprint(input.originalPassportId));
  }
}
