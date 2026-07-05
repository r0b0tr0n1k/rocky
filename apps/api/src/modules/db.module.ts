// ── Database Module ──
// Provides the Drizzle DB instance and the DatabaseProvider for transactional
// connection management via CLS (AsyncLocalStorage).

import { Global, Module } from "@nestjs/common";
import { DatabaseProvider, db } from "@rocky/database/index.js";

export const DB_TOKEN = "DB_TOKEN";

@Global()
@Module({
  providers: [
    {
      provide: DB_TOKEN,
      useValue: db,
    },
    DatabaseProvider,
  ],
  exports: [DB_TOKEN, DatabaseProvider],
})
export class DbModule {}
