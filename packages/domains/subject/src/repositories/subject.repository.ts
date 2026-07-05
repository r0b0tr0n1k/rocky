/**
 * Subject Repository
 *
 * @description DB access layer for subjects and farm-subject bindings.
 */

import { eq, and, or, ilike, sql } from "drizzle-orm";
import { subjects as subjectsTable, farmSubjects as farmSubjectsTable } from "@rocky/database";
import { BaseRepository } from "@rocky/domains-shared";

export class SubjectRepository extends BaseRepository {

  async findById(id: string) {
    const [row] = await this.client.select().from(subjectsTable).where(eq(subjectsTable.id, id)).limit(1);
    return row ?? null;
  }

  async search(query: string, limit: number, offset: number) {
    const cond = or(
      ilike(subjectsTable.shortName, `%${query}%`),
      ilike(subjectsTable.firstName, `%${query}%`),
      ilike(subjectsTable.lastName, `%${query}%`),
      ilike(subjectsTable.personalId, `%${query}%`),
      ilike(subjectsTable.phoneNumber, `%${query}%`),
    )!;
    const [data, totalResult] = await Promise.all([
      this.client.select().from(subjectsTable).where(cond).limit(limit).offset(offset),
      this.client.select({ count: sql<number>`count(*)::int` }).from(subjectsTable).where(cond),
    ]);
    return { data, total: totalResult[0]?.count ?? 0 };
  }

  async findByPersonalId(personalId: string) {
    const [row] = await this.client.select().from(subjectsTable).where(eq(subjectsTable.personalId, personalId)).limit(1);
    return row ?? null;
  }

  async insert(data: typeof subjectsTable.$inferInsert): Promise<typeof subjectsTable.$inferSelect | null> {
    const [row] = await this.client.insert(subjectsTable).values(data).returning();
    return row ?? null;
  }

  async update(id: string, data: Partial<typeof subjectsTable.$inferInsert>): Promise<typeof subjectsTable.$inferSelect | null> {
    const [row] = await this.client.update(subjectsTable).set(data).where(eq(subjectsTable.id, id)).returning();
    return row ?? null;
  }

  async insertFarmBinding(
    data: typeof farmSubjectsTable.$inferInsert,
  ): Promise<typeof farmSubjectsTable.$inferSelect | null> {
    const [row] = await this.client.insert(farmSubjectsTable).values(data).returning();
    return row ?? null;
  }

  async deleteFarmBinding(id: string) {
    const [row] = await this.client
      .delete(farmSubjectsTable)
      .where(eq(farmSubjectsTable.id, id))
      .returning({ id: farmSubjectsTable.id });
    return row ?? null;
  }

  async findFarmBindings(farmId: string) {
    return this.client
      .select()
      .from(farmSubjectsTable)
      .where(and(eq(farmSubjectsTable.farmId, farmId), eq(farmSubjectsTable.isActive, true)));
  }

  async findSubjectFarms(subjectId: string) {
    return this.client
      .select()
      .from(farmSubjectsTable)
      .where(and(eq(farmSubjectsTable.subjectId, subjectId), eq(farmSubjectsTable.isActive, true)));
  }

  async findSubjectBinding(farmId: string, subjectId: string, role: string) {
    const [row] = await this.client
      .select()
      .from(farmSubjectsTable)
      .where(
        and(
          eq(farmSubjectsTable.farmId, farmId),
          eq(farmSubjectsTable.subjectId, subjectId),
          eq(farmSubjectsTable.role, role),
          eq(farmSubjectsTable.isActive, true),
        ),
      )
      .limit(1);
    return row ?? null;
  }
}
