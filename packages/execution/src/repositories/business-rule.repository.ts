import { Injectable } from "@nestjs/common";
import { businessRules } from "@rocky/database";
import type { DatabaseProvider } from "@rocky/database";
import { eq } from "drizzle-orm";

@Injectable()
export class BusinessRuleRepository {
  constructor(private readonly dbp: DatabaseProvider) {}

  async getActiveForModule(moduleCode: string) {
    return this.dbp.client
      .select()
      .from(businessRules)
      .where(eq(businessRules.isActive, true));
  }
}
