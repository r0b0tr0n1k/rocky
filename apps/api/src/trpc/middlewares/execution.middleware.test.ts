import { describe, expect, it, vi } from "vitest";
import { ANONYMOUS_PRINCIPAL, Principal } from "@rocky/authorization";
import { ExecutionMiddleware } from "./execution.middleware.js";

function buildMiddleware() {
  const auth = { api: { getSession: vi.fn() } } as any;
  const principalResolver = { resolve: vi.fn() } as any;
  // run() must invoke the handler so the middleware can set ctx.execution + call next
  const pipeline = { run: vi.fn(async (_p: unknown, _r: unknown, h: (p: unknown) => unknown) => h(_p)) } as any;
  const runtimeBuilder = { resolve: vi.fn(() => ({})) } as any;
  const mw = new ExecutionMiddleware(auth, principalResolver, pipeline, runtimeBuilder);
  return { mw, auth, principalResolver, pipeline };
}

function authedPrincipal() {
  return Principal.create({
    id: "u1",
    username: "u1",
    roles: [],
    permissions: [],
    organization: null,
    accessLevel: "own",
  });
}

describe("ExecutionMiddleware (auth → principal flow)", () => {
  it("resolves a cookie into ctx.execution.principal and calls next", async () => {
    const { mw, auth, principalResolver } = buildMiddleware();
    auth.api.getSession.mockResolvedValue({ session: { id: "s1" }, user: { id: "u1", name: "n" } });
    principalResolver.resolve.mockResolvedValue(authedPrincipal());
    const next = vi.fn(async (o: unknown) => o);

    const opts = { ctx: { headers: new Headers({ cookie: "rocky_session=abc" }) }, next } as any;
    await mw.use(opts);

    expect(auth.api.getSession).toHaveBeenCalledTimes(1);
    expect(principalResolver.resolve).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledOnce();
    expect(opts.ctx.execution.principal.id).toBe("u1");
  });

  it("does NOT throw on a missing session — attaches ANONYMOUS_PRINCIPAL and proceeds", async () => {
    const { mw, auth, principalResolver } = buildMiddleware();
    auth.api.getSession.mockResolvedValue(null); // missing/expired session
    principalResolver.resolve.mockResolvedValue(ANONYMOUS_PRINCIPAL);
    const next = vi.fn(async (o: unknown) => o);

    const opts = { ctx: { headers: new Headers() }, next } as any;
    // The recipe's per-router AuthMiddleware throws Unauthorized here. Ours must not.
    await expect(mw.use(opts)).resolves.toBeDefined();
    expect(next).toHaveBeenCalledOnce();
    expect(opts.ctx.execution.principal).toBe(ANONYMOUS_PRINCIPAL);
  });
});
