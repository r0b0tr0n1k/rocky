import { Injectable } from "@nestjs/common";
import type { BusinessRuleRepository } from "../repositories/business-rule.repository.js";
import type { businessRules } from "@rocky/database";

export interface ExecutionContext {
  data: Record<string, unknown>;
}

export interface RuleEvaluation {
  ruleId: string;
  ruleName: string;
  passed: boolean;
  message?: string;
  severity?: string;
}

@Injectable()
export class ExecutionService {
  constructor(
    private readonly ruleRepo: BusinessRuleRepository,
  ) {}

  async evaluateForMobile(
    entityType: string,
    context: ExecutionContext,
  ): Promise<RuleEvaluation[]> {
    const rules = await this.ruleRepo.getActiveForModule(entityType);
    const mobileRules = rules.filter((rule) => {
      if (!rule.runOnMobile) return false;
      if (rule.executeIf) {
        return this.evaluateCondition(rule.executeIf, context);
      }
      return true;
    });

    return this.evaluateAll(mobileRules, context);
  }

  async evaluateForServer(
    entityType: string,
    context: ExecutionContext,
  ): Promise<RuleEvaluation[]> {
    const rules = await this.ruleRepo.getActiveForModule(entityType);
    return this.evaluateAll(rules, context);
  }

  private evaluateAll(
    rules: typeof businessRules.$inferSelect[],
    context: ExecutionContext,
  ): RuleEvaluation[] {
    return rules.map<RuleEvaluation>((rule) => {
      try {
        const fn = new Function("ctx", `return !(${rule.validatorPath ?? "true"})`);
        const failed = fn(context.data);
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          passed: !failed,
          message: failed ? rule.messageTemplate ?? `Rule ${rule.name} failed` : undefined,
          severity: failed ? rule.severity : undefined,
        };
      } catch {
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          passed: false,
          message: `Rule evaluation error for ${rule.name}`,
          severity: "error",
        };
      }
    });
  }

  private evaluateCondition(expression: string, context: ExecutionContext): boolean {
    try {
      const fn = new Function("ctx", `return ${expression}`);
      return fn(context.data);
    } catch {
      return false;
    }
  }
}
