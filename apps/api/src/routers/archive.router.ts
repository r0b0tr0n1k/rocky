// --- Archive Router - tRPC entry point ---
// Consumes Diamond Seal schemas from @rocky/validators/api

import { Inject, Injectable } from "@nestjs/common";
import { Policy, RegisterPolicy } from "@rocky/authorization/index.js";
import { ArchiveService } from "@rocky/domains-archive";
import type { AppContext } from "@rocky/trpc/context.js";
import { createResultUnwrapper } from "@rocky/trpc/index.js";
import {
  type ArchiveInspectionFormRequest,
  archiveDocumentListRequestSchema,
  archiveInspectionFormRequestSchema,
  type CreateArchiveDocumentRequest,
  createArchiveDocumentRequestSchema,
} from "@rocky/validators/api/index.js";
import { ARCHIVE_TRPC_ERROR_MAP } from "@rocky/validators/errors/index.js";
import { Ctx, Input, Mutation, Query, Router } from "nestjs-trpc";
import { z } from "zod";

const idParam = z.object({ id: z.uuid() });
const unwrap = createResultUnwrapper(ARCHIVE_TRPC_ERROR_MAP);

@Router({ alias: "archive" })
@RegisterPolicy("archive")
@Policy({ authenticated: true })
@Injectable()
export class ArchiveRouter {
  constructor(@Inject(ArchiveService) private readonly archiveService: ArchiveService) {}

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
  async create(@Input() input: CreateArchiveDocumentRequest, @Ctx() ctx: AppContext) {
    return unwrap(await this.archiveService.create({ ...input, createdBy: ctx.execution?.principal.id }));
  }

  // ── Archival ──

  @Query({ input: z.strictObject({ limit: z.int().min(1).max(1000).default(100) }) })
  async listExpired(@Input() input: { limit: number }) {
    return unwrap(await this.archiveService.findExpiredRetention(input.limit));
  }

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
  async archiveInspectionForm(@Input() input: ArchiveInspectionFormRequest, @Ctx() ctx: AppContext) {
    return unwrap(
      await this.archiveService.archiveInspectionForm({ ...input, createdBy: ctx.execution?.principal.id }),
    );
  }
}
