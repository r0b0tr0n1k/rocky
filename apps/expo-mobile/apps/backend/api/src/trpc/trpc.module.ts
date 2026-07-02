import { Module } from "@nestjs/common";
import { TRPCModule } from "nestjs-trpc-v2";
import { AppContext } from "../app.context.js";

@Module({
  imports: [
    TRPCModule.forRoot({
      autoSchemaFile: "./src/@generated",
      context: AppContext,
      basePath: "/trpc",
    }),
  ],
  providers: [AppContext],
  exports: [TRPCModule],
})
export class TrpcModule {}
