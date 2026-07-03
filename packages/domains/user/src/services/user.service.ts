/**
 * User Domain Service
 */

import type {
  UserResponse,
  UserSummary,
  CreateUserRequest,
  UpdateUserRequest,
  UserListRequest,
} from "@rocky/validators/api";
import { type Result, fromAsyncThrowable, toAppError } from "@rocky/domains-shared";
import { UserError, USER_ERRORS } from "../errors/user.errors.js";
import type { UserRepository } from "../repositories/user.repository.js";
import type { users as usersTable } from "@rocky/database";

export class UserService {
  constructor(private readonly repo: UserRepository) {}

  async getById(id: string): Promise<Result<UserResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const user = await this.repo.findById(id);
      if (!user) throw new UserError(USER_ERRORS.NOT_FOUND, { id });
      return user as unknown as UserResponse;
    }, toAppError)();
  }

  async list(input: UserListRequest): Promise<Result<{ data: UserSummary[]; total: number }, Error>> {
    return fromAsyncThrowable(async () => {
      const result = await this.repo.list(input);
      return { data: result.data as unknown as UserSummary[], total: result.total };
    }, toAppError)();
  }

  async create(input: CreateUserRequest & { createdBy?: string }): Promise<Result<UserResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const existing = await this.repo.findByUsername(input.username);
      if (existing) throw new UserError(USER_ERRORS.DUPLICATE_USERNAME, { username: input.username });
      if (input.email) {
        const existingEmail = await this.repo.findByEmail(input.email);
        if (existingEmail) throw new UserError(USER_ERRORS.DUPLICATE_EMAIL, { email: input.email });
      }
      const { password, ...rest } = input;
      const dbInput: typeof usersTable.$inferInsert = {
        ...rest,
        passwordHash: password,
      };
      const user = await this.repo.insert(dbInput);
      return user as unknown as UserResponse;
    }, toAppError)();
  }

  async update(id: string, input: UpdateUserRequest): Promise<Result<UserResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const existing = await this.repo.findById(id);
      if (!existing) throw new UserError(USER_ERRORS.NOT_FOUND, { id });
      const user = await this.repo.update(id, input);
      return user as unknown as UserResponse;
    }, toAppError)();
  }
}
