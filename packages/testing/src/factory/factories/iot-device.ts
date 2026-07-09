// ── IoT Device Test Factory ──
// Internal enums: IOT_DEVICE_STATUS, TRANSMISSION_TYPE
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import {
  IOT_DEVICE_STATUS,
  IOT_DEVICE_STATUS_VALUES,
  TRANSMISSION_TYPE,
  TRANSMISSION_TYPE_VALUES,
} from "@rocky/database/constants";
import { iotDevicesSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type IotDeviceRecord = InferSelectSchema<typeof iotDevicesSelectSchema>;

export class IotDeviceFactory extends SchemaDataFactory<IotDeviceRecord> {
  constructor(animalId?: string, farmId?: string) {
    super(iotDevicesSelectSchema, {
      id: faker.string.uuid(),
      deviceEui: faker.string.hexadecimal({ length: 16 }).toUpperCase(),
      manufacturer: faker.company.name(),
      model: faker.lorem.words(2),
      serialNumber: faker.string.alphanumeric({ length: 20 }).toUpperCase(),
      firmwareVersion: faker.system.semver(),
      transmissionType: faker.helpers.arrayElement(TRANSMISSION_TYPE_VALUES),
      transmissionIntervalSeconds: faker.number.int({ min: 60, max: 3600 }),
      assignedToAnimalId: animalId ?? null,
      assignedToFarmId: farmId ?? null,
      activationDate: faker.date.recent({ days: 30 }).toISOString().split("T")[0]!,
      deactivationDate: null,
      batteryLevel: faker.number.int({ min: 0, max: 100 }),
      batteryLastChecked: faker.date.recent({ days: 7 }),
      lastTransmissionAt: faker.date.recent({ days: 1 }),
      status: faker.helpers.arrayElement(IOT_DEVICE_STATUS_VALUES),
      isActive: true,
      createdAt: faker.date.recent({ days: 30 }),
      createdBy: null,
      updatedAt: null,
      validTo: null,
    });
  }

  createActive(overrides?: Partial<IotDeviceRecord>): IotDeviceRecord {
    return this.create({
      status: IOT_DEVICE_STATUS.ACTIVE,
      ...overrides,
    });
  }

  createRetired(overrides?: Partial<IotDeviceRecord>): IotDeviceRecord {
    return this.create({
      status: IOT_DEVICE_STATUS.RETIRED,
      deactivationDate: faker.date.recent({ days: 7 }).toISOString().split("T")[0]!,
      ...overrides,
    });
  }

  createAssigned(animalId: string, overrides?: Partial<IotDeviceRecord>): IotDeviceRecord {
    return this.create({
      assignedToAnimalId: animalId,
      ...overrides,
    });
  }

  createLoRaWAN(overrides?: Partial<IotDeviceRecord>): IotDeviceRecord {
    return this.create({
      transmissionType: TRANSMISSION_TYPE.LORAWAN,
      transmissionIntervalSeconds: 900, // 15 minutes
      ...overrides,
    });
  }

  createNBIoT(overrides?: Partial<IotDeviceRecord>): IotDeviceRecord {
    return this.create({
      transmissionType: TRANSMISSION_TYPE.NB_IOT,
      transmissionIntervalSeconds: 3600, // 1 hour
      ...overrides,
    });
  }
}
