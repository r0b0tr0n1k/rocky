import { Module } from "@nestjs/common";
import { db } from "@prasici/database";
import { TodoService } from "@prasici/domains-todo";
import { TodoRouter } from "./todo.router.js";

@Module({
  providers: [
    TodoRouter,
    {
      provide: TodoService,
      useFactory: () => new TodoService(db),
    },
  ],
})
export class TodoModule {}
