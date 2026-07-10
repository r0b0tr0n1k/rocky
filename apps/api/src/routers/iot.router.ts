// -- IoT Router - Device Registry, Sensor Readings, Geofences --
//
// Thin controller - delegates to IotService, unwraps Result<T,E>.
// Endpoints:
//   - iot.registerDevice, iot.listDevices, iot.getDevice
//   - iot.ingestReading, iot.ingestReadings, iot.listReadings
//   - iot.createGeofence, iot.listGeofences, iot.deleteGeofence
//   - iot.logGeofenceEvent, iot.listGeofenceEvents

import { Inject, Injectable } from "@nestjs/common";
import { Policy, RegisterPolicy } from "@rocky/authorization/index.js";
import { IotService } from "@rocky/domains-iot/index.js";
import type { AppContext } from "@rocky/trpc/context.js";
import { createResultUnwrapper } from "@rocky/trpc/index.js";
import type {
  CreateGeofenceRequest,
  IngestReadingRequest,
  LogGeofenceEventRequest,
  RegisterDeviceRequest,
} from "@rocky/validators/api/index.js";
import {
  createGeofenceRequestSchema,
  ingestReadingRequestSchema,
  listDevicesRequestSchema,
  listReadingsRequestSchema,
  logGeofenceEventRequestSchema,
  registerDeviceRequestSchema,
  geofenceEventListResponseSchema,
  geofenceEventResponseSchema,
  geofenceResponseSchema,
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
const geofenceArraySchema = z.array(geofenceResponseSchema);
const deleteGeofenceSchema = z.void();
@Router({ alias: "iot" })
@RegisterPolicy("iot")
@Policy({ authenticated: true })
@Injectable()
export class IotRouter {
  constructor(@Inject(IotService) private readonly iotService: IotService) { }

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

  // -- Geofences --

  @Mutation({ input: createGeofenceRequestSchema, output: geofenceResponseSchema })
  async createGeofence(@Input() input: CreateGeofenceRequest) {
    return unwrap(await this.iotService.createGeofence(input));
  }

  @Query({ input: z.object({ farmId: z.uuid() }), output: geofenceArraySchema })
  async listGeofences(@Input() input: { farmId: string }) {
    return unwrap(await this.iotService.listGeofencesByFarm(input.farmId));
  }

  @Mutation({ input: z.object({ id: z.uuid() }), output: deleteGeofenceSchema })
  async deleteGeofence(@Input() input: { id: string }) {
    return unwrap(await this.iotService.deleteGeofence(input.id));
  }

  // -- Geofence Events --

  @Mutation({ input: logGeofenceEventRequestSchema, output: geofenceEventResponseSchema })
  async logGeofenceEvent(@Input() input: LogGeofenceEventRequest) {
    return unwrap(await this.iotService.logGeofenceEvent(input));
  }

  @Query({
    input: z.object({
      animalId: z.uuid().optional(),
      geofenceId: z.uuid().optional(),
      farmId: z.uuid().optional(),
      limit: z.int().min(1).max(1000).default(50),
      offset: z.int().min(0).default(0),
    }),
    output: geofenceEventListResponseSchema,
  })
  async listGeofenceEvents(
    @Input() input: { animalId?: string; geofenceId?: string; farmId?: string; limit?: number; offset?: number },
  ) {
    return unwrap(await this.iotService.listGeofenceEvents(input));
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
type _verify_createGeofenceOutput = SubtypeGuillotine<
  z.output<typeof geofenceResponseSchema>,
  Awaited<ReturnType<IotRouter["createGeofence"]>>
>;
type _verify_listGeofencesOutput = SubtypeGuillotine<
  z.output<typeof geofenceArraySchema>,
  Awaited<ReturnType<IotRouter["listGeofences"]>>
>;
type _verify_deleteGeofenceOutput = SubtypeGuillotine<
  z.output<typeof deleteGeofenceSchema>,
  Awaited<ReturnType<IotRouter["deleteGeofence"]>>
>;
type _verify_logGeofenceEventOutput = SubtypeGuillotine<
  z.output<typeof geofenceEventResponseSchema>,
  Awaited<ReturnType<IotRouter["logGeofenceEvent"]>>
>;
type _verify_listGeofenceEventsOutput = SubtypeGuillotine<
  z.output<typeof geofenceEventListResponseSchema>,
  Awaited<ReturnType<IotRouter["listGeofenceEvents"]>>
>;

export type _IotGuillotines = ActivateGuillotines<[
  _verify_registerDeviceOutput,
  _verify_listDevicesOutput,
  _verify_getDeviceOutput,
  _verify_ingestReadingOutput,
  _verify_ingestReadingsOutput,
  _verify_listReadingsOutput,
  _verify_createGeofenceOutput,
  _verify_listGeofencesOutput,
  _verify_deleteGeofenceOutput,
  _verify_logGeofenceEventOutput,
  _verify_listGeofenceEventsOutput
]>;
