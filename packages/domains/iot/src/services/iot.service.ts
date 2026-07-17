import { fromAsyncThrowable, type Result, toAppError } from "@rocky/domains-shared";
import type {
  RegisterDeviceRequest,
  ListDevicesRequest,
  IngestReadingRequest,
  ListReadingsRequest,
  IotDeviceResponse,
  SensorReadingResponse,
} from "@rocky/validators/api";
import {
  iotDeviceResponseSchema,
  sensorReadingResponseSchema,
} from "@rocky/validators/api";
import { IOT_ERRORS, IotError } from "../errors/iot.errors.js";
import type { IotRepository } from "../repositories/iot.repository.js";
import { randomUUID } from "node:crypto";

export class IotService {
  constructor(private readonly repo: IotRepository) {}

  // ── Devices ──

  async getDevice(id: string): Promise<Result<IotDeviceResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const device = await this.repo.findDeviceById(id);
      if (!device) throw new IotError(IOT_ERRORS.DEVICE_NOT_FOUND, { id });
      return iotDeviceResponseSchema.parse(device);
    }, toAppError)();
  }

  async listDevices(input: ListDevicesRequest): Promise<Result<{ data: IotDeviceResponse[]; total: number; limit: number; offset: number }, Error>> {
    return fromAsyncThrowable(async () => {
      const { data, total } = await this.repo.listDevices({
        ...input,
        limit: input.limit ?? 20,
        offset: input.offset ?? 0,
      });
      return { data: data.map((d: unknown) => iotDeviceResponseSchema.parse(d)), total, limit: input.limit ?? 20, offset: input.offset ?? 0 };
    }, toAppError)();
  }

  async registerDevice(data: RegisterDeviceRequest & { createdBy?: string }): Promise<Result<IotDeviceResponse, Error>> {
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
      const device = await this.repo.insertDevice({
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
       });
       return iotDeviceResponseSchema.parse(device);
    }, toAppError)();
  }

  // ── Sensor Readings ──

  async ingestReading(data: IngestReadingRequest): Promise<Result<SensorReadingResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const reading = await this.repo.insertReading({
        deviceId: data.deviceId,
        animalId: data.animalId,
        farmId: data.farmId,
        recordedAt: new Date(data.recordedAt),
        readingType: data.readingType,
        valueNumeric: data.valueNumeric?.toString(),
        valueText: data.valueText,
        unit: data.unit,
        location: data.latitude && data.longitude
          ? { x: data.longitude, y: data.latitude }
          : undefined,
        rawPayload: data.rawPayload,
       });
       return sensorReadingResponseSchema.parse(reading);
    }, toAppError)();
  }

  async ingestReadings(dataArray: IngestReadingRequest[]): Promise<Result<SensorReadingResponse[], Error>> {
    return fromAsyncThrowable(async () => {
      const rows = await this.repo.insertReadings(dataArray.map((d) => ({
        deviceId: d.deviceId,
        animalId: d.animalId,
        farmId: d.farmId,
        recordedAt: new Date(d.recordedAt),
        readingType: d.readingType,
        valueNumeric: d.valueNumeric?.toString(),
        valueText: d.valueText,
        unit: d.unit,
        location: d.latitude && d.longitude
          ? { x: d.longitude, y: d.latitude }
          : undefined,
        rawPayload: d.rawPayload,
       })));
       return rows.map((r: unknown) => sensorReadingResponseSchema.parse(r));
    }, toAppError)();
  }

  async listReadings(input: ListReadingsRequest): Promise<Result<{ data: SensorReadingResponse[]; total: number; limit: number; offset: number }, Error>> {
    return fromAsyncThrowable(async () => {
      const { data, total } = await this.repo.listReadings({
        ...input,
        fromDate: input.fromDate ? new Date(input.fromDate) : undefined,
        toDate: input.toDate ? new Date(input.toDate) : undefined,
        limit: input.limit ?? 100,
        offset: input.offset ?? 0,
      });
      return { data: data.map((d: unknown) => sensorReadingResponseSchema.parse(d)), total, limit: input.limit ?? 100, offset: input.offset ?? 0 };
    }, toAppError)();
  }

}
