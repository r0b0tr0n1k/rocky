import { pino } from "pino";
import { appConfig } from "#/config.js";

const isProduction = appConfig.env === "production";

export interface Logger {
  info(msg: string, properties?: Record<string, unknown>): void;
  debug(msg: string, properties?: Record<string, unknown>): void;
  warn(msg: string, properties?: Record<string, unknown>): void;
  error(msg: string, error?: Error | unknown, properties?: Record<string, unknown>): void;
}

export const logger: Logger = (() => {
  const log = pino({
    level: isProduction ? "info" : "debug",
    transport: isProduction
      ? undefined
      : {
          target: "pino-pretty",
          options: {
            colorize: true,
            singleLine: true,
            translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l",
            ignore: "pid,hostname",
          },
        },
  });
  return {
    info: (msg, properties) => log.info(properties ?? {}, msg),
    debug: (msg, properties) => log.debug(properties ?? {}, msg),
    warn: (msg, properties) => log.warn(properties ?? {}, msg),
    error: (msg, error, properties) => {
      const errorObj =
        error instanceof Error
          ? { error: { message: error.message, stack: error.stack, name: error.name } }
          : { error };
      log.error({ ...properties, ...errorObj }, msg);
    },
  };
})();
