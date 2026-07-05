// --- User Router - tRPC entry point ---

import { Inject, Injectable } from "@nestjs/common";
import { UserService } from "@rocky/domains-user";
import { createResultUnwrapper } from "@rocky/trpc";
import {
  createUserRequestSchema,
  updateUserRequestSchema,
  userListRequestSchema,
  userResponseSchema,
  userSummarySchema,
  type CreateUserRequest,
  type UpdateUserRequest,
  type UserListRequest,
  type UserResponse,
  type UserSummary,
} from "@rocky/validators/api";
import { USER_TRPC_ERROR_MAP } from "@rocky/validators/errors";
import { Ctx, Input, Mutation, Query, Router, UseMiddlewares } from "nestjs-trpc";
import { z } from "zod";
import { ProtectedMiddleware, type ProtectedMiddlewareContext } from "../trpc/middlewares/protected.middleware.js";

const idParam = z.object({ id: z.uuid() });
const unwrap = createResultUnwrapper(USER_TRPC_ERROR_MAP);

@Router({ alias: "user" })
@UseMiddlewares(ProtectedMiddleware)
@Injectable()
export class UserRouter {
  constructor(
    @Inject(UserService) private readonly userService: UserService,
  ) { }

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
  async create(
    @Input() input: CreateUserRequest,
    @Ctx() ctx: ProtectedMiddlewareContext,
  ): Promise<UserResponse> {
    return unwrap(
      await this.userService.create({ ...input, createdBy: ctx.auth.userId }),
    );
  }

  @Mutation({ input: idParam.extend(updateUserRequestSchema.shape), output: userResponseSchema })
  async update(@Input() input: UpdateUserRequest & { id: string }): Promise<UserResponse> {
    const { id, ...data } = input;
    return unwrap(await this.userService.update(id, data));
  }
}
