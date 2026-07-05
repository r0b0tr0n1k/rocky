import { eq, and } from "drizzle-orm";
import { vsContracts as vsContractsTable } from "@rocky/database";
import { BaseRepository } from "@rocky/domains-shared";
import { VS_CONTRACT_STATUS } from "@rocky/database/constants";

export interface VsContractInsert {
  subjectId: string;
  contractNumber: string;
  region: string;
  startDate: Date;
  endDate?: Date;
  notes?: string;
  createdBy?: string;
}

export class VsContractRepository extends BaseRepository {

  async findById(id: string) {
    const [row] = await this.client.select().from(vsContractsTable).where(eq(vsContractsTable.id, id)).limit(1);
    return row ?? null;
  }

  async findBySubject(subjectId: string) {
    return this.client
      .select()
      .from(vsContractsTable)
      .where(eq(vsContractsTable.subjectId, subjectId))
      .orderBy(vsContractsTable.createdAt);
  }

  async findByRegion(region: string) {
    return this.client
      .select()
      .from(vsContractsTable)
      .where(eq(vsContractsTable.region, region))
      .orderBy(vsContractsTable.createdAt);
  }

  async findActiveBySubject(subjectId: string) {
    return this.client
      .select()
      .from(vsContractsTable)
      .where(
        and(
          eq(vsContractsTable.subjectId, subjectId),
          eq(vsContractsTable.status, VS_CONTRACT_STATUS.ACTIVE),
          eq(vsContractsTable.isActive, true),
        ),
      )
      .orderBy(vsContractsTable.createdAt);
  }

  async insert(data: VsContractInsert) {
    const [row] = await this.client
      .insert(vsContractsTable)
      .values({
        subjectId: data.subjectId,
        contractNumber: data.contractNumber,
        region: data.region,
        startDate: data.startDate,
        endDate: data.endDate ?? null,
        status: VS_CONTRACT_STATUS.DRAFT,
        notes: data.notes ?? null,
        createdBy: data.createdBy,
      } as typeof vsContractsTable.$inferInsert)
      .returning();
    return row ?? null;
  }

  async updateStatus(id: string, status: string) {
    const [row] = await this.client
      .update(vsContractsTable)
      .set({
        status,
        updatedAt: new Date(),
      } as Partial<typeof vsContractsTable.$inferInsert>)
      .where(eq(vsContractsTable.id, id))
      .returning();
    return row ?? null;
  }
}
