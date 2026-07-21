// -- IoT Router - Device Registry & Sensor Readings --
//
// Thin controller - delegates to IotService, unwraps Result<T,E>.
// Endpoints:
//   - iot.registerDevice, iot.listDevices, iot.getDevice
//   - iot.ingestReading, iot.ingestReadings, iot.listReadings

import { Inject, Injectable } from "@nestjs/common";
import { Policy, RegisterPolicy } from "@rocky/authorization/index.js";
import { IotService } from "@rocky/domains-iot/index.js";
import type { AppContext } from "@rocky/trpc/context.js";
import { createResultUnwrapper } from "@rocky/trpc/index.js";
import type { IngestReadingRequest, RegisterDeviceRequest } from "@rocky/validators/api/index.js";
import {
  ingestReadingRequestSchema,
  listDevicesRequestSchema,
  listReadingsRequestSchema,
  registerDeviceRequestSchema,
  iotDeviceListResponseSchema,
  iotDeviceResponseSchema,
  sensorReadingListResponseSchema,
  sensorReadingResponseSchema,
} from "@rocky/validators/api/index.js";
import { IOT_TRPC_ERROR_MAP } from "@rocky/validators/errors/index.js";
import { Ctx, Input, Mutation, Query, Router } from "nestjs-trpc";
import { z } from "zod";
import type { SubtypeGuillotine, ActivateGuillotines } from "@rocky/validators/utils";

const unwrap = createResultUnwrapper(IOT_TRPC_ERROR_MAP);

// Named output schemas (were inline) — required so Bridge 2b can reference
// `z.output<typeof X>` and prove the declared contract vs the service Result.
const sensorReadingArraySchema = z.array(sensorReadingResponseSchema);
@Router({ alias: "iot" })
@RegisterPolicy("iot")
@Policy({ authenticated: true, feature: "iot" })
@Injectable()
export class IotRouter {
  constructor(@Inject(IotService) private readonly iotService: IotService) {}

  // -- Devices --

  @Mutation({ input: registerDeviceRequestSchema, output: iotDeviceResponseSchema })
  async registerDevice(@Input() input: RegisterDeviceRequest, @Ctx() ctx: AppContext) {
    return unwrap(await this.iotService.registerDevice({ ...input, createdBy: ctx.execution!.principal.id }));
  }

  @Query({ input: listDevicesRequestSchema, output: iotDeviceListResponseSchema })
  async listDevices(@Input() input: z.infer<typeof listDevicesRequestSchema>) {
    return unwrap(await this.iotService.listDevices(input));
  }

  @Query({ input: z.object({ id: z.uuid() }), output: iotDeviceResponseSchema })
  async getDevice(@Input() input: { id: string }) {
    return unwrap(await this.iotService.getDevice(input.id));
  }

  // -- Sensor Readings --

  @Mutation({ input: ingestReadingRequestSchema, output: sensorReadingResponseSchema })
  async ingestReading(@Input() input: IngestReadingRequest) {
    return unwrap(await this.iotService.ingestReading(input));
  }

  @Mutation({ input: z.object({ readings: z.array(ingestReadingRequestSchema) }), output: sensorReadingArraySchema })
  async ingestReadings(@Input() input: { readings: IngestReadingRequest[] }) {
    return unwrap(await this.iotService.ingestReadings(input.readings));
  }

  @Query({ input: listReadingsRequestSchema, output: sensorReadingListResponseSchema })
  async listReadings(@Input() input: z.infer<typeof listReadingsRequestSchema>) {
    return unwrap(await this.iotService.listReadings(input));
  }
}

// SubtypeGuillotine (one-directional: schema output ⊆ return type) — response
// schemas are Drizzle-derived projections; the hand-written interface is the
// wider SSOT, so AssertEqual would false-positive. See audit G3.
type _verify_registerDeviceOutput = SubtypeGuillotine<
  z.output<typeof iotDeviceResponseSchema>,
  Awaited<ReturnType<IotRouter["registerDevice"]>>
>;
type _verify_listDevicesOutput = SubtypeGuillotine<
  z.output<typeof iotDeviceListResponseSchema>,
  Awaited<ReturnType<IotRouter["listDevices"]>>
>;
type _verify_getDeviceOutput = SubtypeGuillotine<
  z.output<typeof iotDeviceResponseSchema>,
  Awaited<ReturnType<IotRouter["getDevice"]>>
>;
type _verify_ingestReadingOutput = SubtypeGuillotine<
  z.output<typeof sensorReadingResponseSchema>,
  Awaited<ReturnType<IotRouter["ingestReading"]>>
>;
type _verify_ingestReadingsOutput = SubtypeGuillotine<
  z.output<typeof sensorReadingArraySchema>,
  Awaited<ReturnType<IotRouter["ingestReadings"]>>
>;
type _verify_listReadingsOutput = SubtypeGuillotine<
  z.output<typeof sensorReadingListResponseSchema>,
  Awaited<ReturnType<IotRouter["listReadings"]>>
>;

export type _IotGuillotines = ActivateGuillotines<
  [
    _verify_registerDeviceOutput,
    _verify_listDevicesOutput,
    _verify_getDeviceOutput,
    _verify_ingestReadingOutput,
    _verify_ingestReadingsOutput,
    _verify_listReadingsOutput,
  ]
>;
