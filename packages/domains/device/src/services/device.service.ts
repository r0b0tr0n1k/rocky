import { fromAsyncThrowable, type Result, toAppError } from "@rocky/domains-shared";
import type {
  CreatePdaDeviceRequest,
  PdaDeviceListResponse,
  PdaDeviceResponse,
  UpdatePdaDeviceRequest,
} from "@rocky/validators/api";
import { pdaDeviceResponseSchema, pdaDeviceSummarySchema } from "@rocky/validators/api";
import { DEVICE_ERRORS, DeviceError } from "../errors/device.errors.js";
import type { DeviceRepository } from "../repositories/device.repository.js";
import { randomUUID } from "node:crypto";

const MAX_FAILED_ATTEMPTS = 3;

export class DeviceService {
  constructor(private readonly repo: DeviceRepository) {}

  async getById(id: string): Promise<Result<PdaDeviceResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const device = await this.repo.findById(id);
      if (!device) throw new DeviceError(DEVICE_ERRORS.NOT_FOUND, { id });
      return pdaDeviceResponseSchema.parse(device);
    }, toAppError)();
  }

  async list(input: { status?: string; search?: string }): Promise<Result<PdaDeviceListResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const { data, total } = await this.repo.listFiltered(input);
      return {
        data: data.map((d: typeof data[number]) => pdaDeviceSummarySchema.parse(d)),
        total,
      };
    }, toAppError)();
  }

  async create(input: CreatePdaDeviceRequest & { createdBy?: string }): Promise<Result<PdaDeviceResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const existing = await this.repo.findByIdentifier(input.deviceIdentifier);
      if (existing) {
        throw new DeviceError(DEVICE_ERRORS.INVALID_INPUT, {
          deviceIdentifier: input.deviceIdentifier,
          message: "Device with this identifier already exists",
        });
      }
      const deviceId = randomUUID();
      const device = await this.repo.insert({
        ...input,
        id: deviceId,
        createdBy: input.createdBy,
      } as typeof import("@rocky/database").pdaDevices.$inferInsert);
      return pdaDeviceResponseSchema.parse(device);
    }, toAppError)();
  }

  async update(id: string, input: UpdatePdaDeviceRequest): Promise<Result<PdaDeviceResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const device = await this.repo.update(id, input as Partial<typeof import("@rocky/database").pdaDevices.$inferInsert>);
      if (!device) throw new DeviceError(DEVICE_ERRORS.NOT_FOUND, { id });
      return pdaDeviceResponseSchema.parse(device);
    }, toAppError)();
  }

  async assignUser(deviceId: string, userId: string): Promise<Result<PdaDeviceResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const device = await this.repo.findById(deviceId);
      if (!device) throw new DeviceError(DEVICE_ERRORS.NOT_FOUND, { id: deviceId });
      if (device.status === "blocked") throw new DeviceError(DEVICE_ERRORS.DEVICE_BLOCKED, { deviceId });
      const updated = await this.repo.assignUser(deviceId, userId);
      return pdaDeviceResponseSchema.parse(updated);
    }, toAppError)();
  }

  async recordSync(deviceId: string): Promise<Result<PdaDeviceResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const device = await this.repo.findById(deviceId);
      if (!device) throw new DeviceError(DEVICE_ERRORS.NOT_FOUND, { id: deviceId });
      if (device.status === "blocked") throw new DeviceError(DEVICE_ERRORS.DEVICE_BLOCKED, { deviceId });
      const updated = await this.repo.recordSync(deviceId);
      return pdaDeviceResponseSchema.parse(updated);
    }, toAppError)();
  }

  async registerFailedAttempt(deviceId: string): Promise<Result<{ blocked: boolean }, Error>> {
    return fromAsyncThrowable(async () => {
      const device = await this.repo.findById(deviceId);
      if (!device) throw new DeviceError(DEVICE_ERRORS.NOT_FOUND, { id: deviceId });
      await this.repo.incrementFailedAttempts(deviceId);
      const newCount = device.failedAttempts + 1;
      if (newCount >= MAX_FAILED_ATTEMPTS) {
        await this.repo.block(deviceId);
        return { blocked: true };
      }
      return { blocked: false };
    }, toAppError)();
  }

  async unblock(deviceId: string): Promise<Result<PdaDeviceResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const device = await this.repo.findById(deviceId);
      if (!device) throw new DeviceError(DEVICE_ERRORS.NOT_FOUND, { id: deviceId });
      const updated = await this.repo.unblock(deviceId);
      return pdaDeviceResponseSchema.parse(updated);
    }, toAppError)();
  }
}
