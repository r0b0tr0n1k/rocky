// ── @rocky/domains-shared ──
// The sovereign home of:
//   - Result monad (ok, err, Result, fromAsyncThrowable, toAppError)
//   - Shared error classes & codes (NotFoundError, ForbiddenError, DbError, SHARED_ERRORS)
//   - BaseRepository

export {
  ok,
  err,
  okAsync,
  errAsync,
  fromAsyncThrowable,
  isSuccess,
  isError,
  toAppError,
} from "./result.js";
export type { Result, ResultAsync } from "./result.js";

export {
  NotFoundError,
  ForbiddenError,
  DbError,
  SHARED_ERRORS,
} from "./errors.js";
export type { SharedErrorCode } from "./errors.js";

export { BaseRepository } from "./repository.js";

// ── Utility: type-stable Record cast ──
// Interfaces without index signatures cannot pass to Record<string, unknown>.
// Object.fromEntries(Object.entries(x)) produces a native Record at both runtime and type level.

export function toRecord<T extends object>(obj: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj));
}
