// --- Sync Router - top-level tRPC entry point (WO-081) ---
// Replaces the health-router PDA sync stub with a dedicated, RLS-scoped sync engine.
// syncDownload pulls field entities + health master data (watermark/LWW);
// syncUpload applies PDA-created records with idempotency + version checks.

import { Injectable } from "@nestjs/common";
import { Policy, RegisterPolicy } from "@rocky/authorization/index.js";
import { SyncService } from "@rocky/domains-sync";
import type { AppContext } from "@rocky/trpc/context.js";
import { createResultUnwrapper } from "@rocky/trpc/index.js";
import {
  syncDownloadRequestSchema,
  type SyncDownloadRequest,
  syncDownloadResponseSchema,
  type SyncDownloadResponse,
  syncUploadRequestSchema,
  type SyncUploadRequest,
  syncUploadResponseSchema,
  type SyncUploadResponse,
} from "@rocky/validators/api/index.js";
import { Ctx, Input, Mutation, Query, Router } from "nestjs-trpc";

const unwrap = createResultUnwrapper();

@Router({ alias: "sync" })
@RegisterPolicy("sync")
@Policy({ authenticated: true })
@Injectable()
export class SyncRouter {
  constructor(private readonly syncService: SyncService) {}

  @Query({ input: syncDownloadRequestSchema, output: syncDownloadResponseSchema })
  async syncDownload(@Input() input: SyncDownloadRequest): Promise<SyncDownloadResponse> {
    return unwrap(await this.syncService.syncDownload(input.since ?? null));
  }

  @Mutation({ input: syncUploadRequestSchema, output: syncUploadResponseSchema })
  async syncUpload(@Input() input: SyncUploadRequest, @Ctx() ctx: AppContext): Promise<SyncUploadResponse> {
    return unwrap(
      await this.syncService.syncUpload({
        records: input.records,
        createdBy: ctx.execution!.principal.id,
      }),
    );
  }
}
