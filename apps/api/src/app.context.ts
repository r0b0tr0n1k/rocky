export type { AppContext } from "@rocky/trpc/index.js";

import { Injectable } from "@nestjs/common";
import type { AppContext } from "@rocky/trpc/index.js";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { TRPCContext } from "nestjs-trpc";

@Injectable()
export class AppContextProvider implements TRPCContext {
  create(opts: CreateExpressContextOptions): AppContext {
    const cookie = (opts.req.headers as Record<string, string>)?.cookie;
    console.info(
      "[TRPC-CTX] headers count:",
      Object.keys(opts.req.headers).length,
      "cookie present:",
      !!cookie,
      "cookie len:",
      cookie?.length ?? 0,
    );
    return {
      headers: new Headers(opts.req.headers as Record<string, string>),
      user: null,
      session: null,
    };
  }
}
