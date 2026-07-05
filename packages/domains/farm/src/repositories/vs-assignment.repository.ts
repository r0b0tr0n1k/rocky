import { eq, and } from "drizzle-orm";
import { vsAssignments as vsAssignmentsTable } from "@rocky/database";
import { BaseRepository } from "@rocky/domains-shared";

export interface VsAssignmentInsert {
  contractId: string;
  farmId: string;
  startDate: Date;
  endDate?: Date;
  isPrimary?: boolean;
  notes?: string;
  createdBy?: string;
}

export class VsAssignmentRepository extends BaseRepository {

  async findById(id: string) {
    const [row] = await this.client.select().from(vsAssignmentsTable).where(eq(vsAssignmentsTable.id, id)).limit(1);
    return row ?? null;
  }

  async findActiveByFarm(farmId: string) {
    return this.client
      .select()
      .from(vsAssignmentsTable)
      .where(
        and(
          eq(vsAssignmentsTable.farmId, farmId),
          eq(vsAssignmentsTable.isActive, true),
        ),
      )
      .orderBy(vsAssignmentsTable.createdAt);
  }

  async findByContract(contractId: string) {
    return this.client
      .select()
      .from(vsAssignmentsTable)
      .where(eq(vsAssignmentsTable.contractId, contractId))
      .orderBy(vsAssignmentsTable.createdAt);
  }

  async findByFarm(farmId: string) {
    return this.client
      .select()
      .from(vsAssignmentsTable)
      .where(eq(vsAssignmentsTable.farmId, farmId))
      .orderBy(vsAssignmentsTable.createdAt);
  }

  async insert(data: VsAssignmentInsert) {
    const [row] = await this.client
      .insert(vsAssignmentsTable)
      .values({
        contractId: data.contractId,
        farmId: data.farmId,
        startDate: data.startDate,
        endDate: data.endDate ?? null,
        isPrimary: data.isPrimary ?? true,
        notes: data.notes ?? null,
        createdBy: data.createdBy,
      } as typeof vsAssignmentsTable.$inferInsert)
      .returning();
    return row ?? null;
  }

  async deactivateByFarm(farmId: string) {
    await this.client
      .update(vsAssignmentsTable)
      .set({
        isActive: false,
        updatedAt: new Date(),
      } as Partial<typeof vsAssignmentsTable.$inferInsert>)
      .where(
        and(
          eq(vsAssignmentsTable.farmId, farmId),
          eq(vsAssignmentsTable.isActive, true),
        ),
      );
  }

  async update(id: string, data: Partial<typeof vsAssignmentsTable.$inferInsert>) {
    const [row] = await this.client
      .update(vsAssignmentsTable)
      .set({ ...data, updatedAt: new Date() } as Partial<typeof vsAssignmentsTable.$inferInsert>)
      .where(eq(vsAssignmentsTable.id, id))
      .returning();
    return row ?? null;
  }
}
