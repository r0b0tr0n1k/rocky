import { Module } from "@nestjs/common";
import { TrpcModule } from "./trpc/trpc.module.js";
import { AuthCoreModule } from "./auth/auth-core.module.js";

@Module({
  imports: [AuthCoreModule, TrpcModule],
})
export class AppModule {}
