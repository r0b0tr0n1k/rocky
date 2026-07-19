import { NestFactory } from "@nestjs/core";
import { toNodeHandler } from "better-auth/node";
import { Logger } from "nestjs-pino";
import "reflect-metadata";
import { auth } from "./auth/auth.js";
import { AppModule } from "./app.module.js";
import { appConfig } from "./config.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
    bufferLogs: true,
  });

  // Single injection point - substitutes NestJS built-in logger
  // biome-ignore lint/correctness/useHookAtTopLevel: NestJS method, not React hook
  app.useLogger(app.get(Logger));

  // Enable shutdown hooks for graceful termination
  app.enableShutdownHooks();

  app.enableCors({
    origin: appConfig.cors.origins,
    credentials: true,
  });

  // Mount Better Auth HTTP handler — must come after CORS, before listen.
  // Wrap with debug logging since toNodeHandler bypasses NestJS entirely.
  const authHandler = toNodeHandler(auth);
  app.getHttpAdapter().use("/api/auth", (req: any, res: any) => {
    const start = Date.now();
    const originalEnd = res.end.bind(res);
    res.end = function (...args: any[]) {
      const ms = Date.now() - start;
      const log = `[AUTH] ${req.method} ${req.url} → ${res.statusCode} (${ms}ms)`;
      if (res.statusCode >= 400) {
        console.error(log);
      } else {
        console.info(log);
      }
      return originalEnd(...args);
    } as any;
    authHandler(req, res);
  });

  // Lightweight liveness probe for the container HEALTHCHECK (GET /health -> 200).
  // Registered before listen(); the distroless runtime ships no curl/nc, so the
  // probe reaches this route via `node -e "fetch('http://localhost:8000/health')"`.
  app.getHttpAdapter().get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
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
