// Tests for PdaDeviceFactory (smartphone registry)
// Verifies PdaDeviceFactory with various device states

import { describe, expect, it } from "vitest";
import { PdaDeviceFactory } from "./factory/factories/pda-device.js";

describe("PdaDeviceFactory", () => {
  it("should create a PDA device", () => {
    const userId = crypto.randomUUID();

    const factory = new PdaDeviceFactory(userId);
    const record = factory.create();

    expect(record.currentUserId).toBe(userId);
    expect(record.deviceIdentifier).toBeDefined();
    expect(record.deviceType).toBeDefined();
    expect(record.id).toBeDefined();
  });

  it("should create an active device", () => {
    const factory = new PdaDeviceFactory();
    const record = factory.createActive();

    expect(record.status).toBe("active");
    expect(record.failedAttempts).toBe(0);
    expect(record.blockedAt).toBeNull();
  });

  it("should create a blocked device", () => {
    const factory = new PdaDeviceFactory();
    const record = factory.createBlocked();

    expect(record.status).toBe("blocked");
    expect(record.failedAttempts).toBe(3);
    expect(record.blockedAt).toBeDefined();
  });

  it("should create a retired device", () => {
    const factory = new PdaDeviceFactory();
    const record = factory.createRetired();

    expect(record.status).toBe("retired");
  });

  it("should create a device with user", () => {
    const userId = crypto.randomUUID();

    const factory = new PdaDeviceFactory();
    const record = factory.createWithUser(userId);

    expect(record.currentUserId).toBe(userId);
  });

  it("should create a device with sync data", () => {
    const factory = new PdaDeviceFactory();
    const record = factory.createWithSync();

    expect(record.lastSyncAt).toBeDefined();
    expect(record.lastSyncData).toBeDefined();
    expect(record.lastSyncData.animals).toBe(true);
  });

  it("should create an iOS device", () => {
    const factory = new PdaDeviceFactory();
    const record = factory.create({ deviceType: "ios" });

    expect(record.deviceType).toBe("ios");
  });

  it("should create an Android device", () => {
    const factory = new PdaDeviceFactory();
    const record = factory.create({ deviceType: "android" });

    expect(record.deviceType).toBe("android");
  });
});
