// Tests for SubjectFactory (keepers/holders domain)
// Verifies SubjectFactory with various subject types

import { describe, expect, it } from "vitest";
import { SubjectFactory } from "./factory/factories/subject.js";

describe("SubjectFactory", () => {
  it("should create a subject", () => {
    const factory = new SubjectFactory();
    const record = factory.create();

    expect(record.shortName).toBeDefined();
    expect(record.firstName).toBeDefined();
    expect(record.lastName).toBeDefined();
    expect(record.id).toBeDefined();
  });

  it("should create an active subject", () => {
    const factory = new SubjectFactory();
    const record = factory.createActive();

    expect(record.isActive).toBe(true);
  });

  it("should create an inactive subject", () => {
    const factory = new SubjectFactory();
    const record = factory.createInactive();

    expect(record.isActive).toBe(false);
  });

  it("should create an individual subject", () => {
    const factory = new SubjectFactory();
    const record = factory.createIndividual();

    expect(record.firstName).toBeDefined();
    expect(record.lastName).toBeDefined();
    expect(record.companyName).toBeNull();
  });

  it("should create a company subject", () => {
    const factory = new SubjectFactory();
    const record = factory.createCompany();

    expect(record.companyName).toBeDefined();
    expect(record.firstName).toBeNull();
    expect(record.lastName).toBeNull();
  });

  it("should create a subject with contact info", () => {
    const factory = new SubjectFactory();
    const record = factory.createWithContact();

    expect(record.phoneNumber).toBeDefined();
    expect(record.email).toBeDefined();
  });

  it("should create a subject with personal ID", () => {
    const factory = new SubjectFactory();
    const record = factory.create();

    expect(record.personalId).toBeDefined();
    expect(record.vatNumber).toBeDefined();
  });

  it("should create a subject with dual names", () => {
    const factory = new SubjectFactory();
    const record = factory.create();

    expect(record.shortName).toBeDefined();
    expect(record.shortNameAlt).toBeDefined();
    expect(record.firstNameAlt).toBeDefined();
    expect(record.lastNameAlt).toBeDefined();
  });
});
