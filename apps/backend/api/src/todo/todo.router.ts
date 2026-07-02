import { Injectable } from "@nestjs/common";
import { Router, Query, Mutation } from "nestjs-trpc-v2";
import { z } from "zod";
import { db } from "@prasici/database";
import { TodoService, createTodoSchema, updateTodoSchema, TODO_ERRORS } from "@prasici/domains-todo";
import { TRPCError } from "@trpc/server";

const listInputSchema = z.object({ completed: z.boolean().optional() });

@Router()
@Injectable()
export class TodoRouter {
  private readonly todoService = new TodoService(db);

  @Query({ input: listInputSchema, output: z.array(z.any()) })
  async list(input: { completed?: boolean }) {
    const result = await this.todoService.list({
      userId: "00000000-0000-0000-0000-000000000000",
      completed: input.completed,
    });
    if (result.isErr()) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: result.error.message,
      });
    }
    return result.value;
  }

  @Query({ input: z.object({ id: z.string().uuid() }), output: z.any() })
  async getById(input: { id: string }) {
    const result = await this.todoService.getById({
      userId: "00000000-0000-0000-0000-000000000000",
      id: input.id,
    });
    if (result.isErr()) {
      throw mapTodoError(result.error);
    }
    return result.value;
  }

  @Mutation({ input: z.object({ title: z.string() }), output: z.any() })
  async create(input: { title: string }) {
    const result = await this.todoService.create({
      userId: "00000000-0000-0000-0000-000000000000",
      title: input.title,
    });
    if (result.isErr()) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: result.error.message,
      });
    }
    return result.value;
  }

  @Mutation({ input: updateTodoSchema, output: z.any() })
  async update(input: z.infer<typeof updateTodoSchema>) {
    const result = await this.todoService.update({ ...input, userId: "00000000-0000-0000-0000-000000000000" });
    if (result.isErr()) {
      throw mapTodoError(result.error);
    }
    return result.value;
  }

  @Mutation({ input: z.object({ id: z.string().uuid() }), output: z.any() })
  async delete(input: { id: string }) {
    const result = await this.todoService.delete({
      userId: "00000000-0000-0000-0000-000000000000",
      id: input.id,
    });
    if (result.isErr()) {
      throw mapTodoError(result.error);
    }
    return result.value;
  }
}

function mapTodoError(error: Error): TRPCError {
  switch (error.message) {
    case TODO_ERRORS.NOT_FOUND:
      return new TRPCError({ code: "NOT_FOUND", message: "Todo not found" });
    case TODO_ERRORS.NOT_AUTHORIZED:
      return new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
    default:
      return new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
  }
}
