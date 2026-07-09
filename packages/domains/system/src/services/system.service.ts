import { fromAsyncThrowable, type Result, toAppError } from "@rocky/domains-shared";
import { SystemError, SYSTEM_ERRORS } from "../errors/system.errors.js";
import type {
  ModuleListFilter,
  ParameterListFilter,
} from "../repositories/system.repository.js";
import type { SystemRepository } from "../repositories/system.repository.js";
import { buildRuleSet, type RuleSet } from "../rule-set.js";

export class SystemService {
  constructor(private readonly repo: SystemRepository) {}

  async listModules(
    filter: ModuleListFilter,
    limit: number,
    offset: number,
  ): Promise<Result<Awaited<ReturnType<SystemRepository["listModules"]>>, Error>> {
    return fromAsyncThrowable(async () => await this.repo.listModules(filter, limit, offset), toAppError)();
  }

  async updateModule(
    id: string,
    isActive: boolean,
  ): Promise<Result<Awaited<ReturnType<SystemRepository["updateModule"]>>, Error>> {
    return fromAsyncThrowable(async () => {
      const module = await this.repo.updateModule(id, isActive);
      if (!module) throw new SystemError(SYSTEM_ERRORS.MODULE_NOT_FOUND, { id });
      return module;
    }, toAppError)();
  }

  async listParameters(
    filter: ParameterListFilter,
    limit: number,
    offset: number,
  ): Promise<Result<Awaited<ReturnType<SystemRepository["listParameters"]>>, Error>> {
    return fromAsyncThrowable(async () => await this.repo.listParameters(filter, limit, offset), toAppError)();
  }

  async updateParameter(
    code: string,
    value?: string,
    isActive?: boolean,
  ): Promise<Result<Awaited<ReturnType<SystemRepository["updateParameter"]>>, Error>> {
    return fromAsyncThrowable(async () => {
      const existing = await this.repo.getParameterByCode(code);
      if (!existing) throw new SystemError(SYSTEM_ERRORS.PARAMETER_NOT_FOUND, { code });
      if (!existing.isEditable) throw new SystemError(SYSTEM_ERRORS.PARAMETER_NOT_EDITABLE, { code });
      const updated = await this.repo.updateParameter(code, { value, isActive });
      if (!updated) throw new SystemError(SYSTEM_ERRORS.PARAMETER_NOT_FOUND, { code });
      return updated;
    }, toAppError)();
  }

  /**
   * Resolve the active RuleSet (ADR-0030) for a jurisdiction from seeded
   * `system_parameters`. Domain services consume this instead of hardcoded
   * constants (the B2 gap, WO-012). MK is the seeded default.
   */
  async getRuleSet(jurisdiction = "MK"): Promise<Result<RuleSet, Error>> {
    return fromAsyncThrowable(async () => {
      const [business, inspection] = await Promise.all([
        this.repo.listParameters({ group: "business" }, 100, 0),
        this.repo.listParameters({ group: "inspection" }, 100, 0),
      ]);
      return buildRuleSet(jurisdiction, [...business.data, ...inspection.data]);
    }, toAppError)();
  }
}
