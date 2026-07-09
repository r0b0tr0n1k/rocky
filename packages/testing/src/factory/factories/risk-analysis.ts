// ── Risk Analysis (Inspection Bot) Test Factory ──
// CPC annual 10% farm selection for on-spot inspection
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import { riskAnalysesSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type RiskAnalysisRecord = InferSelectSchema<typeof riskAnalysesSelectSchema>;

export class RiskAnalysisFactory extends SchemaDataFactory<RiskAnalysisRecord> {
  constructor() {
    super(riskAnalysesSelectSchema, {
      id: faker.string.uuid(),
      year: new Date().getFullYear(),
      quarter: null,
      status: "pending",
      totalFarms: 0,
      selectedFarms: 0,
      algorithmVersion: "v1",
      selectionPercentage: 10,
      paramsSnapshot: null,
      isActive: true,
      createdAt: faker.date.recent({ days: 30 }),
      createdBy: null,
      updatedAt: null,
      validTo: null,
    });
  }

  createPending(overrides?: Partial<RiskAnalysisRecord>): RiskAnalysisRecord {
    return this.create({ status: "pending", ...overrides });
  }

  createCompleted(
    totalFarms: number,
    selectedFarms: number,
    overrides?: Partial<RiskAnalysisRecord>,
  ): RiskAnalysisRecord {
    return this.create({
      status: "completed",
      totalFarms,
      selectedFarms,
      ...overrides,
    });
  }
}
