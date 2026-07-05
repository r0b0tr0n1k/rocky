import { Module } from "@nestjs/common";
import { TRPCModule } from 'nestjs-trpc';
import { LoggerModule, createPinoLogger } from "@rocky/logger";
import { AppContextProvider } from "../app.context.js";
import { LoggingMiddleware } from "./middlewares/logging.middleware.js";
import { ProtectedMiddleware } from "./middlewares/protected.middleware.js";
import { RLSMiddleware } from "./middlewares/rls.middleware.js";

@Module({
  imports: [
    LoggerModule,
    TRPCModule.forRoot({
      autoSchemaFile: '../@generated',
      context: AppContextProvider,
      basePath: "/trpc",
      logger: createPinoLogger(),
    }),
  ],
  providers: [AppContextProvider, LoggingMiddleware, ProtectedMiddleware, RLSMiddleware],
  exports: [TRPCModule, LoggingMiddleware, ProtectedMiddleware, RLSMiddleware],
})
export class TrpcModule { }
