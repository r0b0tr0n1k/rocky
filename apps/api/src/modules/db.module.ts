// ── Database Module — provides drizzle connection to NestJS DI ──

import { Global, Module } from "@nestjs/common";
import { db } from "@rocky/database";

export const DB_TOKEN = "DB";

@Global()
@Module({
  providers: [
    {
      provide: DB_TOKEN,
      useValue: db,
    },
  ],
  exports: [DB_TOKEN],
})
export class DbModule {}
