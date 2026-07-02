import { Module } from "@nestjs/common";
import { TodoRouter } from "./todo.router.js";

@Module({
  providers: [TodoRouter],
})
export class TodoModule {}
