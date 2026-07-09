// ── VS Contract (Farm Bot) Test Factory ──
// Internal enums: VS_CONTRACT_STATUS
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import { VS_CONTRACT_STATUS, VS_CONTRACT_STATUS_VALUES } from "@rocky/database/constants";
import { vsContractsSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type VsContractRecord = InferSelectSchema<typeof vsContractsSelectSchema>;

export class VsContractFactory extends SchemaDataFactory<VsContractRecord> {
  constructor(subjectId: string) {
    super(vsContractsSelectSchema, {
      id: faker.string.uuid(),
      subjectId,
      contractNumber: `VC_${faker.string.alphanumeric({ length: 10 }).toUpperCase()}`,
      region: faker.location.state(),
      startDate: faker.date.past({ years: 1 }),
      endDate: null,
      status: faker.helpers.arrayElement(VS_CONTRACT_STATUS_VALUES),
      notes: null,
      isActive: true,
      createdAt: faker.date.recent({ days: 30 }),
      createdBy: null,
      updatedAt: null,
      validTo: null,
    });
  }

  createDraft(overrides?: Partial<VsContractRecord>): VsContractRecord {
    return this.create({ status: VS_CONTRACT_STATUS.DRAFT, ...overrides });
  }

  createActive(overrides?: Partial<VsContractRecord>): VsContractRecord {
    return this.create({
      status: VS_CONTRACT_STATUS.ACTIVE,
      startDate: faker.date.past({ years: 1 }),
      endDate: faker.date.future({ years: 2 }),
      ...overrides,
    });
  }

  createTerminated(overrides?: Partial<VsContractRecord>): VsContractRecord {
    return this.create({ status: VS_CONTRACT_STATUS.TERMINATED, ...overrides });
  }

  createExpired(overrides?: Partial<VsContractRecord>): VsContractRecord {
    return this.create({ status: VS_CONTRACT_STATUS.EXPIRED, ...overrides });
  }
}
