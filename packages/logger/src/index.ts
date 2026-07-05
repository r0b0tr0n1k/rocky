// ── @rocky/logger — Smart Pino Logger Module (v2 Pattern) ──
//
// Logger substitution pattern:
//   1. Import LoggerModule once in your root AppModule
//   2. In main.ts: app.useLogger(app.get(Logger))
//   3. Services use built-in Logger from @nestjs/common
//
// No OpenTelemetry, no RabbitMQ, no monitoring — clean logging only.
// Correlation IDs flow through CLS via the "Red Thread" pattern.

import { Module } from "@nestjs/common";
import type { LoggerService, LogLevel } from "@nestjs/common";
import {
  LoggerModule as PinoLoggerModule,
  Logger,
  PinoLogger,
} from "nestjs-pino";
import { ClsService } from "nestjs-cls";

function getPinoHttpConfig(isProduction: boolean) {
  return {
    level: isProduction ? "info" : "debug",
    transport: isProduction
      ? undefined
      : {
          target: "pino-pretty",
          options: {
            colorize: true,
            singleLine: true,
            translateTime: "yyyy-mm-dd HH:MM:ss.l",
            ignore: "pid,hostname",
            messageFormat: "{msg}",
            errorLikeObjectKeys: ["err", "error"],
          },
        },
    autoLogging: {
      ignore: (req: any) => {
        if (req.url?.includes("/health")) return true;
        if (req.url?.includes("/favicon.ico")) return true;
        return false;
      },
    },
    serializers: {
      req: (req: any) => ({
        id: req.id,
        method: req.method,
        url: req.url,
        headers: {
          ...req.headers,
          authorization: req.headers?.authorization
            ? "[REDACTED]"
            : undefined,
          cookie: "[REDACTED]",
        },
      }),
      res: (res: any) => ({
        statusCode: res.statusCode,
      }),
      err: (err: any) => ({
        type: err.type,
        message: err.message,
        stack: err.stack,
        code: err.code,
      }),
    },
  };
}

export function createPinoLogger(): LoggerService {
  const isProduction = process.env.NODE_ENV === "production";
  const config = getPinoHttpConfig(isProduction);

  const pinoLogger = new PinoLogger({
    pinoHttp: config,
    renameContext: undefined,
  });

  return new Logger(pinoLogger, { renameContext: undefined });
}

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      useFactory: (cls: ClsService) => {
        const isProduction = process.env.NODE_ENV === "production";
        const config = getPinoHttpConfig(isProduction);

        return {
          pinoHttp: {
            ...config,
            customProps: (_req: any, _res: any) => ({
              correlationId: cls.getId(),
            }),
            genReqId: () => cls.getId(),
          },
        };
      },
      inject: [ClsService],
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}

// ── Re-export Logger type for convenience (but DO NOT import Logger
//    from @rocky/logger in services — use @nestjs/common Logger!) ──
export { Logger, PinoLogger };
export type { LoggerService, LogLevel };
