import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { appConfig } from "./config.js";
import { logger } from "./log.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  app.enableCors({
    origin: appConfig.cors.origins,
    credentials: true,
  });

  const server = await app.listen(appConfig.port, "0.0.0.0");
  logger.info(`NestJS API server running on port ${appConfig.port}`);

  // Graceful shutdown
  const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
  for (const signal of signals) {
    process.on(signal, async () => {
      logger.info(`received ${signal}, shutting down`);
      await app.close();
      process.exit(0);
    });
  }
}

bootstrap();
