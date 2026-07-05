/**
 * User Repository
 */

import { users as usersTable } from "@rocky/database";
import { SORT_BY_USER, type SORT_ORDER } from "@rocky/database/constants";
import { BaseRepository } from "@rocky/domains-shared";
import { and, eq, ilike, or, sql } from "drizzle-orm";

export type SortByUser = (typeof SORT_BY_USER)[keyof typeof SORT_BY_USER];
export type SortOrder = (typeof SORT_ORDER)[keyof typeof SORT_ORDER];

export class UserRepository extends BaseRepository {

  async findById(id: string) {
    const [row] = await this.client.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    return row ?? null;
  }

  async findByUsername(username: string) {
    const [row] = await this.client.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
    return row ?? null;
  }

  async findByEmail(email: string) {
    const [row] = await this.client.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    return row ?? null;
  }

  async list(filters: {
    organizationId?: string;
    status?: string;
    search?: string;
    sortBy: string;
    sortOrder: string;
    limit: number;
    offset: number;
  }) {
    const conditions: ReturnType<typeof eq>[] = [];
    if (filters.organizationId) conditions.push(eq(usersTable.organizationId, filters.organizationId));
    if (filters.status) conditions.push(eq(usersTable.status, filters.status));
    if (filters.search) {
      const q = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(usersTable.username, q),
          ilike(usersTable.firstName, q),
          ilike(usersTable.lastName, q),
          ilike(usersTable.email, q),
        )!,
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const orderCol =
      filters.sortBy === SORT_BY_USER.USERNAME
        ? usersTable.username
        : filters.sortBy === SORT_BY_USER.LAST_LOGIN_AT
          ? usersTable.lastLoginAt
          : usersTable.createdAt;

    const [data, totalResult] = await Promise.all([
      this.client.select().from(usersTable).where(where).orderBy(orderCol).limit(filters.limit).offset(filters.offset),
      this.client.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(where),
    ]);
    return { data, total: totalResult[0]?.count ?? 0 };
  }

  async insert(data: typeof usersTable.$inferInsert): Promise<typeof usersTable.$inferSelect | null> {
    const [row] = await this.client.insert(usersTable).values(data).returning();
    return row ?? null;
  }

  async update(
    id: string,
    data: Partial<typeof usersTable.$inferInsert>,
  ): Promise<typeof usersTable.$inferSelect | null> {
    const [row] = await this.client.update(usersTable).set(data).where(eq(usersTable.id, id)).returning();
    return row ?? null;
  }
}
