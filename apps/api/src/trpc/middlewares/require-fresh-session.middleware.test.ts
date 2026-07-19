import { describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { RequireFreshSessionMiddleware } from "./require-fresh-session.middleware.js";

const FRESH_AGE = 900; // 15 minutes, matching DEFAULT_FRESH_AGE_SECONDS

function buildMiddleware(freshAge = FRESH_AGE, getSession = vi.fn()) {
  const auth = {
    options: { session: { freshAge } },
    api: { getSession },
  } as any;
  const mw = new RequireFreshSessionMiddleware(auth);
  return { mw, auth };
}

function opts(cookie: string, next = vi.fn(async (o: unknown) => o)) {
  return { ctx: { headers: new Headers({ cookie }) }, next } as any;
}

function session(ageSecondsAgo: number) {
  return {
    session: { id: "s1", createdAt: new Date(Date.now() - ageSecondsAgo * 1000).toISOString() },
    user: { id: "u1" },
  };
}

describe("RequireFreshSessionMiddleware (step-up gate, Decision B)", () => {
  it("passes a fresh session and calls next", async () => {
    const { mw, auth } = buildMiddleware();
    auth.api.getSession.mockResolvedValue(session(10));
    const next = vi.fn(async (o: unknown) => o);
    await mw.use(opts("rocky_session=abc", next));
    expect(auth.api.getSession).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledOnce();
  });

  it("forces DB revalidation (disableCookieCache) on the getSession call", async () => {
    const { mw, auth } = buildMiddleware();
    auth.api.getSession.mockResolvedValue(session(10));
    await mw.use(opts("rocky_session=abc", vi.fn(async (o) => o)));
    const call = auth.api.getSession.mock.calls[0][0];
    expect(call.query).toEqual({ disableCookieCache: true });
    expect(call.headers).toBeInstanceOf(Headers);
  });

  it("throws UNAUTHORIZED when no session resolves", async () => {
    const { mw, auth } = buildMiddleware();
    auth.api.getSession.mockResolvedValue(null);
    const err = await mw.use(opts("rocky_session=abc", vi.fn())).catch((e) => e);
    expect(err).toBeInstanceOf(TRPCError);
    expect(err.code).toBe("UNAUTHORIZED");
  });

  it("throws FORBIDDEN SESSION_NOT_FRESH for a session older than freshAge", async () => {
    const { mw, auth } = buildMiddleware(FRESH_AGE);
    auth.api.getSession.mockResolvedValue(session(FRESH_AGE + 10));
    const err = await mw.use(opts("rocky_session=abc", vi.fn())).catch((e) => e);
    expect(err).toBeInstanceOf(TRPCError);
    expect(err.code).toBe("FORBIDDEN");
    expect(err.message).toContain("SESSION_NOT_FRESH");
  });

  it("falls back to the default 15-minute freshAge when options.session.freshAge is absent", async () => {
    const { mw, auth } = buildMiddleware();
    delete (auth.options.session as any).freshAge;
    auth.api.getSession.mockResolvedValue(session(FRESH_AGE + 10));
    const err = await mw.use(opts("rocky_session=abc", vi.fn())).catch((e) => e);
    expect(err.code).toBe("FORBIDDEN");
  });

  it("passes a session just inside the freshness window", async () => {
    const { mw, auth } = buildMiddleware(FRESH_AGE);
    auth.api.getSession.mockResolvedValue(session(FRESH_AGE - 5));
    const next = vi.fn(async (o: unknown) => o);
    await mw.use(opts("rocky_session=abc", next));
    expect(next).toHaveBeenCalledOnce();
  });
});
