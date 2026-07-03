import { type Result, fromAsyncThrowable } from "neverthrow";
import { eq, and } from "drizzle-orm";
import type { DB } from "@rocky/database";
import { todos } from "@rocky/database/schema/demo";
import { toAppError } from "@rocky/trpc";
import {
  createTodoSchema,
  listTodosSchema,
  updateTodoSchema,
  deleteTodoSchema,
  getTodoByIdSchema,
  type CreateTodoInput,
  type ListTodosInput,
  type UpdateTodoInput,
  type DeleteTodoInput,
  type GetTodoByIdInput,
  type Todo,
} from "../types/todo.types";
import { todoErr, TODO_ERRORS } from "../errors/todo.errors";

export class TodoService {
  constructor(private readonly db: DB) {}

  async create(input: CreateTodoInput): Promise<Result<Todo, Error>> {
    return fromAsyncThrowable(async () => {
      const validated = createTodoSchema.parse(input);
      const now = new Date();
      const [todo] = await this.db
        .insert(todos)
        .values({
          userId: validated.userId,
          title: validated.title,
          completed: false,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      return todo as Todo;
    }, toAppError)();
  }

  async list(input: ListTodosInput): Promise<Result<Todo[], Error>> {
    return fromAsyncThrowable(async () => {
      const validated = listTodosSchema.parse(input);
      const conditions = [eq(todos.userId, validated.userId)];
      if (typeof validated.completed === "boolean") {
        conditions.push(eq(todos.completed, validated.completed));
      }
      const result = await this.db
        .select()
        .from(todos)
        .where(and(...conditions))
        .orderBy(todos.createdAt);
      return result as Todo[];
    }, toAppError)();
  }

  async getById(input: GetTodoByIdInput): Promise<Result<Todo, Error>> {
    return fromAsyncThrowable(async () => {
      const validated = getTodoByIdSchema.parse(input);
      const [todo] = await this.db
        .select()
        .from(todos)
        .where(and(eq(todos.id, validated.id), eq(todos.userId, validated.userId)))
        .limit(1);
      if (!todo) {
        throw new Error(TODO_ERRORS.NOT_FOUND);
      }
      return todo as Todo;
    }, toAppError)();
  }

  async update(input: UpdateTodoInput): Promise<Result<Todo, Error>> {
    return fromAsyncThrowable(async () => {
      const validated = updateTodoSchema.parse(input);
      const patch: Partial<Pick<Todo, "title" | "completed" | "updatedAt">> = {
        updatedAt: new Date(),
      };
      if (validated.title !== undefined) patch.title = validated.title;
      if (validated.completed !== undefined) patch.completed = validated.completed;

      const [todo] = await this.db
        .update(todos)
        .set(patch)
        .where(and(eq(todos.id, validated.id), eq(todos.userId, validated.userId)))
        .returning();
      if (!todo) {
        throw new Error(TODO_ERRORS.NOT_FOUND);
      }
      return todo as Todo;
    }, toAppError)();
  }

  async delete(input: DeleteTodoInput): Promise<Result<{ deleted: boolean }, Error>> {
    return fromAsyncThrowable(async () => {
      const validated = deleteTodoSchema.parse(input);
      const [todo] = await this.db
        .delete(todos)
        .where(and(eq(todos.id, validated.id), eq(todos.userId, validated.userId)))
        .returning({ id: todos.id });
      if (!todo) {
        throw new Error(TODO_ERRORS.NOT_FOUND);
      }
      return { deleted: true };
    }, toAppError)();
  }
}
