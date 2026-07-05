// ── Archive Router — tRPC entry point ──
// Consumes Diamond Seal schemas from @rocky/validators/api

import { Injectable, Inject } from "@nestjs/common";
import { Router, Query, Mutation, Input, Ctx, UseMiddlewares } from "nestjs-trpc";
import { z } from "zod";
import { createResultUnwrapper } from "@rocky/trpc";
import { ARCHIVE_TRPC_ERROR_MAP } from "@rocky/validators/errors";
import { ProtectedMiddleware, type ProtectedMiddlewareContext } from "../trpc/middlewares/protected.middleware.js";
import { ArchiveService } from "@rocky/domains-archive";
import {
  archiveDocumentListRequestSchema,
  createArchiveDocumentRequestSchema,
  archiveInspectionFormRequestSchema,
  type CreateArchiveDocumentRequest,
  type ArchiveInspectionFormRequest,
} from "@rocky/validators/api";

const idParam = z.object({ id: z.uuid() });
const unwrap = createResultUnwrapper(ARCHIVE_TRPC_ERROR_MAP);

@Router({ alias: "archive" })
@UseMiddlewares(ProtectedMiddleware)
@Injectable()
export class ArchiveRouter {
  constructor(
    @Inject(ArchiveService) private readonly archiveService: ArchiveService,
  ) { }

  // ── CRUD ──

  @Query({ input: idParam })
  async getById(@Input() input: { id: string }) {
    return unwrap(await this.archiveService.getById(input.id));
  }

  @Query({ input: archiveDocumentListRequestSchema })
  async list(@Input() input: z.infer<typeof archiveDocumentListRequestSchema>) {
    return unwrap(await this.archiveService.list(input));
  }

  @Mutation({ input: createArchiveDocumentRequestSchema })
  async create(
    @Input() input: CreateArchiveDocumentRequest,
    @Ctx() ctx: ProtectedMiddlewareContext,
  ) {
    return unwrap(
      await this.archiveService.create({ ...input, createdBy: ctx.auth.userId }),
    );
  }

  // ── Archival ──

  @Mutation({ input: idParam })
  async markArchived(@Input() input: { id: string }) {
    return unwrap(await this.archiveService.markArchived(input.id));
  }

  @Mutation({ input: idParam })
  async markDestroyed(@Input() input: { id: string }) {
    return unwrap(await this.archiveService.markDestroyed(input.id));
  }

  // ── Inspection Form Integration ──

  @Mutation({ input: archiveInspectionFormRequestSchema })
  async archiveInspectionForm(
    @Input() input: ArchiveInspectionFormRequest,
    @Ctx() ctx: ProtectedMiddlewareContext,
  ) {
    return unwrap(
      await this.archiveService.archiveInspectionForm({ ...input, createdBy: ctx.auth.userId }),
    );
  }
}
