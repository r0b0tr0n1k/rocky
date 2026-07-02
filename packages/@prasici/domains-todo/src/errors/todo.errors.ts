import { err } from "neverthrow";

export const TODO_ERRORS = {
  NOT_FOUND: "TODO_NOT_FOUND",
  NOT_AUTHORIZED: "TODO_NOT_AUTHORIZED",
  DATABASE_ERROR: "TODO_DATABASE_ERROR",
} as const;

export type TodoErrorCode = (typeof TODO_ERRORS)[keyof typeof TODO_ERRORS];

export const todoErr = {
  notFound: (id: string) => err(TODO_ERRORS.NOT_FOUND, `Todo not found: ${id}`),
  notAuthorized: () => err(TODO_ERRORS.NOT_AUTHORIZED, "Not authorized to access this todo"),
  dbError: (operation: string, details?: string) =>
    err(TODO_ERRORS.DATABASE_ERROR, `DB failed on ${operation}: ${details}`),
};
