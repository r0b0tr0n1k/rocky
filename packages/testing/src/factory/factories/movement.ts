// ── Movement Test Factory ──
// Internal enums: MOVEMENT_TYPE, DEATH_CAUSE, PASTURE_TYPE
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import {
  MOVEMENT_TYPE,
  MOVEMENT_TYPE_VALUES,
  DEATH_CAUSE,
  DEATH_CAUSE_VALUES,
} from "@rocky/database/constants";
import { movementsSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type MovementRecord = InferSelectSchema<typeof movementsSelectSchema>;

export class MovementFactory extends SchemaDataFactory<MovementRecord> {
  constructor(animalId: string, toFarmId: string, fromFarmId?: string) {
    super(movementsSelectSchema, {
      id: faker.string.uuid(),
      animalId,
      fromFarmId: fromFarmId ?? null,
      toFarmId,
      type: faker.helpers.arrayElement(MOVEMENT_TYPE_VALUES),
      movementDate: faker.date.recent({ days: 30 }).toISOString().split("T")[0],
      arrivalDate: null,
      parentMovementId: null,
      legOrder: 0,
      movementGroupId: null,
      reason: null,
      documentRef: null,
      deathDate: null,
      deathCause: null,
      importCountry: null,
      exportCountry: null,
      breedingState: null,
      breedingPlaceId: null,
      isVerified: faker.datatype.boolean({ probability: 0.5 }),
      verifiedAt: null,
      verifiedBy: null,
      isActive: true,
      createdAt: faker.date.recent({ days: 30 }),
      createdBy: null,
      updatedAt: null,
      validTo: null,
    });
  }

  createTransfer(overrides?: Partial<MovementRecord>): MovementRecord {
    return this.create({
      type: MOVEMENT_TYPE.TRANSFER,
      ...overrides,
    });
  }

  createDeath(overrides?: Partial<MovementRecord>): MovementRecord {
    return this.create({
      type: MOVEMENT_TYPE.DEATH,
      deathDate: faker.date.recent({ days: 7 }).toISOString().split("T")[0],
      deathCause: faker.helpers.arrayElement(DEATH_CAUSE_VALUES),
      ...overrides,
    });
  }

  createSlaughter(overrides?: Partial<MovementRecord>): MovementRecord {
    return this.create({
      type: MOVEMENT_TYPE.SLAUGHTERHOUSE,
      ...overrides,
    });
  }

  createHomeSlaughter(overrides?: Partial<MovementRecord>): MovementRecord {
    return this.create({
      type: MOVEMENT_TYPE.HOME_SLAUGHTER,
      ...overrides,
    });
  }

  createPastureDeparture(overrides?: Partial<MovementRecord>): MovementRecord {
    return this.create({
      type: MOVEMENT_TYPE.PASTURE_DEPARTURE,
      ...overrides,
    });
  }

  createPastureReturn(overrides?: Partial<MovementRecord>): MovementRecord {
    return this.create({
      type: MOVEMENT_TYPE.PASTURE_RETURN,
      ...overrides,
    });
  }

  createImport(overrides?: Partial<MovementRecord>): MovementRecord {
    return this.create({
      type: MOVEMENT_TYPE.IMPORT,
      importCountry: "DEU",
      ...overrides,
    });
  }

  createExport(overrides?: Partial<MovementRecord>): MovementRecord {
    return this.create({
      type: MOVEMENT_TYPE.EXPORT,
      exportCountry: "DEU",
      ...overrides,
    });
  }

  createMarketSale(overrides?: Partial<MovementRecord>): MovementRecord {
    return this.create({
      type: MOVEMENT_TYPE.MARKET_SALE,
      ...overrides,
    });
  }
}
