// --- Audit Router - tRPC entry point ---
//
// Read-only surface over the centralized audit_log table (ADR-0007).
// RLS already scopes rows to SUPER_ADMIN / VD_ADMIN; the @Policy below mirrors
// the client-side nav filter (sm:audit permission) for defense-in-depth.

import { Inject, Injectable } from "@nestjs/common";
import { Policy, RegisterPolicy } from "@rocky/authorization/index.js";
import { AuditService } from "@rocky/domains-audit";
import { createResultUnwrapper } from "@rocky/trpc/index.js";
import {
  type AuditListRequest,
  auditListRequestSchema,
  auditListResponseSchema,
  type AuditListResponse,
} from "@rocky/validators/api/index.js";
import { AUDIT_TRPC_ERROR_MAP } from "@rocky/validators/errors/index.js";
import { Input, Query, Router } from "nestjs-trpc";
import { z } from "zod";
import type { SubtypeGuillotine, ActivateGuillotines } from "@rocky/validators/utils";

const unwrap = createResultUnwrapper(AUDIT_TRPC_ERROR_MAP);

@Router({ alias: "audit" })
@RegisterPolicy("audit")
@Policy({ authenticated: true })
@Injectable()
export class AuditRouter {
  constructor(
    @Inject(AuditService)
    private readonly auditService: AuditService,
  ) {}

  @Query({
    input: auditListRequestSchema,
    output: auditListResponseSchema,
  })
  @Policy({ action: "sm:audit:read" })
  async list(@Input() input: AuditListRequest): Promise<AuditListResponse> {
    return unwrap(await this.auditService.list(input, input.limit, input.offset));
  }
}

// SubtypeGuillotine (one-directional: schema output ⊆ return type) — response
// schemas are Drizzle-derived projections; the hand-written interface is the
// wider SSOT, so AssertEqual would false-positive. See audit G3.
type _verify_listOutput = SubtypeGuillotine<
  z.output<typeof auditListResponseSchema>,
  Awaited<ReturnType<AuditRouter["list"]>>
>;

export type _AuditGuillotines = ActivateGuillotines<[
  _verify_listOutput
]>;
