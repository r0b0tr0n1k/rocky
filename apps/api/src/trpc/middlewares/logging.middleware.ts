import { Injectable } from "@nestjs/common";
import { TRPCMiddleware, MiddlewareOptions } from "nestjs-trpc-v2";
import type { AppContext } from "@rocky/trpc/context.js";

/**
 * Logging middleware - tracks request timing and errors
 *
 * Logs all tRPC requests with timing information.
 * Place at router level for global logging or procedure level for specific logging.
 *
 * Usage:
 * ```typescript
 * @Router({ alias: "farm" })
 * @UseMiddlewares(LoggingMiddleware)
 * export class FarmRouter {
 *   // All procedures in this router will be logged
 * }
 * ```
 */
@Injectable()
export class LoggingMiddleware implements TRPCMiddleware {
	constructor() {}

	async use(opts: MiddlewareOptions) {
		const start = Date.now();
		const { next, path, type } = opts;

		const result = await next();
		const durationMs = Date.now() - start;

		const meta = {
			path,
			type,
			durationMs,
		};

		// TODO: Integrate with your logging system (pino?)
		if (result.ok) {
			console.log("✅ OK request timing:", meta);
		} else {
			console.error("❌ Non-OK request timing:", meta);
		}

		return result;
	}
}
