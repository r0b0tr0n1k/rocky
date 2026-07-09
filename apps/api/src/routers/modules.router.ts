// --- Modules Router - tRPC entry point ---
//
// Feature-flag registry (sm.modules). Global enable/disable of application
// modules. Per-user-group gating (module_roles) is a future extension.

import { Inject, Injectable } from "@nestjs/common";
import { Policy, RegisterPolicy } from "@rocky/authorization/index.js";
import { SystemService } from "@rocky/domains-system";
import { createResultUnwrapper } from "@rocky/trpc/index.js";
import {
  type ModuleListRequest,
  moduleListRequestSchema,
  moduleListResponseSchema,
  type ModuleListResponse,
  type ModuleResponse,
  moduleResponseSchema,
  type UpdateModule,
  updateModuleSchema,
} from "@rocky/validators/api/index.js";
import { SYSTEM_TRPC_ERROR_MAP } from "@rocky/validators/errors/index.js";
import { Input, Mutation, Query, Router } from "nestjs-trpc";
import { z } from "zod";

const unwrap = createResultUnwrapper(SYSTEM_TRPC_ERROR_MAP);

@Router({ alias: "modules" })
@RegisterPolicy("modules")
@Policy({ authenticated: true })
@Injectable()
export class ModulesRouter {
  constructor(
    @Inject(SystemService)
    private readonly systemService: SystemService,
  ) {}

  @Query({ input: moduleListRequestSchema, output: moduleListResponseSchema })
  @Policy({ action: "sm:modules:read" })
  async list(@Input() input: ModuleListRequest): Promise<ModuleListResponse> {
    return unwrap(await this.systemService.listModules(input, input.limit, input.offset));
  }

  @Mutation({
    input: z.strictObject({ id: z.uuid(), data: updateModuleSchema }),
    output: moduleResponseSchema,
  })
  @Policy({ action: "sm:modules:write" })
  async update(@Input() input: { id: string; data: UpdateModule }): Promise<ModuleResponse> {
    return unwrap(await this.systemService.updateModule(input.id, input.data.isActive));
  }
}
