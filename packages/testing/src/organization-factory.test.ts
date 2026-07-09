// Tests for OrganizationFactory (system management domain)
// Verifies OrganizationFactory with various organization types

import { describe, expect, it } from "vitest";
import { OrganizationFactory } from "./factory/factories/organization.js";

describe("OrganizationFactory", () => {
  it("should create an organization", () => {
    const factory = new OrganizationFactory();
    const record = factory.create();

    expect(record.name1).toBeDefined();
    expect(record.orgType).toBeDefined();
    expect(record.address).toBeDefined();
    expect(record.id).toBeDefined();
  });

  it("should create a VD organization", () => {
    const factory = new OrganizationFactory();
    const record = factory.createVD();

    expect(record.orgType).toBe("VD");
  });

  it("should create a vet clinic organization", () => {
    const factory = new OrganizationFactory();
    const record = factory.createVetClinic();

    expect(record.orgType).toBe("VET_CLINIC");
  });

  it("should create a slaughterhouse organization", () => {
    const factory = new OrganizationFactory();
    const record = factory.createSlaughterhouse();

    expect(record.orgType).toBe("SLAUGHTERHOUSE");
  });

  it("should create a livestock market organization", () => {
    const factory = new OrganizationFactory();
    const record = factory.createLivestockMarket();

    expect(record.orgType).toBe("LIVESTOCK_MARKET");
  });

  it("should create an active organization", () => {
    const factory = new OrganizationFactory();
    const record = factory.createActive();

    expect(record.isActive).toBe(true);
  });

  it("should create an inactive organization", () => {
    const factory = new OrganizationFactory();
    const record = factory.createInactive();

    expect(record.isActive).toBe(false);
  });

  it("should create an organization with parent", () => {
    const parentId = crypto.randomUUID();

    const factory = new OrganizationFactory();
    const record = factory.createWithParent(parentId);

    expect(record.parentId).toBe(parentId);
  });

  it("should create an organization with address", () => {
    const factory = new OrganizationFactory();
    const record = factory.create();

    expect(record.address.street).toBeDefined();
    expect(record.address.city).toBeDefined();
    expect(record.address.zipCode).toBeDefined();
  });

  it("should create an organization with contact info", () => {
    const factory = new OrganizationFactory();
    const record = factory.create();

    expect(record.phone).toBeDefined();
    expect(record.email).toBeDefined();
  });
});
