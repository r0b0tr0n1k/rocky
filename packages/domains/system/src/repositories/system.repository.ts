/**
 * System Repository
 *
 * @description DB access for the `sm` configuration tables: feature-flag
 * modules and system parameters (software preferences).
 */

import { and, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import {
  modules as modulesTable,
  systemParameters as systemParametersTable,
} from "@rocky/database";
import { BaseRepository } from "@rocky/domains-shared";

export interface ModuleListFilter {
  type?: string;
  isActive?: boolean;
  q?: string;
}

export interface ParameterListFilter {
  group?: string;
  code?: string;
  isActive?: boolean;
  q?: string;
}

export class SystemRepository extends BaseRepository {
  // ── Feature-flag modules ──

  async listModules(filter: ModuleListFilter, limit: number, offset: number) {
    const conditions: SQL[] = [];
    if (filter.type) conditions.push(eq(modulesTable.type, filter.type));
    if (filter.isActive !== undefined) conditions.push(eq(modulesTable.isActive, filter.isActive));
    if (filter.q) {
      conditions.push(
        or(
          ilike(modulesTable.name, `%${filter.q}%`),
          ilike(modulesTable.title, `%${filter.q}%`),
          ilike(modulesTable.route, `%${filter.q}%`),
        )!,
      );
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      this.client
        .select()
        .from(modulesTable)
        .where(where)
        .orderBy(modulesTable.orderSeq)
        .limit(limit)
        .offset(offset),
      this.client.select({ count: sql<number>`count(*)::int` }).from(modulesTable).where(where),
    ]);
    return { data, total: totalResult[0]?.count ?? 0 };
  }

  async getModuleById(id: string) {
    const [row] = await this.client.select().from(modulesTable).where(eq(modulesTable.id, id)).limit(1);
    return row ?? null;
  }

  async updateModule(id: string, isActive: boolean) {
    const [row] = await this.client
      .update(modulesTable)
      .set({ isActive })
      .where(eq(modulesTable.id, id))
      .returning();
    return row ?? null;
  }

  // ── System parameters (preferences) ──

  async listParameters(filter: ParameterListFilter, limit: number, offset: number) {
    const conditions: SQL[] = [];
    if (filter.group) conditions.push(eq(systemParametersTable.group, filter.group));
    if (filter.code) conditions.push(eq(systemParametersTable.code, filter.code));
    if (filter.isActive !== undefined) conditions.push(eq(systemParametersTable.isActive, filter.isActive));
    if (filter.q) {
      conditions.push(
        or(
          ilike(systemParametersTable.code, `%${filter.q}%`),
          ilike(systemParametersTable.description, `%${filter.q}%`),
          ilike(systemParametersTable.value, `%${filter.q}%`),
        )!,
      );
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      this.client
        .select()
        .from(systemParametersTable)
        .where(where)
        .orderBy(systemParametersTable.group, systemParametersTable.code)
        .limit(limit)
        .offset(offset),
      this.client.select({ count: sql<number>`count(*)::int` }).from(systemParametersTable).where(where),
    ]);
    return { data, total: totalResult[0]?.count ?? 0 };
  }

  async getParameterByCode(code: string) {
    const [row] = await this.client
      .select()
      .from(systemParametersTable)
      .where(eq(systemParametersTable.code, code))
      .limit(1);
    return row ?? null;
  }

  async updateParameter(code: string, data: { value?: string; isActive?: boolean }) {
    const [row] = await this.client
      .update(systemParametersTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(systemParametersTable.code, code))
      .returning();
    return row ?? null;
  }
}
