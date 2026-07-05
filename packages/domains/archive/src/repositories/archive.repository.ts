/**
 * Archive Repository
 *
 * @description DB access layer for archive domain — CRUD on archive_documents table.
 */

import { eq, and, ilike, desc, asc, sql, type SQL } from "drizzle-orm";
import { archiveDocuments as archiveDocumentsTable } from "@rocky/database";
import { BaseRepository } from "@rocky/domains-shared";

export class ArchiveRepository extends BaseRepository {

  // ── Read ──

  async findById(id: string) {
    const [row] = await this.client.select().from(archiveDocumentsTable).where(eq(archiveDocumentsTable.id, id)).limit(1);
    return row ?? null;
  }

  async list(opts: { documentType?: string; archiveLocation?: string; farmId?: string; isArchived?: boolean; search?: string; limit: number; offset: number }) {
    const c: SQL<unknown>[] = [];
    if (opts.documentType) c.push(eq(archiveDocumentsTable.documentType, opts.documentType));
    if (opts.archiveLocation) c.push(eq(archiveDocumentsTable.archiveLocation, opts.archiveLocation));
    if (opts.farmId) c.push(eq(archiveDocumentsTable.farmId, opts.farmId));
    if (opts.isArchived !== undefined) c.push(eq(archiveDocumentsTable.isArchived, opts.isArchived));
    if (opts.search) c.push(ilike(archiveDocumentsTable.documentRef, `%${opts.search}%`));
    const where = c.length > 0 ? and(...c) : undefined;
    const [data, totalResult] = await Promise.all([
      this.client.select().from(archiveDocumentsTable).where(where).orderBy(desc(archiveDocumentsTable.createdAt)).limit(opts.limit).offset(opts.offset),
      this.client.select({ count: sql<number>`count(*)::int` }).from(archiveDocumentsTable).where(where),
    ]);
    return { data, total: totalResult[0]?.count ?? 0 };
  }

  /** Find documents where retention has expired and not yet destroyed */
  async findExpiredRetention(limit = 100) {
    return this.client
      .select()
      .from(archiveDocumentsTable)
      .where(
        and(
          eq(archiveDocumentsTable.isActive, true),
          sql`${archiveDocumentsTable.retentionExpiry} < NOW()`,
          sql`${archiveDocumentsTable.destroyedAt} IS NULL`,
        ),
      )
      .orderBy(asc(archiveDocumentsTable.retentionExpiry))
      .limit(limit);
  }

  /** Find by inspection ID (for inspection form archival) */
  async findByInspectionId(inspectionId: string) {
    const [row] = await this.client.select().from(archiveDocumentsTable).where(eq(archiveDocumentsTable.inspectionId, inspectionId)).limit(1);
    return row ?? null;
  }

  /** Find by passport ID (for passport seizure archival) */
  async findByPassportId(passportId: string) {
    const [row] = await this.client.select().from(archiveDocumentsTable).where(eq(archiveDocumentsTable.passportId, passportId)).limit(1);
    return row ?? null;
  }

  /** Find by document reference (for error correction archival) */
  async findByDocumentRef(documentRef: string) {
    const [row] = await this.client.select().from(archiveDocumentsTable).where(eq(archiveDocumentsTable.documentRef, documentRef)).limit(1);
    return row ?? null;
  }

  // ── Write ──

  async create(data: typeof archiveDocumentsTable.$inferInsert) {
    const [row] = await this.client.insert(archiveDocumentsTable).values(data).returning();
    return row ?? null;
  }

  async update(id: string, data: Partial<typeof archiveDocumentsTable.$inferInsert>) {
    const [row] = await this.client.update(archiveDocumentsTable).set({ ...data, updatedAt: new Date() }).where(eq(archiveDocumentsTable.id, id)).returning();
    return row ?? null;
  }

  async markArchived(id: string) {
    return this.update(id, { isArchived: true, archivedAt: new Date() });
  }

  async markDestroyed(id: string) {
    return this.update(id, { destroyedAt: new Date(), isActive: false });
  }
}
