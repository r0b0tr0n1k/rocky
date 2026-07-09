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

const unwrap = createResultUnwrapper(IOT_TRPC_ERROR_MAP);

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

  @Mutation({ input: z.object({ readings: z.array(ingestReadingRequestSchema) }), output: z.array(sensorReadingResponseSchema) })
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

  @Query({ input: z.object({ farmId: z.uuid() }), output: z.array(geofenceResponseSchema) })
  async listGeofences(@Input() input: { farmId: string }) {
    return unwrap(await this.iotService.listGeofencesByFarm(input.farmId));
  }

  @Mutation({ input: z.object({ id: z.uuid() }), output: z.void() })
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
