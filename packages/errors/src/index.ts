// ── @rocky/errors ──
// ⚠️ DEPRECATED — thin backward-compat barrel re-exporting from @rocky/domains-shared.
// New code should import directly from "@rocky/domains-shared".

export {
  ok, err, okAsync, errAsync, fromAsyncThrowable, isSuccess, isError, toAppError,
  NotFoundError, ForbiddenError, DbError, SHARED_ERRORS,
} from "@rocky/domains-shared";
export type { Result, ResultAsync, SharedErrorCode } from "@rocky/domains-shared";
