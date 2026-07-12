// --- Archive Router - tRPC entry point ---
// Consumes Diamond Seal schemas from @rocky/validators/api

import { Inject, Injectable } from "@nestjs/common";
import { Policy, RegisterPolicy } from "@rocky/authorization/index.js";
import { ArchiveService } from "@rocky/domains-archive";
import type { AppContext } from "@rocky/trpc/context.js";
import { createResultUnwrapper } from "@rocky/trpc/index.js";
import {
  archiveDocumentResponseSchema,
  archiveDocumentListResponseSchema,
  archiveExpiredListResponseSchema,
  type ArchiveInspectionFormRequest,
  archiveDocumentListRequestSchema,
  archiveInspectionFormRequestSchema,
  type CreateArchiveDocumentRequest,
  createArchiveDocumentRequestSchema,
  type MarkDestroyedArchiveRequest,
  markDestroyedArchiveRequestSchema,
} from "@rocky/validators/api/index.js";
import { ARCHIVE_TRPC_ERROR_MAP } from "@rocky/validators/errors/index.js";
import { Ctx, Input, Mutation, Query, Router } from "nestjs-trpc";
import { z } from "zod";
import type { SubtypeGuillotine, ActivateGuillotines } from "@rocky/validators/utils";

const idParam = z.object({ id: z.uuid() });
const unwrap = createResultUnwrapper(ARCHIVE_TRPC_ERROR_MAP);

@Router({ alias: "archive" })
@RegisterPolicy("archive")
@Policy({ authenticated: true })
@Injectable()
export class ArchiveRouter {
  constructor(@Inject(ArchiveService) private readonly archiveService: ArchiveService) {}

  // -- CRUD --

  @Query({ input: idParam, output: archiveDocumentResponseSchema })
  async getById(@Input() input: { id: string }) {
    return unwrap(await this.archiveService.getById(input.id));
  }

  @Query({ input: archiveDocumentListRequestSchema, output: archiveDocumentListResponseSchema })
  async list(@Input() input: z.infer<typeof archiveDocumentListRequestSchema>) {
    return unwrap(await this.archiveService.list(input));
  }

  @Mutation({ input: createArchiveDocumentRequestSchema, output: archiveDocumentResponseSchema })
  async create(@Input() input: CreateArchiveDocumentRequest, @Ctx() ctx: AppContext) {
    return unwrap(await this.archiveService.create(input));
  }

  // -- Archival --

  @Query({ input: z.strictObject({ limit: z.int().min(1).max(1000).default(100) }), output: archiveExpiredListResponseSchema })
  async listExpired(@Input() input: { limit: number }) {
    return unwrap(await this.archiveService.findExpiredRetention(input.limit));
  }

  @Mutation({ input: idParam, output: archiveDocumentResponseSchema })
  async markArchived(@Input() input: { id: string }) {
    return unwrap(await this.archiveService.markArchived(input.id));
  }

  @Mutation({ input: markDestroyedArchiveRequestSchema, output: archiveDocumentResponseSchema })
  async markDestroyed(@Input() input: MarkDestroyedArchiveRequest) {
    return unwrap(await this.archiveService.markDestroyed(input.id));
  }

  // -- Inspection Form Integration --

  @Mutation({ input: archiveInspectionFormRequestSchema, output: archiveDocumentResponseSchema })
  async archiveInspectionForm(@Input() input: ArchiveInspectionFormRequest, @Ctx() ctx: AppContext) {
    return unwrap(
      await this.archiveService.archiveInspectionForm({ ...input, createdBy: ctx.execution?.principal.id }),
    );
  }
}

// SubtypeGuillotine (one-directional: schema output ⊆ return type) — response
// schemas are Drizzle-derived projections; the hand-written interface is the
// wider SSOT, so AssertEqual would false-positive. See audit G3.
type _verify_getByIdOutput = SubtypeGuillotine<
  z.output<typeof archiveDocumentResponseSchema>,
  Awaited<ReturnType<ArchiveRouter["getById"]>>
>;
type _verify_listOutput = SubtypeGuillotine<
  z.output<typeof archiveDocumentListResponseSchema>,
  Awaited<ReturnType<ArchiveRouter["list"]>>
>;
type _verify_createOutput = SubtypeGuillotine<
  z.output<typeof archiveDocumentResponseSchema>,
  Awaited<ReturnType<ArchiveRouter["create"]>>
>;
type _verify_listExpiredOutput = SubtypeGuillotine<
  z.output<typeof archiveExpiredListResponseSchema>,
  Awaited<ReturnType<ArchiveRouter["listExpired"]>>
>;
type _verify_markArchivedOutput = SubtypeGuillotine<
  z.output<typeof archiveDocumentResponseSchema>,
  Awaited<ReturnType<ArchiveRouter["markArchived"]>>
>;
type _verify_markDestroyedOutput = SubtypeGuillotine<
  z.output<typeof archiveDocumentResponseSchema>,
  Awaited<ReturnType<ArchiveRouter["markDestroyed"]>>
>;
type _verify_archiveInspectionFormOutput = SubtypeGuillotine<
  z.output<typeof archiveDocumentResponseSchema>,
  Awaited<ReturnType<ArchiveRouter["archiveInspectionForm"]>>
>;

export type _ArchiveGuillotines = ActivateGuillotines<[
  _verify_getByIdOutput,
  _verify_listOutput,
  _verify_createOutput,
  _verify_listExpiredOutput,
  _verify_markArchivedOutput,
  _verify_markDestroyedOutput,
  _verify_archiveInspectionFormOutput
]>;
