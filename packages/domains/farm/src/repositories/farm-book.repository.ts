import { eq } from "drizzle-orm";
import { farmBooks as farmBooksTable } from "@rocky/database";
import { BaseRepository } from "@rocky/domains-shared";
import { FARM_BOOK_STATUS } from "@rocky/database/constants";

export interface FarmBookInsert {
  farmId: string;
  status: string;
  assembledAt?: Date;
  assembledBy?: string;
  notes?: string;
  createdBy?: string;
}

export interface FarmBookStatusUpdate {
  status: string;
  vsId?: string;
  notes?: string;
}

const STATUS_TIMESTAMP_FIELD: Record<string, string> = {
  [FARM_BOOK_STATUS.ASSEMBLED]: "assembledAt",
  [FARM_BOOK_STATUS.PRINTED]: "printedAt",
  [FARM_BOOK_STATUS.SHIPPED_TO_VS]: "shippedAt",
  [FARM_BOOK_STATUS.DELIVERED]: "deliveredAt",
};

const STATUS_USER_FIELD: Record<string, string> = {
  [FARM_BOOK_STATUS.ASSEMBLED]: "assembledBy",
  [FARM_BOOK_STATUS.PRINTED]: "printedBy",
};

export class FarmBookRepository extends BaseRepository {

  async findById(id: string) {
    const [row] = await this.client.select().from(farmBooksTable).where(eq(farmBooksTable.id, id)).limit(1);
    return row ?? null;
  }

  async findByFarmId(farmId: string) {
    return this.client
      .select()
      .from(farmBooksTable)
      .where(eq(farmBooksTable.farmId, farmId))
      .orderBy(farmBooksTable.createdAt);
  }

  async insert(data: FarmBookInsert) {
    const [row] = await this.client
      .insert(farmBooksTable)
      .values({
        farmId: data.farmId,
        status: data.status,
        assembledAt: data.assembledAt,
        assembledBy: data.assembledBy,
        notes: data.notes,
        createdBy: data.createdBy,
      } as typeof farmBooksTable.$inferInsert)
      .returning();
    return row ?? null;
  }

  async updateStatus(id: string, data: FarmBookStatusUpdate, updatedBy?: string) {
    const setFields: Record<string, unknown> = {
      status: data.status,
      updatedAt: new Date(),
    };

    const tsField = STATUS_TIMESTAMP_FIELD[data.status];
    if (tsField) setFields[tsField] = new Date();

    const userField = STATUS_USER_FIELD[data.status];
    if (userField && updatedBy) setFields[userField] = updatedBy;

    if (data.vsId) setFields.vsId = data.vsId;
    if (data.notes) setFields.notes = data.notes;

    const [row] = await this.client
      .update(farmBooksTable)
      .set(setFields as Partial<typeof farmBooksTable.$inferInsert>)
      .where(eq(farmBooksTable.id, id))
      .returning();
    return row ?? null;
  }
}
