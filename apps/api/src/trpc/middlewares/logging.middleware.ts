import { Injectable, Logger } from "@nestjs/common";
import type { TRPCMiddleware, MiddlewareOptions } from "nestjs-trpc";
import type { AppContext } from "@rocky/trpc/context.js";

/**
 * Logging middleware - tracks request timing and errors via Pino
 *
 * The built-in Logger from @nestjs/common routes through nestjs-pino
 * via the one-time substitution in main.ts.
 */
@Injectable()
export class LoggingMiddleware implements TRPCMiddleware {
  private readonly logger = new Logger(LoggingMiddleware.name);

  async use(opts: MiddlewareOptions) {
    const start = Date.now();
    const { next, path, type } = opts;

    const result = await next();
    const durationMs = Date.now() - start;

    const meta = { path, type, durationMs };

    if (result.ok) {
      this.logger.log("tRPC OK", meta);
    } else {
      this.logger.error("tRPC error", meta);
    }

    return result;
  }
}
