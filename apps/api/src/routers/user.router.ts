// --- User Router - tRPC entry point ---

import { Inject, Injectable } from "@nestjs/common";
import { Policy, RegisterPolicy } from "@rocky/authorization/index.js";
import { UserService } from "@rocky/domains-user/index.js";
import type { AppContext } from "@rocky/trpc/context.js";
import { createResultUnwrapper } from "@rocky/trpc/index.js";
import {
  type CreateUserRequest,
  createUserRequestSchema,
  type UpdateUserRequest,
  type UserListRequest,
  type UserResponse,
  type UserSummary,
  updateUserRequestSchema,
  userListRequestSchema,
  userResponseSchema,
  userSummarySchema,
} from "@rocky/validators/api/index.js";
import { USER_TRPC_ERROR_MAP } from "@rocky/validators/errors/index.js";
import { Ctx, Input, Mutation, Query, Router } from "nestjs-trpc";
import { z } from "zod";

const idParam = z.object({ id: z.uuid() });
const unwrap = createResultUnwrapper(USER_TRPC_ERROR_MAP);

@Router({ alias: "user" })
@RegisterPolicy("user")
@Policy({ authenticated: true })
@Injectable()
export class UserRouter {
  constructor(@Inject(UserService) private readonly userService: UserService) {}

  @Query({ input: idParam, output: userResponseSchema })
  async getById(@Input() input: { id: string }): Promise<UserResponse> {
    return unwrap(await this.userService.getById(input.id));
  }

  @Query({ input: userListRequestSchema, output: z.array(userSummarySchema) })
  async list(@Input() input: UserListRequest): Promise<UserSummary[]> {
    const result = await this.userService.list(input);
    return unwrap(result).data;
  }

  @Mutation({ input: createUserRequestSchema, output: userResponseSchema })
  async create(@Input() input: CreateUserRequest, @Ctx() ctx: AppContext): Promise<UserResponse> {
    return unwrap(await this.userService.create({ ...input, createdBy: ctx.execution?.principal.id }));
  }

  @Mutation({ input: idParam.extend(updateUserRequestSchema.shape), output: userResponseSchema })
  async update(@Input() input: UpdateUserRequest & { id: string }): Promise<UserResponse> {
    const { id, ...data } = input;
    return unwrap(await this.userService.update(id, data));
  }
}
