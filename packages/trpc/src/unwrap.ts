import type { Result } from "@rocky/domains-shared";
import { TRPCError } from "@trpc/server";

type ErrorWithCode = Error & { code: string };

function hasCode(error: Error): error is ErrorWithCode {
  return "code" in error && typeof (error as ErrorWithCode).code === "string";
}

const errorToTRPCCode: Record<string, { code: TRPCError["code"]; message: string }> = {
  NotFoundError: { code: "NOT_FOUND", message: "Resource not found" },
  ForbiddenError: { code: "FORBIDDEN", message: "Forbidden" },
  DbError: { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" },
};

export function createResultUnwrapper(domainErrorMap?: Record<string, { code: TRPCError["code"]; message: string }>) {
  return function unwrapResult<T>(result: Result<T, Error>): T {
    if (result.isErr()) {
      const error = result.error;
      const code = hasCode(error) ? error.code : error.message;
      const mapping = domainErrorMap?.[code] ?? errorToTRPCCode[error.constructor.name];
      if (mapping) {
        throw new TRPCError({ code: mapping.code, message: error.message || mapping.message, cause: error });
      }
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message, cause: error });
    }
    return result.value;
  };
}

// re-export toAppError from domains-shared for backward compat
export { toAppError } from "@rocky/domains-shared";
