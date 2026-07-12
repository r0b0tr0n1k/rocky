// --- Device Router - tRPC entry point ---

import { Inject, Injectable } from "@nestjs/common";
import { Policy, RegisterPolicy } from "@rocky/authorization/index.js";
import { DeviceService } from "@rocky/domains-device";
import type { AppContext } from "@rocky/trpc/index.js";
import { createResultUnwrapper } from "@rocky/trpc/index.js";
import type {
  AssignDeviceUserRequest,
  CreatePdaDeviceRequest,
  RegisterFailedAttemptDeviceRequest,
  RecordSyncRequest,
  UnblockDeviceRequest,
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
  registerFailedAttemptDeviceRequestSchema,
  unblockDeviceRequestSchema,
  updatePdaDeviceRequestSchema,
} from "@rocky/validators/api/index.js";
import { DEVICE_TRPC_ERROR_MAP } from "@rocky/validators/errors/index.js";
import { Ctx, Input, Mutation, Query, Router } from "nestjs-trpc";
import { z } from "zod";
import type { SubtypeGuillotine, ActivateGuillotines } from "@rocky/validators/utils";

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

  @Mutation({ input: registerFailedAttemptDeviceRequestSchema, output: pdaDeviceBlockedResponseSchema })
  async registerFailedAttempt(@Input() input: RegisterFailedAttemptDeviceRequest) {
    return unwrap(await this.deviceService.registerFailedAttempt(input.deviceId));
  }

  @Mutation({ input: unblockDeviceRequestSchema, output: pdaDeviceResponseSchema })
  async unblock(@Input() input: UnblockDeviceRequest) {
    return unwrap(await this.deviceService.unblock(input.deviceId));
  }
}

// SubtypeGuillotine (one-directional: schema output ⊆ return type) — response
// schemas are Drizzle-derived projections; the hand-written interface is the
// wider SSOT, so AssertEqual would false-positive. See audit G3.
type _verify_getByIdOutput = SubtypeGuillotine<
  z.output<typeof pdaDeviceResponseSchema>,
  Awaited<ReturnType<DeviceRouter["getById"]>>
>;
type _verify_listOutput = SubtypeGuillotine<
  z.output<typeof pdaDeviceListResponseSchema>,
  Awaited<ReturnType<DeviceRouter["list"]>>
>;
type _verify_createOutput = SubtypeGuillotine<
  z.output<typeof pdaDeviceResponseSchema>,
  Awaited<ReturnType<DeviceRouter["create"]>>
>;
type _verify_updateOutput = SubtypeGuillotine<
  z.output<typeof pdaDeviceResponseSchema>,
  Awaited<ReturnType<DeviceRouter["update"]>>
>;
type _verify_assignUserOutput = SubtypeGuillotine<
  z.output<typeof pdaDeviceResponseSchema>,
  Awaited<ReturnType<DeviceRouter["assignUser"]>>
>;
type _verify_recordSyncOutput = SubtypeGuillotine<
  z.output<typeof pdaDeviceResponseSchema>,
  Awaited<ReturnType<DeviceRouter["recordSync"]>>
>;
type _verify_registerFailedAttemptOutput = SubtypeGuillotine<
  z.output<typeof pdaDeviceBlockedResponseSchema>,
  Awaited<ReturnType<DeviceRouter["registerFailedAttempt"]>>
>;
type _verify_unblockOutput = SubtypeGuillotine<
  z.output<typeof pdaDeviceResponseSchema>,
  Awaited<ReturnType<DeviceRouter["unblock"]>>
>;

export type _DeviceGuillotines = ActivateGuillotines<[
  _verify_getByIdOutput,
  _verify_listOutput,
  _verify_createOutput,
  _verify_updateOutput,
  _verify_assignUserOutput,
  _verify_recordSyncOutput,
  _verify_registerFailedAttemptOutput,
  _verify_unblockOutput
]>;
