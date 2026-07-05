import "reflect-metadata";
import "@total-typescript/ts-reset";
import { NestFactory } from "@nestjs/core";
import { Logger } from "nestjs-pino";
import { AppModule } from "./app.module.js";
import { appConfig } from "./config.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
    bufferLogs: true,
  });

  // Single injection point - substitutes NestJS built-in logger
  app.useLogger(app.get(Logger));

  // Enable shutdown hooks for graceful termination
  app.enableShutdownHooks();

  app.enableCors({
    origin: appConfig.cors.origins,
    credentials: true,
  });

  await app.listen(appConfig.port, "0.0.0.0");

  const logger = app.get(Logger);
  logger.log(`NestJS API server running on port ${appConfig.port}`);

  // Graceful shutdown handlers
  const signals = ["SIGINT", "SIGTERM"] as const;
  for (const signal of signals) {
    process.on(signal, async () => {
      logger.log(`Received ${signal}. Initiating graceful shutdown...`);
      try {
        await app.close();
        logger.log("Application closed gracefully");
        process.exit(0);
      } catch (error) {
        logger.error("Error during graceful shutdown", error as Error);
        process.exit(1);
      }
    });
  }
}

bootstrap();
