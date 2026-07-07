// -- Database Module --
// Provides the Drizzle DB instance and the DatabaseProvider for transactional
// connection management via CLS (AsyncLocalStorage).

import { Global, Module } from "@nestjs/common";
import { ClsService } from "nestjs-cls";
import { DatabaseProvider, db } from "@rocky/database/index.js";

export const DB_TOKEN = "DB_TOKEN";

@Global()
@Module({
  providers: [
    {
      provide: DB_TOKEN,
      useValue: db,
    },
    // useFactory + explicit inject: esbuild/tsx does not emit design:paramtypes,
    // so implicit constructor injection of ClsService does not work.
    {
      provide: DatabaseProvider,
      useFactory: (cls: ClsService) => new DatabaseProvider(cls),
      inject: [ClsService],
    },
  ],
  exports: [DB_TOKEN, DatabaseProvider],
})
export class DbModule {}
