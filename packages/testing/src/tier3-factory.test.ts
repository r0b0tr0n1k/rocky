// Tests for Tier 3a factories — farm-domain reference/business child tables:
// Address, FarmSubject, FarmBook, VsContract, VsAssignment, SyncError
//
// Verifies every factory produces schema-valid data (create() throws on
// safeParse failure) and that domain state helpers set correct enum values.

import { describe, expect, it } from "vitest";
import { AddressFactory } from "./factory/factories/address.js";
import { FarmSubjectFactory } from "./factory/factories/farm-subject.js";
import { FarmBookFactory } from "./factory/factories/farm-book.js";
import { VsContractFactory } from "./factory/factories/vs-contract.js";
import { VsAssignmentFactory } from "./factory/factories/vs-assignment.js";
import { SyncErrorFactory } from "./factory/factories/sync-error.js";

describe("Farm-domain factories", () => {
  it("AddressFactory requires a zip code", () => {
    const zipCodeId = crypto.randomUUID();
    const record = new AddressFactory(zipCodeId).create();
    expect(record.zipCodeId).toBe(zipCodeId);
    expect(record.city).toBeDefined();
    expect(record.houseNumber).toBeDefined();
    expect(record.isActive).toBe(true);
  });

  it("AddressFactory active/inactive helpers", () => {
    expect(new AddressFactory(crypto.randomUUID()).createActive().isActive).toBe(true);
    expect(new AddressFactory(crypto.randomUUID()).createInactive().isActive).toBe(false);
  });

  it("FarmSubjectFactory links farm and subject", () => {
    const farmId = crypto.randomUUID();
    const subjectId = crypto.randomUUID();
    const record = new FarmSubjectFactory(farmId, subjectId).create();
    expect(record.farmId).toBe(farmId);
    expect(record.subjectId).toBe(subjectId);
    expect(record.role).toBeDefined();
  });

  it("FarmSubjectFactory role helpers", () => {
    const f = new FarmSubjectFactory(crypto.randomUUID(), crypto.randomUUID());
    expect(f.createOwner().role).toBe("owner");
    expect(f.createKeeper().role).toBe("keeper");
  });

  it("FarmBookFactory links to a farm", () => {
    const farmId = crypto.randomUUID();
    const record = new FarmBookFactory(farmId).create();
    expect(record.farmId).toBe(farmId);
    expect(record.status).toBeDefined();
  });

  it("FarmBookFactory lifecycle helpers", () => {
    const f = new FarmBookFactory(crypto.randomUUID());
    expect(f.createPending().status).toBe("pending");
    expect(f.createAssembled().status).toBe("assembled");
    expect(f.createShipped().shippedToVs).toBe(true);
    expect(f.createDelivered().deliveredToKeeper).toBe(true);
  });

  it("VsContractFactory links to a subject", () => {
    const subjectId = crypto.randomUUID();
    const record = new VsContractFactory(subjectId).create();
    expect(record.subjectId).toBe(subjectId);
    expect(record.contractNumber).toBeDefined();
    expect(record.region).toBeDefined();
  });

  it("VsContractFactory status helpers", () => {
    const f = new VsContractFactory(crypto.randomUUID());
    expect(f.createDraft().status).toBe("draft");
    expect(f.createActive().status).toBe("active");
    expect(f.createTerminated().status).toBe("terminated");
    expect(f.createExpired().status).toBe("expired");
  });

  it("VsAssignmentFactory links contract and farm", () => {
    const contractId = crypto.randomUUID();
    const farmId = crypto.randomUUID();
    const record = new VsAssignmentFactory(contractId, farmId).create();
    expect(record.contractId).toBe(contractId);
    expect(record.farmId).toBe(farmId);
    expect(record.isPrimary).toBe(true);
  });

  it("VsAssignmentFactory primary/secondary helpers", () => {
    const f = new VsAssignmentFactory(crypto.randomUUID(), crypto.randomUUID());
    expect(f.createPrimary().isPrimary).toBe(true);
    expect(f.createSecondary().isPrimary).toBe(false);
  });

  it("SyncErrorFactory creates with a type", () => {
    const record = new SyncErrorFactory().create();
    expect(record.errorType).toBeDefined();
    expect(record.syncStatus).toBe("WARNING");
    expect(record.resolved).toBe(false);
  });

  it("SyncErrorFactory status/resolved helpers", () => {
    expect(new SyncErrorFactory().createWarning().syncStatus).toBe("WARNING");
    expect(new SyncErrorFactory().createRejected().syncStatus).toBe("REJECTED");
    expect(new SyncErrorFactory().createResolved().resolved).toBe(true);
  });
});

describe("Tier 3a factories — createMany", () => {
  it("produces multiple schema-valid records", () => {
    const contracts = new VsContractFactory(crypto.randomUUID()).createMany(3);
    expect(contracts).toHaveLength(3);
    const errors = new SyncErrorFactory().createMany(4);
    expect(errors).toHaveLength(4);
  });
});
