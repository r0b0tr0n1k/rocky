// ── Result Monad & Async Helpers ──
// The sovereign home of ok/err/Result/unwrap/fromAsyncThrowable.
// All domain packages import Result infrastructure from here, never from neverthrow directly.

import type { Result } from "neverthrow";

export { ok, err, okAsync, errAsync, fromAsyncThrowable } from "neverthrow";
export type { Result, ResultAsync } from "neverthrow";

/**
 * Check if a Result is success (delegates to neverthrow's .isOk() type guard).
 */
export function isSuccess<T, E>(result: Result<T, E>): result is Extract<Result<T, E>, { isOk: true }> {
  return result.isOk();
}

/**
 * Check if a Result is an error (delegates to neverthrow's .isErr() type guard).
 */
export function isError<T, E>(result: Result<T, E>): result is Extract<Result<T, E>, { isErr: true }> {
  return result.isErr();
}

/**
 * Normalize any thrown value into an Error instance.
 * Used as the error-handler parameter of fromAsyncThrowable.
 *
 * Moved from @rocky/trpc — this is a domain concern, not TRPC-specific.
 */
export function toAppError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error(String(error));
}
