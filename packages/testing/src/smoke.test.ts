// Smoke tests for @rocky/testing factories
// Verifies that factories produce valid schema-matched data

import { describe, expect, it } from "vitest";
import { EarTagOrderFactory } from "./factory/factories/ear-tag-order.js";
import { FarmFactory } from "./factory/factories/farm.js";

describe("EarTagOrderFactory", () => {
  it("should create a draft order with valid UUIDs", () => {
    const organizationId = crypto.randomUUID();
    const requestedBy = crypto.randomUUID();

    const factory = new EarTagOrderFactory(organizationId, requestedBy);
    const draft = factory.createDraft();

    expect(draft.organizationId).toBe(organizationId);
    expect(draft.requestedBy).toBe(requestedBy);
    expect(draft.status).toBe("draft");
    expect(draft.id).toBeDefined();
  });

  it("should create a submitted order", () => {
    const organizationId = crypto.randomUUID();
    const factory = new EarTagOrderFactory(organizationId);
    const submitted = factory.createPending();

     expect(submitted.status).toBe("pending");
  });
});

describe("FarmFactory", () => {
  it("should create an active farm with valid UUIDs", () => {
    const addressId = crypto.randomUUID();
    const createdBy = crypto.randomUUID();

    const factory = new FarmFactory(addressId, createdBy);
    const active = factory.createActive();

    expect(active.addressId).toBe(addressId);
    expect(active.isActive).toBe(true);
     expect(active.type).toBe("farm");
    expect(active.id).toBeDefined();
  });

  it("should create a pending verification farm", () => {
    const addressId = crypto.randomUUID();
    const factory = new FarmFactory(addressId);
    const pending = factory.createPendingVerification();

     expect(pending.verificationStatus).toBe("pending_vd_approval");
    expect(pending.verifiedAt).toBeNull();
  });
});
