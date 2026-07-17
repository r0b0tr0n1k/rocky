/**
 * User Domain Service
 */

import { fromAsyncThrowable, type Result, toAppError } from "@rocky/domains-shared";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  UserListRequest,
  UserResponse,
  UserSummary,
} from "@rocky/validators/api";
import { userResponseSchema, userSummarySchema } from "@rocky/validators/api";
import { USER_ERRORS, UserError } from "../errors/user.errors.js";
import type { UserRepository, UserRow } from "../repositories/user.repository.js";

export class UserService {
  constructor(private readonly repo: UserRepository) { }

  async getById(id: string): Promise<Result<UserResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const user = await this.repo.findById(id);
      if (!user) throw new UserError(USER_ERRORS.NOT_FOUND, { id });
      return userResponseSchema.parse(user);
    }, toAppError)();
  }

  async list(input: UserListRequest): Promise<Result<{ data: UserSummary[]; total: number }, Error>> {
    return fromAsyncThrowable(async () => {
      const result = await this.repo.list(input);
      return { data: userSummarySchema.array().parse(result.data), total: result.total };
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
      // password field is currently unused — Better Auth manages authentication
      // In the future, pass it to Better Auth API for user creation
      const { password: _password, ...rest } = input;
      const dbInput: UserRow = {
        ...rest,
      };
      const user = await this.repo.insert(dbInput);
      return userResponseSchema.parse(user);
    }, toAppError)();
  }

  async update(id: string, input: UpdateUserRequest): Promise<Result<UserResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const existing = await this.repo.findById(id);
      if (!existing) throw new UserError(USER_ERRORS.NOT_FOUND, { id });
      const user = await this.repo.update(id, input);
      return userResponseSchema.parse(user);
    }, toAppError)();
  }
}
