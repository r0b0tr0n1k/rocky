import { z } from "zod";

export const createTodoSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1).max(200),
});

export const listTodosSchema = z.object({
  userId: z.string().uuid(),
  completed: z.boolean().optional(),
});

export const updateTodoSchema = z.object({
  userId: z.string().uuid(),
  id: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  completed: z.boolean().optional(),
});

export const deleteTodoSchema = z.object({
  userId: z.string().uuid(),
  id: z.string().uuid(),
});

export const getTodoByIdSchema = z.object({
  userId: z.string().uuid(),
  id: z.string().uuid(),
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type ListTodosInput = z.infer<typeof listTodosSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
export type DeleteTodoInput = z.infer<typeof deleteTodoSchema>;
export type GetTodoByIdInput = z.infer<typeof getTodoByIdSchema>;

export interface Todo {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}
