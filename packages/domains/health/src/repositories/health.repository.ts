/**
 * Health Repository
 *
 * @description DB access layer for health domain (diseases, vaccines, batches, vaccinations, treatments, lab tests, vaccine-disease links).
 */

import { eq, and, ilike, desc, asc, sql, type SQL } from "drizzle-orm";
import type { DB } from "@rocky/database";
import {
  diseases as diseasesTable,
  vaccines as vaccinesTable,
  vaccineBatches as vaccineBatchesTable,
  vaccinations as vaccinationsTable,
  treatments as treatmentsTable,
  labTests as labTestsTable,
  vaccineDiseases as vaccineDiseasesTable,
} from "@rocky/database";
import { BaseRepository } from "@rocky/domains-shared";

export class HealthRepository extends BaseRepository {
  constructor(db: DB) {
    super(db);
  }

  // ── Disease ──

  async findDiseaseById(id: string) {
    const [row] = await this.db.select().from(diseasesTable).where(eq(diseasesTable.id, id)).limit(1);
    return row ?? null;
  }

  async listDiseases(opts: { search?: string; notifiable?: boolean; limit: number; offset: number }) {
    const c: SQL<unknown>[] = [];
    if (opts.search) c.push(ilike(diseasesTable.name, `%${opts.search}%`));
    if (opts.notifiable !== undefined) c.push(eq(diseasesTable.notifiable, opts.notifiable));
    const where = c.length > 0 ? and(...c) : undefined;
    const [data, totalResult] = await Promise.all([
      this.db.select().from(diseasesTable).where(where).orderBy(asc(diseasesTable.name)).limit(opts.limit).offset(opts.offset),
      this.db.select({ count: sql<number>`count(*)::int` }).from(diseasesTable).where(where),
    ]);
    return { data, total: totalResult[0]?.count ?? 0 };
  }

  async createDisease(data: typeof diseasesTable.$inferInsert) {
    const [row] = await this.db.insert(diseasesTable).values(data).returning();
    return row ?? null;
  }

  async updateDisease(id: string, data: Partial<typeof diseasesTable.$inferInsert>) {
    const [row] = await this.db.update(diseasesTable).set({ ...data, updatedAt: new Date() }).where(eq(diseasesTable.id, id)).returning();
    return row ?? null;
  }

  // ── Vaccine ──

  async findVaccineById(id: string) {
    const [row] = await this.db.select().from(vaccinesTable).where(eq(vaccinesTable.id, id)).limit(1);
    return row ?? null;
  }

  async listVaccines(opts: { search?: string; type?: string; limit: number; offset: number }) {
    const c: SQL<unknown>[] = [];
    if (opts.search) c.push(ilike(vaccinesTable.name, `%${opts.search}%`));
    if (opts.type) c.push(eq(vaccinesTable.type, opts.type));
    const where = c.length > 0 ? and(...c) : undefined;
    const [data, totalResult] = await Promise.all([
      this.db.select().from(vaccinesTable).where(where).orderBy(asc(vaccinesTable.name)).limit(opts.limit).offset(opts.offset),
      this.db.select({ count: sql<number>`count(*)::int` }).from(vaccinesTable).where(where),
    ]);
    return { data, total: totalResult[0]?.count ?? 0 };
  }

  async createVaccine(data: typeof vaccinesTable.$inferInsert) {
    const [row] = await this.db.insert(vaccinesTable).values(data).returning();
    return row ?? null;
  }

  // ── Vaccine Batch ──

  async findBatchById(id: string) {
    const [row] = await this.db.select().from(vaccineBatchesTable).where(eq(vaccineBatchesTable.id, id)).limit(1);
    return row ?? null;
  }

  async findBatchWithVaccine(id: string) {
    const [row] = await this.db
      .select({
        batch: vaccineBatchesTable,
        vaccineName: vaccinesTable.name,
      })
      .from(vaccineBatchesTable)
      .innerJoin(vaccinesTable, eq(vaccineBatchesTable.vaccineId, vaccinesTable.id))
      .where(eq(vaccineBatchesTable.id, id))
      .limit(1);
    return row ?? null;
  }

  async listBatches(opts: { vaccineId?: string; limit: number; offset: number }) {
    const c: SQL<unknown>[] = [];
    if (opts.vaccineId) c.push(eq(vaccineBatchesTable.vaccineId, opts.vaccineId));
    const where = c.length > 0 ? and(...c) : undefined;
    const [data, totalResult] = await Promise.all([
      this.db.select().from(vaccineBatchesTable).where(where).orderBy(desc(vaccineBatchesTable.expiryDate)).limit(opts.limit).offset(opts.offset),
      this.db.select({ count: sql<number>`count(*)::int` }).from(vaccineBatchesTable).where(where),
    ]);
    return { data, total: totalResult[0]?.count ?? 0 };
  }

  async createBatch(data: typeof vaccineBatchesTable.$inferInsert) {
    const [row] = await this.db.insert(vaccineBatchesTable).values(data).returning();
    return row ?? null;
  }

  async decrementBatchQuantity(id: string) {
    const [row] = await this.db
      .update(vaccineBatchesTable)
      .set({ quantityRemaining: sql`${vaccineBatchesTable.quantityRemaining} - 1`, updatedAt: new Date() })
      .where(eq(vaccineBatchesTable.id, id))
      .returning();
    return row ?? null;
  }

  // ── Vaccination ──

