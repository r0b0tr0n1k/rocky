// -- Require Fresh Session Middleware --
// Step-up gate (Decision B): privileged mutations (role assignment/revocation)
// require a session issued within the freshness window. Freshness is measured
// against the session's `createdAt`, NOT last activity -- sliding updateAge does
// NOT reset it. So "fresh" == "re-authenticated at least every freshAge seconds".
//
// We force a DB revalidation (disableCookieCache) so a revoked session cannot
// slip through the 300s compact cookie cache. Mirrors better-auth's internal
// freshSessionMiddleware (SESSION_NOT_FRESH).

import { Inject, Injectable } from "@nestjs/common";
import { AUTH_INSTANCE, type Auth } from "@rocky/auth";
import { TRPCError } from "@trpc/server";
import type { AppContext } from "@rocky/trpc/context.js";
import type { MiddlewareOptions, TRPCMiddleware } from "nestjs-trpc";

const DEFAULT_FRESH_AGE_SECONDS = 60 * 15;

@Injectable()
export class RequireFreshSessionMiddleware implements TRPCMiddleware {
  constructor(
    @Inject(AUTH_INSTANCE)
    private readonly auth: ReturnType<typeof Auth.getInstance>,
  ) {}

  async use(opts: MiddlewareOptions<AppContext>) {
    const { ctx, next } = opts;

    const cookieHeader = ctx.headers?.get?.("cookie") ?? "";
    // Force DB revalidation -- bypass the compact cookie cache for this sensitive op.
    const result = await this.auth.api.getSession({
      headers: new Headers({ cookie: cookieHeader }),
      query: { disableCookieCache: true },
    });

    if (!result?.session) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required." });
    }

    const freshAgeSeconds = this.auth.options.session?.freshAge ?? DEFAULT_FRESH_AGE_SECONDS;
    const ageMs = Date.now() - new Date(result.session.createdAt).getTime();
    if (ageMs >= freshAgeSeconds * 1000) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "SESSION_NOT_FRESH: re-authenticate to perform this privileged action.",
      });
    }

    return next({ ctx });
  }
}
