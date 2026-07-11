// ── Animal Test Factory ──
// Internal enums: ANIMAL_STATUS, BIRTH_TYPE, SEX, STATE_CODE
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import {
  ANIMAL_STATUS,
  ANIMAL_STATUS_VALUES,
  BIRTH_TYPE,
  BIRTH_TYPE_VALUES,
  SEX,
  SEX_VALUES,
  STATE_CODE,
} from "@rocky/database/constants";
import { calculateEarTagCheckDigit } from "@rocky/validators";
import { animalsSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type AnimalRecord = InferSelectSchema<typeof animalsSelectSchema>;

export class AnimalFactory extends SchemaDataFactory<AnimalRecord> {
  constructor(currentFarmId: string, motherId?: string, fatherId?: string) {
    super(animalsSelectSchema, {
      id: faker.string.uuid(),
      stateCode: STATE_CODE.MK,
      // WO-118: emit a MK_8-compliant ear tag (7 base digits + canonical MK check digit)
      earTagNumber: (() => { const b = faker.string.numeric({ length: 7 }); return `${b}${calculateEarTagCheckDigit(b)}`; })(),
      birthDate: faker.date.recent({ days: 365 }).toISOString().split("T")[0],
      sex: faker.helpers.arrayElement(SEX_VALUES),
      breed: faker.animal.type(),
      birthType: faker.helpers.arrayElement(BIRTH_TYPE_VALUES),
      birthWeight: faker.number.int({ min: 20000, max: 60000 }),
      motherId: motherId ?? null,
      fatherId: fatherId ?? null,
      currentFarmId,
      status: faker.helpers.arrayElement(ANIMAL_STATUS_VALUES),
      isFirstTagging: faker.datatype.boolean({ probability: 0.3 }),
      taggingDate: faker.date.recent({ days: 30 }).toISOString().split("T")[0],
      imported: faker.datatype.boolean({ probability: 0.1 }),
      importCountry: null,
      importDate: null,
      isActive: true,
      createdAt: faker.date.recent({ days: 365 }),
      createdBy: null,
      updatedAt: null,
      validTo: null,
    });
  }

  createAlive(overrides?: Partial<AnimalRecord>): AnimalRecord {
    return this.create({
      status: ANIMAL_STATUS.ALIVE,
      ...overrides,
    });
  }

  createDead(overrides?: Partial<AnimalRecord>): AnimalRecord {
    return this.create({ status: ANIMAL_STATUS.DEAD, ...overrides });
  }

  createSlaughtered(overrides?: Partial<AnimalRecord>): AnimalRecord {
    return this.create({ status: ANIMAL_STATUS.SLAUGHTERED, ...overrides });
  }

  createImported(overrides?: Partial<AnimalRecord>): AnimalRecord {
    return this.create({
      status: ANIMAL_STATUS.IMPORTED,
      imported: true,
      importCountry: "DEU",
      importDate: faker.date.recent({ days: 30 }).toISOString().split("T")[0],
      ...overrides,
    });
  }

  createExported(overrides?: Partial<AnimalRecord>): AnimalRecord {
    return this.create({ status: ANIMAL_STATUS.EXPORTED, ...overrides });
  }

  createMissing(overrides?: Partial<AnimalRecord>): AnimalRecord {
    return this.create({ status: ANIMAL_STATUS.MISSING, ...overrides });
  }

  createStillborn(overrides?: Partial<AnimalRecord>): AnimalRecord {
    return this.create({
      status: ANIMAL_STATUS.STILLBORN,
      birthType: BIRTH_TYPE.STILLBORN,
      ...overrides,
    });
  }
}
