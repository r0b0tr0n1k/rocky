import { Injectable, Inject } from "@nestjs/common";
import { Ctx, Input, Mutation, Query, Router } from "nestjs-trpc-v2";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createResultUnwrapper } from "@prasici/trpc";
import type { AppContext } from "@prasici/trpc/context";
import { TodoService, TODO_ERRORS } from "@prasici/domains-todo";
import {
  createTodoSchema,
  updateTodoSchema,
  getTodoByIdSchema,
  deleteTodoSchema,
} from "@prasici/domains-todo/todo.types";
import type { Todo } from "@prasici/domains-todo/todo.types";
import { TODO_TRPC_ERROR_MAP } from "./todo.errors.js";

const unwrapResult = createResultUnwrapper(TODO_TRPC_ERROR_MAP);

const listInputSchema = z.object({ completed: z.boolean().optional() });
const idInputSchema = getTodoByIdSchema.omit({ userId: true });
const createInputSchema = createTodoSchema.omit({ userId: true });
const updateInputSchema = updateTodoSchema.omit({ userId: true });
const todoOutputSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  completed: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

@Router({ alias: "todo" })
@Injectable()
export class TodoRouter {
  constructor(
    @Inject(TodoService)
    private readonly _todoService: TodoService,
  ) {}

  @Query({ input: listInputSchema, output: todoOutputSchema.array() })
  async list(
    @Input() input: { completed?: boolean } | undefined,
    @Ctx() ctx: AppContext,
  ): Promise<Todo[]> {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    return unwrapResult(await this._todoService.list({
      userId: ctx.user.id,
      completed: input?.completed,
    }));
  }

  @Query({ input: idInputSchema, output: todoOutputSchema.nullable() })
  async getById(
    @Input() input: { id: string },
    @Ctx() ctx: AppContext,
  ): Promise<Todo | null> {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    return unwrapResult(await this._todoService.getById({
      userId: ctx.user.id,
      id: input.id,
    }));
  }

  @Mutation({ input: createInputSchema, output: todoOutputSchema })
  async create(
    @Input() input: { title: string },
    @Ctx() ctx: AppContext,
  ): Promise<Todo> {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    return unwrapResult(await this._todoService.create({
      userId: ctx.user.id,
      title: input.title,
    }));
  }

  @Mutation({ input: updateInputSchema, output: todoOutputSchema.nullable() })
  async update(
    @Input() input: { id: string; title?: string; completed?: boolean },
    @Ctx() ctx: AppContext,
  ): Promise<Todo | null> {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    return unwrapResult(await this._todoService.update({
      userId: ctx.user.id,
      ...input,
    }));
  }

  @Mutation({ input: idInputSchema, output: z.object({ deleted: z.boolean() }) })
  async delete(
    @Input() input: { id: string },
    @Ctx() ctx: AppContext,
  ): Promise<{ deleted: boolean }> {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    return unwrapResult(await this._todoService.delete({
      userId: ctx.user.id,
      id: input.id,
    }));
  }
}
