import { describe, test, expect } from "vitest";
import { EarTagOrderFactory, FarmFactory } from "@rocky/testing";

const ORG_ID = crypto.randomUUID();
const ADDR_ID = crypto.randomUUID();

describe("EarTagOrderFactory", () => {
  test("createDraft() produces schema-valid data with DRAFT status", () => {
    const order = new EarTagOrderFactory(ORG_ID).createDraft();
    expect(order.status).toBe("draft");
    expect(order.id).toBeDefined();
    expect(order.orderNumber).toBeDefined();
    expect(order.organizationId).toBe(ORG_ID);
  });

  test("createOrdered() produces ORDERED status", () => {
    const order = new EarTagOrderFactory(ORG_ID).createOrdered();
    expect(order.status).toBe("ordered");
  });

  test("createReceived() produces RECEIVED status with delivery date", () => {
    const order = new EarTagOrderFactory(ORG_ID).createReceived();
    expect(order.status).toBe("received");
    expect(order.actualDeliveryDate).toBeDefined();
  });

  test("createCancelled() produces CANCELLED status", () => {
    const order = new EarTagOrderFactory(ORG_ID).createCancelled();
    expect(order.status).toBe("cancelled");
  });

  test("createMany() produces multiple records", () => {
    const orders = new EarTagOrderFactory(ORG_ID).createMany(5);
    expect(orders).toHaveLength(5);
    for (const order of orders) {
      expect(order.id).toBeDefined();
      expect(order.organizationId).toBe(ORG_ID);
    }
  });

  test("overrides work correctly", () => {
    const order = new EarTagOrderFactory(ORG_ID).createDraft({
      totalQuantity: 100,
    });
    expect(order.totalQuantity).toBe(100);
  });
});

describe("FarmFactory", () => {
  test("createActive() produces active farm", () => {
    const farm = new FarmFactory(ADDR_ID).createActive();
    expect(farm.isActive).toBe(true);
    expect(farm.addressId).toBe(ADDR_ID);
    expect(farm.farmId).toBeDefined();
  });

  test("createApproved() produces approved farm", () => {
    const farm = new FarmFactory(ADDR_ID).createApproved();
    expect(farm.verificationStatus).toBe("approved");
    expect(farm.verifiedAt).toBeDefined();
  });
});
