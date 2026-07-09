// Tests for UserFactory (Better Auth users)
// Verifies UserFactory with various user roles and statuses

import { describe, expect, it } from "vitest";
import { UserFactory } from "./factory/factories/user.js";

describe("UserFactory", () => {
  it("should create a user", () => {
    const factory = new UserFactory();
    const record = factory.create();

    expect(record.username).toBeDefined();
    expect(record.authUserId).toBeDefined();
    expect(record.email).toBeDefined();
    expect(record.id).toBeDefined();
  });

  it("should create a super admin user", () => {
    const factory = new UserFactory();
    const record = factory.createSuperAdmin();

    expect(record.role).toBe("SUPER_ADMIN");
  });

  it("should create a VD admin user", () => {
    const factory = new UserFactory();
    const record = factory.createVdAdmin();

    expect(record.role).toBe("VD_ADMIN");
  });

  it("should create a VD staff user", () => {
    const factory = new UserFactory();
    const record = factory.createVdStaff();

    expect(record.role).toBe("VD_STAFF");
  });

  it("should create a farmer user", () => {
    const factory = new UserFactory();
    const record = factory.createFarmer();

    expect(record.role).toBe("FARMER");
  });

  it("should create an active user", () => {
    const factory = new UserFactory();
    const record = factory.createActive();

    expect(record.status).toBe("active");
  });

  it("should create a blocked user", () => {
    const factory = new UserFactory();
    const record = factory.createBlocked();

    expect(record.status).toBe("blocked");
  });

  it("should create a user with organization", () => {
    const organizationId = crypto.randomUUID();

    const factory = new UserFactory();
    const record = factory.createWithOrganization(organizationId);

    expect(record.organizationId).toBe(organizationId);
  });

  it("should create a user with mobile phone", () => {
    const mobilePhone = "+38970123456";

    const factory = new UserFactory();
    const record = factory.createWithMobile(mobilePhone);

    expect(record.mobilePhone).toBe(mobilePhone);
    expect(record.mobileVerified).toBe(true);
  });

  it("should create a user with dual names", () => {
    const factory = new UserFactory();
    const record = factory.create();

    expect(record.firstName).toBeDefined();
    expect(record.firstNameAlt).toBeDefined();
    expect(record.lastName).toBeDefined();
    expect(record.lastNameAlt).toBeDefined();
  });

  it("should create a user with language", () => {
    const factory = new UserFactory();
    const record = factory.create();

    expect(record.language).toBeDefined();
  });
});
