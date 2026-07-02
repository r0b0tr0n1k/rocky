import { Module } from "@nestjs/common";
import { TrpcModule } from "./trpc/trpc.module.js";
import { AuthCoreModule } from "./auth/auth-core.module.js";
import { TodoModule } from "./todo/todo.module.js";

@Module({
  imports: [AuthCoreModule, TrpcModule, TodoModule],
})
export class AppModule {}
