export type { AppContext } from "@rocky/trpc/index.js";

import { Injectable } from "@nestjs/common";
import type { AppContext } from "@rocky/trpc/index.js";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { TRPCContext } from "nestjs-trpc";

@Injectable()
export class AppContextProvider implements TRPCContext {
  create(opts: CreateExpressContextOptions): AppContext {
    return {
      headers: new Headers(opts.req.headers as Record<string, string>),
      user: null,
      session: null,
    };
  }
}
