import { Injectable, Logger } from "@nestjs/common";
import type { OnErrorOptions, TRPCErrorHandler } from "nestjs-trpc";

@Injectable()
export class TrpcErrorHandler implements TRPCErrorHandler {
  private readonly logger = new Logger(TrpcErrorHandler.name);

  onError(opts: OnErrorOptions): void {
    this.logger.error(
      `[${opts.type}] ${opts.path}: ${opts.error.message}`,
      opts.error.stack,
    );
  }
}
