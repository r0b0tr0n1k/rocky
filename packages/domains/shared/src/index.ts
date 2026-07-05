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