  async createVaccination(data: typeof vaccinationsTable.$inferInsert) {
    const [row] = await this.db.insert(vaccinationsTable).values(data).returning();
    return row ?? null;
  }

  async findVaccinationById(id: string) {
    const [row] = await this.db.select().from(vaccinationsTable).where(eq(vaccinationsTable.id, id)).limit(1);
    return row ?? null;
  }

  async listVaccinations(opts: { animalId?: string; farmId?: string; vaccineId?: string; vetId?: string; limit: number; offset: number }) {
    const c: SQL<unknown>[] = [];
    if (opts.animalId) c.push(eq(vaccinationsTable.animalId, opts.animalId));
    if (opts.farmId) c.push(eq(vaccinationsTable.farmId, opts.farmId));
    if (opts.vaccineId) c.push(eq(vaccinationsTable.vaccineId, opts.vaccineId));
    if (opts.vetId) c.push(eq(vaccinationsTable.vetId, opts.vetId));
    const where = c.length > 0 ? and(...c) : undefined;
    const [data, totalResult] = await Promise.all([
      this.db.select().from(vaccinationsTable).where(where).orderBy(desc(vaccinationsTable.adminDate)).limit(opts.limit).offset(opts.offset),
      this.db.select({ count: sql<number>`count(*)::int` }).from(vaccinationsTable).where(where),
    ]);
    return { data, total: totalResult[0]?.count ?? 0 };
  }

  // ── Treatment ──

  async createTreatment(data: typeof treatmentsTable.$inferInsert) {
    const [row] = await this.db.insert(treatmentsTable).values(data).returning();
    return row ?? null;
  }

  async findTreatmentById(id: string) {
    const [row] = await this.db.select().from(treatmentsTable).where(eq(treatmentsTable.id, id)).limit(1);
    return row ?? null;
  }

  async listTreatments(opts: { animalId?: string; farmId?: string; diseaseId?: string; vetId?: string; limit: number; offset: number }) {
    const c: SQL<unknown>[] = [];
    if (opts.animalId) c.push(eq(treatmentsTable.animalId, opts.animalId));
    if (opts.farmId) c.push(eq(treatmentsTable.farmId, opts.farmId));
    if (opts.diseaseId) c.push(eq(treatmentsTable.diseaseId, opts.diseaseId));
    if (opts.vetId) c.push(eq(treatmentsTable.vetId, opts.vetId));
    const where = c.length > 0 ? and(...c) : undefined;
    const [data, totalResult] = await Promise.all([
      this.db.select().from(treatmentsTable).where(where).orderBy(desc(treatmentsTable.diagnosisDate)).limit(opts.limit).offset(opts.offset),
      this.db.select({ count: sql<number>`count(*)::int` }).from(treatmentsTable).where(where),
    ]);
    return { data, total: totalResult[0]?.count ?? 0 };
  }

  // ── Lab Test ──

  async createLabTest(data: typeof labTestsTable.$inferInsert) {
    const [row] = await this.db.insert(labTestsTable).values(data).returning();
    return row ?? null;
  }

  async findLabTestById(id: string) {
    const [row] = await this.db.select().from(labTestsTable).where(eq(labTestsTable.id, id)).limit(1);
    return row ?? null;
  }

  async listLabTests(opts: { animalId?: string; farmId?: string; diseaseId?: string; testType?: string; result?: string; limit: number; offset: number }) {
    const c: SQL<unknown>[] = [];
    if (opts.animalId) c.push(eq(labTestsTable.animalId, opts.animalId));
    if (opts.farmId) c.push(eq(labTestsTable.farmId, opts.farmId));
    if (opts.diseaseId) c.push(eq(labTestsTable.diseaseId, opts.diseaseId));
    if (opts.testType) c.push(eq(labTestsTable.testType, opts.testType));
    if (opts.result) c.push(eq(labTestsTable.result, opts.result));
    const where = c.length > 0 ? and(...c) : undefined;
    const [data, totalResult] = await Promise.all([
      this.db.select().from(labTestsTable).where(where).orderBy(desc(labTestsTable.resultDate)).limit(opts.limit).offset(opts.offset),
      this.db.select({ count: sql<number>`count(*)::int` }).from(labTestsTable).where(where),
    ]);
    return { data, total: totalResult[0]?.count ?? 0 };
  }

  // ── Vaccine-Disease Links ──

  async linkVaccineToDisease(data: typeof vaccineDiseasesTable.$inferInsert) {
    const [row] = await this.db.insert(vaccineDiseasesTable).values(data).returning();
    return row ?? null;
  }

  async unlinkVaccineFromDisease(vaccineId: string, diseaseId: string) {
    const [row] = await this.db
      .delete(vaccineDiseasesTable)
      .where(and(eq(vaccineDiseasesTable.vaccineId, vaccineId), eq(vaccineDiseasesTable.diseaseId, diseaseId)))
      .returning();
    return row ?? null;
  }

  async findVaccineDiseases(vaccineId: string) {
    const rows = await this.db
      .select()
      .from(vaccineDiseasesTable)
      .where(eq(vaccineDiseasesTable.vaccineId, vaccineId));
    return rows;
  }

  async findVaccineDiseaseLink(vaccineId: string, diseaseId: string) {
    const [row] = await this.db
      .select()
      .from(vaccineDiseasesTable)
      .where(and(eq(vaccineDiseasesTable.vaccineId, vaccineId), eq(vaccineDiseasesTable.diseaseId, diseaseId)))
      .limit(1);
    return row ?? null;
  }
}
