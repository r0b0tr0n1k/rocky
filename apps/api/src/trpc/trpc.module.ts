// -- tRPC Module --
// Central NestJS module for tRPC - handles context, middleware, routing.

import { Module } from "@nestjs/common";
import type { Auth } from "@rocky/auth";
import { AUTH_INSTANCE } from "@rocky/auth";
import { PrincipalResolver } from "@rocky/authorization/index.js";
import { ExecutionPipeline, RuntimeBuilder } from "@rocky/execution/index.js";
import { createPinoLogger, LoggerModule } from "@rocky/logger/index.js";
import { TRPCModule } from "nestjs-trpc";
import { superjson } from "@rocky/trpc/superjson";
import { AppContextProvider } from "../app.context.js";
import { ExecutionMiddleware } from "./middlewares/execution.middleware.js";
import { LoggingMiddleware } from "./middlewares/logging.middleware.js";
import { PolicyResolver } from "./middlewares/policy.resolver.js";

import { TrpcErrorHandler } from "./trpc-error.handler.js";

@Module({
  imports: [
    LoggerModule,
    TRPCModule.forRoot({
      context: AppContextProvider,
      basePath: "/trpc",
      logger: createPinoLogger(),
      transformer: superjson,
      globalMiddlewares: [ExecutionMiddleware, PolicyResolver],
      onError: TrpcErrorHandler,
    }),
  ],
  controllers: [],
  providers: [
    TrpcErrorHandler,
    AppContextProvider,
    LoggingMiddleware,
    {
      provide: ExecutionMiddleware,
      useFactory: (
        auth: ReturnType<typeof Auth.getInstance>,
        principalResolver: PrincipalResolver,
        pipeline: ExecutionPipeline,
        runtimeBuilder: RuntimeBuilder,
      ) => new ExecutionMiddleware(auth, principalResolver, pipeline, runtimeBuilder),
      inject: [AUTH_INSTANCE, PrincipalResolver, ExecutionPipeline, RuntimeBuilder],
    },
    PolicyResolver,
  ],
  exports: [TRPCModule, LoggingMiddleware, ExecutionMiddleware, PolicyResolver],
})
export class TrpcModule {}
