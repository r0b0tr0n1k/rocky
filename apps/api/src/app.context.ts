export type { AppContext } from "@rocky/trpc";

import { Injectable } from "@nestjs/common";
import type { TRPCContext } from "nestjs-trpc";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { AppContext } from "@rocky/trpc";

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
