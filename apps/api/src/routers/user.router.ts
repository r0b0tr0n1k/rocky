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
import type { SubtypeGuillotine, ActivateGuillotines } from "@rocky/validators/utils";

const idParam = z.object({ id: z.uuid() });
const unwrap = createResultUnwrapper(USER_TRPC_ERROR_MAP);


// Named output schemas (were inline) — required so Bridge 2b can reference
// `z.output<typeof X>` and prove the declared contract vs the service Result.
const userArraySchema = z.array(userSummarySchema);
@Router({ alias: "user" })
@RegisterPolicy("user")
@Policy({ authenticated: true, roles: ["SUPER_ADMIN"] })
@Injectable()
export class UserRouter {
  constructor(@Inject(UserService) private readonly userService: UserService) {}

  @Query({ input: idParam, output: userResponseSchema })
  async getById(@Input() input: { id: string }): Promise<UserResponse> {
    return unwrap(await this.userService.getById(input.id));
  }

  @Query({ input: userListRequestSchema, output: userArraySchema })
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

// SubtypeGuillotine (one-directional: schema output ⊆ return type) — response
// schemas are Drizzle-derived projections; the hand-written interface is the
// wider SSOT, so AssertEqual would false-positive. See audit G3.
type _verify_getByIdOutput = SubtypeGuillotine<
  z.output<typeof userResponseSchema>,
  Awaited<ReturnType<UserRouter["getById"]>>
>;
type _verify_listOutput = SubtypeGuillotine<
  z.output<typeof userArraySchema>,
  Awaited<ReturnType<UserRouter["list"]>>
>;
type _verify_createOutput = SubtypeGuillotine<
  z.output<typeof userResponseSchema>,
  Awaited<ReturnType<UserRouter["create"]>>
>;
type _verify_updateOutput = SubtypeGuillotine<
  z.output<typeof userResponseSchema>,
  Awaited<ReturnType<UserRouter["update"]>>
>;

export type _UserGuillotines = ActivateGuillotines<[
  _verify_getByIdOutput,
  _verify_listOutput,
  _verify_createOutput,
  _verify_updateOutput
]>;
