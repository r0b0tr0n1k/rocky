// Tests for IoT domain factories
// Verifies IotDeviceFactory, SensorReadingFactory, GeofenceFactory, AnimalGeofenceEventFactory

import { describe, expect, it } from "vitest";
import { IotDeviceFactory } from "./factory/factories/iot-device.js";
import { SensorReadingFactory } from "./factory/factories/sensor-reading.js";
import { GeofenceFactory } from "./factory/factories/geofence.js";
import { AnimalGeofenceEventFactory } from "./factory/factories/animal-geofence-event.js";

describe("IotDeviceFactory", () => {
  it("should create an IoT device", () => {
    const animalId = crypto.randomUUID();
    const farmId = crypto.randomUUID();

    const factory = new IotDeviceFactory(animalId, farmId);
    const record = factory.create();

    expect(record.assignedToAnimalId).toBe(animalId);
    expect(record.assignedToFarmId).toBe(farmId);
    expect(record.deviceEui).toBeDefined();
    expect(record.id).toBeDefined();
  });

  it("should create an active device", () => {
    const factory = new IotDeviceFactory();
    const record = factory.createActive();

    expect(record.status).toBe("active");
  });

  it("should create a retired device", () => {
    const factory = new IotDeviceFactory();
    const record = factory.createRetired();

    expect(record.status).toBe("retired");
    expect(record.deactivationDate).toBeDefined();
  });

  it("should create a LoRaWAN device", () => {
    const factory = new IotDeviceFactory();
    const record = factory.createLoRaWAN();

    expect(record.transmissionType).toBe("LORAWAN");
    expect(record.transmissionIntervalSeconds).toBe(900);
  });
});

describe("SensorReadingFactory", () => {
  it("should create a sensor reading", () => {
    const deviceId = crypto.randomUUID();
    const farmId = crypto.randomUUID();

    const factory = new SensorReadingFactory(deviceId, farmId);
    const record = factory.create();

    expect(record.deviceId).toBe(deviceId);
    expect(record.farmId).toBe(farmId);
    expect(record.readingType).toBeDefined();
    expect(record.id).toBeDefined();
  });

  it("should create a temperature reading", () => {
    const factory = new SensorReadingFactory(crypto.randomUUID());
    const record = factory.createTemperature();

    expect(record.readingType).toBe("temperature");
    expect(record.unit).toBe("°C");
  });

  it("should create a heart rate reading", () => {
    const factory = new SensorReadingFactory(crypto.randomUUID());
    const record = factory.createHeartRate();

    expect(record.readingType).toBe("heart_rate");
    expect(record.unit).toBe("bpm");
  });

  it("should create a raw reading", () => {
    const factory = new SensorReadingFactory(crypto.randomUUID());
    const record = factory.createRaw();

    expect(record.processingStage).toBe("raw");
    expect(record.processedAt).toBeNull();
  });
});

describe("GeofenceFactory", () => {
  it("should create a geofence", () => {
    const farmId = crypto.randomUUID();

    const factory = new GeofenceFactory(farmId);
    const record = factory.create();

    expect(record.farmId).toBe(farmId);
    expect(record.name).toBeDefined();
    expect(record.geometry).toBeDefined();
    expect(record.id).toBeDefined();
  });

  it("should create an active geofence", () => {
    const factory = new GeofenceFactory(crypto.randomUUID());
    const record = factory.createActive();

    expect(record.isActive).toBe(true);
  });

  it("should create a polygon geofence", () => {
    const factory = new GeofenceFactory(crypto.randomUUID());
    const record = factory.createPolygon();

    expect(record.fenceType).toBe("pasture_boundary");
    expect(record.geometry).toBeDefined();
  });

  it("should create an exclusion zone", () => {
    const factory = new GeofenceFactory(crypto.randomUUID());
    const record = factory.createExclusion();

    expect(record.fenceType).toBe("exclusion_zone");
  });
});

describe("AnimalGeofenceEventFactory", () => {
  it("should create an animal geofence event", () => {
    const animalId = crypto.randomUUID();
    const geofenceId = crypto.randomUUID();

    const factory = new AnimalGeofenceEventFactory(animalId, geofenceId);
    const record = factory.create();

    expect(record.animalId).toBe(animalId);
    expect(record.geofenceId).toBe(geofenceId);
    expect(record.eventType).toBeDefined();
    expect(record.id).toBeDefined();
  });

  it("should create an entry event", () => {
    const factory = new AnimalGeofenceEventFactory(crypto.randomUUID(), crypto.randomUUID());
    const record = factory.createEntry();

    expect(record.eventType).toBe("entered");
  });

  it("should create an exit event", () => {
    const factory = new AnimalGeofenceEventFactory(crypto.randomUUID(), crypto.randomUUID());
    const record = factory.createExit();

    expect(record.eventType).toBe("exited");
  });

  it("should create a manual event", () => {
    const factory = new AnimalGeofenceEventFactory(crypto.randomUUID(), crypto.randomUUID());
    const record = factory.createManual();

    expect(record.source).toBe("manual");
  });

  it("should create an automated event", () => {
    const factory = new AnimalGeofenceEventFactory(crypto.randomUUID(), crypto.randomUUID());
    const record = factory.createAutomated();

    expect(record.source).toBe("automated");
  });
});
