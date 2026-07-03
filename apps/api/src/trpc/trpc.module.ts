import { Module } from "@nestjs/common";
import { TRPCModule } from "nestjs-trpc-v2";
import { AppContextProvider } from "../app.context.js";
import { ProtectedMiddleware } from "./middlewares/protected.middleware.js";
import { RLSMiddleware } from "./middlewares/rls.middleware.js";
import { LoggingMiddleware } from "./middlewares/logging.middleware.js";

@Module({
  imports: [
    TRPCModule.forRoot({
      autoSchemaFile: "./src/@generated",
      context: AppContextProvider,
      basePath: "/trpc",
    }),
  ],
  providers: [AppContextProvider, ProtectedMiddleware, RLSMiddleware, LoggingMiddleware],
  exports: [TRPCModule, ProtectedMiddleware, RLSMiddleware, LoggingMiddleware],
})
export class TrpcModule {}
