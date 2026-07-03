/**
 * Organization Repository
 */

import { eq } from "drizzle-orm";
import type { DB } from "@rocky/database";
import { organizations as orgsTable, orgAreas as orgAreasTable } from "@rocky/database";
import { BaseRepository } from "@rocky/domains-shared";

export class OrganizationRepository extends BaseRepository {
  constructor(db: DB) {
    super(db);
  }

  async findById(id: string) {
    const [row] = await this.db.select().from(orgsTable).where(eq(orgsTable.id, id)).limit(1);
    return row ?? null;
  }

  async findAll() {
    return this.db.select().from(orgsTable).orderBy(orgsTable.name1);
  }

  async findByType(orgType: string) {
    return this.db.select().from(orgsTable).where(eq(orgsTable.orgType, orgType)).orderBy(orgsTable.name1);
  }

  async insert(data: typeof orgsTable.$inferInsert) {
    const [row] = await this.db.insert(orgsTable).values(data).returning();
    return row ?? null;
  }

  async update(id: string, data: Partial<typeof orgsTable.$inferInsert>) {
    const [row] = await this.db.update(orgsTable).set(data).where(eq(orgsTable.id, id)).returning();
    return row ?? null;
  }

  async findAreas(organizationId: string) {
    return this.db.select().from(orgAreasTable).where(eq(orgAreasTable.organizationId, organizationId));
  }
}
