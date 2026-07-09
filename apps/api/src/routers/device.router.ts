// --- Device Router - tRPC entry point ---

import { Inject, Injectable } from "@nestjs/common";
import { Policy, RegisterPolicy } from "@rocky/authorization/index.js";
import { DeviceService } from "@rocky/domains-device";
import type { AppContext } from "@rocky/trpc/index.js";
import { createResultUnwrapper } from "@rocky/trpc/index.js";
import type {
  AssignDeviceUserRequest,
  CreatePdaDeviceRequest,
  RecordSyncRequest,
  UpdatePdaDeviceRequest,
} from "@rocky/validators/api";
import {
  assignDeviceUserRequestSchema,
  createPdaDeviceRequestSchema,
  pdaDeviceBlockedResponseSchema,
  pdaDeviceListRequestSchema,
  pdaDeviceListResponseSchema,
  pdaDeviceResponseSchema,
  recordSyncRequestSchema,
  updatePdaDeviceRequestSchema,
} from "@rocky/validators/api/index.js";
import { DEVICE_TRPC_ERROR_MAP } from "@rocky/validators/errors/index.js";
import { Ctx, Input, Mutation, Query, Router } from "nestjs-trpc";
import { z } from "zod";

const idParam = z.object({ id: z.uuid() });
const unwrap = createResultUnwrapper(DEVICE_TRPC_ERROR_MAP);

@Router({ alias: "device" })
@RegisterPolicy("device")
@Policy({ authenticated: true })
@Injectable()
export class DeviceRouter {
  constructor(@Inject(DeviceService) private readonly deviceService: DeviceService) {}

  @Query({ input: idParam, output: pdaDeviceResponseSchema })
  async getById(@Input() input: { id: string }) {
    return unwrap(await this.deviceService.getById(input.id));
  }

  @Query({ input: pdaDeviceListRequestSchema, output: pdaDeviceListResponseSchema })
  async list(@Input() input: z.infer<typeof pdaDeviceListRequestSchema>) {
    return unwrap(await this.deviceService.list(input));
  }

  @Mutation({ input: createPdaDeviceRequestSchema, output: pdaDeviceResponseSchema })
  async create(@Input() input: CreatePdaDeviceRequest, @Ctx() ctx: AppContext) {
    return unwrap(await this.deviceService.create({ ...input, createdBy: ctx.execution?.principal.id }));
  }

  @Mutation({ input: idParam.partial().extend(updatePdaDeviceRequestSchema.shape), output: pdaDeviceResponseSchema })
  async update(@Input() input: { id: string } & UpdatePdaDeviceRequest) {
    const { id, ...data } = input;
    return unwrap(await this.deviceService.update(id, data));
  }

  @Mutation({ input: assignDeviceUserRequestSchema, output: pdaDeviceResponseSchema })
  async assignUser(@Input() input: AssignDeviceUserRequest) {
    return unwrap(await this.deviceService.assignUser(input.deviceId, input.userId));
  }

  @Mutation({ input: recordSyncRequestSchema, output: pdaDeviceResponseSchema })
  async recordSync(@Input() input: RecordSyncRequest) {
    return unwrap(await this.deviceService.recordSync(input.deviceId));
  }

  @Mutation({ input: idParam, output: pdaDeviceBlockedResponseSchema })
  async registerFailedAttempt(@Input() input: { id: string }) {
    return unwrap(await this.deviceService.registerFailedAttempt(input.id));
  }

  @Mutation({ input: idParam, output: pdaDeviceResponseSchema })
  async unblock(@Input() input: { id: string }) {
    return unwrap(await this.deviceService.unblock(input.id));
  }
}
