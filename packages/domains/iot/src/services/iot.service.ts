import { fromAsyncThrowable, type Result, toAppError } from "@rocky/domains-shared";
import { iotDevices } from "@rocky/database";
import type {
  RegisterDeviceRequest,
  ListDevicesRequest,
  IngestReadingRequest,
  ListReadingsRequest,
  CreateGeofenceRequest,
  LogGeofenceEventRequest,
} from "@rocky/validators/api";
import { IOT_ERRORS, IotError } from "../errors/iot.errors.js";
import type { IotRepository } from "../repositories/iot.repository.js";
import { randomUUID } from "node:crypto";

export class IotService {
  constructor(private readonly repo: IotRepository) {}

  // ── Devices ──

  async getDevice(id: string): Promise<Result<Awaited<ReturnType<IotRepository["findDeviceById"]>>, Error>> {
    return fromAsyncThrowable(async () => {
      const device = await this.repo.findDeviceById(id);
      if (!device) throw new IotError(IOT_ERRORS.DEVICE_NOT_FOUND, { id });
      return device;
    }, toAppError)();
  }

  async listDevices(input: ListDevicesRequest): Promise<Result<Awaited<ReturnType<IotRepository["listDevices"]>>, Error>> {
    return fromAsyncThrowable(async () => {
      return this.repo.listDevices({
        ...input,
        limit: input.limit ?? 20,
        offset: input.offset ?? 0,
      });
    }, toAppError)();
  }

  async registerDevice(data: RegisterDeviceRequest & { createdBy?: string }): Promise<Result<Awaited<ReturnType<IotRepository["insertDevice"]>>, Error>> {
    return fromAsyncThrowable(async () => {
      if (data.deviceEui) {
        const existing = await this.repo.findDeviceByEui(data.deviceEui);
        if (existing) {
          throw new IotError(IOT_ERRORS.INVALID_INPUT, {
            deviceEui: data.deviceEui,
            message: "Device with this EUI already exists",
          });
        }
      }
      return this.repo.insertDevice({
        id: randomUUID(),
        deviceEui: data.deviceEui,
        manufacturer: data.manufacturer,
        model: data.model,
        serialNumber: data.serialNumber,
        firmwareVersion: data.firmwareVersion,
        transmissionType: data.transmissionType,
        transmissionIntervalSeconds: data.transmissionIntervalSeconds,
        assignedToAnimalId: data.assignedToAnimalId,
        assignedToFarmId: data.assignedToFarmId,
        activationDate: data.activationDate,
        createdBy: data.createdBy,
      } as typeof iotDevices.$inferInsert);
    }, toAppError)();
  }

  // ── Sensor Readings ──

  async ingestReading(data: IngestReadingRequest): Promise<Result<Awaited<ReturnType<IotRepository["insertReading"]>>, Error>> {
    return fromAsyncThrowable(async () => {
      return this.repo.insertReading({
        deviceId: data.deviceId,
        animalId: data.animalId,
        farmId: data.farmId,
        recordedAt: new Date(data.recordedAt),
        readingType: data.readingType,
        valueNumeric: data.valueNumeric?.toString(),
        valueText: data.valueText,
        unit: data.unit,
        location: data.latitude && data.longitude
          ? { type: "Point", coordinates: [data.longitude, data.latitude] }
          : undefined,
        rawPayload: data.rawPayload,
      } as any);
    }, toAppError)();
  }

  async ingestReadings(dataArray: IngestReadingRequest[]): Promise<Result<Awaited<ReturnType<IotRepository["insertReadings"]>>, Error>> {
    return fromAsyncThrowable(async () => {
      return this.repo.insertReadings(dataArray.map((d) => ({
        deviceId: d.deviceId,
        animalId: d.animalId,
        farmId: d.farmId,
        recordedAt: new Date(d.recordedAt),
        readingType: d.readingType,
        valueNumeric: d.valueNumeric?.toString(),
        valueText: d.valueText,
        unit: d.unit,
        location: d.latitude && d.longitude
          ? { type: "Point", coordinates: [d.longitude, d.latitude] }
          : undefined,
        rawPayload: d.rawPayload,
      } as any)));
    }, toAppError)();
  }

  async listReadings(input: ListReadingsRequest): Promise<Result<Awaited<ReturnType<IotRepository["listReadings"]>>, Error>> {
    return fromAsyncThrowable(async () => {
      return this.repo.listReadings({
        ...input,
        fromDate: input.fromDate ? new Date(input.fromDate) : undefined,
        toDate: input.toDate ? new Date(input.toDate) : undefined,
        limit: input.limit ?? 100,
        offset: input.offset ?? 0,
      });
    }, toAppError)();
  }

  // ── Geofences ──

  async createGeofence(data: CreateGeofenceRequest): Promise<Result<Awaited<ReturnType<IotRepository["insertGeofence"]>>, Error>> {
    return fromAsyncThrowable(async () => {
      return this.repo.insertGeofence({
        name: data.name,
        description: data.description,
        farmId: data.farmId,
        pastureId: data.pastureId,
        fenceType: data.fenceType,
        geometry: data.geometry,
      } as any);
    }, toAppError)();
  }

  async listGeofencesByFarm(farmId: string): Promise<Result<Awaited<ReturnType<IotRepository["listGeofencesByFarm"]>>, Error>> {
    return fromAsyncThrowable(async () => {
      return this.repo.listGeofencesByFarm(farmId);
    }, toAppError)();
  }

  async deleteGeofence(id: string): Promise<Result<void, Error>> {
    return fromAsyncThrowable(async () => {
      const existing = await this.repo.findGeofenceById(id);
      if (!existing) throw new IotError(IOT_ERRORS.GEOFENCE_NOT_FOUND, { id });
      await this.repo.deleteGeofence(id);
    }, toAppError)();
  }

  // ── Geofence Events ──

  async logGeofenceEvent(data: LogGeofenceEventRequest): Promise<Result<Awaited<ReturnType<IotRepository["insertGeofenceEvent"]>>, Error>> {
    return fromAsyncThrowable(async () => {
      return this.repo.insertGeofenceEvent({
        animalId: data.animalId,
        geofenceId: data.geofenceId,
        farmId: data.farmId,
        eventType: data.eventType,
        eventAt: new Date(data.eventAt),
        location: data.latitude && data.longitude
          ? { type: "Point", coordinates: [data.longitude, data.latitude] }
          : undefined,
        source: data.source,
      } as any);
    }, toAppError)();
  }

  async listGeofenceEvents(input: {
    animalId?: string;
    geofenceId?: string;
    farmId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Result<Awaited<ReturnType<IotRepository["listGeofenceEvents"]>>, Error>> {
    return fromAsyncThrowable(async () => {
      return this.repo.listGeofenceEvents({
        ...input,
        limit: input.limit ?? 50,
        offset: input.offset ?? 0,
      });
    }, toAppError)();
  }
}
