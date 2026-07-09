import { describe, expect, it } from "vitest";
import { OrgAreaFactory } from "../src/factory/index.js";
import { OrganizationFactory } from "../src/factory/index.js";

describe("OrgAreaFactory", () => {
  it("should create a valid OrgArea record", () => {
    const orgFactory = new OrganizationFactory();
    const org = orgFactory.create();
    const factory = new OrgAreaFactory(org.id);
    const record = factory.create();
    expect(record).toBeDefined();
    expect(record.id).toBeDefined();
    expect(record.organizationId).toBe(org.id);
    expect(record.createdAt).toBeInstanceOf(Date);
  });

  it("should create multiple OrgArea records", () => {
    const orgFactory = new OrganizationFactory();
    const org = orgFactory.create();
    const factory = new OrgAreaFactory(org.id);
    const records = factory.createMany(3);
    expect(records).toHaveLength(3);
    records.forEach((record) => {
      expect(record.id).toBeDefined();
      expect(record.organizationId).toBe(org.id);
    });
  });

  it("should override fields via partial", () => {
    const orgFactory = new OrganizationFactory();
    const org = orgFactory.create();
    const factory = new OrgAreaFactory(org.id);
    const record = factory.create({
      region: "Test Region",
    });
    expect(record.region).toBe("Test Region");
  });

  it("should use helper methods", () => {
    const orgFactory = new OrganizationFactory();
    const org = orgFactory.create();
    const factory = new OrgAreaFactory(org.id);
    const record = factory.createWithRegion("Sofia");
    expect(record.region).toBe("Sofia");
  });
});
