// --- System Parameters Router - tRPC entry point ---
//
// Software preferences (sm.system_parameters). Read + update editable params.

import { Inject, Injectable } from "@nestjs/common";
import { Policy, RegisterPolicy } from "@rocky/authorization/index.js";
import { SystemService } from "@rocky/domains-system";
import { createResultUnwrapper } from "@rocky/trpc/index.js";
import {
  type SystemParameterListRequest,
  systemParameterListRequestSchema,
  systemParameterListResponseSchema,
  type SystemParameterListResponse,
  type UpdateSystemParameter,
  updateSystemParameterSchema,
  systemParameterResponseSchema,
} from "@rocky/validators/api/index.js";
import { SYSTEM_TRPC_ERROR_MAP } from "@rocky/validators/errors/index.js";
import { Input, Mutation, Query, Router } from "nestjs-trpc";
import { z } from "zod";

const unwrap = createResultUnwrapper(SYSTEM_TRPC_ERROR_MAP);

@Router({ alias: "systemParameters" })
@RegisterPolicy("systemParameters")
@Policy({ authenticated: true })
@Injectable()
export class SystemParametersRouter {
  constructor(
    @Inject(SystemService)
    private readonly systemService: SystemService,
  ) {}

  @Query({ input: systemParameterListRequestSchema, output: systemParameterListResponseSchema })
  @Policy({ action: "sm:sysparams:read" })
  async list(@Input() input: SystemParameterListRequest): Promise<SystemParameterListResponse> {
    return unwrap(await this.systemService.listParameters(input, input.limit, input.offset));
  }

  @Mutation({
    input: z.strictObject({ code: z.string(), data: updateSystemParameterSchema }),
    output: systemParameterResponseSchema,
  })
  @Policy({ action: "sm:sysparams:write" })
  async update(
    @Input() input: { code: string; data: UpdateSystemParameter },
  ): Promise<z.infer<typeof systemParameterResponseSchema>> {
    return unwrap(await this.systemService.updateParameter(input.code, input.data.value, input.data.isActive));
  }
}
