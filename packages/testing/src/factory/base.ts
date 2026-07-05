// ── SchemaDataFactory<T> — The Material Base of Testing ──
//
// Because of the Diamond Seal, your pipeline is unbreakable:
//
//   1. Drizzle (pgTable) defines the exact Postgres SQL schema
//   2. Drizzle-Zod (createSelectSchema) generates the Dumb Zod schema from Drizzle
//   3. SchemaDataFactory uses that Dumb Zod schema to generate data
//
// When your factory generates an object, it perfectly satisfies BOTH the
// Drizzle `$inferSelect` type AND the Zod schema simultaneously.
//
// The Diamond Seal: You cannot mock the database. You can only mock the Repository.


/**
 * Base class for all test factories.
 *
 * The schema parameter is typed loosely to work with any Zod version and
 * drizzle-zod integration. Validation happens at runtime via safeParse.
 *
 * @template TRecord — The output type (inferred from the Zod select schema).
 *
 * ## Usage
 *
 * ```typescript
 * import { z } from "zod";
 * import { farmSelectSchema } from "@rocky/database/zod";
 *
 * type FarmRecord = z.infer<typeof farmSelectSchema>;
 *
 * export class FarmFactory extends SchemaDataFactory<FarmRecord> {
 *   constructor(addressId: string) {
 *     super(farmSelectSchema, {
 *       addressId,
 *       type: FARM_TYPE.FARM,
 *       name: faker.company.name(),
 *       farmId: faker.string.numeric({ length: 9 }),
 *     });
 *   }
 * }
 * ```
 */
export abstract class SchemaDataFactory<TRecord> {
  /** The Zod schema used to validate generated records */
  protected readonly schema: {
    safeParse: (data: unknown) => { success: true; data: TRecord } | { success: false; error: Error };
  };

  /** Default values applied to every generated record */
  protected readonly defaults: Partial<TRecord>;

  /**
   * @param schema — A Dumb Zod select schema from `@rocky/database/zod`
   * @param defaults — Default values for every generated record
   */

  // biome-ignore lint/suspicious/noExplicitAny: OK in tests
  constructor(schema: any, defaults: Partial<TRecord> = {}) {
    this.schema = schema;
    this.defaults = defaults;
  }

  /**
   * Create a single record with optional overrides.
   *
   * Defaults → Schema-based defaults (id, timestamps) → Constructor defaults → Overrides
   *
   * The generated record is validated against the Zod schema before returning.
   * If validation fails, the error is thrown — your test data is invalid.
   *
   * @param overrides — Field values to override on top of defaults
   * @returns A schema-validated record
   * @throws Error if the generated record fails validation
   */
  create(overrides?: Partial<TRecord>): TRecord {
    const merged = {
      ...this.defaults,
      ...overrides,
    };

    // Schema validation — this is the Diamond Seal in action!
    const result = this.schema.safeParse(merged);

    if (!result.success) {
      const errorMessages = result.error instanceof Error ? result.error.message : JSON.stringify(result.error);
      throw new Error(
        `SchemaDataFactory: Generated record failed schema validation.\n` +
        `Error: ${errorMessages}\n` +
        `Record: ${JSON.stringify(merged, null, 2)}`,
      );
    }

    return result.data;
  }

  /**
   * Create multiple records.
   *
   * @param count — Number of records to create
   * @param overrides — Field values applied to ALL records
   * @returns Array of schema-validated records
   */
  createMany(count: number, overrides?: Partial<TRecord>): TRecord[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  /**
   * Create multiple records with per-record overrides.
   *
   * @param overrides — Array of per-record overrides (same length as desired count)
   * @returns Array of schema-validated records
   */
  createManyEach(overrides: Array<Partial<TRecord>>): TRecord[] {
    return overrides.map((o) => this.create(o));
  }
}
