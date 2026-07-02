import { TRPCError } from "@trpc/server";

type ErrorClass = new (...args: unknown[]) => Error;

const errorToTRPCCode: Record<string, { code: TRPCError["code"]; message: string }> = {
  NotFoundError: { code: "NOT_FOUND", message: "Resource not found" },
  ForbiddenError: { code: "FORBIDDEN", message: "Forbidden" },
  DbError: { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" },
};

export function createResultUnwrapper(domainErrorMap?: Record<string, { code: TRPCError["code"]; message: string }>) {
  return function unwrapResult<T>(result: { isErr(): boolean; error: Error; value: T }): T {
    if (result.isErr()) {
      const error = result.error;
      const mapping = domainErrorMap?.[error.message] ?? errorToTRPCCode[error.constructor.name];
      if (mapping) {
        throw new TRPCError({ code: mapping.code, message: error.message || mapping.message, cause: error });
      }
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message, cause: error });
    }
    return result.value;
  };
}

export function toAppError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error(String(error));
}
